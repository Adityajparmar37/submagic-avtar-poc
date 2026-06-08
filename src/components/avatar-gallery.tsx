import { AVATARS } from "../lib/constants";
import type { AvatarDefinition } from "../lib/types";

interface Props {
  selected: string;
  onSelect: (avatar: AvatarDefinition) => void;
  disabled?: boolean;
}

export default function AvatarGallery({ selected, onSelect, disabled }: Props) {
  return (
    <div>
      <label
        className="block text-sm font-semibold mb-3"
        style={{ color: "var(--color-muted)" }}
      >
        CHOOSE AVATAR
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AVATARS.map((avatar) => {
          const isSelected = selected === avatar.id;
          return (
            <button
              key={avatar.id}
              onClick={() => !disabled && onSelect(avatar)}
              disabled={disabled}
              className="relative rounded-xl overflow-hidden text-left transition-all duration-200 focus:outline-none"
              style={{
                border: isSelected
                  ? "2px solid var(--color-primary)"
                  : "2px solid var(--color-border)",
                transform: isSelected ? "scale(1.03)" : "scale(1)",
                boxShadow: isSelected
                  ? "0 0 20px 4px oklch(55% 0.22 295 / 0.35)"
                  : "none",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <div className="aspect-square bg-gray-800 overflow-hidden">
                <img
                  src={avatar.image}
                  alt={avatar.name}
                  className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div
                className="p-2"
                style={{ background: "var(--color-surface)" }}
              >
                <p className="text-sm font-semibold truncate">{avatar.name}</p>
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--color-muted)" }}
                >
                  {avatar.description.split("—")[0].trim()}
                </p>
              </div>
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: "var(--color-primary)", color: "white" }}
                >
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
