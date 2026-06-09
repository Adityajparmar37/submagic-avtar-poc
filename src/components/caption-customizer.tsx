import { useState } from "react";
import { FONT_FAMILIES } from "../lib/constants";
import type { CaptionCustomization } from "../lib/types";

interface Props {
  value: CaptionCustomization;
  onChange: (v: CaptionCustomization) => void;
  disabled?: boolean;
}

function buildPreviewShadow(outlineColor: string, thickness: number): string {
  if (thickness === 0) return "none";
  const t = Math.max(1, Math.round(thickness * 0.8));
  return [
    `-${t}px -${t}px 0 ${outlineColor}`,
    ` ${t}px -${t}px 0 ${outlineColor}`,
    `-${t}px  ${t}px 0 ${outlineColor}`,
    ` ${t}px  ${t}px 0 ${outlineColor}`,
  ].join(", ");
}

export default function CaptionCustomizer({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);

  function set<K extends keyof CaptionCustomization>(key: K, val: CaptionCustomization[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div>
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-2 text-xs font-semibold transition-colors focus:outline-none"
        style={{
          color: open ? "var(--color-primary)" : "var(--color-muted)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        <span
          className="transition-transform duration-200"
          style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        CUSTOMIZE CAPTION STYLE
      </button>

      {open && (
        <div
          className="mt-3 rounded-xl p-4 space-y-4"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Color row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
                TEXT COLOR
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  disabled={disabled}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                  style={{ background: "none", padding: 0 }}
                />
                <span className="text-xs font-mono" style={{ color: "var(--color-muted)" }}>
                  {value.primaryColor.toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
                OUTLINE COLOR
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.outlineColor}
                  onChange={(e) => set("outlineColor", e.target.value)}
                  disabled={disabled}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                  style={{ background: "none", padding: 0 }}
                />
                <span className="text-xs font-mono" style={{ color: "var(--color-muted)" }}>
                  {value.outlineColor.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Font family */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
              FONT
            </label>
            <div className="flex items-center gap-3">
              <select
                value={value.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value)}
                disabled={disabled}
                className="flex-1 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              {/* Bold */}
              <button
                onClick={() => set("bold", !value.bold)}
                disabled={disabled}
                className="w-9 h-9 rounded-lg text-sm font-extrabold transition-all focus:outline-none"
                style={{
                  background: value.bold ? "oklch(55% 0.22 295 / 0.2)" : "var(--color-surface)",
                  border: value.bold ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                  color: value.bold ? "var(--color-primary)" : "var(--color-muted)",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                B
              </button>
              {/* Italic */}
              <button
                onClick={() => set("italic", !value.italic)}
                disabled={disabled}
                className="w-9 h-9 rounded-lg text-sm font-semibold italic transition-all focus:outline-none"
                style={{
                  background: value.italic ? "oklch(55% 0.22 295 / 0.2)" : "var(--color-surface)",
                  border: value.italic ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                  color: value.italic ? "var(--color-primary)" : "var(--color-muted)",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                I
              </button>
            </div>
          </div>

          {/* Font size */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                FONT SIZE
              </label>
              <span className="text-xs font-mono" style={{ color: "var(--color-accent)" }}>
                {value.fontSize}pt
              </span>
            </div>
            <input
              type="range"
              min={24}
              max={96}
              step={4}
              value={value.fontSize}
              onChange={(e) => set("fontSize", Number(e.target.value))}
              disabled={disabled}
              className="w-full accent-current"
              style={{ accentColor: "var(--color-primary)", cursor: disabled ? "not-allowed" : "pointer" }}
            />
          </div>

          {/* Outline thickness */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                OUTLINE THICKNESS
              </label>
              <span className="text-xs font-mono" style={{ color: "var(--color-accent)" }}>
                {value.outlineThickness}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={value.outlineThickness}
              onChange={(e) => set("outlineThickness", Number(e.target.value))}
              disabled={disabled}
              className="w-full"
              style={{ accentColor: "var(--color-primary)", cursor: disabled ? "not-allowed" : "pointer" }}
            />
          </div>

          {/* Live preview */}
          <div
            className="rounded-lg flex items-center justify-center"
            style={{
              background: "#111",
              border: "1px solid var(--color-border)",
              minHeight: 64,
              padding: "12px 16px",
            }}
          >
            <span
              style={{
                color: value.primaryColor,
                fontFamily: value.fontFamily,
                fontSize: `${Math.round(value.fontSize * 0.3)}px`,
                fontWeight: value.bold ? "bold" : "normal",
                fontStyle: value.italic ? "italic" : "normal",
                textShadow: buildPreviewShadow(value.outlineColor, value.outlineThickness),
                letterSpacing: "0.02em",
              }}
            >
              Your caption will look like this
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
