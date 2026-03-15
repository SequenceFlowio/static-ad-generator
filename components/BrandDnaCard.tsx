"use client";

import type { BrandDnaData } from "@/types";

function ColorSwatch({ hex, label }: { hex: string | null; label: string }) {
  if (!hex) return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-5 rounded border border-dashed border-gray-300" />
      <span className="text-xs text-gray-400">{label}: —</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-5 w-5 rounded border border-black/10 flex-shrink-0"
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs text-gray-700">{label}</span>
      <span className="text-xs font-mono text-gray-400">{hex}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-700">{value ?? <span className="text-gray-300">—</span>}</span>
    </div>
  );
}

interface Props {
  data: BrandDnaData;
  onEdit: () => void;
  onReResearch: () => void;
  loading: boolean;
}

export default function BrandDnaCard({ data, onEdit, onReResearch, loading }: Props) {
  return (
    <div className="space-y-5">
      {/* Brand Overview */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Brand Overview</p>
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <div className="mb-2 flex items-baseline gap-3">
            <span className="text-base font-bold">{data.name}</span>
            {data.tagline && <span className="text-sm italic text-gray-500">{data.tagline}</span>}
          </div>
          {data.voice_adjectives.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {data.voice_adjectives.map((adj) => (
                <span key={adj} className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                  {adj}
                </span>
              ))}
            </div>
          )}
          {data.positioning && (
            <p className="text-xs text-gray-600 leading-relaxed">{data.positioning}</p>
          )}
        </div>
      </div>

      {/* Visual System */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Visual System</p>
        <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ColorSwatch hex={data.primary_color} label="Primary" />
            <ColorSwatch hex={data.secondary_color} label="Secondary" />
            <ColorSwatch hex={data.accent_color} label="Accent" />
            {data.background_colors.map((c, i) => (
              <ColorSwatch key={i} hex={c} label={`Background ${i + 1}`} />
            ))}
          </div>
          <Row label="Primary Font" value={data.primary_font} />
          <Row label="Secondary Font" value={data.secondary_font} />
          <Row label="CTA Style" value={data.cta_color_style} />
        </div>
      </div>

      {/* Photography Direction */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Photography Direction</p>
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <Row label="Lighting" value={data.lighting} />
          <Row label="Color Grading" value={data.color_grading} />
          <Row label="Composition" value={data.composition} />
          <Row label="Subject Matter" value={data.subject_matter} />
          <Row label="Props & Surfaces" value={data.props_and_surfaces} />
          <Row label="Mood" value={data.mood} />
        </div>
      </div>

      {/* Product Details */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Product Details</p>
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <Row label="Description" value={data.physical_description} />
          <Row label="Logo Placement" value={data.label_logo_placement} />
          <Row label="Distinctive Features" value={data.distinctive_features} />
          <Row label="Packaging" value={data.packaging_system} />
        </div>
      </div>

      {/* Prompt Modifier */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Image Generation Prompt Modifier</p>
        <div className="rounded-xl bg-[#C7F56F]/10 border border-[#C7F56F]/40 px-4 py-3">
          <p className="text-xs leading-relaxed text-gray-700">{data.prompt_modifier}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onEdit}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Edit DNA
        </button>
        <button
          onClick={onReResearch}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Re-researching…" : "Re-research"}
        </button>
      </div>
    </div>
  );
}
