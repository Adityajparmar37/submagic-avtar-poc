const MAX_CHARS = 1000;

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ScriptEditor({ value, onChange, disabled }: Props) {
  const remaining = MAX_CHARS - value.length;
  const isNearLimit = remaining < 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label
          className="block text-sm font-semibold"
          style={{ color: "var(--color-muted)" }}
        >
          YOUR SCRIPT
        </label>
        <span
          className="text-xs font-mono"
          style={{ color: isNearLimit ? "oklch(65% 0.2 30)" : "var(--color-muted)" }}
        >
          {remaining} chars left
        </span>
      </div>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          disabled={disabled}
          rows={6}
          placeholder="Write your script here... For example: 'Welcome to our platform! Today I'm going to show you how to create stunning AI-powered videos in minutes. Let's get started!'"
          className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-all duration-200 focus:outline-none"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            fontFamily: "var(--font-sans)",
            lineHeight: "1.6",
            boxShadow: "none",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--color-primary)";
            e.target.style.boxShadow = "0 0 0 3px oklch(55% 0.22 295 / 0.15)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--color-border)";
            e.target.style.boxShadow = "none";
          }}
        />
        {disabled && (
          <div
            className="absolute inset-0 rounded-xl"
            style={{ background: "oklch(0% 0 0 / 0.3)", cursor: "not-allowed" }}
          />
        )}
      </div>
      {value.length < 10 && value.length > 0 && (
        <p className="mt-2 text-xs" style={{ color: "oklch(65% 0.2 30)" }}>
          Script must be at least 10 characters
        </p>
      )}
    </div>
  );
}
