import ffmpeg from "fluent-ffmpeg";
import path from "path";
import type { VideoOrientation } from "../../src/lib/types.ts";

/**
 * Burn ASS subtitles into a video using FFmpeg.
 * Re-encodes video with libx264, copies audio.
 */
export function burnCaptions(
  videoPath: string,
  assPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("[video] Burning captions...");
    console.log("[video] Input:", videoPath);
    console.log("[video] Subtitles:", assPath);
    console.log("[video] Output:", outputPath);

    // Need to escape the path for the ASS filter
    // FFmpeg's subtitle filter uses : as delimiter, so we escape colons in path
    const escapedAssPath = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");

    ffmpeg(videoPath)
      .videoFilters(`ass=${escapedAssPath}`)
      .outputOptions([
        "-c:v libx264",
        "-preset fast",
        "-crf 23",
        "-c:a copy",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("start", (cmd) => {
        console.log("[video] FFmpeg command:", cmd);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`[video] Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on("end", () => {
        console.log("[video] Caption burn complete.");
        resolve();
      })
      .on("error", (err) => {
        console.error("[video] FFmpeg error:", err.message);
        reject(new Error(`FFmpeg failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Extract audio track from a video file as a WAV.
 */
export function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec("pcm_s16le")
      .output(audioPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`extractAudio failed: ${err.message}`)))
      .run();
  });
}

/**
 * Apply orientation and background transforms to a video.
 * - landscape: pass-through (no change)
 * - portrait:  scale to 1080 width and pad to 1080×1920 with the chosen background color
 */
export function transformVideo(
  inputPath: string,
  outputPath: string,
  orientation: VideoOrientation
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (orientation === "landscape") {
      // No transform needed — just copy
      ffmpeg(inputPath)
        .outputOptions(["-c copy"])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(new Error(`transformVideo copy failed: ${err.message}`)))
        .run();
      return;
    }

    // Portrait 9:16: scale to fit 1080 width, pad to 1080×1920 with black bars
    // scale=1080:-2 keeps aspect ratio, ensures even height
    // pad=1080:1920:0:(1920-ih)/2 centers vertically
    const vf = `scale=1080:-2,pad=1080:1920:0:(1920-ih)/2:0x000000`;

    console.log(`[video] Portrait transform — bg ${bgColor}`);
    ffmpeg(inputPath)
      .videoFilters(vf)
      .outputOptions([
        "-c:v libx264",
        "-preset fast",
        "-crf 23",
        "-c:a copy",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("end", () => {
        console.log("[video] Portrait transform complete.");
        resolve();
      })
      .on("error", (err) => reject(new Error(`transformVideo failed: ${err.message}`)))
      .run();
  });
}

/**
 * Get video duration in seconds using ffprobe.
 */
export function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
}
