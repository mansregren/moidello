"use client";

import { GARMENT_COLORS } from "@/lib/colors";

/**
 * Click-to-pick colour swatches for garment tags. The selected value is
 * the colour's Swedish name. Clicking the active swatch again clears it
 * (colour is optional). Shared by /skapa and the admin outfit editor.
 */
export function ColorPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  const current = value.trim().toLowerCase();

  return (
    <div className="flex flex-wrap gap-1.5">
      {GARMENT_COLORS.map((c) => {
        const selected = current === c.name.toLowerCase();
        return (
          <button
            key={c.name}
            type="button"
            disabled={disabled}
            onClick={() => onChange(selected ? "" : c.name)}
            title={c.name}
            aria-label={c.name}
            aria-pressed={selected}
            className={`h-7 w-7 rounded-full border transition-transform disabled:opacity-50 disabled:cursor-not-allowed ${
              selected
                ? "border-white ring-2 ring-white/40 scale-110"
                : "border-border hover:scale-105"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        );
      })}
    </div>
  );
}
