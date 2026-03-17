"use client";

import type { BrandDnaData } from "@/types";

function ColorSwatch({ hex, label }: { hex: string | null; label: string }) {
  if (!hex)
    return (
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded border border-dashed border-gray-300 dark:border-gray-600" />
        <span className="text-xs text-gray-400 dark:text-gray-500">{label}: —</span>
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-5 w-5 rounded border border-black/10 flex-shrink-0"
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs text-gray-700 dark:text-gray-200">{label}</span>
      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{hex}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-700 dark:text-gray-200">
        {value ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
      </span>
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
      {/* Language */}
      {data.language && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">Ad copy language:</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{data.language}</span>
        </div>
      )}

      {/* Brand Overview */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Brand Overview</p>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-base font-bold">{data.name}</span>
            {data.tagline && <span className="text-sm italic text-gray-500 dark:text-gray-400">{data.tagline}</span>}
          </div>
          {data.voice_adjectives.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.voice_adjectives.map((adj) => (
                <span
                  key={adj}
                  className="rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300"
                >
                  {adj}
                </span>
              ))}
            </div>
          )}
          {data.brand_story && (
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{data.brand_story}</p>
          )}
          {data.target_audience && (
            <div className="flex gap-3 pt-1">
              <span className="text-xs text-gray-400 dark:text-gray-500 w-36 flex-shrink-0">Target Audience</span>
              <span className="text-xs text-gray-700 dark:text-gray-200">{data.target_audience}</span>
            </div>
          )}
          {data.brand_personality && (
            <div className="flex gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 w-36 flex-shrink-0">Personality</span>
              <span className="text-xs text-gray-700 dark:text-gray-200">{data.brand_personality}</span>
            </div>
          )}
          {data.positioning && (
            <div className="flex gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 w-36 flex-shrink-0">Positioning</span>
              <span className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{data.positioning}</span>
            </div>
          )}
          {data.competitive_differentiation && (
            <div className="flex gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 w-36 flex-shrink-0">Differentiation</span>
              <span className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{data.competitive_differentiation}</span>
            </div>
          )}
        </div>
      </div>

      {/* Copy Strategy */}
      {((data.customer_desires ?? []).length > 0 || (data.hook_examples ?? []).length > 0) && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Copy Strategy</p>
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-3">
            {(data.customer_desires ?? []).length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-gray-400 dark:text-gray-500">Customer Desires</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.customer_desires.map((d, i) => (
                    <span key={i} className="rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-200">{d}</span>
                  ))}
                </div>
              </div>
            )}
            {(data.hook_examples ?? []).length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-gray-400 dark:text-gray-500">Hook Examples</p>
                <div className="space-y-1">
                  {data.hook_examples.map((h, i) => (
                    <p key={i} className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">&ldquo;{h}&rdquo;</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logo */}
      {data.logo_url && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Brand Logo</p>
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.logo_url} alt="Brand logo" className="h-12 max-w-[180px] object-contain" />
          </div>
        </div>
      )}

      {/* Visual System */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Visual System</p>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ColorSwatch hex={data.accent_color} label="Accent" />
            <ColorSwatch hex={data.lettertype_color} label="Lettertype" />
            <ColorSwatch hex={data.background_color} label="Background" />
          </div>
          <Row label="Primary Font" value={data.primary_font} />
          <Row label="Secondary Font" value={data.secondary_font} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onEdit}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Edit DNA
        </button>
        <button
          onClick={onReResearch}
          disabled={loading}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Re-researching…" : "Re-research"}
        </button>
      </div>
    </div>
  );
}
