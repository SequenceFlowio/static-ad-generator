"use client";

import { useState } from "react";
import type { PromptSet } from "@/types";

interface Props {
  brandId: string;
  hasDna: boolean;
  initialPromptSet: PromptSet | null;
  onComplete: (ps: PromptSet) => void;
}

export default function Phase2Prompts({ brandId, hasDna, initialPromptSet, onComplete }: Props) {
  const [promptSet, setPromptSet] = useState<PromptSet | null>(initialPromptSet);
  const [productName, setProductName] = useState(initialPromptSet?.product_name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(!initialPromptSet && hasDna);
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);

  async function handleGenerate() {
    if (!productName.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/brands/${brandId}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_name: productName.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Prompt generation failed.");
      return;
    }

    setPromptSet(data.prompt_set);
    onComplete(data.prompt_set);
  }

  const prompts = promptSet?.prompts_json?.prompts ?? [];

  return (
    <div className={`rounded-xl border bg-white overflow-hidden ${!hasDna ? "opacity-50 pointer-events-none" : "border-gray-200"}`}>
      <button
        onClick={() => hasDna && setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${promptSet ? "bg-[#C7F56F] text-[#1a1a1a]" : "bg-gray-100 text-gray-500"}`}>
            {promptSet ? "✓" : "2"}
          </span>
          <div>
            <p className="font-semibold text-sm">Phase 2 — Prompt Generation</p>
            <p className="text-xs text-gray-400">
              {promptSet
                ? `${prompts.length} prompts generated for "${promptSet.product_name}"`
                : hasDna
                ? "Generate image prompts from Brand DNA"
                : "Complete Phase 1 first"}
            </p>
          </div>
        </div>
        <span className="text-gray-300 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && hasDna && (
        <div className="border-t border-gray-100 px-6 py-5">
          <div className="mb-4 flex gap-3">
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Product name (e.g. Drizzle Olive Oil)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !productName.trim()}
              className="rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Generating… (~30s)" : "Generate Prompts ▶"}
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {prompts.length > 0 && (
            <div className="space-y-2">
              {prompts.map((p) => (
                <div key={p.template_number} className="rounded-lg border border-gray-100 overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedTemplate((t) =>
                        t === p.template_number ? null : p.template_number
                      )
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-xs font-mono font-semibold">
                        {String(p.template_number).padStart(2, "0")}
                      </span>
                      <span className="font-medium capitalize">{p.template_name.replace(/-/g, " ")}</span>
                      <span className="text-gray-400 text-xs">{p.aspect_ratio}</span>
                      {p.needs_product_images && (
                        <span className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">needs product images</span>
                      )}
                    </div>
                    <span className="text-gray-300">{expandedTemplate === p.template_number ? "▲" : "▼"}</span>
                  </button>

                  {expandedTemplate === p.template_number && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <pre className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">{p.prompt}</pre>
                      {p.notes && (
                        <p className="mt-2 text-xs text-amber-600 italic">{p.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
