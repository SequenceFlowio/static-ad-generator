"use client";

import Link from "next/link";
import Image from "next/image";
import { CONTENT_TEMPLATES } from "@/lib/content-templates";
import { useLanguage } from "@/components/LanguageProvider";

const AD_TEMPLATES = [
  { name: "headline", label: "Headline", description: "Bold hook, clear CTA", thumb: "/template thumbnails/headline.jpg" },
  { name: "offer-promotion", label: "Offer / Promo", description: "Discount, deal, urgency", thumb: "/template thumbnails/offer.jpg" },
  { name: "testimonial", label: "Testimonial", description: "Social proof quote card", thumb: "/template thumbnails/testimonial.jpg" },
  { name: "vs-them", label: "Us vs Them", description: "Comparison advantage", thumb: "/template thumbnails/us_vs_them.jpg" },
  { name: "ugc-lifestyle", label: "UGC Lifestyle", description: "Real-person scene", thumb: "/template thumbnails/ugc_lifestyle.jpg" },
];

export default function HomePage() {
  const { t } = useLanguage();

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

      {/* Ad Templates */}
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
        <div className="grid grid-cols-5 gap-3">
          {AD_TEMPLATES.map((t) => (
            <Link key={t.name} href="/ad-gen"
              className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:border-[#C7F56F] hover:shadow-sm transition-all">
              <div className="aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image src={t.thumb} alt={t.label} width={200} height={250}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-gray-800 dark:text-white">{t.label}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{t.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Content Templates */}
      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("home.contentTemplates")}</p>
            <h2 className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">{t("home.contentTemplatesTitle")}</h2>
          </div>
          <Link href="/content-gen" className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:underline">
            {t("home.contentTemplatesLink")}
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
          {CONTENT_TEMPLATES.map((tmpl) => (
            <Link key={tmpl.name} href="/content-gen"
              className="group flex flex-col items-start gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3.5 hover:border-[#C7F56F] hover:shadow-sm transition-all">
              <span className="text-2xl">{tmpl.icon}</span>
              <p className="text-xs font-semibold text-gray-800 dark:text-white leading-tight">{tmpl.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{tmpl.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
