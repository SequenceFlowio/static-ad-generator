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

type Step = "idle" | "searching" | "review" | "saving" | "done";

export default function Phase1Research({ brandId, brandUrl, initialDna, onComplete }: Props) {
  const [dna, setDna] = useState<BrandDna | null>(initialDna);
  const [step, setStep] = useState<Step>(initialDna ? "done" : "idle");
  const [prefill, setPrefill] = useState<Partial<BrandDnaData> | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(!initialDna);
  const [showEdit, setShowEdit] = useState(false);
  const [reSearching, setReSearching] = useState(false);

  async function handleWebSearch() {
    setError("");
    setStep("searching");

    const res = await fetch(`/api/brands/${brandId}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manual: {} }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Research failed");
      setStep("idle");
      return;
    }

    // Pre-fill the review form with AI results
    setPrefill((data.brand_dna as BrandDna).data);
    setStep("review");
  }

  function handleManual() {
    setPrefill(null);
    setStep("review");
  }

  async function handleSave(formData: Partial<BrandDnaData>) {
    setStep("saving");
    setError("");

    const res = await fetch(`/api/brands/${brandId}/research`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Save failed");
      setStep("review");
      return;
    }

    setDna(data.brand_dna);
    onComplete(data.brand_dna);
    setStep("done");
  }

  async function handleEditSave(formData: Partial<BrandDnaData>) {
    setError("");
    const res = await fetch(`/api/brands/${brandId}/research`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    setDna(data.brand_dna);
    onComplete(data.brand_dna);
    setShowEdit(false);
  }

  async function handleReResearch() {
    setReSearching(true);
    setError("");
    const res = await fetch(`/api/brands/${brandId}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manual: {} }),
    });
    const data = await res.json();
    setReSearching(false);
    if (!res.ok) { setError(data.error ?? "Re-research failed"); return; }
    setDna(data.brand_dna);
    onComplete(data.brand_dna);
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              dna ? "bg-[#C7F56F] text-[#1a1a1a]" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            {dna ? "✓" : "1"}
          </span>
          <div>
            <p className="font-semibold text-sm">Phase 1 — Brand DNA</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {dna
                ? `Brand DNA saved · ${new Date(dna.generated_at).toLocaleDateString()}`
                : step === "searching"
                ? "Researching your brand…"
                : step === "review" || step === "saving"
                ? "Review and save your brand identity"
                : "Build your brand identity"}
            </p>
          </div>
        </div>
        <span className="text-gray-300 dark:text-gray-600 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-5 space-y-5">
          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Idle — choose path */}
          {step === "idle" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">How do you want to set up your Brand DNA?</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Web search finds colors, fonts, positioning and audience automatically. You can review and adjust everything before saving.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleWebSearch}
                  disabled={!brandUrl}
                  className="flex flex-col items-start gap-1.5 rounded-xl border-2 border-[#C7F56F] bg-[#C7F56F]/5 px-4 py-4 text-left hover:bg-[#C7F56F]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-lg">🔍</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Web Search</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">AI researches your website and fills everything in. You review and adjust.</span>
                </button>

                <button
                  onClick={handleManual}
                  className="flex flex-col items-start gap-1.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-4 text-left hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  <span className="text-lg">✏️</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Fill Manually</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Enter your brand details yourself — full control over every field.</span>
                </button>
              </div>

              {!brandUrl && (
                <p className="text-xs text-amber-500">No website URL set — web search is disabled. Add a URL to the brand to enable it.</p>
              )}
            </div>
          )}

          {/* Searching — loading */}
          {step === "searching" && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 px-4 py-5">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Researching your brand…</p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Searching the web and analyzing your website. This takes ~30–60 seconds.</p>
              </div>
            </div>
          )}

          {/* Review — pre-filled (web search) or empty (manual) */}
          {(step === "review" || step === "saving") && (
            <div className="space-y-4">
              {prefill && (
                <div className="flex items-center gap-2 rounded-lg bg-[#C7F56F]/10 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                  <span>✓</span>
                  <span>AI filled in what it found — review everything, fill any blanks, then save.</span>
                </div>
              )}
              <BrandDnaForm
                brandId={brandId}
                initialData={prefill ?? {
                  voice_adjectives: [],
                  customer_desires: [],
                  hook_examples: [],
                }}
                onSave={handleSave}
                onCancel={() => setStep("idle")}
                loading={step === "saving"}
                saveLabel="Save Brand DNA ▶"
              />
            </div>
          )}

          {/* Done — show card or edit form */}
          {step === "done" && dna && !showEdit && (
            <BrandDnaCard
              data={dna.data}
              onEdit={() => setShowEdit(true)}
              onReResearch={handleReResearch}
              loading={reSearching}
            />
          )}

          {step === "done" && dna && showEdit && (
            <BrandDnaForm
              brandId={brandId}
              initialData={dna.data}
              onSave={handleEditSave}
              onCancel={() => setShowEdit(false)}
              loading={false}
              saveLabel="Save Changes"
            />
          )}
        </div>
      )}
    </div>
  );
}
