import { VOICES, EMOTIONS, CAPTION_STYLES, DURATIONS, ORIENTATIONS } from "../lib/constants";
import type { VoiceOption, EmotionOption, CaptionStyle, VideoDuration, VideoOrientation } from "../lib/types";

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function Select({ label, value, onChange, disabled, children }: SelectProps) {
  return (
    <div>
      <label
        className="block text-sm font-semibold mb-2"
        style={{ color: "var(--color-muted)" }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none transition-all"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          paddingRight: "40px",
        }}
      >
        {children}
      </select>
    </div>
  );
}

interface VoiceSelectorProps {
  value: VoiceOption;
  onChange: (v: VoiceOption) => void;
  disabled?: boolean;
}

export function VoiceSelector({ value, onChange, disabled }: VoiceSelectorProps) {
  return (
    <Select label="VOICE" value={value} onChange={(v) => onChange(v as VoiceOption)} disabled={disabled}>
      {VOICES.map((v) => (
        <option key={v.id} value={v.id}>
          {v.label} — {v.description}
        </option>
      ))}
    </Select>
  );
}

interface EmotionSelectorProps {
  value: EmotionOption;
  onChange: (v: EmotionOption) => void;
  disabled?: boolean;
}

export function EmotionSelector({ value, onChange, disabled }: EmotionSelectorProps) {
  return (
    <Select label="EMOTION" value={value} onChange={(v) => onChange(v as EmotionOption)} disabled={disabled}>
      {EMOTIONS.map((e) => (
        <option key={e.id} value={e.id}>
          {e.emoji} {e.label} — {e.description}
        </option>
      ))}
    </Select>
  );
}

interface CaptionStyleSelectorProps {
  value: CaptionStyle;
  onChange: (v: CaptionStyle) => void;
  disabled?: boolean;
}

export function CaptionStyleSelector({ value, onChange, disabled }: CaptionStyleSelectorProps) {
  return (
    <div>
      <label
        className="block text-sm font-semibold mb-3"
        style={{ color: "var(--color-muted)" }}
      >
        CAPTION STYLE
      </label>
      <div className="grid grid-cols-3 gap-3">
        {CAPTION_STYLES.map((style) => {
          const isSelected = value === style.id;
          return (
            <button
              key={style.id}
              onClick={() => !disabled && onChange(style.id)}
              disabled={disabled}
              className="rounded-xl p-3 text-left transition-all duration-200 focus:outline-none"
              style={{
                background: isSelected ? "oklch(55% 0.22 295 / 0.2)" : "var(--color-surface-2)",
                border: isSelected
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <div className="text-xl mb-1">{style.emoji}</div>
              <div className="text-sm font-semibold">{style.label}</div>
              <div
                className="text-xs mt-1 leading-tight"
                style={{ color: "var(--color-muted)" }}
              >
                {style.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pill button used by Duration, Orientation ───
function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { id: T; label: string; description?: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-muted)" }}>
        {label}
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => !disabled && onChange(opt.id)}
              disabled={disabled}
              title={opt.description}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none"
              style={{
                background: isSelected ? "oklch(55% 0.22 295 / 0.2)" : "var(--color-surface-2)",
                border: isSelected
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
                color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Duration Selector ───
interface DurationSelectorProps {
  value: VideoDuration;
  onChange: (v: VideoDuration) => void;
  disabled?: boolean;
}

export function DurationSelector({ value, onChange, disabled }: DurationSelectorProps) {
  return (
    <PillGroup
      label="DURATION"
      options={DURATIONS.map((d) => ({ id: d.id, label: d.label, description: d.description }))}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

// ─── Orientation Selector ───
interface OrientationSelectorProps {
  value: VideoOrientation;
  onChange: (v: VideoOrientation) => void;
  disabled?: boolean;
}

export function OrientationSelector({ value, onChange, disabled }: OrientationSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-muted)" }}>
        FORMAT
      </label>
      <div className="grid grid-cols-2 gap-3">
        {ORIENTATIONS.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => !disabled && onChange(opt.id)}
              disabled={disabled}
              className="rounded-xl p-3 text-left transition-all duration-200 focus:outline-none"
              style={{
                background: isSelected ? "oklch(55% 0.22 295 / 0.2)" : "var(--color-surface-2)",
                border: isSelected
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <div className="text-xl mb-1">{opt.emoji}</div>
              <div className="text-sm font-semibold">{opt.label}</div>
              <div className="text-xs mt-1 leading-tight" style={{ color: "var(--color-muted)" }}>
                {opt.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
