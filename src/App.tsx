import { useState } from "react";
import VideoGenerator from "./components/video-generator";
import HistoryTab from "./components/history-tab";

type Tab = "generate" | "history";

export default function App() {
  const [tab, setTab] = useState<Tab>("generate");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <header className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h1
                className="text-xl font-bold gradient-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                SubMagic Avatar
              </h1>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                AI-powered talking avatar video generator
              </p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
            {(["generate", "history"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
                style={{
                  background: tab === t ? "var(--color-primary)" : "transparent",
                  color: tab === t ? "white" : "var(--color-muted)",
                  cursor: "pointer",
                  border: "none",
                  fontFamily: "var(--font-display)",
                }}
              >
                {t === "generate" ? "🎬 Generate" : "🕘 History"}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === "generate" ? <VideoGenerator /> : <HistoryTab />}
      </main>
    </div>
  );
}
