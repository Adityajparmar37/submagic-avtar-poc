import { spawn } from "child_process";
import path from "path";
import type { SoundEffectType, WordEffect, UserWordEffect, WordTimestamp } from "../../src/lib/types.ts";

/**
 * Match user-selected words (by script position) to their timestamps in the
 * transcription. Case-insensitive, punctuation-stripped matching.
 * Words that can't be matched are silently skipped.
 */
export function matchUserWordEffects(
  userSelections: UserWordEffect[],
  transcribedWords: WordTimestamp[]
): WordEffect[] {
  if (userSelections.length === 0 || transcribedWords.length === 0) return [];

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  return userSelections.flatMap(({ word, effectType }) => {
    const target = clean(word);
    const idx = transcribedWords.findIndex((w) => clean(w.word) === target);
    if (idx < 0) {
      console.warn(`[sfx] No transcription match for "${word}" — skipped`);
      return [];
    }
    return [{
      wordIndex: idx,
      word: transcribedWords[idx].word,
      timestamp: transcribedWords[idx].start,
      effectType,
    }];
  });
}

// Each effect is generated via FFmpeg's libavfilter (lavfi) sources.
// The filter chain produces a short mono WAV, then we convert to stereo when mixing.
const LAVFI_DEFS: Record<SoundEffectType, { source: string; audioFilter?: string }> = {
  pop: {
    // Damped sine at 1 kHz — classic snappy pop
    source: "aevalsrc=sin(2*PI*t*1000)*exp(-t*50):s=44100:c=mono:d=0.12",
  },
  ding: {
    // Softer damped sine at 1.5 kHz — bell-like ding
    source: "aevalsrc=sin(2*PI*t*1500)*0.6*exp(-t*10):s=44100:c=mono:d=0.3",
  },
  whoosh: {
    // Bandpass-filtered white noise with quick fade in/out
    source: "anoisesrc=d=0.25:c=white:a=0.45",
    audioFilter: "lowpass=f=2500,highpass=f=400,afade=t=in:d=0.03,afade=t=out:st=0.2:d=0.05",
  },
};

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [...args, "-y"], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    proc.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code: number) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-400)}`));
    });
    proc.on("error", (err: Error) => reject(err));
  });
}

async function generateEffectFile(type: SoundEffectType, outputPath: string): Promise<void> {
  const { source, audioFilter } = LAVFI_DEFS[type];
  const args = ["-f", "lavfi", "-i", source];
  if (audioFilter) args.push("-af", audioFilter);
  args.push(outputPath);
  await runFFmpeg(args);
}

/**
 * Mix sound effects into a video at specific timestamps.
 * If effects is empty, outputs a copy of the input.
 * Soft-fail safe: caller should catch and proceed without effects on error.
 */
export async function mixSoundEffects(
  inputVideoPath: string,
  outputVideoPath: string,
  effects: WordEffect[],
  sessionDir: string
): Promise<void> {
  if (effects.length === 0) {
    await runFFmpeg(["-i", inputVideoPath, "-c", "copy", outputVideoPath]);
    return;
  }

  // Generate unique WAV files for each effect type used
  const effectFilePaths = new Map<SoundEffectType, string>();
  for (const effect of effects) {
    if (!effectFilePaths.has(effect.effectType)) {
      const filePath = path.join(sessionDir, `sfx_${effect.effectType}.wav`);
      await generateEffectFile(effect.effectType, filePath);
      effectFilePaths.set(effect.effectType, filePath);
    }
  }

  // Build filter_complex to position each effect at its timestamp
  // All effect inputs are converted to stereo and delayed before mixing
  const inputArgs: string[] = ["-i", inputVideoPath];
  for (const effect of effects) {
    inputArgs.push("-i", effectFilePaths.get(effect.effectType)!);
  }

  const filterParts: string[] = [];
  const mixInputLabels: string[] = ["[0:a]"];

  for (let i = 0; i < effects.length; i++) {
    const delayMs = Math.max(0, Math.round(effects[i].timestamp * 1000));
    filterParts.push(
      `[${i + 1}:a]adelay=${delayMs}|${delayMs},aformat=channel_layouts=stereo,volume=0.4[s${i}]`
    );
    mixInputLabels.push(`[s${i}]`);
  }

  // amix: normalize=0 keeps the speech volume unchanged, effects just layer on top
  filterParts.push(
    `${mixInputLabels.join("")}amix=inputs=${effects.length + 1}:duration=first:normalize=0[audio]`
  );

  console.log(`[sfx] Mixing ${effects.length} effect(s): ${effects.map((e) => `"${e.word}"→${e.effectType}`).join(", ")}`);

  await runFFmpeg([
    ...inputArgs,
    "-filter_complex", filterParts.join("; "),
    "-map", "0:v",
    "-map", "[audio]",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    outputVideoPath,
  ]);

  console.log("[sfx] Sound effect mixing complete.");
}
