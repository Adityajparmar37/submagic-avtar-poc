import { useRef, useState } from "react";
import ThumbnailGenerator from "./thumbnail-generator";

interface Props {
  videoUrl: string;
  onReset: () => void;
  sessionId: string;
}

export default function VideoPreview({ videoUrl, onReset, sessionId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/video/${sessionId}/download`);
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
    </div>
  );
}
