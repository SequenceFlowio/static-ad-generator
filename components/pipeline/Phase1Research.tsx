"use client";

import { useRef, useState } from "react";
import BrandDnaCard from "@/components/BrandDnaCard";
import BrandDnaForm from "@/components/BrandDnaForm";
import type { BrandDna, BrandDnaData } from "@/types";

interface Props {
  brandId: string;
  brandUrl: string;
  initialDna: BrandDna | null;
  onComplete: (dna: BrandDna) => void;
}

type Step = "idle" | "filling" | "saving" | "done";
type AiStatus = "idle" | "running" | "complete" | "error";

export default function Phase1Research({ brandId, brandUrl, initialDna, onComplete }: Props) {
  const [dna, setDna] = useState<BrandDna | null>(initialDna);
  const [step, setStep] = useState<Step>(initialDna ? "done" : "idle");
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(!initialDna);
  const [showEdit, setShowEdit] = useState(false);
  const [reSearching, setReSearching] = useState(false);

  // Holds the in-flight AI research promise so we can await it before PATCH
  const aiPromiseRef = useRef<Promise<BrandDna | null> | null>(null);

  function startResearch() {
    setStep("filling");
    setAiStatus("running");
    setError("");

    const promise = fetch(`/api/brands/${brandId}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manual: {} }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Research failed");
        setAiStatus("complete");
        return data.brand_dna as BrandDna;
      })
      .catch((err: Error) => {
        setAiStatus("error");
        setError(err.message);
        return null;
      });

    aiPromiseRef.current = promise;
  }

  // Called when user clicks "Save Brand DNA" from the manual form
  async function handleResearchSave(formData: Partial<BrandDnaData>) {
    setStep("saving");
    setError("");

    // Wait for AI to finish — ensures POST saves its result before our PATCH
    await aiPromiseRef.current;

    // Filter out blank values so we don't overwrite AI data with empty strings
    const filtered: Partial<BrandDnaData> = {};
    for (const [k, v] of Object.entries(formData)) {
      if (v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)) {
        (filtered as Record<string, unknown>)[k] = v;
      }
    }

    const res = await fetch(`/api/brands/${brandId}/research`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtered),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Save failed");
      setStep("filling");
      return;
    }

    setDna(data.brand_dna);
    onComplete(data.brand_dna);
    setStep("done");
  }

  // Called when user saves edits to existing DNA
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

  const savingLabel =
    step === "saving"
      ? aiStatus === "running"
        ? "Waiting for AI…"
        : "Saving…"
      : aiStatus === "complete"
      ? "Save Brand DNA ▶"
      : "Save Brand DNA ▶";

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
                : step === "filling" || step === "saving"
                ? "Building brand identity…"
                : "Research & build your brand identity"}
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

          {/* Step 1 — Start */}
          {step === "idle" && (
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Auto-Research your Brand</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  We&apos;ll search the web and analyze your website to extract colors, fonts, photography style, and positioning automatically.
                </p>
              </div>
              {brandUrl ? (
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">{brandUrl}</p>
              ) : (
                <p className="text-xs text-amber-500">No website URL set — results may be limited.</p>
              )}
              <button
                onClick={startResearch}
                className="rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]"
              >
                Start Research ▶
              </button>
            </div>
          )}

          {/* Step 2 — AI running in background, manual form visible */}
          {(step === "filling" || step === "saving") && (
            <div className="space-y-5">
              {/* AI status banner */}
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  aiStatus === "running"
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : aiStatus === "complete"
                    ? "bg-[#C7F56F]/10 text-[#1a1a1a]"
                    : aiStatus === "error"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    : ""
                }`}
              >
                {aiStatus === "running" && (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                    <span>AI is researching your brand in the background (~60s)… fill in what you know below.</span>
                  </>
                )}
                {aiStatus === "complete" && (
                  <>
                    <span className="flex-shrink-0">✓</span>
                    <span>AI research complete — click &quot;Save Brand DNA&quot; to combine everything.</span>
                  </>
                )}
                {aiStatus === "error" && (
                  <>
                    <span className="flex-shrink-0">⚠</span>
                    <span>AI research failed — your manual entries will still be saved.</span>
                  </>
                )}
              </div>

              <div>
                <p className="mb-1 text-sm font-medium">Fill in what you know</p>
                <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
                  These fields are hard for AI to find — add what you can, leave the rest blank. AI fills everything else.
                </p>
                <BrandDnaForm
                  brandId={brandId}
                  initialData={{
                    voice_adjectives: [],
                    positioning: null,
                    primary_font: null,
                    secondary_font: null,
                    accent_color: null,
                    lettertype_color: null,
                    background_color: null,
                  }}
                  onSave={handleResearchSave}
                  onCancel={null}
                  loading={step === "saving"}
                  saveLabel={savingLabel}
                />
              </div>
            </div>
          )}

          {/* Step 3 — Done — show card or edit form */}
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
