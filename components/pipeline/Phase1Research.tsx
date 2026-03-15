"use client";

import { useState } from "react";
import BrandDnaCard from "@/components/BrandDnaCard";
import BrandDnaForm from "@/components/BrandDnaForm";
import type { BrandDna, BrandDnaData } from "@/types";

interface Props {
  brandId: string;
  brandUrl: string;
  initialDna: BrandDna | null;
  onComplete: (dna: BrandDna) => void;
}

const EMPTY_DNA: BrandDnaData = {
  name: "",
  tagline: null,
  design_agency: null,
  voice_adjectives: [],
  positioning: null,
  competitive_differentiation: null,
  primary_font: null,
  secondary_font: null,
  primary_color: null,
  secondary_color: null,
  accent_color: null,
  background_colors: [],
  cta_color_style: null,
  lighting: null,
  color_grading: null,
  composition: null,
  subject_matter: null,
  props_and_surfaces: null,
  mood: null,
  physical_description: null,
  label_logo_placement: null,
  distinctive_features: null,
  packaging_system: null,
  typical_ad_formats: null,
  text_overlay_style: null,
  photo_vs_illustration: null,
  ugc_usage: null,
  offer_presentation: null,
  prompt_modifier: "",
};

export default function Phase1Research({ brandId, brandUrl, initialDna, onComplete }: Props) {
  const [dna, setDna] = useState<BrandDna | null>(initialDna);
  const [mode, setMode] = useState<"view" | "edit" | "manual">("view");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(!initialDna);

  async function handleResearch() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/brands/${brandId}/research`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Research failed."); return; }
    setDna(data.brand_dna);
    setMode("view");
    onComplete(data.brand_dna);
  }

  async function handleSave(formData: BrandDnaData) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/brands/${brandId}/research`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Save failed."); return; }
    setDna(data.brand_dna);
    setMode("view");
    onComplete(data.brand_dna);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${dna ? "bg-[#C7F56F] text-[#1a1a1a]" : "bg-gray-100 text-gray-500"}`}>
            {dna ? "✓" : "1"}
          </span>
          <div>
            <p className="font-semibold text-sm">Phase 1 — Brand DNA</p>
            <p className="text-xs text-gray-400">
              {dna ? `Brand DNA saved · ${new Date(dna.generated_at).toLocaleDateString()}` : "Research & build your brand identity"}
            </p>
          </div>
        </div>
        <span className="text-gray-300 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-6 py-5">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {/* No DNA yet — show options */}
          {!dna && mode === "view" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                <p className="text-sm font-medium mb-1">Auto-Research</p>
                <p className="text-xs text-gray-400 mb-3">
                  OpenAI searches the web and scrapes your website to fill in brand identity fields automatically.
                  {!brandUrl && <span className="text-amber-500"> Set a website URL on this brand first for best results.</span>}
                </p>
                <button
                  onClick={handleResearch}
                  disabled={loading}
                  className="rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
                >
                  {loading ? "Researching… (~60s)" : "Research Brand ▶"}
                </button>
              </div>

              <div className="text-center text-xs text-gray-300">or</div>

              <button
                onClick={() => setMode("manual")}
                className="w-full rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500"
              >
                Fill in manually →
              </button>
            </div>
          )}

          {/* Manual entry (no prior DNA) */}
          {mode === "manual" && (
            <BrandDnaForm
              initialData={EMPTY_DNA}
              onSave={handleSave}
              onCancel={() => setMode("view")}
              loading={loading}
            />
          )}

          {/* DNA exists — show card or edit form */}
          {dna && mode === "view" && (
            <BrandDnaCard
              data={dna.data}
              onEdit={() => setMode("edit")}
              onReResearch={handleResearch}
              loading={loading}
            />
          )}

          {dna && mode === "edit" && (
            <BrandDnaForm
              initialData={dna.data}
              onSave={handleSave}
              onCancel={() => setMode("view")}
              loading={loading}
            />
          )}
        </div>
      )}
    </div>
  );
}
