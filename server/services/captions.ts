import type {
  CaptionStyle,
  CaptionCustomization,
  WordTimestamp,
  SegmentTimestamp,
  TranscriptionResult,
} from "../../src/lib/types.ts";
import { CAPTION_STYLE_DEFAULTS } from "../../src/lib/constants.ts";

// Convert CSS #RRGGBB to ASS &H00BBGGRR
function cssHexToAss(hex: string): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = h.slice(0, 2);
  const g = h.slice(2, 4);
  const b = h.slice(4, 6);
  return `&H00${b}${g}${r}`.toUpperCase();
}

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
 * Generate ASS subtitle content based on transcription, caption style, and optional customization.
 */
export function generateASS(
  transcription: TranscriptionResult,
  style: CaptionStyle,
  custom?: CaptionCustomization
): string {
  const header = buildHeader(style, custom);
  const events = buildEvents(transcription, style, custom);
  return `${header}\n${events}`;
}

function buildStyleDef(style: CaptionStyle, custom: CaptionCustomization): string {
  const primary = cssHexToAss(custom.primaryColor);
  const outline = cssHexToAss(custom.outlineColor);
  const bold   = custom.bold   ? "1" : "0";
  const italic = custom.italic ? "1" : "0";
  // Preserve style-specific layout values
  const bgColor = style === "professional" ? "&H00000000" : "&H80000000";
  const shadow  = style === "viral" ? "2" : "0";
  const marginV = style === "viral" ? "80" : style === "professional" ? "60" : "70";
  return `Style: Default,${custom.fontFamily},${custom.fontSize},${primary},&H000000FF,${outline},${bgColor},${bold},${italic},0,0,100,100,0,0,1,${custom.outlineThickness},${shadow},2,20,20,${marginV}`;
}

function buildHeader(style: CaptionStyle, custom?: CaptionCustomization): string {
  const W = 1920;
  const H = 1080;
  const resolved = custom ?? CAPTION_STYLE_DEFAULTS[style];
  const styleDef = buildStyleDef(style, resolved);

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
  style: CaptionStyle,
  custom?: CaptionCustomization
): string {
  const lines: string[] = [];
  const resolved = custom ?? CAPTION_STYLE_DEFAULTS[style];
  const highlightColor = cssHexToAss(resolved.primaryColor);
  const bigSize = Math.round(resolved.fontSize * 1.2);

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
              return `{\\b1\\fs${bigSize}\\c${highlightColor}}${word.toUpperCase()}{\\b0\\fs${resolved.fontSize}\\c${highlightColor}}`;
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
