"use client";

import { useRef, useState } from "react";
import type { BrandDnaData } from "@/types";
import { useLanguage } from "@/components/LanguageProvider";

interface Props {
  brandId: string;
  initialData: Partial<BrandDnaData>;
  onSave: (data: Partial<BrandDnaData>) => void;
  onCancel: (() => void) | null;
  loading: boolean;
  saveLabel?: string;
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center align-middle ml-1">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-[10px] font-semibold text-gray-400 dark:text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors leading-none"
      >
        i
      </button>
      {open && (
        <div className="absolute left-5 top-0 z-50 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg text-xs text-gray-600 dark:text-gray-300 leading-relaxed normal-case font-normal tracking-normal">
          {text}
        </div>
      )}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  tooltip,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  tooltip?: string;
}) {
  const base =
    "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30";
  return (
    <div>
      <label className="mb-1 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${base} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-gray-200 dark:border-gray-700 p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm font-mono outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30"
        />
      </div>
    </div>
  );
}

export default function BrandDnaForm({ brandId, initialData, onSave, onCancel, loading, saveLabel }: Props) {
  const [d, setD] = useState<Partial<BrandDnaData>>({ ...initialData });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/brands/${brandId}/logo`, { method: "POST", body: formData });
    const data = await res.json();
    setUploadingLogo(false);
    if (res.ok) set("logo_url", data.url);
  }

  async function handleLogoRemove() {
    await fetch(`/api/brands/${brandId}/logo`, { method: "DELETE" });
    set("logo_url", null as unknown as never);
  }

  function set<K extends keyof BrandDnaData>(key: K, value: BrandDnaData[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
  }

  function setStr(key: keyof BrandDnaData) {
    return (v: string) => set(key, (v || null) as never);
  }

  return (
    <div className="space-y-6">
      {/* Brand Logo */}
      <section>
        <p className="mb-3 flex items-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {t("brandDna.logoSection")}
          <InfoTooltip text={t("brandDna.logoTooltip")} />
        </p>
        <div className="flex items-center gap-4">
          {d.logo_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.logo_url} alt="Logo" className="h-12 max-w-[180px] object-contain rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1" />
              <button
                type="button"
                onClick={handleLogoRemove}
                className="text-xs text-red-400 hover:text-red-600"
              >
                {t("brandDna.logoRemove")}
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">{t("brandDna.logoNoLogo")}</p>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {uploadingLogo ? t("brandDna.logoUploading") : d.logo_url ? t("brandDna.logoReplace") : t("brandDna.logoUpload")}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{t("brandDna.logoTip")}</p>
      </section>

      {/* Language */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("brandDna.languageSection")}</p>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t("brandDna.languageLabel")}</label>
          <select
            value={d.language ?? "English"}
            onChange={(e) => set("language", e.target.value as never)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30"
          >
            <option value="English">English</option>
            <option value="Dutch">Dutch</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Portuguese">Portuguese</option>
          </select>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{t("brandDna.languageTip")}</p>
        </div>
      </section>

      {/* Brand Overview */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("brandDna.overviewSection")}</p>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("brandDna.tagline")}
              value={d.tagline ?? ""}
              onChange={setStr("tagline")}
              placeholder="Your brand tagline"
            />
            <Field
              label={t("brandDna.voiceAdjectives")}
              value={(d.voice_adjectives ?? []).join(", ")}
              onChange={(v) =>
                set("voice_adjectives", v.split(",").map((s) => s.trim()).filter(Boolean))
              }
              placeholder="Elegant, Minimal, Modern, Clean, Premium"
            />
          </div>
          <Field
            label={t("brandDna.brandStory")}
            value={d.brand_story ?? ""}
            onChange={setStr("brand_story")}
            textarea
            placeholder="1–2 sentences about the brand's origin or mission"
          />
          <Field
            label={t("brandDna.targetAudience")}
            value={d.target_audience ?? ""}
            onChange={setStr("target_audience")}
            textarea
            placeholder="Who the brand is for — demographics, lifestyle, needs"
            tooltip={t("brandDna.targetAudienceTooltip")}
          />
          <Field
            label={t("brandDna.brandPersonality")}
            value={d.brand_personality ?? ""}
            onChange={setStr("brand_personality")}
            textarea
            placeholder="How the brand acts, speaks, and feels — e.g. Premium but approachable"
          />
          <Field
            label={t("brandDna.positioning")}
            value={d.positioning ?? ""}
            onChange={setStr("positioning")}
            textarea
            placeholder="1–2 sentences describing what makes this brand unique"
          />
          <Field
            label={t("brandDna.competitiveDiff")}
            value={d.competitive_differentiation ?? ""}
            onChange={setStr("competitive_differentiation")}
            placeholder="How this brand differs from competitors"
            tooltip={t("brandDna.competitiveDiffTooltip")}
          />
        </div>
      </section>

      {/* Copy Strategy */}
      <section>
        <p className="mb-1 flex items-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {t("brandDna.copyStrategySection")}
          <InfoTooltip text={t("brandDna.copyStrategyTooltip")} />
        </p>
        <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">{t("brandDna.copyStrategyDesc")}</p>
        <div className="space-y-4">
          {/* Customer Desires — tag input */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("brandDna.customerDesires")} <span className="text-gray-400 dark:text-gray-500 font-normal">({(d.customer_desires ?? []).length}/6)</span>
            </label>
            <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">{t("brandDna.customerDesiresDesc")}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(d.customer_desires ?? []).map((desire, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-200">
                  {desire}
                  <button
                    type="button"
                    onClick={() => set("customer_desires", (d.customer_desires ?? []).filter((_, j) => j !== i))}
                    className="ml-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                  >×</button>
                </span>
              ))}
            </div>
            {(d.customer_desires ?? []).length < 6 && (
              <input
                type="text"
                placeholder="e.g. effortless kitchen — press Enter"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && (d.customer_desires ?? []).length < 6) {
                      set("customer_desires", [...(d.customer_desires ?? []), val]);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
            )}
          </div>

          {/* Hook Examples — dynamic list */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t("brandDna.hookExamples")}</label>
            <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">{t("brandDna.hookExamplesDesc")}</p>
            <div className="space-y-2">
              {(d.hook_examples ?? []).map((hook, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={hook}
                    onChange={(e) => {
                      const updated = [...(d.hook_examples ?? [])];
                      updated[i] = e.target.value;
                      set("hook_examples", updated);
                    }}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30"
                    placeholder="e.g. How I made my kitchen look 10x more organized"
                  />
                  <button
                    type="button"
                    onClick={() => set("hook_examples", (d.hook_examples ?? []).filter((_, j) => j !== i))}
                    className="mt-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 text-sm"
                  >×</button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => set("hook_examples", [...(d.hook_examples ?? []), ""])}
              className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2"
            >
              {t("brandDna.addHookExample")}
            </button>
          </div>
        </div>
      </section>

      {/* Visual System */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("brandDna.visualSystemSection")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={t("brandDna.primaryFont")}
            value={d.primary_font ?? ""}
            onChange={setStr("primary_font")}
            placeholder="Neue Haas Grotesk"
          />
          <Field
            label={t("brandDna.secondaryFont")}
            value={d.secondary_font ?? ""}
            onChange={setStr("secondary_font")}
            placeholder="Garamond"
          />
          <ColorField
            label={t("brandDna.accentColor")}
            value={d.accent_color ?? ""}
            onChange={(v) => set("accent_color", v || null)}
          />
          <ColorField
            label={t("brandDna.lettertypeColor")}
            value={d.lettertype_color ?? ""}
            onChange={(v) => set("lettertype_color", v || null)}
          />
          <ColorField
            label={t("brandDna.backgroundColor")}
            value={d.background_color ?? ""}
            onChange={(v) => set("background_color", v || null)}
          />
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(d)}
          disabled={loading}
          className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
        >
          {saveLabel ?? (loading ? t("product.saving") : t("brandDna.save"))}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t("brandDna.cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
