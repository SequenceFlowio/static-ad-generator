"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { lang } = useLanguage();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const nl = lang === "nl";

  function handleSend() {
    if (!message.trim()) return;
    const subject = encodeURIComponent(nl ? "Feedback of verzoek" : "Feedback or request");
    const body = encodeURIComponent(message);
    window.open(`mailto:hallo@sequenceflow.io?subject=${subject}&body=${body}`);
    setSent(true);
    setTimeout(onClose, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{nl ? "Feedback of verzoek" : "Feedback or request"}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{nl ? "Deel je idee of meld een probleem. We lezen alles." : "Share your idea or report an issue. We read everything."}</p>
            </div>
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {sent ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center py-4">{nl ? "Bedankt! We nemen het door." : "Thanks! We'll read it."}</p>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={nl ? "Beschrijf je feedback of verzoek..." : "Describe your feedback or request..."}
                rows={5}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#C7F56F] resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="rounded-full bg-[#C7F56F] px-6 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {nl ? "Versturen" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
