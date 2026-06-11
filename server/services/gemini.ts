import { GoogleGenAI } from "@google/genai";
import type { WordTimestamp, SoundEffectType, WordEffect, TokenUsage } from "../../src/lib/types.ts";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractTokens(response: any): TokenUsage {
  const meta = response.usageMetadata;
  return {
    inputTokens:  meta?.promptTokenCount     ?? 0,
    outputTokens: meta?.candidatesTokenCount  ?? 0,
    totalTokens:  meta?.totalTokenCount       ?? 0,
  };
}

function logTokens(label: string, tokens: TokenUsage) {
  console.log(
    `[gemini:tokens] ${label} — input=${tokens.inputTokens} output=${tokens.outputTokens} total=${tokens.totalTokens}`
  );
}

function is503(err: any): boolean {
  return (
    err?.status === 503 ||
    err?.message?.includes("503") ||
    err?.message?.includes("UNAVAILABLE") ||
    err?.message?.includes("high demand")
  );
}

// Word-count targets per duration (seconds → approx words at 150 wpm)
const DURATION_WORD_TARGETS: Record<string, number> = {
  "15": 37,
  "30": 75,
  "60": 150,
  "90": 225,
};

// Speaking style guidance per emotion — influences TTS interpretation via word choice
const EMOTION_STYLE_GUIDE: Record<string, string> = {
  neutral:      "Calm, measured delivery. Use clear, simple sentences with natural pauses.",
  happy:        "Warm and upbeat. Use positive, light language. Short, energetic sentences.",
  excited:      "High energy and enthusiasm. Use exclamation-worthy phrasing, dynamic rhythm, punchy sentences.",
  motivational: "Powerful and inspiring. Use strong action verbs, bold declarative statements, build toward a rally.",
  professional: "Polished and authoritative. Crisp, precise language. No filler words.",
  sad:          "Soft, heartfelt, and gentle. Use slower pacing cues like ellipses where natural pauses belong. Empathetic language.",
};

/**
 * Enhance a user script using Gemini 2.5 Flash.
 * Targets a specific word count for the desired duration.
 * Retries up to 3 times on 503. Falls back to the original script
 * unchanged if Gemini is unavailable — the pipeline keeps running.
 */
export async function enhanceScript(
  rawScript: string,
  emotion: string,
  duration: string = "30"
): Promise<{ text: string; tokens: TokenUsage }> {
  const targetWords = DURATION_WORD_TARGETS[duration] ?? 75;
  const styleGuide = EMOTION_STYLE_GUIDE[emotion] ?? EMOTION_STYLE_GUIDE.neutral;

  const prompt = `You are a professional script writer for short-form video content.

Your task is to improve the following script for a talking-avatar video.

EMOTION/TONE: ${emotion}
SPEAKING STYLE: ${styleGuide}
TARGET LENGTH: approximately ${targetWords} words (for a ~${duration}-second video at normal speaking pace)

INSTRUCTIONS:
- Rewrite the script so it reads in approximately ${targetWords} words — expand if too short, condense if too long
- Deeply express the "${emotion}" emotion through word choice, sentence rhythm, and pacing
- Fix any grammar or punctuation issues
- Optimize for spoken delivery — no jargon, no long complex sentences
- Keep the core message and meaning intact
- Do NOT add stage directions, action descriptions, or formatting markers
- Do NOT add quotation marks around the output
- Return ONLY the improved script text, nothing else

ORIGINAL SCRIPT:
${rawScript}`;

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const enhanced = response.text?.trim();
      if (enhanced) {
        const wordCount = enhanced.split(/\s+/).length;
        const tokens = extractTokens(response);
        logTokens("enhanceScript", tokens);
        console.log(`[gemini] Script enhanced (attempt ${attempt}) — ${wordCount} words, target ${targetWords}`);
        return { text: enhanced, tokens };
      }
    } catch (err: any) {
      if (is503(err) && attempt < RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.warn(`[gemini] 503 on attempt ${attempt}/${RETRIES} — retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      console.warn(`[gemini] Failed after ${attempt} attempt(s): ${err?.message}`);
      break;
    }
  }

  // Gemini unavailable — use the original script so the pipeline continues
  console.warn("[gemini] Using original script as fallback (Gemini unavailable)");
  return { text: rawScript, tokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 } };
}

/**
 * Use Gemini to identify which transcribed words should have a sound effect.
 * Returns up to 4 WordEffect entries. Soft-fails to [] on any error.
 */
export async function analyzeSoundEffects(
  words: WordTimestamp[],
  emotion: string,
  script: string
): Promise<{ effects: WordEffect[]; tokens: TokenUsage }> {
  const noTokens: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  // Sad emotion gets no sound effects
  if (emotion === "sad" || words.length === 0) return { effects: [], tokens: noTokens };

  const wordList = words
    .map((w, i) => `${i}: "${w.word}" (${w.start.toFixed(2)}s)`)
    .join("\n");

  const prompt = `You are analyzing a spoken video transcript to add punch sound effects to specific words.

TRANSCRIPT WORDS (index: "word" at timestamp):
${wordList}

EMOTION: ${emotion}
SCRIPT (first 200 chars): ${script.slice(0, 200)}

Select 2–4 words that deserve a brief sound effect when spoken. Choose high-energy words, key moments, or punchlines.

Sound effect types:
- "pop"    = quick snappy pop (for punchy, energetic words)
- "ding"   = bright bell tone (for key points, revelations, or important keywords)
- "whoosh" = swoosh sound (for action, movement, or transition words)

Rules:
- Maximum 4 effects total
- Avoid the very first or very last word
- Prefer content words (nouns, verbs) over function words (the, a, is)
- For "professional" or "neutral" emotion, use at most 2 effects
- Return ONLY a JSON array, no other text, no markdown

Example: [{"wordIndex":3,"effectType":"pop"},{"wordIndex":11,"effectType":"ding"}]`;

  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text?.trim() ?? "";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    const parsed: { wordIndex: number; effectType: string }[] = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];

    const valid = parsed.filter(
      (item) =>
        typeof item.wordIndex === "number" &&
        item.wordIndex >= 0 &&
        item.wordIndex < words.length &&
        ["pop", "ding", "whoosh"].includes(item.effectType)
    );

    const effects: WordEffect[] = valid.slice(0, 4).map((item) => ({
      wordIndex: item.wordIndex,
      word: words[item.wordIndex].word,
      timestamp: words[item.wordIndex].start,
      effectType: item.effectType as SoundEffectType,
    }));

    const tokens = extractTokens(response);
    logTokens("analyzeSoundEffects", tokens);
    console.log(`[gemini] Sound effects: ${effects.map((e) => `"${e.word}"→${e.effectType}`).join(", ")}`);
    return { effects, tokens };
  } catch (err: any) {
    console.warn("[gemini] analyzeSoundEffects failed:", err?.message);
    return { effects: [], tokens: noTokens };
  }
}
