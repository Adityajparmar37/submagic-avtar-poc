import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";
import type { VoiceOption } from "../../src/lib/types.ts";

const execAsync = promisify(exec);

// macOS neural voices — free, no API key, 4 distinct voices
const VOICE_MAP: Record<VoiceOption, string> = {
  "professional-male":   "Daniel",              // British male
  "professional-female": "Samantha",            // US female
  "friendly-female":     "Flo (English (US))",  // warm US female
  "motivational-male":   "Reed (English (US))", // energetic US male
};

export async function generateSpeech(
  text: string,
  voice: VoiceOption
): Promise<Buffer> {
  const macVoice = VOICE_MAP[voice] ?? "Samantha";
  const tmpId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const textFile = path.join(os.tmpdir(), `tts-${tmpId}.txt`);
  const aiffFile = path.join(os.tmpdir(), `tts-${tmpId}.aiff`);
  const mp3File  = path.join(os.tmpdir(), `tts-${tmpId}.mp3`);

  try {
    await fs.promises.writeFile(textFile, text, "utf-8");
    console.log(`[tts] say -v "${macVoice}"`);
    await execAsync(`say -v "${macVoice}" -f "${textFile}" -o "${aiffFile}"`);
    await execAsync(`ffmpeg -i "${aiffFile}" -codec:a libmp3lame -qscale:a 2 "${mp3File}" -y 2>/dev/null`);
    return await fs.promises.readFile(mp3File);
  } finally {
    await Promise.all([
      fs.promises.rm(textFile, { force: true }).catch(() => {}),
      fs.promises.rm(aiffFile, { force: true }).catch(() => {}),
      fs.promises.rm(mp3File,  { force: true }).catch(() => {}),
    ]);
  }
}
