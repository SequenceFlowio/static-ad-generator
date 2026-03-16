"use client";

import { useState } from "react";
import type { BrandDnaData } from "@/types";

interface Props {
  initialData: Partial<BrandDnaData>;
  onSave: (data: Partial<BrandDnaData>) => void;
  onCancel: (() => void) | null;
  loading: boolean;
  saveLabel?: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  const base =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30";
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${base} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-gray-200 p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30"
        />
      </div>
    </div>
  );
}

export default function BrandDnaForm({ initialData, onSave, onCancel, loading, saveLabel }: Props) {
  const [d, setD] = useState<Partial<BrandDnaData>>({ ...initialData });

  function set<K extends keyof BrandDnaData>(key: K, value: BrandDnaData[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
  }

  function setStr(key: keyof BrandDnaData) {
    return (v: string) => set(key, (v || null) as never);
  }

  return (
    <div className="space-y-6">
      {/* Brand Voice */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Brand Voice</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Tagline"
            value={d.tagline ?? ""}
            onChange={setStr("tagline")}
            placeholder="Your brand tagline"
          />
          <Field
            label="Voice Adjectives (comma-separated)"
            value={(d.voice_adjectives ?? []).join(", ")}
            onChange={(v) =>
              set("voice_adjectives", v.split(",").map((s) => s.trim()).filter(Boolean))
            }
            placeholder="Elegant, Minimal, Modern, Clean, Premium"
          />
        </div>
        <div className="mt-3">
          <Field
            label="Positioning"
            value={d.positioning ?? ""}
            onChange={setStr("positioning")}
            textarea
            placeholder="1–2 sentences describing what makes this brand unique"
          />
        </div>
      </section>

      {/* Visual System */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Visual System</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Primary Font"
            value={d.primary_font ?? ""}
            onChange={setStr("primary_font")}
            placeholder="Neue Haas Grotesk"
          />
          <Field
            label="Secondary Font"
            value={d.secondary_font ?? ""}
            onChange={setStr("secondary_font")}
            placeholder="Garamond"
          />
          <ColorField
            label="Primary Color"
            value={d.primary_color ?? ""}
            onChange={(v) => set("primary_color", v || null)}
          />
          <ColorField
            label="Secondary Color"
            value={d.secondary_color ?? ""}
            onChange={(v) => set("secondary_color", v || null)}
          />
          <ColorField
            label="Accent Color"
            value={d.accent_color ?? ""}
            onChange={(v) => set("accent_color", v || null)}
          />
          <Field
            label="Background Colors (comma-separated hex)"
            value={(d.background_colors ?? []).join(", ")}
            onChange={(v) =>
              set("background_colors", v.split(",").map((s) => s.trim()).filter(Boolean))
            }
            placeholder="#FFFFFF, #F5F0EB"
          />
          <Field
            label="CTA Color & Style"
            value={d.cta_color_style ?? ""}
            onChange={setStr("cta_color_style")}
            placeholder="Solid black pill, white text"
          />
        </div>
      </section>

      {/* Photography Direction */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Photography Direction</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Lighting" value={d.lighting ?? ""} onChange={setStr("lighting")} placeholder="Soft natural window light" />
          <Field label="Color Grading" value={d.color_grading ?? ""} onChange={setStr("color_grading")} placeholder="Warm golden tones" />
          <Field label="Composition" value={d.composition ?? ""} onChange={setStr("composition")} placeholder="Clean minimalist, product centered" />
          <Field label="Subject Matter" value={d.subject_matter ?? ""} onChange={setStr("subject_matter")} placeholder="Product in use in kitchen" />
          <Field label="Props & Surfaces" value={d.props_and_surfaces ?? ""} onChange={setStr("props_and_surfaces")} placeholder="Marble countertop, wooden board" />
          <Field label="Mood" value={d.mood ?? ""} onChange={setStr("mood")} placeholder="Serene, inviting, premium" />
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(d)}
          disabled={loading}
          className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
        >
          {saveLabel ?? (loading ? "Saving…" : "Save Brand DNA")}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
