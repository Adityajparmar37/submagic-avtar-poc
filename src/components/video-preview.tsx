import { useRef, useState } from "react";
import ThumbnailGenerator from "./thumbnail-generator";
import { apiUrl } from "../lib/api";
import type { PipelineTokenUsage } from "../lib/types";

interface Props {
  videoUrl: string;
  onReset: () => void;
  sessionId: string;
  tokenUsage?: PipelineTokenUsage;
}

export default function VideoPreview({ videoUrl, onReset, sessionId, tokenUsage }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(apiUrl(`/api/video/${sessionId}/download`));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submagic-avatar-${sessionId}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="animate-slide-up">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Video player */}
        <div className="relative" style={{ background: "#000" }}>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            className="w-full"
            style={{ maxHeight: "70vh", display: "block" }}
          />
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none"
            style={{
              background: "var(--color-primary)",
              color: "white",
              opacity: downloading ? 0.7 : 1,
              cursor: downloading ? "not-allowed" : "pointer",
            }}
          >
            {downloading ? "Downloading..." : "⬇ Download MP4"}
          </button>
          <button
            onClick={onReset}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = "var(--color-primary)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = "var(--color-border)";
            }}
          >
            + Generate Another
          </button>
        </div>
      </div>

      {/* Thumbnail generator */}
      <ThumbnailGenerator sessionId={sessionId} />

      {/* Token usage */}
      {tokenUsage && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            marginTop: "16px",
          }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--color-muted)", fontFamily: "var(--font-display)" }}
          >
            AI TOKEN USAGE
          </h3>
          <div className="space-y-2">
            {tokenUsage.scriptEnhancement && (
              <TokenRow
                label="Script Enhancement (Gemini)"
                tokens={tokenUsage.scriptEnhancement}
              />
            )}
            {tokenUsage.soundEffectAnalysis && (
              <TokenRow
                label="Sound Effect Analysis (Gemini)"
                tokens={tokenUsage.soundEffectAnalysis}
              />
            )}
            <div
              className="pt-2"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <TokenRow label="Total" tokens={tokenUsage.total} bold />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TokenRow({
  label,
  tokens,
  bold = false,
}: {
  label: string;
  tokens: { inputTokens: number; outputTokens: number; totalTokens: number };
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span
        style={{
          color: bold ? "var(--color-text)" : "var(--color-muted)",
          fontWeight: bold ? 600 : 400,
        }}
      >
        {label}
      </span>
      <div className="flex gap-3" style={{ color: "var(--color-muted)", flexShrink: 0 }}>
        <span title="Input tokens">
          <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
            {tokens.inputTokens.toLocaleString()}
          </span>{" "}
          in
        </span>
        <span title="Output tokens">
          <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
            {tokens.outputTokens.toLocaleString()}
          </span>{" "}
          out
        </span>
        <span title="Total tokens">
          <span
            style={{
              color: "var(--color-primary)",
              fontWeight: bold ? 700 : 500,
            }}
          >
            {tokens.totalTokens.toLocaleString()}
          </span>{" "}
          total
        </span>
      </div>
    </div>
  );
}
