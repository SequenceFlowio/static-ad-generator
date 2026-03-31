"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";
import PricingModal from "@/components/PricingModal";
import { useLanguage } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/translations";

const NAV_ITEMS = [
  {
    labelKey: "nav.home",
    href: "/",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    labelKey: "nav.stores",
    href: "/stores",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    labelKey: "nav.adGen",
    href: "/ad-gen",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
  {
    labelKey: "nav.contentGen",
    href: "/content-gen",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const BOTTOM_LINK_KEYS = [
  { labelKey: "nav.tutorial", href: "#" },
  { labelKey: "nav.feedback", href: "#" },
  { labelKey: "nav.support", href: "#" },
];

function SettingsModal({ onClose, onUpgrade, lang, setLang, t }: {
  onClose: () => void;
  onUpgrade: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}) {
  const [tab, setTab] = useState<"profile" | "billing">("profile");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    getBrowserSupabase().auth.getUser().then(({ data: { user } }) => {
      setUserName(user?.user_metadata?.full_name ?? "");
      setUserEmail(user?.email ?? "");
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C7F56F]/20">
              <svg className="h-5 w-5 text-[#1a1a1a] dark:text-[#C7F56F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{t("settings.title")}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t("settings.subtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* Tabs */}
          <nav className="w-44 border-r border-gray-100 dark:border-gray-800 p-3 space-y-0.5">
            {(["profile", "billing"] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  tab === tabKey
                    ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                {tabKey === "profile" ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                )}
                {tabKey === "profile" ? t("settings.profile") : t("settings.billing")}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 p-6">
            {tab === "profile" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("settings.profile")}</h3>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("settings.fullName")}</label>
                  <input value={userName} readOnly className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("settings.email")}</label>
                  <input value={userEmail} readOnly className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t("settings.oauthNote")}</p>

                {/* Language switcher */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                  <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("settings.language")}</label>
                  <div className="flex gap-2">
                    {(["nl", "en"] as Lang[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          lang === l
                            ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white"
                            : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <span>{l === "nl" ? "🇳🇱" : "🇬🇧"}</span>
                        {l === "nl" ? "Nederlands" : "English"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab === "billing" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("settings.billing")}</h3>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Free</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t("settings.currentPlan")}</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">€0<span className="text-sm font-normal text-gray-400 dark:text-gray-500">/mo</span></p>
                  </div>
                  <button onClick={() => { onClose(); onUpgrade(); }} className="w-full rounded-lg bg-[#C7F56F] py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
                    {t("settings.upgradePlan")}
                  </button>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("settings.creditsTitle")}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t("settings.creditsSoon")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 px-6 py-3">
          <button onClick={onClose} className="rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
            {t("settings.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const TRIAL_DAYS = 7;
  const WHITELISTED_EMAILS = ["sequenceflownl@gmail.com"];

  const [dark, setDark] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [userPopover, setUserPopover] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    getBrowserSupabase().auth.getUser().then(({ data: { user } }) => {
      const email = user?.email ?? null;
      setUserName(user?.user_metadata?.full_name ?? email ?? null);
      setUserEmail(email);
      // Trial countdown — skip for whitelisted accounts
      if (user?.created_at && email && !WHITELISTED_EMAILS.includes(email)) {
        const daysElapsed = Math.floor(
          (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        setTrialDaysLeft(Math.max(0, TRIAL_DAYS - daysElapsed));
      }
    });
  }, []);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setUserPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleTheme(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function handleSignOut() {
    await getBrowserSupabase().auth.signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/stores") {
      if (pathname.startsWith("/stores")) return true;
      if (pathname.startsWith("/brands/")) {
        return !pathname.match(/\/brands\/[^/]+\/ads/) && !pathname.match(/\/brands\/[^/]+\/content($|\/)/);
      }
      return false;
    }
    if (href === "/ad-gen") return pathname.startsWith("/ad-gen") || !!pathname.match(/\/brands\/[^/]+\/ads/);
    if (href === "/content-gen") return pathname.startsWith("/content-gen") || !!pathname.match(/\/brands\/[^/]+\/content($|\/)/);
    return pathname.startsWith(href);
  }

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[240px] flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111]">
        {/* Logo */}
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dark ? "/logo-white.png" : "/logo-black.png"}
              alt="SequenceFlow"
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-[#C7F56F] text-[#1a1a1a] font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className={isActive(item.href) ? "text-[#1a1a1a]" : ""}>{item.icon}</span>
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Upgrade CTA */}
        <div className="px-3 pb-3 space-y-2">
          <div className="rounded-xl bg-[#C7F56F]/10 border border-[#C7F56F]/30 p-3.5">
            <div className="mb-2">
              <p className="text-xs font-bold text-gray-900 dark:text-white">{t("upgrade.title")}</p>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2.5 leading-relaxed">{t("upgrade.desc")}</p>
            <button onClick={() => setShowPricing(true)} className="w-full rounded-lg bg-[#C7F56F] py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors">
              {t("upgrade.cta")}
            </button>
          </div>

          {/* Trial countdown */}
          {trialDaysLeft !== null && (
            <div className={`rounded-xl border p-3 ${
              trialDaysLeft === 0
                ? "border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20"
                : trialDaysLeft <= 2
                ? "border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${
                  trialDaysLeft === 0 ? "text-red-500 dark:text-red-400"
                  : trialDaysLeft <= 2 ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-400 dark:text-gray-500"
                }`}>
                  {t("trial.title")}
                </p>
                <p className={`text-[10px] font-bold ${
                  trialDaysLeft === 0 ? "text-red-500 dark:text-red-400"
                  : trialDaysLeft <= 2 ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-600 dark:text-gray-300"
                }`}>
                  {trialDaysLeft === 0 ? t("trial.expired") : `${trialDaysLeft} ${trialDaysLeft === 1 ? t("trial.dayLeft") : t("trial.daysLeft")}`}
                </p>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    trialDaysLeft === 0 ? "bg-red-400"
                    : trialDaysLeft <= 2 ? "bg-amber-400"
                    : "bg-[#C7F56F]"
                  }`}
                  style={{ width: `${Math.round((trialDaysLeft / TRIAL_DAYS) * 100)}%` }}
                />
              </div>
              {trialDaysLeft === 0 && (
                <button onClick={() => setShowPricing(true)}
                  className="mt-2 w-full rounded-lg bg-red-500 py-1.5 text-[10px] font-semibold text-white hover:bg-red-600 transition-colors">
                  {t("trial.upgradeCta")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-3 space-y-0.5">
          {BOTTOM_LINK_KEYS.map((link) => (
            <a
              key={link.labelKey}
              href={link.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {t(link.labelKey)}
            </a>
          ))}

          {/* User row */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setUserPopover((o) => !o)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#C7F56F] text-xs font-bold text-[#1a1a1a]">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{userName ?? "User"}</p>
                {userEmail && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{userEmail}</p>}
              </div>
              <svg className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Popover */}
            {userPopover && (
              <div className="absolute bottom-full left-0 mb-1 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1.5 z-50">
                {/* Theme toggle */}
                <div className="flex items-center gap-1 px-2 pb-1.5 mb-1 border-b border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => toggleTheme(false)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      !dark ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    {t("theme.light")}
                  </button>
                  <button
                    onClick={() => toggleTheme(true)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      dark ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                    {t("theme.dark")}
                  </button>
                </div>
                <button
                  onClick={() => { setUserPopover(false); setShowSettings(true); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("auth.signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onUpgrade={() => setShowPricing(true)} lang={lang} setLang={setLang} t={t} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </>
  );
}
