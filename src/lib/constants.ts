import type {
  AvatarDefinition,
  VoiceDefinition,
  EmotionDefinition,
  CaptionStyleDefinition,
  CaptionCustomization,
  DurationDefinition,
  OrientationDefinition,
  CaptionStyle,
} from "./types";

// ─── Avatars ───
export const AVATARS: AvatarDefinition[] = [
  {
    id: "avatar1",
    name: "Sophia",
    image: "/avatars/avatar1.png",
    description: "Professional woman — confident & polished",
  },
  {
    id: "avatar2",
    name: "James",
    image: "/avatars/avatar2.png",
    description: "Professional man — authoritative & warm",
  },
  {
    id: "avatar3",
    name: "Mia",
    image: "/avatars/avatar3.png",
    description: "Creative woman — energetic & approachable",
  },
  {
    id: "avatar4",
    name: "Alex",
    image: "/avatars/avatar4.png",
    description: "Creative man — modern & dynamic",
  },
];

// ─── Voices ───
export const VOICES: VoiceDefinition[] = [
  {
    id: "professional-male",
    label: "Professional Male",
    openaiVoice: "onyx",
    description: "Deep, authoritative tone",
  },
  {
    id: "professional-female",
    label: "Professional Female",
    openaiVoice: "nova",
    description: "Clear, confident tone",
  },
  {
    id: "friendly-female",
    label: "Friendly Female",
    openaiVoice: "shimmer",
    description: "Warm, approachable tone",
  },
  {
    id: "motivational-male",
    label: "Motivational Male",
    openaiVoice: "echo",
    description: "Energetic, inspiring tone",
  },
];

// ─── Emotions ───
export const EMOTIONS: EmotionDefinition[] = [
  {
    id: "neutral",
    label: "Neutral",
    emoji: "😐",
    description: "Calm and balanced delivery",
  },
  {
    id: "happy",
    label: "Happy",
    emoji: "😊",
    description: "Warm and upbeat energy",
  },
  {
    id: "excited",
    label: "Excited",
    emoji: "🤩",
    description: "High energy and enthusiasm",
  },
  {
    id: "motivational",
    label: "Motivational",
    emoji: "💪",
    description: "Powerful and inspiring",
  },
  {
    id: "professional",
    label: "Professional",
    emoji: "💼",
    description: "Polished and business-ready",
  },
  {
    id: "sad",
    label: "Sad",
    emoji: "😢",
    description: "Soft, heartfelt delivery",
  },
];

// ─── Caption Styles ───
export const CAPTION_STYLES: CaptionStyleDefinition[] = [
  {
    id: "viral",
    label: "Viral",
    description: "Large, bold captions with keyword highlights",
    emoji: "🔥",
  },
  {
    id: "professional",
    label: "Professional",
    description: "Clean, minimal subtitles",
    emoji: "✨",
  },
  {
    id: "creator",
    label: "Creator",
    description: "Word-by-word animated captions",
    emoji: "🎯",
  },
];

// ─── Caption Style Defaults ───
export const CAPTION_STYLE_DEFAULTS: Record<CaptionStyle, CaptionCustomization> = {
  viral: {
    primaryColor: "#00FFFF",
    outlineColor: "#000000",
    fontSize: 60,
    fontFamily: "Arial",
    bold: true,
    italic: false,
    outlineThickness: 4,
  },
  professional: {
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    fontSize: 36,
    fontFamily: "Arial",
    bold: false,
    italic: false,
    outlineThickness: 2,
  },
  creator: {
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    fontSize: 48,
    fontFamily: "Arial",
    bold: true,
    italic: false,
    outlineThickness: 4,
  },
};

// ─── Font Families ───
export const FONT_FAMILIES = [
  "Arial",
  "Impact",
  "Helvetica",
  "Verdana",
  "Georgia",
  "Trebuchet MS",
  "Times New Roman",
];

// ─── Sound Effect Definitions ───
export const SOUND_EFFECT_DEFINITIONS = [
  { id: "pop" as const,    label: "Pop",    emoji: "💥", description: "Quick snappy pop" },
  { id: "ding" as const,   label: "Ding",   emoji: "🔔", description: "Bright bell tone" },
  { id: "whoosh" as const, label: "Whoosh", emoji: "💨", description: "Swoosh sound" },
];

// ─── Durations ───
export const DURATIONS: DurationDefinition[] = [
  { id: "15", label: "15s", words: 37, description: "Quick clip" },
  { id: "30", label: "30s", words: 75, description: "Short clip" },
  { id: "60", label: "60s", words: 150, description: "Standard" },
  { id: "90", label: "90s", words: 225, description: "Long form" },
];

// ─── Orientations ───
export const ORIENTATIONS: OrientationDefinition[] = [
  { id: "landscape", label: "Landscape", emoji: "📺", description: "16:9 — YouTube, Twitter" },
  { id: "portrait", label: "Portrait (Reels)", emoji: "📱", description: "9:16 — TikTok, Reels, Shorts" },
];

// ─── Pipeline Steps ───
export const PIPELINE_STEPS = [
  { step: 1, label: "Processing Script",       emoji: "✍️" },
  { step: 2, label: "Creating Talking Avatar", emoji: "🎭" },
  { step: 3, label: "Generating Captions",     emoji: "📝" },
  { step: 4, label: "Adding Sound Effects",    emoji: "🔊" },
  { step: 5, label: "Rendering Final Video",   emoji: "🎬" },
  { step: 6, label: "Applying Format",         emoji: "📐" },
  { step: 7, label: "Complete",                emoji: "✅" },
] as const;

export const TOTAL_PIPELINE_STEPS = 7;
