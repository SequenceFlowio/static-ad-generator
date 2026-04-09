"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function TutorialModal({ onClose }: { onClose: () => void }) {
  const { lang } = useLanguage();
  const nl = lang === "nl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Tutorial</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{nl ? "Leer hoe SequenceFlow werkt" : "Learn how SequenceFlow works"}</p>
            </div>
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video placeholder */}
        <div className="p-5">
          <div className="aspect-video rounded-xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-md">
              <svg className="h-6 w-6 text-gray-400 dark:text-gray-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">{nl ? "Video binnenkort beschikbaar" : "Video coming soon"}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-[#C7F56F] px-6 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
          >
            {nl ? "Sluiten" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
