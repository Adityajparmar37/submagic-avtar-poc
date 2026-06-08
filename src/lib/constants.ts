import type {
  AvatarDefinition,
  VoiceDefinition,
  EmotionDefinition,
  CaptionStyleDefinition,
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

// ─── Pipeline Steps ───
export const PIPELINE_STEPS = [
  { step: 1, label: "Processing Script", emoji: "✍️" },
  { step: 2, label: "Creating Talking Avatar", emoji: "🎭" },
  { step: 3, label: "Generating Captions", emoji: "📝" },
  { step: 4, label: "Rendering Final Video", emoji: "🎬" },
  { step: 5, label: "Complete", emoji: "✅" },
] as const;

export const TOTAL_PIPELINE_STEPS = 5;
