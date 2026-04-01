"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CONTENT_TEMPLATES } from "@/lib/content-templates";
import { useLanguage } from "@/components/LanguageProvider";
import SupportModal from "@/components/SupportModal";

const AD_TEMPLATES = [
  { name: "headline", label: "Headline", description: "Bold hook, clear CTA", thumb: "/template thumbnails/headline.jpg" },
  { name: "offer-promotion", label: "Offer / Promo", description: "Discount, deal, urgency", thumb: "/template thumbnails/offer.jpg" },
  { name: "testimonial", label: "Testimonial", description: "Social proof quote card", thumb: "/template thumbnails/testimonial.jpg" },
  { name: "vs-them", label: "Us vs Them", description: "Comparison advantage", thumb: "/template thumbnails/us_vs_them.jpg" },
  { name: "ugc-lifestyle", label: "UGC Lifestyle", description: "Real-person scene", thumb: "/template thumbnails/ugc_lifestyle.jpg" },
];

// Placeholder bg colors for content templates until images are provided
const CONTENT_PLACEHOLDER_COLORS = [
  "bg-violet-100", "bg-blue-100", "bg-emerald-100", "bg-amber-100", "bg-rose-100",
  "bg-indigo-100", "bg-teal-100", "bg-orange-100", "bg-pink-100",
];

const SUPPORT_CARDS = [
  {
    icon: (
      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
    titleKey: "home.support.title",
    descKey: "home.support.desc",
    ctaKey: "home.support.cta",
    action: "support" as const,
  },
  {
    icon: (
      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
      </svg>
    ),
    titleKey: "home.requestSection.title",
    descKey: "home.requestSection.desc",
    ctaKey: "home.requestSection.cta",
    action: "mailto:hello@sequenceflow.io?subject=Section Request" as const,
  },
  {
    icon: (
      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    titleKey: "home.requestFeature.title",
    descKey: "home.requestFeature.desc",
    ctaKey: "home.requestFeature.cta",
    action: "mailto:hello@sequenceflow.io?subject=Feature Request" as const,
  },
  {
    icon: (
      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    titleKey: "home.partner.title",
    descKey: "home.partner.desc",
    ctaKey: "home.partner.cta",
    action: "mailto:hello@sequenceflow.io?subject=Affiliate Program" as const,
  },
];

export default function HomePage() {
  const { t } = useLanguage();
  const [showSupport, setShowSupport] = useState(false);

  // Double items for seamless infinite loop
  const adLoop = [...AD_TEMPLATES, ...AD_TEMPLATES];
  const contentLoop = [...CONTENT_TEMPLATES, ...CONTENT_TEMPLATES];

  return (
    <div>
      {/* Hero */}
      <section className="mb-14 pt-8 text-center flex flex-col items-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C7F56F]/30 bg-[#C7F56F]/10 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C7F56F]" />
          {t("home.badge")}
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight max-w-xl">
          {t("home.headline")}
        </h1>
        <p className="mt-4 max-w-md text-base text-gray-500 dark:text-gray-400">
          {t("home.subtext")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/stores" className="rounded-lg bg-[#C7F56F] px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors">
            {t("home.getStarted")}
          </Link>
          <Link href="/ad-gen" className="rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {t("home.generateAds")}
          </Link>
        </div>
      </section>

      {/* Ad Templates — infinite marquee */}
      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("home.adTemplates")}</p>
            <h2 className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">{t("home.adTemplatesTitle")}</h2>
          </div>
          <Link href="/ad-gen" className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:underline">
            {t("home.adTemplatesLink")}
          </Link>
        </div>
        <div className="overflow-hidden relative"
          style={{ maskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)" }}>
          <div className="flex gap-3 animate-marquee" style={{ width: "max-content" }}>
            {adLoop.map((tmpl, i) => (
              <Link key={`${tmpl.name}-${i}`} href="/ad-gen"
                className="group flex-shrink-0 w-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:border-[#C7F56F] hover:shadow-sm transition-all">
                <div className="aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <Image src={tmpl.thumb} alt={tmpl.label} width={160} height={200}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white">{tmpl.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{tmpl.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Content Templates — infinite marquee, same 4:5 ratio */}
      <section className="mb-14">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("home.contentTemplates")}</p>
            <h2 className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">{t("home.contentTemplatesTitle")}</h2>
          </div>
          <Link href="/content-gen" className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:underline">
            {t("home.contentTemplatesLink")}
          </Link>
        </div>
        <div className="overflow-hidden relative"
          style={{ maskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)" }}>
          <div className="flex gap-3 animate-marquee-slow" style={{ width: "max-content" }}>
            {contentLoop.map((tmpl, i) => (
              <Link key={`${tmpl.name}-${i}`} href="/content-gen"
                className="group flex-shrink-0 w-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:border-[#C7F56F] hover:shadow-sm transition-all">
                <div className={`aspect-[4/5] flex flex-col items-center justify-center gap-2 ${CONTENT_PLACEHOLDER_COLORS[i % CONTENT_PLACEHOLDER_COLORS.length]} dark:bg-gray-800`}>
                  <span className="text-3xl">{tmpl.icon}</span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white">{tmpl.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{tmpl.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Support section */}
      <section className="mb-12 border-t border-gray-200 dark:border-gray-800 pt-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SUPPORT_CARDS.map((card) => (
            <div key={card.titleKey} className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                {card.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t(card.titleKey)}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t(card.descKey)}</p>
              </div>
              {card.action === "support" ? (
                <button
                  onClick={() => setShowSupport(true)}
                  className="mt-auto w-fit rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t(card.ctaKey)}
                </button>
              ) : (
                <a
                  href={card.action}
                  className="mt-auto w-fit rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t(card.ctaKey)}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
    </div>
  );
}
