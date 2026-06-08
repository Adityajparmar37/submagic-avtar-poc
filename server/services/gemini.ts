import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function is503(err: any): boolean {
  return (
    err?.status === 503 ||
    err?.message?.includes("503") ||
    err?.message?.includes("UNAVAILABLE") ||
    err?.message?.includes("high demand")
  );
}

/**
 * Enhance a user script using Gemini 2.5 Flash.
 * Retries up to 3 times on 503. Falls back to the original script
 * unchanged if Gemini is unavailable — the pipeline keeps running.
 */
export async function enhanceScript(
  rawScript: string,
  emotion: string
): Promise<string> {
  const prompt = `You are a professional script writer for short-form video content.

Your task is to improve the following script for a talking-avatar video.

EMOTION/TONE: ${emotion}

INSTRUCTIONS:
- Fix any grammar or punctuation issues
- Improve readability and flow for spoken delivery
- Optimize the pacing and word choice for the "${emotion}" emotional tone
- Keep the core message and meaning intact
- Do NOT add stage directions, emojis, or formatting markers
- Do NOT add quotation marks around the output
- Keep the script concise — similar length to the original
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
        console.log(`[gemini] Script enhanced (attempt ${attempt})`);
        return enhanced;
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
  return rawScript;
}
