"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { PromptSet, SseEvent, Resolution } from "@/types";

const TEMPLATES = [
  { number: 1, name: "headline", label: "01 Headline", aspect: "4:5" },
  { number: 2, name: "offer-promotion", label: "02 Offer / Promotion", aspect: "4:5" },
  { number: 3, name: "testimonial", label: "03 Testimonial", aspect: "1:1" },
  { number: 4, name: "vs-them", label: "04 Us vs Them", aspect: "4:5" },
  { number: 5, name: "ugc-lifestyle", label: "05 UGC Lifestyle", aspect: "9:16" },
];

const COST_PER_IMAGE: Record<Resolution, number> = {
  "1K": 0.08,
  "2K": 0.12,
  "4K": 0.16,
};

interface TemplateProgress {
  template_number: number;
  status: "idle" | "running" | "done" | "error";
  image_urls?: string[];
  error?: string;
}

interface Props {
  brandId: string;
  promptSet: PromptSet | null;
}

export default function Phase3Generate({ brandId, promptSet }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([1, 2, 3, 4, 5]);
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [numImages, setNumImages] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<TemplateProgress[]>([]);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  const hasPromptSet = !!promptSet;

  const toggleTemplate = (n: number) =>
    setSelectedTemplates((prev) =>
      prev.includes(n) ? prev.filter((t) => t !== n) : [...prev, n]
    );

  const estimatedCost = selectedTemplates.length * numImages * (COST_PER_IMAGE[resolution] ?? 0.12);

  const handleGenerate = useCallback(async () => {
    if (!promptSet || selectedTemplates.length === 0) return;
    setGenerating(true);
    setComplete(false);
    setError("");
    setProgress(selectedTemplates.map((n) => ({ template_number: n, status: "idle" })));

    const res = await fetch(`/api/brands/${brandId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_numbers: selectedTemplates,
        resolution,
        num_images: numImages,
        prompt_set_id: promptSet.id,
      }),
    });

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Generation failed to start.");
      setGenerating(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const event: SseEvent = JSON.parse(raw);
          if (event.type === "start") {
            setProgress((prev) => prev.map((p) => p.template_number === event.template_number ? { ...p, status: "running" } : p));
          } else if (event.type === "done") {
            setProgress((prev) => prev.map((p) => p.template_number === event.template_number ? { ...p, status: "done", image_urls: event.image_urls } : p));
          } else if (event.type === "error") {
            setProgress((prev) => prev.map((p) => p.template_number === event.template_number ? { ...p, status: "error", error: event.error } : p));
          } else if (event.type === "complete") {
            setComplete(true);
            setGenerating(false);
          }
        } catch { /* ignore */ }
      }
    }

    setGenerating(false);
  }, [brandId, promptSet, selectedTemplates, resolution, numImages]);

  return (
    <div className={`rounded-xl border bg-white overflow-hidden ${!hasPromptSet ? "opacity-50 pointer-events-none" : "border-gray-200"}`}>
      <button
        onClick={() => hasPromptSet && setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-[#C7F56F] text-[#1a1a1a]" : "bg-gray-100 text-gray-500"}`}>
            {complete ? "✓" : "3"}
          </span>
          <div>
            <p className="font-semibold text-sm">Phase 3 — Image Generation</p>
            <p className="text-xs text-gray-400">
              {hasPromptSet ? complete ? "Generation complete" : "Generate ads via kie.ai" : "Complete Phase 2 first"}
            </p>
          </div>
        </div>
        <span className="text-gray-300 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && hasPromptSet && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-5">

          {/* Template selection */}
          <div>
            <p className="mb-2 text-sm font-medium">Templates</p>
            <div className="space-y-0.5">
              {TEMPLATES.map((t) => (
                <label key={t.number} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(t.number)}
                    onChange={() => toggleTemplate(t.number)}
                    className="rounded border-gray-300 accent-[#C7F56F]"
                  />
                  <span className="text-sm">{t.label}</span>
                  <span className="text-xs text-gray-400">{t.aspect}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images per template */}
          <div>
            <p className="mb-2 text-sm font-medium">Images per Template</p>
            <div className="flex gap-2">
              {[1, 2, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setNumImages(n)}
                  className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${numImages === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <p className="mb-2 text-sm font-medium">Resolution</p>
            <div className="flex flex-wrap items-center gap-2">
              {(["1K", "2K", "4K"] as Resolution[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${resolution === r ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                >
                  {r}
                </button>
              ))}
              <span className="text-xs text-gray-400">
                ~${estimatedCost.toFixed(2)} · {selectedTemplates.length * numImages} images
              </span>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          {/* Progress */}
          {progress.length > 0 && (
            <div className="space-y-2">
              {progress.map((p) => {
                const tpl = TEMPLATES.find((t) => t.number === p.template_number);
                return (
                  <div key={p.template_number} className="flex items-center gap-3 text-sm">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${p.status === "done" ? "bg-[#C7F56F] text-[#1a1a1a]" : p.status === "error" ? "bg-red-100 text-red-500" : p.status === "running" ? "bg-blue-100 text-blue-600 animate-pulse" : "bg-gray-100 text-gray-400"}`}>
                      {p.status === "done" ? "✓" : p.status === "error" ? "✗" : p.status === "running" ? "…" : "○"}
                    </span>
                    <span className="text-gray-600">{tpl?.label ?? `Template ${p.template_number}`}</span>
                    {p.status === "error" && <span className="text-xs text-red-400 truncate max-w-[200px]">{p.error}</span>}
                    {p.status === "done" && p.image_urls && <span className="text-xs text-gray-400">{p.image_urls.length} images</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating || selectedTemplates.length === 0}
              className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
            >
              {generating
                ? `Generating… (${progress.filter((p) => p.status === "done").length}/${selectedTemplates.length} done)`
                : "Generate Ads ▶"}
            </button>
            {complete && (
              <Link href={`/brands/${brandId}/gallery`} className="rounded-lg bg-[#1a1a1a] px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">
                View Gallery →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
