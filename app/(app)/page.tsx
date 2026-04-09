"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CONTENT_TEMPLATES } from "@/lib/content-templates";
import { useLanguage } from "@/components/LanguageProvider";
import SupportModal from "@/components/SupportModal";
import FeedbackModal from "@/components/FeedbackModal";
import TutorialModal from "@/components/TutorialModal";

const AD_TEMPLATES = [
  { name: "headline", label: "Headline", description: "Bold hook, clear CTA", thumb: "/template thumbnails/headline.jpg" },
  { name: "offer-promotion", label: "Offer / Promo", description: "Discount, deal, urgency", thumb: "/template thumbnails/offer.jpg" },
  { name: "testimonial", label: "Testimonial", description: "Social proof quote card", thumb: "/template thumbnails/testimonial.jpg" },
  { name: "vs-them", label: "Us vs Them", description: "Comparison advantage", thumb: "/template thumbnails/us_vs_them.jpg" },
  { name: "ugc-lifestyle", label: "UGC Lifestyle", description: "Real-person scene", thumb: "/template thumbnails/ugc_lifestyle.jpg" },
];



export default function HomePage() {
  const { t } = useLanguage();
  const [showSupport, setShowSupport] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

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

      {/* Support section */}
      <section className="mb-12 border-t border-gray-200 dark:border-gray-800 pt-10">
        <div className="grid grid-cols-3 gap-4">
          {/* Feature Request */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("home.requestFeature.title")}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t("home.requestFeature.desc")}</p>
            </div>
            <button
              onClick={() => setShowFeedback(true)}
              className="mt-auto w-fit rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("home.requestFeature.cta")}
            </button>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("home.support.title")}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t("home.support.desc")}</p>
            </div>
            <button
              onClick={() => setShowSupport(true)}
              className="mt-auto w-fit rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("home.support.cta")}
            </button>
          </div>

          {/* Partner — coming soon */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-5 opacity-60">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                {t("home.partner.badge") || "Binnenkort"}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("home.partner.title")}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t("home.partner.desc")}</p>
            </div>
            <button disabled className="mt-auto w-fit rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed">
              {t("home.partner.cta")}
            </button>
          </div>
        </div>
      </section>

      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
