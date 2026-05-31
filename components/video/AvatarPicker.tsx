"use client";

import { AVATAR_PRESETS, type AvatarPreset } from "@/lib/avatar-presets";

interface Props {
  value: string;
  onChange: (key: string) => void;
}

export function AvatarPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {AVATAR_PRESETS.map((preset) => (
        <AvatarCard
          key={preset.key}
          preset={preset}
          selected={value === preset.key}
          onClick={() => onChange(preset.key)}
        />
      ))}
    </div>
  );
}

function AvatarCard({
  preset,
  selected,
  onClick,
}: {
  preset: AvatarPreset;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
        selected
          ? "border-[#C7F56F] bg-[#C7F56F]/10 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div
        className={`flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-br text-xl ${preset.gradient}`}
      >
        {preset.emoji}
      </div>
      <span className="text-center text-[10px] font-medium leading-tight text-gray-700">
        {preset.labelNl}
      </span>
      {selected && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C7F56F] text-[8px] font-bold text-black">
          ✓
        </span>
      )}
    </button>
  );
}
