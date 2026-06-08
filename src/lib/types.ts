// ─── Voice Options ───
export type VoiceOption =
  | "professional-male"
  | "professional-female"
  | "friendly-female"
  | "motivational-male";

// ─── Emotion Options ───
export type EmotionOption =
  | "neutral"
  | "happy"
  | "excited"
  | "motivational"
  | "professional";

// ─── Caption Styles ───
export type CaptionStyle = "viral" | "professional" | "creator";

// ─── Request / Response ───
export interface GenerateRequest {
  avatar: string;
  script: string;
  voice: VoiceOption;
  emotion: EmotionOption;
  captionStyle: CaptionStyle;
}

export interface GenerateResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

// ─── Pipeline Progress (sent via SSE) ───
export interface PipelineProgress {
  step: number;
  totalSteps: number;
  status: "processing" | "completed" | "error";
  message: string;
}

export interface PipelineResult {
  type: "progress" | "complete" | "error";
  data: PipelineProgress | { videoUrl: string } | { error: string };
}

// ─── Transcription Data ───
export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface SegmentTimestamp {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  text: string;
  words: WordTimestamp[];
  segments: SegmentTimestamp[];
}

// ─── Avatar Definition ───
export interface AvatarDefinition {
  id: string;
  name: string;
  image: string;
  description: string;
}

// ─── Voice Definition ───
export interface VoiceDefinition {
  id: VoiceOption;
  label: string;
  openaiVoice: string;
  description: string;
}

// ─── Emotion Definition ───
export interface EmotionDefinition {
  id: EmotionOption;
  label: string;
  emoji: string;
  description: string;
}

// ─── Caption Style Definition ───
export interface CaptionStyleDefinition {
  id: CaptionStyle;
  label: string;
  description: string;
  emoji: string;
}
