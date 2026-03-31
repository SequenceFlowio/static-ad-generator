"use client";

import { useState } from "react";
import { CONTENT_TEMPLATES, PLATFORMS } from "@/lib/content-templates";
import type { Platform } from "@/lib/content-templates";
import type { BrandDnaData, Product } from "@/types";
import InspoPicker from "@/components/InspoPicker";
import GeneratingOverlay from "@/components/GeneratingOverlay";

interface ContentSession {
  id: string;
  template_name: string;
  platform: string;
  caption: string | null;
  image_url: string | null;
  image_prompt: string | null;
  status: string;
  created_at: string;
}

interface Props {
  brandId: string;
  brandDna: BrandDnaData;
  products: Product[];
  onCreated: (session: ContentSession) => void;
  onClose: () => void;
  initialTemplate?: string;
}

type Step = "template" | "inputs" | "review";

const COPY_MESSAGES = [
  "Reading the brand DNA...",
  "Checking your vibe...",
  "Crafting your copy...",
  "Talking to the AI...",
];

const IMAGE_MESSAGES = [
  "Starting the engines...",
  "Pixel by pixel...",
  "Making it look good...",
  "Almost there...",
  "Adding the finishing touches...",
  "Because details matter...",
];

export default function ContentGenerator({ brandId, brandDna, products, onCreated, onClose, initialTemplate }: Props) {
  const [step, setStep] = useState<Step>(initialTemplate ? "inputs" : "template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialTemplate ?? null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [topicHint, setTopicHint] = useState("");
  const [selectedDesire, setSelectedDesire] = useState<string>(brandDna.customer_desires?.[0] ?? "");
  const [selectedInspo, setSelectedInspo] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<1 | 5 | 10 | 20 | 50>(1);
  const [bulkDone, setBulkDone] = useState(false);

  // Generation state
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayMessage, setOverlayMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [session, setSession] = useState<ContentSession | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedImagePrompt, setEditedImagePrompt] = useState("");

  const template = CONTENT_TEMPLATES.find((t) => t.name === selectedTemplate);
  const isOverlayVisible = generatingCopy || generatingImage;

  async function handleGenerate() {
    if (!selectedTemplate || !selectedPlatform) return;
    setGeneratingCopy(true);
    setBulkDone(false);
    setError(null);
    setOverlayProgress(5);
    setOverlayMessage(quantity > 1 ? `Generating 1 of ${quantity}...` : COPY_MESSAGES[0]);

    let lastSession = null;

    for (let i = 0; i < quantity; i++) {
      const basePct = Math.round((i / quantity) * 90);
      setOverlayProgress(Math.max(5, basePct));
      if (quantity > 1) setOverlayMessage(`Generating ${i + 1} of ${quantity}...`);

      // Animate progress within this variation
      let pct = Math.max(5, basePct);
      const copyTimer = setInterval(() => {
        pct = Math.min(pct + 5, basePct + Math.round(80 / quantity) - 2);
        setOverlayProgress(pct);
        if (quantity === 1) setOverlayMessage(COPY_MESSAGES[Math.floor(Math.random() * COPY_MESSAGES.length)]);
      }, 2000);

      const res = await fetch(`/api/brands/${brandId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_name: selectedTemplate,
          platform: selectedPlatform,
          product_id: selectedProductId || null,
          topic_hint: topicHint || null,
          selected_desire: selectedDesire || null,
          variation_index: i,
          total_count: quantity,
        }),
      });

      clearInterval(copyTimer);
      const data = await res.json();

      if (!res.ok) { setGeneratingCopy(false); setError(data.error ?? "Generation failed."); return; }
      lastSession = data;
    }

    setGeneratingCopy(false);
    if (!lastSession) return;

    if (quantity > 1) {
      setBulkDone(true);
    } else {
      setSession(lastSession);
      setEditedCaption(lastSession.caption ?? "");
      setEditedImagePrompt(lastSession.image_prompt ?? "");
      setStep("review");
    }
  }

  async function handleSaveEdits() {
    if (!session) return;
    await fetch(`/api/brands/${brandId}/content/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: editedCaption, image_prompt: editedImagePrompt }),
    });
  }

  async function handleGenerateImage() {
    if (!session) return;
    setGeneratingImage(true);
    setError(null);
    setOverlayProgress(40);
    setOverlayMessage(IMAGE_MESSAGES[0]);

    await handleSaveEdits();

    // Simulate image generation progress
    let pct = 40;
    let msgIdx = 0;
    const imgTimer = setInterval(() => {
      pct = Math.min(pct + 4, 92);
      msgIdx = (msgIdx + 1) % IMAGE_MESSAGES.length;
      setOverlayProgress(pct);
      setOverlayMessage(IMAGE_MESSAGES[msgIdx]);
    }, 3000);

    const res = await fetch(`/api/brands/${brandId}/content/${session.id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspo_image_urls: selectedInspo }),
    });

    clearInterval(imgTimer);
    setOverlayProgress(100);
    setOverlayMessage("Wrapping up...");
    await new Promise((r) => setTimeout(r, 600));

    const data = await res.json();
    setGeneratingImage(false);

    if (!res.ok) { setError(data.error ?? "Image generation failed."); return; }

    const updated = { ...session, status: "done", image_url: data.image_url };
    setSession(updated);
    onCreated(updated);
  }

  // ── STEP 1: Template + Platform ──────────────────────────────────────────────
  if (step === "template") {
    return (
      <div className="space-y-6">
        <GeneratingOverlay visible={isOverlayVisible} progress={overlayProgress} message={overlayMessage} />

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Choose a template</p>
          <div className="grid grid-cols-3 gap-3">
            {CONTENT_TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTemplate(t.name)}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                  selectedTemplate === t.name
                    ? "border-[#C7F56F] bg-[#C7F56F]/5"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Platform</p>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPlatform(p.value)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                  selectedPlatform === p.value
                    ? "border-[#C7F56F] bg-[#C7F56F]/5 text-gray-900 dark:text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {p.label}
                <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-500">{p.aspectRatio}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button
            onClick={() => setStep("inputs")}
            disabled={!selectedTemplate || !selectedPlatform}
            className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2: Inputs ───────────────────────────────────────────────────────────
  if (step === "inputs") {
    const needsProduct = template?.needs_product ?? false;
    const productOptional = template?.product_optional ?? false;
    const showProduct = needsProduct || productOptional;
    const desires = brandDna.customer_desires ?? [];

    return (
      <div className="space-y-5">
        <GeneratingOverlay visible={isOverlayVisible} progress={overlayProgress} message={overlayMessage} />

        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <span className="text-lg">{template?.icon}</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">{template?.label}</span>
          <span>·</span>
          <span className="capitalize">{selectedPlatform}</span>
        </div>

        {showProduct && products.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Product {needsProduct ? <span className="text-red-400">*</span> : <span className="text-gray-400 font-normal">(optional)</span>}
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:border-[#C7F56F]"
            >
              <option value="">— No product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {desires.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Customer desire</p>
            <div className="flex flex-wrap gap-2">
              {desires.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDesire(d === selectedDesire ? "" : d)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    selectedDesire === d
                      ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white font-medium"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity selector */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">How many variations?</p>
          <div className="flex gap-2">
            {([1, 5, 10, 20, 50] as const).map((n) => (
              <button
                key={n}
                onClick={() => setQuantity(n)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  quantity === n
                    ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {quantity > 1 && (
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Generates {quantity} unique variations with different angles. Each is saved to your gallery.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Topic / angle hint <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={topicHint}
            onChange={(e) => setTopicHint(e.target.value)}
            placeholder="e.g. focus on morning routines, summer campaign"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30"
          />
        </div>

        <InspoPicker brandId={brandId} type="content" selected={selectedInspo} onSelect={setSelectedInspo} />

        {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

        {bulkDone && (
          <div className="rounded-xl border border-[#C7F56F]/30 bg-[#C7F56F]/10 px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              {quantity} variations generated!
            </p>
            <button onClick={onClose} className="text-xs font-semibold text-[#C7F56F] hover:underline">
              View in Gallery →
            </button>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-2">
          <button onClick={() => setStep("template")} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">← Back</button>
          <button
            onClick={handleGenerate}
            disabled={generatingCopy || (template?.needs_product && !selectedProductId)}
            className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {quantity > 1 ? `Generate ${quantity} variations` : "Generate content"}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 3: Review ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <GeneratingOverlay visible={isOverlayVisible} progress={overlayProgress} message={overlayMessage} />

      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Review & edit</p>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Caption</label>
        <textarea
          value={editedCaption}
          onChange={(e) => setEditedCaption(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30 resize-none font-mono"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Image prompt</label>
        <textarea
          value={editedImagePrompt}
          onChange={(e) => setEditedImagePrompt(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30 resize-none font-mono"
        />
      </div>

      <InspoPicker brandId={brandId} type="content" selected={selectedInspo} onSelect={setSelectedInspo} />

      {session?.image_url && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Generated image</p>
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={session.image_url} alt="Generated content" className="w-full" />
          </div>
          <a href={session.image_url} download target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-[#C7F56F] hover:underline">
            Download image →
          </a>
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="flex justify-between gap-3 pt-2">
        <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Close</button>
        {!session?.image_url ? (
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage}
            className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate image
          </button>
        ) : (
          <button
            onClick={() => { setStep("template"); setSession(null); setSelectedTemplate(null); setTopicHint(""); setSelectedInspo([]); }}
            className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]"
          >
            New content +
          </button>
        )}
      </div>
    </div>
  );
}
