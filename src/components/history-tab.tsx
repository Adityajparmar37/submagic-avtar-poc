import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

interface HistorySession {
  sessionId: string;
  createdAt: string;
  avatarId: string;
  emotion: string;
  voice: string;
  duration: string;
  orientation: string;
  captionStyle: string;
  scriptSnippet: string;
  fileSizeBytes: number;
  tokenUsage?: {
    total?: { totalTokens: number };
  };
}

const EMOTION_EMOJI: Record<string, string> = {
  neutral: "😐", happy: "😊", excited: "🤩",
  motivational: "💪", professional: "💼", sad: "😢",
};

const ORIENTATION_LABEL: Record<string, string> = {
  landscape: "16:9", portrait: "9:16",
};

export default function HistoryTab() {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/history"))
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(sessionId: string) {
    setDeleting(sessionId);
    try {
      await fetch(apiUrl(`/api/cleanup/${sessionId}`), { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: "var(--color-muted)" }}>
        Loading history...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center text-center py-24"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="text-5xl mb-4">🎬</div>
        <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          No videos yet
        </h2>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Generated videos will appear here. Go to the Generate tab to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          {sessions.length} video{sessions.length !== 1 ? "s" : ""} generated this session
        </p>
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
          History resets when the server restarts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((s) => (
          <SessionCard
            key={s.sessionId}
            session={s}
            isPlaying={playing === s.sessionId}
            isDeleting={deleting === s.sessionId}
            onPlay={() => setPlaying(playing === s.sessionId ? null : s.sessionId)}
            onDelete={() => handleDelete(s.sessionId)}
          />
        ))}
      </div>
    </div>
  );
}

function SessionCard({
  session: s,
  isPlaying,
  isDeleting,
  onPlay,
  onDelete,
}: {
  session: HistorySession;
  isPlaying: boolean;
  isDeleting: boolean;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const videoUrl = apiUrl(`/api/video/${s.sessionId}`);
  const downloadUrl = apiUrl(`/api/video/${s.sessionId}/download`);
  const createdDate = new Date(s.createdAt);
  const fileMB = (s.fileSizeBytes / (1024 * 1024)).toFixed(1);

  async function handleDownload() {
    const res = await fetch(downloadUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submagic-${s.sessionId.slice(0, 8)}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      {/* Video player (shown on play) */}
      {isPlaying && (
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full"
          style={{ maxHeight: "280px", background: "#000", display: "block" }}
        />
      )}

      <div className="p-4 space-y-3">
        {/* Script snippet */}
        <p className="text-sm leading-snug line-clamp-2" style={{ color: "var(--color-text)" }}>
          {s.scriptSnippet}{s.scriptSnippet.length >= 120 ? "…" : ""}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge>{EMOTION_EMOJI[s.emotion] ?? "🎭"} {s.emotion}</Badge>
          <Badge>{s.avatarId}</Badge>
          <Badge>{s.duration}s</Badge>
          <Badge>{ORIENTATION_LABEL[s.orientation] ?? s.orientation}</Badge>
          <Badge>{s.captionStyle}</Badge>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-muted)" }}>
          <span title={createdDate.toLocaleString()}>
            {formatRelative(createdDate)}
          </span>
          <span>{fileMB} MB{s.tokenUsage?.total ? ` · ${s.tokenUsage.total.totalTokens.toLocaleString()} tokens` : ""}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onPlay}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: isPlaying ? "var(--color-surface-2)" : "var(--color-primary)",
              color: isPlaying ? "var(--color-text)" : "white",
              border: isPlaying ? "1px solid var(--color-border)" : "none",
              cursor: "pointer",
            }}
          >
            {isPlaying ? "⏹ Hide" : "▶ Play"}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              cursor: "pointer",
            }}
          >
            ⬇ Download
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="py-2 px-3 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid oklch(65% 0.2 30 / 0.4)",
              color: "oklch(65% 0.2 30)",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.5 : 1,
            }}
          >
            {isDeleting ? "…" : "🗑"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: "var(--color-surface-2)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}
    >
      {children}
    </span>
  );
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
}
