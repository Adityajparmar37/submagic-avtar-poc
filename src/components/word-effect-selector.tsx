import type { SoundEffectType, UserWordEffect } from "../lib/types";

export type { UserWordEffect };

const EFFECT_CYCLE: (SoundEffectType | null)[] = [null, "pop", "ding", "whoosh"];

const EFFECT_META: Record<SoundEffectType, { emoji: string; label: string; color: string }> = {
  pop:    { emoji: "💥", label: "Pop",    color: "#EF4444" },
  ding:   { emoji: "🔔", label: "Ding",   color: "#F59E0B" },
  whoosh: { emoji: "💨", label: "Whoosh", color: "#3B82F6" },
};

interface Props {
  script: string;
  selections: UserWordEffect[];
  onChange: (selections: UserWordEffect[]) => void;
  disabled?: boolean;
}

export default function WordEffectSelector({ script, selections, onChange, disabled }: Props) {
  const words = script.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return (
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-muted)" }}>
          WORD SOUND EFFECTS
        </label>
        <div
          className="rounded-xl p-4 text-center text-sm"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted)",
          }}
        >
          Write your script above to select words for sound effects
        </div>
      </div>
    );
  }

  function handleWordClick(pos: number, word: string) {
    if (disabled) return;
    const existing = selections.find((s) => s.wordPosition === pos);
    const currentEffect = existing?.effectType ?? null;
    const nextEffect = EFFECT_CYCLE[(EFFECT_CYCLE.indexOf(currentEffect) + 1) % EFFECT_CYCLE.length];

    if (nextEffect === null) {
      onChange(selections.filter((s) => s.wordPosition !== pos));
    } else {
      onChange([
        ...selections.filter((s) => s.wordPosition !== pos),
        { wordPosition: pos, word, effectType: nextEffect },
      ]);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
          WORD SOUND EFFECTS
        </label>
        {selections.length > 0 && (
          <button
            onClick={() => !disabled && onChange([])}
            disabled={disabled}
            className="text-xs focus:outline-none"
            style={{
              color: "var(--color-muted)",
              background: "none",
              border: "none",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <div
        className="rounded-xl p-3 space-y-3"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs" style={{ color: "var(--color-muted)" }}>
            Click a word to cycle:
          </span>
          {(["pop", "ding", "whoosh"] as SoundEffectType[]).map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: EFFECT_META[t].color + "22",
                color: EFFECT_META[t].color,
                border: `1px solid ${EFFECT_META[t].color}55`,
              }}
            >
              {EFFECT_META[t].emoji} {EFFECT_META[t].label}
            </span>
          ))}
          <span className="text-xs" style={{ color: "var(--color-muted)", opacity: 0.6 }}>→ off</span>
        </div>

        {/* Word chips */}
        <div className="flex flex-wrap gap-1.5">
          {words.map((word, i) => {
            const sel = selections.find((s) => s.wordPosition === i);
            const meta = sel ? EFFECT_META[sel.effectType] : null;
            return (
              <button
                key={i}
                onClick={() => handleWordClick(i, word)}
                disabled={disabled}
                title={meta ? `${meta.label} effect — click to change` : "Click to add sound effect"}
                className="rounded-lg px-2 py-1 text-sm transition-all duration-150 focus:outline-none"
                style={{
                  background: meta ? meta.color + "22" : "var(--color-surface)",
                  border: `1px solid ${meta ? meta.color + "88" : "var(--color-border)"}`,
                  color: meta ? meta.color : "var(--color-text)",
                  fontWeight: meta ? 600 : 400,
                  cursor: disabled ? "not-allowed" : "pointer",
                  transform: meta ? "scale(1.04)" : "scale(1)",
                }}
              >
                {meta && <span className="mr-1">{meta.emoji}</span>}
                {word}
              </button>
            );
          })}
        </div>

        {/* Active effects summary */}
        {selections.length > 0 && (
          <div
            className="pt-2 flex flex-wrap gap-2"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            {[...selections]
              .sort((a, b) => a.wordPosition - b.wordPosition)
              .map((s) => (
                <span
                  key={s.wordPosition}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: EFFECT_META[s.effectType].color + "18",
                    color: EFFECT_META[s.effectType].color,
                    border: `1px solid ${EFFECT_META[s.effectType].color}44`,
                  }}
                >
                  {EFFECT_META[s.effectType].emoji} "{s.word}" → {s.effectType}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
