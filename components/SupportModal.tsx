"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const EMAIL = "hallo@sequenceflow.io";

export default function SupportModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{t("support.title")}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("support.subtitle")}</p>
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          <a
            href="/docs"
            className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#C7F56F]/20">
              <svg className="h-5 w-5 text-[#1a1a1a] dark:text-[#C7F56F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("support.helpCenter")}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t("support.helpCenterDesc")}</p>
            </div>
            <svg className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#C7F56F]/20">
              <svg className="h-5 w-5 text-[#1a1a1a] dark:text-[#C7F56F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{EMAIL}</p>
            <button
              onClick={copyEmail}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? t("support.copied") : t("support.copy")}
            </button>
          </div>
        </div>

        {/* Send email button */}
        <div className="px-4 pb-4">
          <a
            href={`mailto:${EMAIL}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C7F56F] py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            {t("support.sendEmail")}
          </a>
        </div>
      </div>
    </div>
  );
}
