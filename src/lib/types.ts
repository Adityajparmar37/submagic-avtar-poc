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
  | "professional"
  | "sad";

// ─── Caption Styles ───
export type CaptionStyle = "viral" | "professional" | "creator";

// ─── Video Duration (seconds) ───
export type VideoDuration = "15" | "30" | "60" | "90";

// ─── Video Orientation ───
export type VideoOrientation = "landscape" | "portrait";

// ─── Request / Response ───
export interface GenerateRequest {
  avatar: string;
  script: string;
  voice: VoiceOption;
  emotion: EmotionOption;
  captionStyle: CaptionStyle;
  duration: VideoDuration;
  orientation: VideoOrientation;
  captionCustomization?: CaptionCustomization;
  soundEffectWords?: UserWordEffect[];
}

// ─── Duration Definition ───
export interface DurationDefinition {
  id: VideoDuration;
  label: string;
  words: number;
  description: string;
}

// ─── Orientation Definition ───
export interface OrientationDefinition {
  id: VideoOrientation;
  label: string;
  emoji: string;
  description: string;
}

export interface GenerateResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

// ─── Token Usage ───
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface PipelineTokenUsage {
  scriptEnhancement?: TokenUsage;
  soundEffectAnalysis?: TokenUsage;
  total: TokenUsage;
}

// ─── Pipeline Progress (sent via SSE) ───
export interface PipelineProgress {
  step: number;
  totalSteps: number;
  status: "processing" | "completed" | "error";
  message: string;
}

export interface PipelineComplete {
  videoUrl: string;
  tokenUsage?: PipelineTokenUsage;
}

export interface PipelineResult {
  type: "progress" | "complete" | "error";
  data: PipelineProgress | PipelineComplete | { error: string };
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

// ─── Caption Customization ───
export interface CaptionCustomization {
  primaryColor: string;       // CSS hex "#RRGGBB"
  outlineColor: string;       // CSS hex "#RRGGBB"
  fontSize: number;           // points
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  outlineThickness: number;   // 0–8
}

// ─── Sound Effects ───
export type SoundEffectType = "pop" | "ding" | "whoosh";

// User-specified effect selection (before timestamp resolution)
export interface UserWordEffect {
  wordPosition: number;    // 0-based index in the original script words array
  word: string;            // raw word as typed (may include punctuation)
  effectType: SoundEffectType;
}

// Resolved effect with audio timestamp (used internally after transcription)
export interface WordEffect {
  wordIndex: number;
  word: string;
  timestamp: number;       // seconds into the audio
  effectType: SoundEffectType;
}
