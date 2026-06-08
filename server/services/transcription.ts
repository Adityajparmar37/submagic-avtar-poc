import Groq from "groq-sdk";
import fs from "fs";
import type { TranscriptionResult } from "../../src/lib/types.ts";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

/**
 * Transcribe an audio file using Groq Whisper with word-level timestamps.
 */
export async function transcribeAudio(
  audioPath: string
): Promise<TranscriptionResult> {
  console.log("[transcription] Transcribing:", audioPath);

  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: "whisper-large-v3",
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
  });

  const result: TranscriptionResult = {
    text: transcription.text || "",
    words: ((transcription as any).words || []).map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    })),
    segments: ((transcription as any).segments || []).map((s: any) => ({
      text: s.text,
      start: s.start,
      end: s.end,
    })),
  };

  console.log(
    `[transcription] Got ${result.words.length} words, ${result.segments.length} segments`
  );
  return result;
}
