"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useBrand } from "@/lib/brand-context";

interface SocialSettings {
  enabled: boolean;
  platforms: string[];
  frequency: string;
  post_time: string;
  content_types: string[];
  require_approval: boolean;
}

const FREQUENCIES = [
  { value: "daily", label: "Daily", labelNl: "Dagelijks", desc: "1 post per day", descNl: "1 post per dag" },
  { value: "2x_week", label: "2× per week", labelNl: "2× per week", desc: "Mon + Thu", descNl: "Ma + Do" },
  { value: "3x_week", label: "3× per week", labelNl: "3× per week", desc: "Mon + Wed + Fri", descNl: "Ma + Wo + Vr" },
];

const CONTENT_TYPE_OPTIONS = [
  { value: "product", label: "Product", labelNl: "Product", desc: "Product highlights + benefits", descNl: "Product uitlichten" },
  { value: "lifestyle", label: "Lifestyle", labelNl: "Lifestyle", desc: "Aspirational real-world scenes", descNl: "Inspirerende sfeerbeelden" },
  { value: "ugc", label: "UGC-style", labelNl: "UGC-stijl", desc: "Creator reviews + reactions", descNl: "Creator reviews + reacties" },
];

export default function AutoPosterPage() {
  const { lang } = useLanguage();
  const { brand, loading: brandCtxLoading } = useBrand();
  const [settings, setSettings] = useState<SocialSettings>({
    enabled: false,
    platforms: ["instagram"],
    frequency: "daily",
    post_time: "09:00",
    content_types: ["product", "lifestyle"],
    require_approval: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!brand) return;
    setLoading(true);
    fetch(`/api/brands/${brand.id}/social/settings`)
      .then(r => r.json())
      .then(data => { if (data) setSettings(s => ({ ...s, ...data })); setLoading(false); })
      .catch(() => setLoading(false));
  }, [brand]);

  async function handleSave() {
    if (!brand) return;
    setSaving(true);
    setSaved(false);
    await fetch(`/api/brands/${brand.id}/social/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function togglePlatform(p: string) {
    setSettings(s => ({
      ...s,
      platforms: s.platforms.includes(p) ? s.platforms.filter(x => x !== p) : [...s.platforms, p],
    }));
  }

  function toggleContentType(t: string) {
    setSettings(s => ({
      ...s,
      content_types: s.content_types.includes(t) ? s.content_types.filter(x => x !== t) : [...s.content_types, t],
    }));
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
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{brand.name}</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auto-poster</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {lang === "nl"
            ? "Stel in hoe SequenceFlow automatisch content genereert en post."
            : "Configure how SequenceFlow automatically generates and posts content."}
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === "nl"
                  ? "SequenceFlow genereert en post automatisch content"
                  : "SequenceFlow automatically generates and posts content"}
              </p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enabled ? "bg-[#C7F56F]" : "bg-gray-200 dark:bg-gray-700"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Platforms */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Platform</p>
            <div className="flex gap-2">
              {["instagram", "facebook"].map(p => (
                <button key={p} onClick={() => togglePlatform(p)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    settings.platforms.includes(p) ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                  {p === "instagram" ? "📸" : "👍"} {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {lang === "nl" ? "Frequentie" : "Frequency"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCIES.map(f => (
                <button key={f.value} onClick={() => setSettings(s => ({ ...s, frequency: f.value }))}
                  className={`flex flex-col rounded-xl border-2 p-3 text-left transition-colors ${
                    settings.frequency === f.value ? "border-[#C7F56F] bg-[#C7F56F]/10" : "border-gray-200 dark:border-gray-700"
                  }`}>
                  <span className={`text-sm font-semibold ${settings.frequency === f.value ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>
                    {lang === "nl" ? f.labelNl : f.label}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">{lang === "nl" ? f.descNl : f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Post time */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {lang === "nl" ? "Posttijd" : "Post time"}
            </p>
            <input type="time" value={settings.post_time} onChange={e => setSettings(s => ({ ...s, post_time: e.target.value }))}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50" />
          </div>

          {/* Content types */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {lang === "nl" ? "Contenttypen" : "Content types"}
            </p>
            <div className="space-y-2">
              {CONTENT_TYPE_OPTIONS.map(ct => (
                <button key={ct.value} onClick={() => toggleContentType(ct.value)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    settings.content_types.includes(ct.value) ? "border-[#C7F56F] bg-[#C7F56F]/10" : "border-gray-200 dark:border-gray-700"
                  }`}>
                  <div>
                    <p className={`text-sm font-medium ${settings.content_types.includes(ct.value) ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>
                      {lang === "nl" ? ct.labelNl : ct.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{lang === "nl" ? ct.descNl : ct.desc}</p>
                  </div>
                  {settings.content_types.includes(ct.value) && (
                    <svg className="h-4 w-4 text-[#1a1a1a] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Approval */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {lang === "nl" ? "Goedkeuring vereist" : "Require approval"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === "nl"
                  ? "Gegenereerde posts eerst goedkeuren voor publicatie"
                  : "Review generated posts before they go live"}
              </p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, require_approval: !s.require_approval }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.require_approval ? "bg-[#C7F56F]" : "bg-gray-200 dark:bg-gray-700"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.require_approval ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Note about coming soon */}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
              {lang === "nl" ? "Binnenkort beschikbaar" : "Coming soon"}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
              {lang === "nl"
                ? "Automatische generatie is in ontwikkeling. Instellingen worden nu al opgeslagen zodat je klaar bent wanneer het live gaat."
                : "Automatic generation is in development. Your settings are saved now so you're ready when it goes live."}
            </p>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full rounded-lg bg-[#C7F56F] py-3 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40">
            {saved ? "✓ Opgeslagen" : saving ? "…" : (lang === "nl" ? "Instellingen opslaan" : "Save settings")}
          </button>
        </div>
      )}
    </div>
  );
}
