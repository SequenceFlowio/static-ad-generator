"use client";

import { useRef, useState } from "react";
import type { BrandDnaData } from "@/types";

interface Props {
  brandId: string;
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

export default function BrandDnaForm({ brandId, initialData, onSave, onCancel, loading, saveLabel }: Props) {
  const [d, setD] = useState<Partial<BrandDnaData>>({ ...initialData });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/brands/${brandId}/logo`, { method: "POST", body: formData });
    const data = await res.json();
    setUploadingLogo(false);
    if (res.ok) set("logo_url", data.url);
  }

  async function handleLogoRemove() {
    await fetch(`/api/brands/${brandId}/logo`, { method: "DELETE" });
    set("logo_url", null as unknown as never);
  }

  function set<K extends keyof BrandDnaData>(key: K, value: BrandDnaData[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
  }

  function setStr(key: keyof BrandDnaData) {
    return (v: string) => set(key, (v || null) as never);
  }

  return (
    <div className="space-y-6">
      {/* Brand Logo */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Brand Logo</p>
        <div className="flex items-center gap-4">
          {d.logo_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.logo_url} alt="Logo" className="h-12 max-w-[180px] object-contain rounded border border-gray-200 bg-gray-50 p-1" />
              <button
                type="button"
                onClick={handleLogoRemove}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400">No logo uploaded</p>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploadingLogo ? "Uploading…" : d.logo_url ? "Replace" : "Upload Logo"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">PNG or SVG with transparent background recommended. Used as reference in every generated ad.</p>
      </section>

      {/* Brand Overview */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Brand Overview</p>
        <div className="space-y-3">
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
          <Field
            label="Brand Story"
            value={d.brand_story ?? ""}
            onChange={setStr("brand_story")}
            textarea
            placeholder="1–2 sentences about the brand's origin or mission"
          />
          <Field
            label="Target Audience"
            value={d.target_audience ?? ""}
            onChange={setStr("target_audience")}
            textarea
            placeholder="Who the brand is for — demographics, lifestyle, needs"
          />
          <Field
            label="Brand Personality"
            value={d.brand_personality ?? ""}
            onChange={setStr("brand_personality")}
            textarea
            placeholder="How the brand acts, speaks, and feels — e.g. Premium but approachable"
          />
          <Field
            label="Positioning"
            value={d.positioning ?? ""}
            onChange={setStr("positioning")}
            textarea
            placeholder="1–2 sentences describing what makes this brand unique"
          />
          <Field
            label="Competitive Differentiation"
            value={d.competitive_differentiation ?? ""}
            onChange={setStr("competitive_differentiation")}
            placeholder="How this brand differs from competitors"
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
            label="Accent Color"
            value={d.accent_color ?? ""}
            onChange={(v) => set("accent_color", v || null)}
          />
          <ColorField
            label="Lettertype Color"
            value={d.lettertype_color ?? ""}
            onChange={(v) => set("lettertype_color", v || null)}
          />
          <ColorField
            label="Background Color"
            value={d.background_color ?? ""}
            onChange={(v) => set("background_color", v || null)}
          />
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
