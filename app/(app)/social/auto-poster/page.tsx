"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { useBrand } from "@/lib/brand-context";
import type { ContentPlan, ContentTypeConfig, ContentTopic, ContentGoal } from "@/types";

interface SocialSettings {
  enabled: boolean;
  platforms: string[];
  post_time: string;
  require_approval: boolean;
  frequency: string;
  content_types: string[];
}

interface Product {
  id: string;
  name: string;
  image_urls: string[];
}

const COLOR_MAP: Record<string, string> = {
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  gray: "bg-gray-400",
  red: "bg-red-500",
  pink: "bg-pink-500",
};

const GOAL_LABELS: Record<ContentGoal, { nl: string; en: string }> = {
  saves: { nl: "Saves", en: "Saves" },
  engagement: { nl: "Engagement", en: "Engagement" },
  reach: { nl: "Bereik", en: "Reach" },
  sales: { nl: "Sales", en: "Sales" },
  trust: { nl: "Vertrouwen", en: "Trust" },
};

const GOAL_OPTIONS: ContentGoal[] = ["saves", "engagement", "reach", "sales", "trust"];

// ─── Topic Library ────────────────────────────────────────────────────────────

function TopicLibrary({
  brandId, contentType, topics, onTopicsChange,
}: {
  brandId: string;
  contentType: ContentTypeConfig;
  topics: ContentTopic[];
  onTopicsChange: (topics: ContentTopic[]) => void;
}) {
  const { lang } = useLanguage();
  const [newTopic, setNewTopic] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  async function addTopic() {
    if (!newTopic.trim()) return;
    const res = await fetch(`/api/brands/${brandId}/social/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_type_key: contentType.key, topic: newTopic.trim() }),
    });
    if (res.ok) {
      const { topic } = await res.json() as { topic: ContentTopic };
      onTopicsChange([...topics, topic]);
      setNewTopic("");
    }
  }

  async function deleteTopic(id: string) {
    await fetch(`/api/brands/${brandId}/social/topics/${id}`, { method: "DELETE" });
    onTopicsChange(topics.filter(t => t.id !== id));
  }

  async function suggestTopics() {
    setSuggesting(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/social/topics/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type_key: contentType.key,
          content_type_label: contentType.label,
          template_key: contentType.template_key,
          count: 6,
        }),
      });
      const data = await res.json() as { topics?: string[] };
      if (data.topics?.length) {
        // Bulk insert suggested topics
        const added: ContentTopic[] = [];
        for (const topic of data.topics) {
          const r = await fetch(`/api/brands/${brandId}/social/topics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content_type_key: contentType.key, topic }),
          });
          if (r.ok) {
            const { topic: t } = await r.json() as { topic: ContentTopic };
            added.push(t);
          }
        }
        onTopicsChange([...topics, ...added]);
      }
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {lang === "nl" ? "Topic bibliotheek" : "Topic library"}
          <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-normal text-gray-500">{topics.length}</span>
        </p>
        <button onClick={suggestTopics} disabled={suggesting}
          className="flex items-center gap-1 text-[11px] font-medium text-[#C7F56F] hover:text-[#b8e85e] disabled:opacity-50 transition-colors">
          {suggesting ? (
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          ) : (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          )}
          {lang === "nl" ? "AI suggesties" : "AI suggest"}
        </button>
      </div>

      {topics.length > 0 ? (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {topics.map(t => (
            <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-gray-800 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 group">
              <span className="flex-1 truncate">{t.topic}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {t.last_used_at && (
                  <span className="text-[10px] text-gray-400">
                    {new Date(t.last_used_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </span>
                )}
                <button onClick={() => deleteTopic(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">
          {lang === "nl" ? "Nog geen topics. Voeg ze toe of genereer ze met AI." : "No topics yet. Add them or generate with AI."}
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={newTopic}
          onChange={e => setNewTopic(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTopic()}
          placeholder={lang === "nl" ? "Topic toevoegen…" : "Add topic…"}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C7F56F]/50"
        />
        <button onClick={addTopic} disabled={!newTopic.trim()}
          className="rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
          +
        </button>
      </div>
    </div>
  );
}

// ─── Content Type Card ────────────────────────────────────────────────────────

function ContentTypeCard({
  brandId, type, topics, onUpdate, onTopicsChange,
}: {
  brandId: string;
  type: ContentTypeConfig;
  topics: ContentTopic[];
  onUpdate: (updated: ContentTypeConfig) => void;
  onTopicsChange: (topics: ContentTopic[]) => void;
}) {
  const { lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border transition-colors ${expanded ? "border-gray-300 dark:border-gray-600" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-900`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`h-3 w-3 rounded-full shrink-0 ${COLOR_MAP[type.color] ?? "bg-gray-400"}`} />
        <button onClick={() => setExpanded(e => !e)} className="flex-1 text-left">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{type.label}</span>
          <span className="ml-2 text-xs text-gray-400">{type.percentage}%</span>
          {type.goal && (
            <span className="ml-2 rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500 dark:text-gray-400">
              {lang === "nl" ? GOAL_LABELS[type.goal].nl : GOAL_LABELS[type.goal].en}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-gray-400">{lang === "nl" ? (type.auto_enabled ? "Auto" : "Handmatig") : (type.auto_enabled ? "Auto" : "Manual")}</span>
          <button onClick={() => onUpdate({ ...type, auto_enabled: !type.auto_enabled })}
            className={`relative h-5 w-9 rounded-full transition-colors ${type.auto_enabled ? "bg-[#C7F56F]" : "bg-gray-200 dark:bg-gray-700"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${type.auto_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400">
            <svg className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Percentage */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">% doel</label>
              <input type="number" min={0} max={100} value={type.percentage}
                onChange={e => onUpdate({ ...type, percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 text-sm text-center font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C7F56F]/50"
              />
            </div>
            {/* Max consecutive */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Max op rij</label>
              <input type="number" min={1} max={5} value={type.max_consecutive}
                onChange={e => onUpdate({ ...type, max_consecutive: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 text-sm text-center font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C7F56F]/50"
              />
            </div>
            {/* Goal */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Doel</label>
              <select value={type.goal}
                onChange={e => onUpdate({ ...type, goal: e.target.value as ContentGoal })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C7F56F]/50">
                {GOAL_OPTIONS.map(g => (
                  <option key={g} value={g}>{lang === "nl" ? GOAL_LABELS[g].nl : GOAL_LABELS[g].en}</option>
                ))}
              </select>
            </div>
          </div>

          <TopicLibrary brandId={brandId} contentType={type} topics={topics} onTopicsChange={onTopicsChange} />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutoPosterPage() {
  const { lang } = useLanguage();
  const { brand, loading: brandCtxLoading } = useBrand();

  const [settings, setSettings] = useState<SocialSettings>({
    enabled: false,
    platforms: ["instagram"],
    post_time: "09:00",
    require_approval: true,
    frequency: "4x_week",
    content_types: [],
  });
  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [topicsByType, setTopicsByType] = useState<Record<string, ContentTopic[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState<"week" | "month" | null>(null);
  const [generateResult, setGenerateResult] = useState<{ created: number; errors: string[] } | null>(null);

  const loadData = useCallback(async (brandId: string) => {
    setLoading(true);
    try {
      const [settingsRes, planRes, productsRes] = await Promise.all([
        fetch(`/api/brands/${brandId}/social/settings`),
        fetch(`/api/brands/${brandId}/social/content-plan`),
        fetch(`/api/brands/${brandId}/products`),
      ]);

      if (settingsRes.ok) {
        const d = await settingsRes.json() as SocialSettings;
        setSettings(s => ({ ...s, ...d }));
      }
      if (planRes.ok) {
        const { plan: p } = await planRes.json() as { plan: ContentPlan };
        setPlan(p);
        // Load topics for each content type
        const topicMap: Record<string, ContentTopic[]> = {};
        await Promise.all(p.content_types.map(async (ct) => {
          const r = await fetch(`/api/brands/${brandId}/social/topics?content_type_key=${ct.key}`);
          if (r.ok) {
            const { topics } = await r.json() as { topics: ContentTopic[] };
            topicMap[ct.key] = topics;
          }
        }));
        setTopicsByType(topicMap);
      }
      if (productsRes.ok) {
        const d = await productsRes.json() as { products?: Product[] };
        setProducts(d.products ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (brand) loadData(brand.id);
  }, [brand, loadData]);

  async function handleSave() {
    if (!brand || !plan) return;
    setSaving(true);
    setSaved(false);
    await Promise.all([
      fetch(`/api/brands/${brand.id}/social/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }),
      fetch(`/api/brands/${brand.id}/social/content-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_types: plan.content_types,
          product_weights: plan.product_weights,
          weekly_posts: plan.weekly_posts,
        }),
      }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleGenerate(weeks: number) {
    if (!brand) return;
    setGenerating(weeks === 1 ? "week" : "month");
    setGenerateResult(null);
    try {
      const res = await fetch(`/api/brands/${brand.id}/social/generate-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeks,
          platform: settings.platforms[0] ?? "instagram",
          require_approval: settings.require_approval,
        }),
      });
      const d = await res.json() as { created: number; errors?: string[] };
      setGenerateResult({ created: d.created ?? 0, errors: d.errors ?? [] });
    } finally {
      setGenerating(null);
    }
  }

  function updateContentType(updatedType: ContentTypeConfig) {
    if (!plan) return;
    setPlan(p => p ? { ...p, content_types: p.content_types.map(t => t.key === updatedType.key ? updatedType : t) } : p);
  }

  function updateTopicsForType(typeKey: string, topics: ContentTopic[]) {
    setTopicsByType(prev => ({ ...prev, [typeKey]: topics }));
  }

  function setProductWeight(productId: string, weight: number) {
    if (!plan) return;
    setPlan(p => p ? { ...p, product_weights: { ...p.product_weights, [productId]: weight } } : p);
  }

  if (brandCtxLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-8 w-40 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse mb-4" />
        <div className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Auto-poster</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {lang === "nl" ? "Selecteer een brand via het menu linksonder." : "Select a brand from the bottom-left menu."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{brand.name}</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auto-poster</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {lang === "nl"
            ? "Configureer je content strategie en genereer automatisch posts."
            : "Configure your content strategy and automatically generate posts."}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C7F56F] border-t-transparent" /></div>
      ) : (
        <div className="space-y-6">

          {/* Enable toggle */}
          <div className="flex items-center justify-between rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-5">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {lang === "nl" ? "Auto-poster inschakelen" : "Enable auto-poster"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === "nl" ? "Dagelijks automatisch content genereren op postdagen" : "Auto-generate content daily on posting days"}
              </p>
            </div>
            <button onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enabled ? "bg-[#C7F56F]" : "bg-gray-200 dark:bg-gray-700"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Content Types */}
          {plan && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {lang === "nl" ? "Content types" : "Content types"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lang === "nl" ? "Klik op een type om topics te beheren en instellingen aan te passen." : "Click a type to manage topics and edit settings."}
                </p>
              </div>
              <div className="p-3 space-y-2">
                {plan.content_types.map(type => (
                  <ContentTypeCard
                    key={type.key}
                    brandId={brand.id}
                    type={type}
                    topics={topicsByType[type.key] ?? []}
                    onUpdate={updateContentType}
                    onTopicsChange={topics => updateTopicsForType(type.key, topics)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Product Weights */}
          {products.length > 0 && plan && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {lang === "nl" ? "Product rotatie" : "Product rotation"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lang === "nl" ? "Hogere score = vaker in gegenereerde content" : "Higher weight = appears more in generated content"}
                  </p>
                </div>
                <button onClick={() => {
                  const equal = Math.floor(100 / products.length);
                  const weights: Record<string, number> = {};
                  products.forEach(p => { weights[p.id] = equal; });
                  setPlan(pl => pl ? { ...pl, product_weights: weights } : pl);
                }}
                  className="text-xs font-medium text-[#C7F56F] hover:text-[#b8e85e]">
                  {lang === "nl" ? "Alle gelijk" : "Equal"}
                </button>
              </div>
              <div className="space-y-2">
                {products.map(p => {
                  const weight = plan.product_weights[p.id] ?? 0;
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">{p.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <input type="range" min={0} max={100} value={weight}
                          onChange={e => setProductWeight(p.id, parseInt(e.target.value))}
                          className="w-24 accent-[#C7F56F]" />
                        <span className="w-8 text-right text-xs font-bold text-gray-600 dark:text-gray-300">{weight}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* General Settings */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {lang === "nl" ? "Algemene instellingen" : "General settings"}
            </p>

            {/* Platforms */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Platform</p>
              <div className="flex gap-2">
                {["instagram", "facebook"].map(p => (
                  <button key={p} onClick={() => setSettings(s => ({
                    ...s,
                    platforms: s.platforms.includes(p) ? s.platforms.filter(x => x !== p) : [...s.platforms, p],
                  }))}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      settings.platforms.includes(p) ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Post time */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {lang === "nl" ? "Posttijd" : "Post time"}
              </p>
              <input type="time" value={settings.post_time}
                onChange={e => setSettings(s => ({ ...s, post_time: e.target.value }))}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50" />
            </div>

            {/* Approval toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {lang === "nl" ? "Goedkeuring vereist" : "Require approval"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lang === "nl" ? "Posts verschijnen als concept voor je goedkeurt" : "Posts land as drafts until you approve"}
                </p>
              </div>
              <button onClick={() => setSettings(s => ({ ...s, require_approval: !s.require_approval }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.require_approval ? "bg-[#C7F56F]" : "bg-gray-200 dark:bg-gray-700"}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.require_approval ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {/* Generate buttons */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {lang === "nl" ? "Nu genereren" : "Generate now"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === "nl"
                  ? "Maak posts aan voor de aankomende week of maand. Posts met goedkeuring vereist verschijnen als concept in de planner."
                  : "Create posts for the upcoming week or month. Posts requiring approval land as drafts in the planner."}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleGenerate(1)} disabled={!!generating}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#C7F56F] py-3 text-sm font-bold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 transition-colors">
                {generating === "week" ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                ) : null}
                {lang === "nl" ? "Genereer deze week" : "Generate this week"}
              </button>
              <button onClick={() => handleGenerate(4)} disabled={!!generating}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#C7F56F] py-3 text-sm font-bold text-gray-800 dark:text-white hover:bg-[#C7F56F]/10 disabled:opacity-40 transition-colors">
                {generating === "month" ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                ) : null}
                {lang === "nl" ? "Genereer deze maand" : "Generate this month"}
              </button>
            </div>

            {generateResult && (
              <div className={`rounded-xl px-4 py-3 text-sm ${generateResult.created > 0 ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                {generateResult.created > 0 ? (
                  <span>
                    {lang === "nl" ? `${generateResult.created} posts aangemaakt. ` : `${generateResult.created} posts created. `}
                    <Link href="/social/planner" className="font-semibold underline">
                      {lang === "nl" ? "Bekijk in de planner →" : "View in planner →"}
                    </Link>
                  </span>
                ) : (
                  <span>{lang === "nl" ? "Alle slots zijn al ingevuld." : "All slots already have content."}</span>
                )}
                {generateResult.errors.length > 0 && (
                  <p className="mt-1 text-xs text-red-500">{generateResult.errors.length} {lang === "nl" ? "fout(en)" : "error(s)"}</p>
                )}
              </div>
            )}
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            className="w-full rounded-xl bg-[#C7F56F] py-3 text-sm font-bold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 transition-colors">
            {saved ? (lang === "nl" ? "✓ Opgeslagen" : "✓ Saved") : saving ? "…" : (lang === "nl" ? "Instellingen opslaan" : "Save settings")}
          </button>

        </div>
      )}
    </div>
  );
}
