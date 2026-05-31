"use client";

import { useState } from "react";
import { ENVIRONMENT_PRESETS, type EnvironmentPreset } from "@/lib/environment-presets";

interface Props {
  value: string;
  onChange: (key: string) => void;
}

type StyleFilter = "all" | "realistic" | "unrealistic";

export function EnvironmentPicker({ value, onChange }: Props) {
  const [filter, setFilter] = useState<StyleFilter>("all");
  const [search, setSearch] = useState("");

  const visible = ENVIRONMENT_PRESETS.filter((p) => {
    if (filter !== "all" && p.style !== filter) return false;
    if (search && !p.label.toLowerCase().includes(search.toLowerCase()) && !p.labelNl.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
          {(["all", "realistic", "unrealistic"] as StyleFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${
                filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all" ? "All" : f === "realistic" ? "Realistic" : "Unrealistic"}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-[#C7F56F] focus:ring-1 focus:ring-[#C7F56F]"
        />
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {visible.map((preset) => (
          <EnvironmentCard
            key={preset.key}
            preset={preset}
            selected={value === preset.key}
            onClick={() => onChange(preset.key)}
          />
        ))}
      </div>
    </div>
  );
}

function EnvironmentCard({
  preset,
  selected,
  onClick,
}: {
  preset: EnvironmentPreset;
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
