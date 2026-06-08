import { PIPELINE_STEPS, TOTAL_PIPELINE_STEPS } from "../lib/constants";
import type { PipelineProgress } from "../lib/types";

interface Props {
  progress: PipelineProgress | null;
}

export default function ProgressIndicator({ progress }: Props) {
  if (!progress) return null;

  const currentStep = progress.step;
  const pct = Math.round((currentStep / TOTAL_PIPELINE_STEPS) * 100);

  return (
    <div className="animate-slide-up rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ fontFamily: "var(--font-display)" }}>
          Generating your video...
        </h3>
        <span className="text-sm font-mono" style={{ color: "var(--color-accent)" }}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full mb-5 overflow-hidden"
        style={{ background: "var(--color-surface-2)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
          }}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-2">
        {PIPELINE_STEPS.map(({ step, label, emoji }) => {
          const isDone = step < currentStep;
          const isActive = step === currentStep;
          const isPending = step > currentStep;

          return (
            <div
              key={step}
              className="flex items-center gap-3 text-sm transition-all duration-300"
              style={{ opacity: isPending ? 0.35 : 1 }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-300"
                style={{
                  background: isDone
                    ? "var(--color-primary)"
                    : isActive
                    ? "oklch(55% 0.22 295 / 0.25)"
                    : "var(--color-surface-2)",
                  border: isActive
                    ? "1px solid var(--color-primary)"
                    : isDone
                    ? "none"
                    : "1px solid var(--color-border)",
                  animation: isActive ? "glow-pulse 2s ease-in-out infinite" : "none",
                }}
              >
                {isDone ? "✓" : emoji}
              </div>
              <span
                style={{
                  color: isActive
                    ? "var(--color-text)"
                    : isDone
                    ? "var(--color-muted)"
                    : "var(--color-muted)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
                {isActive && (
                  <span
                    className="ml-2 inline-block text-xs"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {progress.message.split("—")[1]?.trim() || ""}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
