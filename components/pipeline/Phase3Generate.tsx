"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<TemplateProgress[]>([]);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPromptSet = !!promptSet;

  // Load existing product images
  useEffect(() => {
    if (!hasPromptSet) return;
    fetch(`/api/brands/${brandId}/images`)
      .then((r) => r.json())
      .then((d) => setProductImages(d.urls ?? []));
  }, [brandId, hasPromptSet]);

  const toggleTemplate = (n: number) => {
    setSelectedTemplates((prev) =>
      prev.includes(n) ? prev.filter((t) => t !== n) : [...prev, n]
    );
  };

  const estimatedCost =
    selectedTemplates.length * 4 * (COST_PER_IMAGE[resolution] ?? 0.12);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    const res = await fetch(`/api/brands/${brandId}/images`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    setProductImages((prev) => [...prev, ...(data.urls ?? [])]);
  }

  async function handleDeleteImages() {
    await fetch(`/api/brands/${brandId}/images`, { method: "DELETE" });
    setProductImages([]);
  }

  const handleGenerate = useCallback(async () => {
    if (!promptSet || selectedTemplates.length === 0) return;
    setGenerating(true);
    setComplete(false);
    setError("");
    setProgress(
      selectedTemplates.map((n) => ({ template_number: n, status: "idle" }))
    );

    const res = await fetch(`/api/brands/${brandId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_numbers: selectedTemplates,
        resolution,
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
            setProgress((prev) =>
              prev.map((p) =>
                p.template_number === event.template_number
                  ? { ...p, status: "running" }
                  : p
              )
            );
          } else if (event.type === "done") {
            setProgress((prev) =>
              prev.map((p) =>
                p.template_number === event.template_number
                  ? { ...p, status: "done", image_urls: event.image_urls }
                  : p
              )
            );
          } else if (event.type === "error") {
            setProgress((prev) =>
              prev.map((p) =>
                p.template_number === event.template_number
                  ? { ...p, status: "error", error: event.error }
                  : p
              )
            );
          } else if (event.type === "complete") {
            setComplete(true);
            setGenerating(false);
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    setGenerating(false);
  }, [brandId, promptSet, selectedTemplates, resolution]);

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
              {hasPromptSet
                ? complete
                  ? "Generation complete"
                  : "Generate ads via kie.ai"
                : "Complete Phase 2 first"}
            </p>
          </div>
        </div>
        <span className="text-gray-300 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && hasPromptSet && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-6">
          {/* Product images */}
          <div>
            <p className="mb-2 text-sm font-medium">Product Reference Images</p>
            <p className="mb-3 text-xs text-gray-400">Upload 1–3 product photos. Used for templates that need product images.</p>

            {productImages.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {productImages.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`product ${i + 1}`}
                    className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                  />
                ))}
                <button
                  onClick={handleDeleteImages}
                  className="text-xs text-red-400 hover:text-red-600 self-end mb-1"
                >
                  Remove all
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload product images"}
            </button>
          </div>

          {/* Template selection */}
          <div>
            <p className="mb-2 text-sm font-medium">Templates</p>
            <div className="space-y-1">
              {TEMPLATES.map((t) => (
                <label
                  key={t.number}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50"
                >
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

          {/* Resolution */}
          <div>
            <p className="mb-2 text-sm font-medium">Resolution</p>
            <div className="flex gap-2">
              {(["1K", "2K", "4K"] as Resolution[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    resolution === r
                      ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {r}
                </button>
              ))}
              <span className="self-center text-xs text-gray-400">
                ~${estimatedCost.toFixed(2)} estimated · {selectedTemplates.length * 4} images
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {/* Progress */}
          {progress.length > 0 && (
            <div className="space-y-2">
              {progress.map((p) => {
                const tpl = TEMPLATES.find((t) => t.number === p.template_number);
                return (
                  <div key={p.template_number} className="flex items-center gap-3 text-sm">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                        p.status === "done"
                          ? "bg-[#C7F56F] text-[#1a1a1a]"
                          : p.status === "error"
                          ? "bg-red-100 text-red-500"
                          : p.status === "running"
                          ? "bg-blue-100 text-blue-600 animate-pulse"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {p.status === "done" ? "✓" : p.status === "error" ? "✗" : p.status === "running" ? "…" : "○"}
                    </span>
                    <span className="text-gray-600">{tpl?.label ?? `Template ${p.template_number}`}</span>
                    {p.status === "error" && (
                      <span className="text-xs text-red-400 truncate max-w-[200px]">{p.error}</span>
                    )}
                    {p.status === "done" && p.image_urls && (
                      <span className="text-xs text-gray-400">{p.image_urls.length} images</span>
                    )}
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
              <Link
                href={`/brands/${brandId}/gallery`}
                className="rounded-lg bg-[#1a1a1a] px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                View Gallery →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
