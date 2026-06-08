import type {
  CaptionStyle,
  WordTimestamp,
  SegmentTimestamp,
  TranscriptionResult,
} from "../../src/lib/types.ts";

/**
 * Convert seconds to ASS timestamp format: H:MM:SS.CC
 */
function toAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/**
 * Generate ASS subtitle content based on transcription and caption style.
 */
export function generateASS(
  transcription: TranscriptionResult,
  style: CaptionStyle
): string {
  const header = buildHeader(style);
  const events = buildEvents(transcription, style);
  return `${header}\n${events}`;
}

function buildHeader(style: CaptionStyle): string {
  const W = 1920;
  const H = 1080;
  // Alignment 2 = bottom-center.  MarginL/MarginR = horizontal padding, MarginV = pixels from bottom.
  // Format: Name,Font,Size,PrimaryColour,SecondaryColour,OutlineColour,BackColour,
  //         Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,
  //         BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV

  let styleDef: string;

  switch (style) {
    case "viral":
      // Big bold cyan, thick outline, bottom-center
      styleDef = `Style: Default,Arial,60,&H0000FFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,4,2,2,20,20,80`;
      break;
    case "professional":
      // Clean white, thin outline, bottom-center
      styleDef = `Style: Default,Arial,36,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,20,20,60`;
      break;
    case "creator":
      // White with thick black outline, bottom-center
      styleDef = `Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,0,2,20,20,70`;
      break;
  }

  return `[Script Info]
Title: SubMagic Avatar Captions
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV
${styleDef}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
}

function buildEvents(
  transcription: TranscriptionResult,
  style: CaptionStyle
): string {
  const lines: string[] = [];

  switch (style) {
    case "viral":
      // Show segments with keyword highlighting (uppercase important words)
      for (const segment of transcription.segments) {
        const start = toAssTime(segment.start);
        const end = toAssTime(segment.end);
        // Highlight words longer than 5 chars by making them bold + larger
        const text = segment.text
          .trim()
          .split(" ")
          .map((word) => {
            if (word.replace(/[^a-zA-Z]/g, "").length > 5) {
              return `{\\b1\\fs72\\c&H00FFFF&}${word.toUpperCase()}{\\b0\\fs60\\c&H00FFFF&}`;
            }
            return word;
          })
          .join(" ");
        lines.push(
          `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`
        );
      }
      break;

    case "professional":
      // Clean segment-based subtitles
      for (const segment of transcription.segments) {
        const start = toAssTime(segment.start);
        const end = toAssTime(segment.end);
        lines.push(
          `Dialogue: 0,${start},${end},Default,,0,0,0,,${segment.text.trim()}`
        );
      }
      break;

    case "creator":
      // Word-by-word appearance — each word is its own dialogue event
      for (const word of transcription.words) {
        const start = toAssTime(word.start);
        const end = toAssTime(word.end);
        lines.push(
          `Dialogue: 0,${start},${end},Default,,0,0,0,,{\\fad(100,100)}${word.word.trim()}`
        );
      }
      break;
  }

  return lines.join("\n");
}
