"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { useBrand } from "@/lib/brand-context";
import type { ContentPlan, ContentTypeConfig, ContentTopic, SocialPost } from "@/types";

const COLOR_DOT: Record<string, string> = {
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500",
  orange: "bg-orange-500", yellow: "bg-yellow-500", gray: "bg-gray-400",
};

interface Product { id: string; name: string; image_urls: string[] }
interface GeneratedPost extends SocialPost { scheduling?: boolean; scheduled?: boolean }

// ─── Inline topic manager per content type ────────────────────────────────────
function TopicRow({
  brandId, type, topics, onTopicsChange,
}: {
  brandId: string;
  type: ContentTypeConfig;
  topics: ContentTopic[];
  onTopicsChange: (t: ContentTopic[]) => void;
}) {
  const { lang } = useLanguage();
  const [suggesting, setSuggesting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  async function suggest() {
    setSuggesting(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/social/topics/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type_key: type.key, content_type_label: type.label, template_key: type.template_key, count: 6 }),
      });
      const d = await res.json() as { topics?: string[] };
      for (const topic of d.topics ?? []) {
        const r = await fetch(`/api/brands/${brandId}/social/topics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_type_key: type.key, topic }),
        });
        if (r.ok) { const { topic: t } = await r.json() as { topic: ContentTopic }; onTopicsChange([...topics, t]); }
      }
    } finally { setSuggesting(false); }
  }

  async function addTopic() {
    if (!newTopic.trim()) return;
    const r = await fetch(`/api/brands/${brandId}/social/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_type_key: type.key, topic: newTopic.trim() }),
    });
    if (r.ok) { const { topic: t } = await r.json() as { topic: ContentTopic }; onTopicsChange([...topics, t]); setNewTopic(""); setAdding(false); }
  }

  async function deleteTopic(id: string) {
    await fetch(`/api/brands/${brandId}/social/topics/${id}`, { method: "DELETE" });
    onTopicsChange(topics.filter(t => t.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${COLOR_DOT[type.color] ?? "bg-gray-400"}`} />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{type.label}</span>
          <span className="text-[10px] text-gray-400">{topics.length} topics</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAdding(a => !a)}
            className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            + {lang === "nl" ? "Voeg toe" : "Add"}
          </button>
          <button onClick={suggest} disabled={suggesting}
            className="text-[11px] text-[#C7F56F] hover:text-[#b8e85e] disabled:opacity-50">
            {suggesting ? "…" : "✦ AI"}
          </button>
        </div>
      </div>

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topics.map(t => (
            <span key={t.id} className="group flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-[11px] text-gray-600 dark:text-gray-300">
              {t.topic}
              <button onClick={() => deleteTopic(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}

      {adding && (
        <div className="flex gap-2">
          <input autoFocus value={newTopic} onChange={e => setNewTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTopic()}
            placeholder={lang === "nl" ? "Bijv. Japandi kitchen corner…" : "E.g. Japandi kitchen corner…"}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#C7F56F]/50 text-gray-700 dark:text-gray-200" />
          <button onClick={addTopic} disabled={!newTopic.trim()}
            className="rounded-lg bg-[#C7F56F] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] disabled:opacity-40">
            {lang === "nl" ? "Voeg toe" : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ContentStudioPage() {
  const { lang } = useLanguage();
  const { brand, loading: brandCtxLoading } = useBrand();

  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [platform, setPlatform] = useState("instagram");
  const [postTime, setPostTime] = useState("09:00");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [topicsByType, setTopicsByType] = useState<Record<string, ContentTopic[]>>({});
  const [setupOpen, setSetupOpen] = useState(false);

  // Per-type render state
  const [rendering, setRendering] = useState<Record<string, boolean>>({});
  const [samples, setSamples] = useState<Record<string, GeneratedPost>>({});

  // Week generation
  const [generatingWeek, setGeneratingWeek] = useState(false);
  const [weekPosts, setWeekPosts] = useState<GeneratedPost[]>([]);

  const loadAll = useCallback(async (brandId: string) => {
    setLoadingPlan(true);
    try {
      const [planRes, settingsRes, productsRes] = await Promise.all([
        fetch(`/api/brands/${brandId}/social/content-plan`),
        fetch(`/api/brands/${brandId}/social/settings`),
        fetch(`/api/brands/${brandId}/products`),
      ]);
      if (planRes.ok) {
        const { plan: p } = await planRes.json() as { plan: ContentPlan };
        setPlan(p);
        // Load topics for each type
        const map: Record<string, ContentTopic[]> = {};
        await Promise.all(p.content_types.map(async ct => {
          const r = await fetch(`/api/brands/${brandId}/social/topics?content_type_key=${ct.key}`);
          if (r.ok) { const { topics } = await r.json() as { topics: ContentTopic[] }; map[ct.key] = topics; }
        }));
        setTopicsByType(map);
        // Pre-select first product from weights, or first product
        const firstWeighted = Object.keys(p.product_weights ?? {})[0];
        if (firstWeighted) setSelectedProductId(firstWeighted);
      }
      if (settingsRes.ok) {
        const s = await settingsRes.json() as { platforms?: string[]; post_time?: string };
        if (s.platforms?.[0]) setPlatform(s.platforms[0]);
        if (s.post_time) setPostTime(s.post_time);
      }
      if (productsRes.ok) {
        const d = await productsRes.json() as { products?: Product[] };
        const prods = d.products ?? [];
        setProducts(prods);
        if (!selectedProductId && prods[0]) setSelectedProductId(prods[0].id);
      }
    } finally { setLoadingPlan(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (brand) loadAll(brand.id); }, [brand, loadAll]);

  async function savePlan() {
    if (!brand || !plan) return;
    // Update product_weights so the selected product has 100% weight
    const weights: Record<string, number> = selectedProductId ? { [selectedProductId]: 100 } : {};
    const updated = { ...plan, product_weights: weights };
    setPlan(updated);
    await fetch(`/api/brands/${brand.id}/social/content-plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_types: updated.content_types, product_weights: updated.product_weights, weekly_posts: updated.weekly_posts }),
    });
  }

  async function renderSample(type: ContentTypeConfig) {
    if (!brand) return;
    await savePlan(); // ensure product weight is saved first
    setRendering(r => ({ ...r, [type.key]: true }));
    try {
      const res = await fetch(`/api/brands/${brand.id}/social/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots: [{ content_type_key: type.key, scheduled_date: new Date().toISOString().split("T")[0], product_id: selectedProductId || undefined }],
          platform,
          require_approval: true,
        }),
      });
      const data = await res.json() as { posts?: GeneratedPost[] };
      if (data.posts?.[0]) setSamples(s => ({ ...s, [type.key]: data.posts![0] }));
    } finally { setRendering(r => ({ ...r, [type.key]: false })); }
  }

  async function generateWeek() {
    if (!brand) return;
    await savePlan();
    setGeneratingWeek(true);
    try {
      const res = await fetch(`/api/brands/${brand.id}/social/generate-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks: 1, platform, require_approval: true }),
      });
      const data = await res.json() as { posts?: GeneratedPost[] };
      setWeekPosts((data.posts ?? []) as GeneratedPost[]);
    } finally { setGeneratingWeek(false); }
  }

  async function schedulePost(post: GeneratedPost, date: string) {
    if (!brand) return;
    setWeekPosts(prev => prev.map(p => p.id === post.id ? { ...p, scheduling: true } : p));
    const scheduledAt = `${date}T${postTime}:00Z`;
    await fetch(`/api/brands/${brand.id}/social/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "scheduled", scheduled_at: scheduledAt }),
    });
    setWeekPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, scheduling: false, scheduled: true, scheduled_at: scheduledAt } : p
    ));
  }

  async function scheduleAll() {
    if (!brand) return;
    for (const post of weekPosts.filter(p => !p.scheduled && p.scheduled_at)) {
      if (post.scheduled_at) await schedulePost(post, post.scheduled_at.split("T")[0]);
    }
  }

  const autoTypes = plan?.content_types.filter(t => t.auto_enabled) ?? [];
  const allScheduled = weekPosts.length > 0 && weekPosts.every(p => p.scheduled);
  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (brandCtxLoading || loadingPlan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-8 w-48 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1,2,3,4,5].map(i => <div key={i} className="aspect-[9/16] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!brand) return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-gray-500">{lang === "nl" ? "Selecteer een brand." : "Select a brand."}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 mb-1">{brand.name}</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Studio</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {lang === "nl" ? "Test per type, genereer je week, plan in." : "Test per type, generate your week, schedule."}
        </p>
      </div>

      {/* Setup: product + platform (always visible) */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button onClick={() => setSetupOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {lang === "nl" ? "Instellingen" : "Settings"}
            </span>
            {/* Quick summary */}
            <div className="flex items-center gap-2">
              {selectedProduct && (
                <span className="flex items-center gap-1.5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2.5 py-1 text-[11px] text-gray-600 dark:text-gray-300">
                  {selectedProduct.image_urls?.[0] && (
                    <Image src={selectedProduct.image_urls[0]} alt="" width={14} height={14} className="rounded-full object-cover" unoptimized />
                  )}
                  {selectedProduct.name}
                </span>
              )}
              <span className="rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2.5 py-1 text-[11px] text-gray-600 dark:text-gray-300 capitalize">{platform}</span>
            </div>
          </div>
          <svg className={`h-4 w-4 text-gray-400 transition-transform ${setupOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {setupOpen && (
          <div className="px-5 py-4 space-y-5 border-t border-gray-100 dark:border-gray-800">

            {/* Product */}
            {products.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {lang === "nl" ? "Product" : "Product"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {products.map(p => (
                    <button key={p.id} onClick={() => setSelectedProductId(p.id)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                        selectedProductId === p.id
                          ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                      }`}>
                      {p.image_urls?.[0] && (
                        <div className="relative h-8 w-8 rounded-lg overflow-hidden shrink-0">
                          <Image src={p.image_urls[0]} alt="" fill className="object-cover" unoptimized />
                        </div>
                      )}
                      {p.name}
                    </button>
                  ))}
                  <button onClick={() => setSelectedProductId("")}
                    className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                      !selectedProductId
                        ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                    }`}>
                    {lang === "nl" ? "Geen product" : "No product"}
                  </button>
                </div>
              </div>
            )}

            {/* Platform + post time */}
            <div className="flex gap-6 flex-wrap">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Platform</p>
                <div className="flex gap-2">
                  {["instagram", "facebook"].map(p => (
                    <button key={p} onClick={() => setPlatform(p)}
                      className={`rounded-xl border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                        platform === p ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500"
                      }`}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {lang === "nl" ? "Posttijd" : "Post time"}
                </p>
                <input type="time" value={postTime} onChange={e => setPostTime(e.target.value)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C7F56F]/50" />
              </div>
            </div>

            {/* Topics per type */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {lang === "nl" ? "Topics per type" : "Topics per type"}
              </p>
              <div className="space-y-4">
                {autoTypes.map(type => (
                  <TopicRow
                    key={type.key}
                    brandId={brand.id}
                    type={type}
                    topics={topicsByType[type.key] ?? []}
                    onTopicsChange={topics => setTopicsByType(prev => ({ ...prev, [type.key]: topics }))}
                  />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Step 1: Content type cards */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          {lang === "nl" ? "Stap 1 — Test per type" : "Step 1 — Test per type"}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {autoTypes.map(type => {
            const sample = samples[type.key];
            const isRendering = rendering[type.key];
            return (
              <div key={type.key} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
                {/* Image area 9:16 */}
                <div className="relative w-full" style={{ aspectRatio: "9/16" }}>
                  {sample?.image_urls?.[0] ? (
                    <Image src={sample.image_urls[0]} alt={type.label} fill className="object-cover" unoptimized />
                  ) : isRendering ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 gap-2">
                      <svg className="h-5 w-5 animate-spin text-[#C7F56F]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      <p className="text-[10px] text-gray-400">{lang === "nl" ? "Genereren…" : "Generating…"}</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                      <div className={`h-8 w-8 rounded-full ${COLOR_DOT[type.color] ?? "bg-gray-400"} opacity-20`} />
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${COLOR_DOT[type.color] ?? "bg-gray-400"}`} />
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{type.label}</span>
                  </div>
                  {sample?.caption && (
                    <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{sample.caption}</p>
                  )}
                  <div className="flex gap-1.5 mt-auto">
                    {sample?.image_urls?.[0] ? (
                      <>
                        <a href={sample.image_urls[0]} download target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#C7F56F] py-1.5 text-[11px] font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                          Download
                        </a>
                        <button onClick={() => renderSample(type)} disabled={isRendering}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-[11px] text-gray-500 hover:border-gray-300 disabled:opacity-40">
                          ↺
                        </button>
                      </>
                    ) : (
                      <button onClick={() => renderSample(type)} disabled={isRendering}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 py-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:border-[#C7F56F] disabled:opacity-40 transition-colors">
                        {isRendering ? (lang === "nl" ? "Bezig…" : "Generating…") : "Render test"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Generate week */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          {lang === "nl" ? "Stap 2 — Genereer volledige week" : "Step 2 — Generate full week"}
        </p>
        <button onClick={generateWeek} disabled={generatingWeek}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#C7F56F] py-4 text-base font-bold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 transition-colors">
          {generatingWeek ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {lang === "nl" ? "Week genereren… (~2-4 min)" : "Generating week… (~2-4 min)"}
            </>
          ) : (lang === "nl" ? "Genereer volledige week →" : "Generate full week →")}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          {lang === "nl" ? `Maakt 4 posts aan verdeeld over ${autoTypes.length} types` : `Creates 4 posts across ${autoTypes.length} types`}
        </p>
      </div>

      {/* Step 3: Review + schedule */}
      {weekPosts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {lang === "nl" ? "Stap 3 — Beoordeel & plan in" : "Step 3 — Review & schedule"}
            </p>
            {!allScheduled && (
              <button onClick={scheduleAll} className="text-xs font-semibold text-[#C7F56F] hover:text-[#b8e85e]">
                {lang === "nl" ? "Alles inplannen →" : "Schedule all →"}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {weekPosts.map(post => {
              const scheduledDate = post.scheduled_at
                ? new Date(post.scheduled_at).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { weekday: "long", day: "numeric", month: "short" })
                : null;
              return (
                <div key={post.id} className="flex gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                  {post.image_urls?.[0] && (
                    <div className="relative h-20 w-12 shrink-0 rounded-xl overflow-hidden">
                      <Image src={post.image_urls[0]} alt="" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {post.content_type_key && (
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          {post.content_type_key.replace(/-/g, " ")}
                        </span>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5 leading-relaxed">{post.caption}</p>
                    </div>
                    {scheduledDate && <p className="text-[10px] text-gray-400 mt-1">📅 {scheduledDate}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {post.image_urls?.[0] && (
                      <a href={post.image_urls[0]} download target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-gray-400 hover:text-gray-600">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                      </a>
                    )}
                    {post.scheduled ? (
                      <span className="rounded-lg bg-[#C7F56F]/20 px-2.5 py-1.5 text-[11px] font-semibold text-green-700 dark:text-[#C7F56F] text-center whitespace-nowrap">
                        ✓ {lang === "nl" ? "Ingepland" : "Scheduled"}
                      </span>
                    ) : (
                      <button onClick={() => post.scheduled_at && schedulePost(post, post.scheduled_at.split("T")[0])}
                        disabled={post.scheduling}
                        className="rounded-lg bg-[#C7F56F] px-2.5 py-1.5 text-[11px] font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50 whitespace-nowrap">
                        {post.scheduling ? "…" : (lang === "nl" ? "Inplannen" : "Schedule")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {allScheduled && (
            <div className="mt-4 rounded-2xl bg-[#C7F56F]/10 border border-[#C7F56F]/30 px-5 py-4 text-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {lang === "nl" ? "Week ingepland ✓" : "Week scheduled ✓"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {lang === "nl" ? "Posts worden automatisch gepubliceerd op de geplande tijd." : "Posts will be automatically published at the scheduled time."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
