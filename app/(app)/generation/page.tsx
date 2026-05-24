"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function GenerationPage() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === "nl" ? "Wat wil je genereren?" : "What do you want to generate?"}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {lang === "nl"
              ? "Kies het type output dat je wilt maken."
              : "Choose the type of output you want to create."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Ads card */}
          <Link href="/generation/ads" className="group">
            <div className="flex h-full flex-col rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] p-7 transition-all hover:border-[#C7F56F] hover:shadow-md cursor-pointer">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C7F56F]/10">
                <svg className="h-6 w-6 text-[#1a1a1a] dark:text-[#C7F56F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Ads</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {lang === "nl"
                    ? "Maak hoge-conversie creatives voor betaalde campagnes"
                    : "Create high-converting creatives for paid campaigns"}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {[
                    lang === "nl" ? "Meerdere varianten per template" : "Multi-variant A/B testing",
                    lang === "nl" ? "Hook-gedreven copy" : "Hook-driven copy",
                    lang === "nl" ? "Alleen afbeeldingen" : "Images only — no captions",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-[#C7F56F] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] group-hover:bg-[#b8e85e] transition-colors">
                  {lang === "nl" ? "Ads genereren" : "Generate Ads"}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

          {/* Content card */}
          <Link href="/generation/content" className="group">
            <div className="flex h-full flex-col rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] p-7 transition-all hover:border-[#C7F56F] hover:shadow-md cursor-pointer">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C7F56F]/10">
                <svg className="h-6 w-6 text-[#1a1a1a] dark:text-[#C7F56F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Content</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {lang === "nl"
                    ? "Maak kant-en-klare organische content met captions"
                    : "Create ready-to-post organic content with captions"}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {[
                    lang === "nl" ? "Afbeelding + caption inbegrepen" : "Image + caption included",
                    lang === "nl" ? "Platform-specifieke toon" : "Platform-specific tone",
                    lang === "nl" ? "Storytelling-gedreven" : "Storytelling-driven",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-[#C7F56F] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] group-hover:bg-[#b8e85e] transition-colors">
                  {lang === "nl" ? "Content genereren" : "Generate Content"}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
          {/* Video card */}
          <Link href="/generation/video" className="group">
            <div className="flex h-full flex-col rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] p-7 transition-all hover:border-[#C7F56F] hover:shadow-md cursor-pointer">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C7F56F]/10">
                <svg className="h-6 w-6 text-[#1a1a1a] dark:text-[#C7F56F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.879V15.12a1 1 0 01-1.447.91L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Video</h2>
                  <span className="rounded-full bg-[#C7F56F]/20 px-2 py-0.5 text-[10px] font-semibold text-[#1a1a1a] dark:text-[#C7F56F]">NEW</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {lang === "nl"
                    ? "15-sec UGC en lifestyle videos voor TikTok en Reels"
                    : "15-sec UGC and lifestyle videos for TikTok and Reels"}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {[
                    lang === "nl" ? "Seedance 2 videogeneratie" : "Seedance 2 video generation",
                    lang === "nl" ? "Multi-scene in 1 clip" : "Multi-scene in one clip",
                    lang === "nl" ? "UGC · Lifestyle · Product Hero" : "UGC · Lifestyle · Product Hero",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-[#C7F56F] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] group-hover:bg-[#b8e85e] transition-colors">
                  {lang === "nl" ? "Video genereren" : "Generate Video"}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
