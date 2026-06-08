import VideoGenerator from "./components/video-generator";

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <header className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
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
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <VideoGenerator />
      </main>
    </div>
  );
}
