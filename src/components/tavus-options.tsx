import { useState } from "react";
import type { TavusOptions, TavusLanguage } from "../lib/types";

interface Props {
  value: TavusOptions;
  onChange: (v: TavusOptions) => void;
  disabled?: boolean;
}

const LANGUAGES: { code: TavusLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "nl", label: "Dutch" },
  { code: "tr", label: "Turkish" },
  { code: "pl", label: "Polish" },
];

export default function TavusOptions({ value, onChange, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);

  function set<K extends keyof TavusOptions>(key: K, val: TavusOptions[K]) {
    onChange({ ...value, [key]: val });
  }

  const activeCount = [
    value.customReplicaId,
    value.backgroundUrl,
    value.backgroundColor && value.backgroundColor !== "#000000",
    value.language && value.language !== "en",
    value.applyGreenscreen,
    value.disableWatermark,
  ].filter(Boolean).length;

  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
      }}
    >
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
        style={{
          background: "var(--color-surface-2)",
          color: "var(--color-text)",
          cursor: disabled ? "not-allowed" : "pointer",
          border: "none",
          textAlign: "left",
        }}
      >
        <span style={{ fontFamily: "var(--font-display)" }}>
          TAVUS SETTINGS
          {activeCount > 0 && (
            <span
              className="ml-2 px-1.5 py-0.5 rounded text-xs"
              style={{
                background: "var(--color-primary)",
                color: "white",
                fontWeight: 700,
              }}
            >
              {activeCount}
            </span>
          )}
        </span>
        <span style={{ color: "var(--color-muted)", fontSize: "10px" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="p-4 space-y-4" style={{ background: "var(--color-surface)" }}>

          {/* Custom Replica ID */}
          <Field label="Custom Replica ID" hint="Overrides the avatar's preset Tavus replica">
            <input
              type="text"
              placeholder="e.g. r4b2c9f1a3..."
              value={value.customReplicaId ?? ""}
              onChange={(e) => set("customReplicaId", e.target.value || undefined)}
              disabled={disabled}
              style={inputStyle}
            />
          </Field>

          {/* Background URL */}
          <Field label="Background URL" hint="Image or video URL rendered behind the avatar">
            <input
              type="url"
              placeholder="https://example.com/bg.jpg"
              value={value.backgroundUrl ?? ""}
              onChange={(e) => set("backgroundUrl", e.target.value || undefined)}
              disabled={disabled}
              style={inputStyle}
            />
          </Field>

          {/* Background Color */}
          <Field label="Background Color" hint="Solid color fallback when no background URL is set">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={value.backgroundColor ?? "#000000"}
                onChange={(e) => set("backgroundColor", e.target.value)}
                disabled={disabled}
                style={{ width: 40, height: 36, cursor: disabled ? "not-allowed" : "pointer", border: "none", borderRadius: 6, background: "none" }}
              />
              <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                {value.backgroundColor ?? "#000000"}
              </span>
            </div>
          </Field>

          {/* Language */}
          <Field label="Language" hint="Spoken language of the script">
            <select
              value={value.language ?? "en"}
              onChange={(e) => set("language", e.target.value as TavusLanguage)}
              disabled={disabled}
              style={inputStyle}
            >
              {LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label} ({code})
                </option>
              ))}
            </select>
          </Field>

          {/* Toggles row */}
          <div className="flex gap-4 flex-wrap">
            <Toggle
              label="Apply Greenscreen"
              hint="Remove green screen from replica"
              checked={value.applyGreenscreen ?? false}
              onChange={(v) => set("applyGreenscreen", v || undefined)}
              disabled={disabled}
            />
            <Toggle
              label="Disable Watermark"
              hint="Paid plan feature"
              checked={value.disableWatermark ?? false}
              onChange={(v) => set("disableWatermark", v || undefined)}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-2)",
  color: "var(--color-text)",
  fontSize: 13,
  outline: "none",
};

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>{label}</span>
        <span className="text-xs" style={{ color: "var(--color-muted)" }}>{hint}</span>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label, hint, checked, onChange, disabled,
}: {
  label: string; hint: string; checked: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <label
      className="flex items-center gap-2 cursor-pointer select-none"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10, flexShrink: 0,
          background: checked ? "var(--color-primary)" : "var(--color-border)",
          position: "relative", transition: "background .2s",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <div
          style={{
            position: "absolute", top: 3,
            left: checked ? 19 : 3,
            width: 14, height: 14, borderRadius: "50%",
            background: "white",
            transition: "left .2s",
          }}
        />
      </div>
      <div>
        <div className="text-xs font-medium" style={{ color: "var(--color-text)" }}>{label}</div>
        <div className="text-xs" style={{ color: "var(--color-muted)" }}>{hint}</div>
      </div>
    </label>
  );
}
