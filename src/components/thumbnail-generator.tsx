import { useState } from "react";

type ThumbnailStyle = "engaging" | "normal" | "cinematic" | "professional" | "dynamic";

interface StyleOption {
  id: ThumbnailStyle;
  label: string;
  emoji: string;
  description: string;
}

const STYLES: StyleOption[] = [
  {
    id: "engaging",
    label: "Engaging",
    emoji: "⚡",
    description: "Best scene, vibrant colors",
  },
  {
    id: "normal",
    label: "Normal",
    emoji: "📸",
    description: "Clean mid-video frame",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    emoji: "🎬",
    description: "Letterbox, dramatic tone",
  },
  {
    id: "professional",
    label: "Professional",
    emoji: "💼",
    description: "Polished intro frame",
  },
  {
    id: "dynamic",
    label: "Dynamic",
    emoji: "🔥",
    description: "Bold, vivid action frame",
  },
];

interface Props {
  sessionId: string;
}

export default function ThumbnailGenerator({ sessionId }: Props) {
  const [selectedStyle, setSelectedStyle] = useState<ThumbnailStyle>("engaging");
  const [generating, setGenerating] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setThumbnailUrl(null);

    try {
      const res = await fetch(`/api/thumbnail/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: selectedStyle }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Thumbnail generation failed");
        return;
      }

      // Cache-bust so the browser always fetches the new image
      setThumbnailUrl(`${data.thumbnailUrl}?t=${Date.now()}`);
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setGenerating(false);
    }
  }

  function handleSelectStyle(id: ThumbnailStyle) {
    setSelectedStyle(id);
    setThumbnailUrl(null);
    setError(null);
  }

  function handleDownload() {
    if (!thumbnailUrl) return;
    const a = document.createElement("a");
    a.href = thumbnailUrl;
    a.download = `submagic-thumbnail-${selectedStyle}.jpg`;
    a.click();
  }

  return (
    <div
      className="mt-4 rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="p-4">
        <p
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--color-text)" }}
        >
          Thumbnail Generator
        </p>

        {/* Style cards */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {STYLES.map((s) => {
            const active = selectedStyle === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectStyle(s.id)}
                className="flex flex-col items-center p-2 rounded-xl text-xs transition-all duration-200 focus:outline-none"
                style={{
                  background: active ? "var(--color-primary)" : "var(--color-surface-2)",
                  border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                  color: active ? "white" : "var(--color-text)",
                  cursor: "pointer",
                }}
              >
                <span className="text-xl mb-1">{s.emoji}</span>
                <span className="font-semibold leading-none mb-0.5">{s.label}</span>
                <span
                  className="text-center leading-tight"
                  style={{
                    fontSize: "10px",
                    opacity: active ? 0.85 : 0.6,
                  }}
                >
                  {s.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none"
          style={{
            background: generating ? "var(--color-surface-2)" : "var(--color-primary)",
            color: generating ? "var(--color-text-muted)" : "white",
            border: generating ? "1px solid var(--color-border)" : "none",
            cursor: generating ? "not-allowed" : "pointer",
          }}
        >
          {generating ? "Generating AI thumbnail (up to 60s)..." : "Generate Thumbnail"}
        </button>

        {error && (
          <p className="mt-2 text-xs" style={{ color: "#f87171" }}>
            {error}
          </p>
        )}

        {/* Preview + download */}
        {thumbnailUrl && (
          <div className="mt-4">
            <img
              src={thumbnailUrl}
              alt={`${selectedStyle} thumbnail`}
              className="w-full rounded-xl object-cover"
              style={{ border: "1px solid var(--color-border)" }}
            />
            <button
              onClick={handleDownload}
              className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                cursor: "pointer",
              }}
            >
              ⬇ Download Thumbnail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
