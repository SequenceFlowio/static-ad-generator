"use client";

import { useState } from "react";
import type { BrandDna } from "@/types";

interface Props {
  brandId: string;
  brandUrl: string;
  initialDna: BrandDna | null;
  onComplete: (dna: BrandDna) => void;
}

export default function Phase1Research({ brandId, brandUrl, initialDna, onComplete }: Props) {
  const [dna, setDna] = useState<BrandDna | null>(initialDna);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(initialDna?.content ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(!initialDna);

  async function handleResearch() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/brands/${brandId}/research`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Research failed.");
      return;
    }
    setDna(data.brand_dna);
    setDraftContent(data.brand_dna.content);
    setEditing(false);
    onComplete(data.brand_dna);
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/brands/${brandId}/research`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draftContent }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed.");
      return;
    }
    setDna(data.brand_dna);
    setEditing(false);
    onComplete(data.brand_dna);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${dna ? "bg-[#C7F56F] text-[#1a1a1a]" : "bg-gray-100 text-gray-500"}`}>
            {dna ? "✓" : "1"}
          </span>
          <div>
            <p className="font-semibold text-sm">Phase 1 — Brand Research</p>
            <p className="text-xs text-gray-400">
              {dna ? `Brand DNA generated · ${new Date(dna.generated_at).toLocaleDateString()}` : "Research the brand and generate Brand DNA"}
            </p>
          </div>
        </div>
        <span className="text-gray-300 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-6 py-5">
          {!dna && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p>This will use OpenAI web search to reverse-engineer the brand&apos;s visual identity and generate a Brand DNA document.</p>
              {!brandUrl && (
                <p className="mt-2 text-amber-600 text-xs">
                  ⚠ No website URL set for this brand. Add one by editing the brand to get better research results.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {/* DNA viewer / editor */}
          {dna && !editing && (
            <div className="mb-4">
              <pre className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4 text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
                {dna.content}
              </pre>
            </div>
          )}

          {editing && (
            <div className="mb-4">
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-gray-200 p-3 font-mono text-xs leading-relaxed outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30 resize-y"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!dna && (
              <button
                onClick={handleResearch}
                disabled={loading}
                className="rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
              >
                {loading ? "Researching… (may take ~60s)" : "Research Brand ▶"}
              </button>
            )}

            {dna && !editing && (
              <>
                <button
                  onClick={handleResearch}
                  disabled={loading}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? "Re-researching…" : "Re-research"}
                </button>
                <button
                  onClick={() => { setEditing(true); setDraftContent(dna.content); }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Edit DNA
                </button>
              </>
            )}

            {editing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
