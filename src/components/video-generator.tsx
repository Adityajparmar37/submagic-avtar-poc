import { useState, useEffect } from "react";
import AvatarGallery from "./avatar-gallery";
import ScriptEditor from "./script-editor";
import {
  VoiceSelector,
  EmotionSelector,
  CaptionStyleSelector,
  DurationSelector,
  OrientationSelector,
} from "./option-selectors";
import CaptionCustomizer from "./caption-customizer";
import WordEffectSelector from "./word-effect-selector";
import TavusOptionsPanel from "./tavus-options";
import ProgressIndicator from "./progress-indicator";
import VideoPreview from "./video-preview";
import { CAPTION_STYLE_DEFAULTS } from "../lib/constants";
import type {
  AvatarDefinition,
  VoiceOption,
  EmotionOption,
  CaptionStyle,
  CaptionCustomization,
  VideoDuration,
  VideoOrientation,
  UserWordEffect,
  TavusOptions,
  PipelineProgress,
  PipelineResult,
  PipelineComplete,
  PipelineTokenUsage,
} from "../lib/types";

type State =
  | { phase: "idle" }
  | { phase: "generating"; progress: PipelineProgress | null }
  | { phase: "done"; videoUrl: string; sessionId: string; tokenUsage?: PipelineTokenUsage }
  | { phase: "error"; message: string };

export default function VideoGenerator() {
  const [avatar, setAvatar] = useState<AvatarDefinition | null>(null);
  const [script, setScript] = useState("");
  const [voice, setVoice] = useState<VoiceOption>("professional-female");
  const [emotion, setEmotion] = useState<EmotionOption>("professional");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("viral");
  const [duration, setDuration] = useState<VideoDuration>("30");
  const [orientation, setOrientation] = useState<VideoOrientation>("landscape");
  const [captionCustomization, setCaptionCustomization] = useState<CaptionCustomization>(
    CAPTION_STYLE_DEFAULTS[captionStyle]
  );
  const [soundEffectWords, setSoundEffectWords] = useState<UserWordEffect[]>([]);
  const [tavusOptions, setTavusOptions] = useState<TavusOptions>({});
  const [state, setState] = useState<State>({ phase: "idle" });

  // Reset caption customization when the style preset changes
  useEffect(() => {
    setCaptionCustomization(CAPTION_STYLE_DEFAULTS[captionStyle]);
  }, [captionStyle]);

  const isGenerating = state.phase === "generating";
  const canGenerate =
    avatar !== null &&
    script.trim().length >= 10 &&
    !isGenerating;

  async function handleGenerate() {
    if (!canGenerate || !avatar) return;

    setState({ phase: "generating", progress: null });

    try {
      const body = {
        avatar: `${avatar.id}.png`,
        script: script.trim(),
        voice,
        emotion,
        captionStyle,
        duration,
        orientation,
        captionCustomization,
        soundEffectWords,
        tavusOptions,
      };

      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setState({ phase: "error", message: err.error || "Request failed" });
        return;
      }

      // Parse SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          let event: PipelineResult;
          try {
            event = JSON.parse(json);
          } catch {
            continue;
          }

          if (event.type === "progress") {
            setState({ phase: "generating", progress: event.data as PipelineProgress });
          } else if (event.type === "complete") {
            const { videoUrl, tokenUsage } = event.data as PipelineComplete;
            // Extract session ID from URL: /api/video/{sessionId}
            const sessionId = videoUrl.split("/").pop() ?? "";
            setState({ phase: "done", videoUrl, sessionId, tokenUsage });
          } else if (event.type === "error") {
            const { error } = event.data as { error: string };
            setState({ phase: "error", message: error });
          }
        }
      }
    } catch (err: any) {
      setState({ phase: "error", message: err.message || "An unexpected error occurred" });
    }
  }

  function handleReset() {
    // Clean up temp session files when the user is done
    if (state.phase === "done") {
      fetch(`/api/cleanup/${state.sessionId}`, { method: "DELETE" }).catch(() => {});
    }
    setState({ phase: "idle" });
    setScript("");
    setAvatar(null);
  }

  const progress = state.phase === "generating" ? state.progress : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* ── Left column: Config ── */}
      <div className="space-y-6">
        <div
          className="rounded-2xl p-6 space-y-6"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <AvatarGallery
            selected={avatar?.id ?? ""}
            onSelect={setAvatar}
            disabled={isGenerating}
          />
          <ScriptEditor
            value={script}
            onChange={setScript}
            disabled={isGenerating}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VoiceSelector value={voice} onChange={setVoice} disabled={isGenerating} />
            <EmotionSelector value={emotion} onChange={setEmotion} disabled={isGenerating} />
          </div>
          <DurationSelector value={duration} onChange={setDuration} disabled={isGenerating} />
          <OrientationSelector value={orientation} onChange={setOrientation} disabled={isGenerating} />
          <CaptionStyleSelector
            value={captionStyle}
            onChange={setCaptionStyle}
            disabled={isGenerating}
          />
          <CaptionCustomizer
            value={captionCustomization}
            onChange={setCaptionCustomization}
            disabled={isGenerating}
          />
          <WordEffectSelector
            script={script}
            selections={soundEffectWords}
            onChange={setSoundEffectWords}
            disabled={isGenerating}
          />
          <TavusOptionsPanel
            value={tavusOptions}
            onChange={setTavusOptions}
            disabled={isGenerating}
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 focus:outline-none"
          style={{
            fontFamily: "var(--font-display)",
            background: canGenerate
              ? "linear-gradient(135deg, var(--color-primary), oklch(50% 0.22 270))"
              : "var(--color-surface-2)",
            color: canGenerate ? "white" : "var(--color-muted)",
            cursor: canGenerate ? "pointer" : "not-allowed",
            boxShadow: canGenerate
              ? "0 4px 24px oklch(55% 0.22 295 / 0.4)"
              : "none",
            transform: canGenerate ? "scale(1)" : "scale(1)",
          }}
          onMouseEnter={(e) => {
            if (canGenerate) {
              (e.target as HTMLButtonElement).style.transform = "scale(1.01)";
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 6px 32px oklch(55% 0.22 295 / 0.55)";
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = "scale(1)";
            (e.target as HTMLButtonElement).style.boxShadow = canGenerate
              ? "0 4px 24px oklch(55% 0.22 295 / 0.4)"
              : "none";
          }}
        >
          {isGenerating ? "Generating..." : "🎬 Generate Video"}
        </button>

        {/* Validation hint */}
        {!isGenerating && (!avatar || script.trim().length < 10) && (
          <p className="text-xs text-center" style={{ color: "var(--color-muted)" }}>
            {!avatar
              ? "Select an avatar to continue"
              : "Enter at least 10 characters in your script"}
          </p>
        )}
      </div>

      {/* ── Right column: Preview / Progress ── */}
      <div className="space-y-4">
        {state.phase === "idle" && (
          <div
            className="rounded-2xl flex flex-col items-center justify-center text-center"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              minHeight: "400px",
            }}
          >
            <div className="text-6xl mb-4">🎭</div>
            <h2
              className="text-xl font-bold mb-2 gradient-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your video will appear here
            </h2>
            <p className="text-sm" style={{ color: "var(--color-muted)", maxWidth: "280px" }}>
              Choose an avatar, write your script, and click Generate to create a talking-avatar video.
            </p>
          </div>
        )}

        {state.phase === "generating" && (
          <div
            className="rounded-2xl flex flex-col justify-center"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              minHeight: "400px",
              padding: "32px",
            }}
          >
            <ProgressIndicator progress={progress} />
            <p
              className="text-xs text-center mt-6"
              style={{ color: "var(--color-muted)" }}
            >
              This takes 60–90 seconds. Please keep this tab open.
            </p>
          </div>
        )}

        {state.phase === "done" && (
          <VideoPreview
            videoUrl={state.videoUrl}
            sessionId={state.sessionId}
            tokenUsage={state.tokenUsage}
            onReset={handleReset}
          />
        )}

        {state.phase === "error" && (
          <div
            className="rounded-2xl p-8 flex flex-col items-center text-center animate-slide-up"
            style={{
              background: "var(--color-surface)",
              border: "1px solid oklch(65% 0.2 30 / 0.5)",
              minHeight: "200px",
              justifyContent: "center",
            }}
          >
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="font-bold mb-2" style={{ color: "oklch(75% 0.2 30)" }}>
              Generation Failed
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)", maxWidth: "300px" }}>
              {state.message}
            </p>
            <button
              onClick={() => setState({ phase: "idle" })}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Info card */}
        {state.phase === "idle" && (
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-muted)", fontFamily: "var(--font-display)" }}
            >
              HOW IT WORKS
            </h3>
            {[
              { emoji: "✍️", text: "Gemini enhances your script for the chosen emotion" },
              { emoji: "🎙️", text: "OpenAI TTS generates natural-sounding speech" },
              { emoji: "🎭", text: "fal.ai OmniHuman lip-syncs the avatar to your audio" },
              { emoji: "📝", text: "Groq Whisper generates word-level captions" },
              { emoji: "🎬", text: "FFmpeg burns styled captions into the final video" },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0">{emoji}</span>
                <span style={{ color: "var(--color-muted)" }}>{text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
