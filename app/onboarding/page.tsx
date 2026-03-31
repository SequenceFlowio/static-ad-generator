"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";
import { translations, type Lang } from "@/lib/translations";

// Standalone page — outside the (app) layout, so we read lang from localStorage directly
function useLang(): Lang {
  const [lang, setLangState] = useState<Lang>("nl");
  useEffect(() => {
    const saved = localStorage.getItem("language") as Lang | null;
    if (saved === "en" || saved === "nl") setLangState(saved);
  }, []);
  return lang;
}

function tr(key: string, lang: Lang): string {
  return translations[key]?.[lang] ?? translations[key]?.["en"] ?? key;
}

const STEPS = [
  {
    id: "role",
    questionKey: "onboarding.step1",
    layout: "horizontal" as const, // always horizontal (pill buttons in a row)
    options: {
      en: ["Agency", "Brand", "Freelancer", "Other"],
      nl: ["Bureau", "Merk", "Freelancer", "Anders"],
    },
  },
  {
    id: "source",
    questionKey: "onboarding.step2",
    layout: "wrap" as const, // wrapping grid of pills
    options: {
      en: ["X / Twitter", "LinkedIn", "Reddit", "Instagram", "TikTok", "Google Search", "YouTube", "Newsletter", "Podcast", "Word of mouth", "From a friend / colleague", "From a client", "Ad I saw", "Other"],
      nl: ["X / Twitter", "LinkedIn", "Reddit", "Instagram", "TikTok", "Google Zoekopdracht", "YouTube", "Nieuwsbrief", "Podcast", "Mond-tot-mondreclame", "Van een vriend / collega", "Van een klant", "Een advertentie", "Anders"],
    },
  },
  {
    id: "goal",
    questionKey: "onboarding.step3",
    layout: "vertical" as const, // stacked full-width options
    options: {
      en: ["Create high-converting ads", "Generate social content at scale", "Scale ad production for clients", "Launch campaigns faster", "Something else"],
      nl: ["Hoog-converterende advertenties maken", "Social content op schaal genereren", "Advertentieproductie schalen voor klanten", "Campagnes sneller lanceren", "Iets anders"],
    },
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const lang = useLang();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const options = current.options[lang] ?? current.options.en;
  const selected = answers[current.id];
  const isLast = step === STEPS.length - 1;
  const t = (key: string) => tr(key, lang);

  function select(option: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: option }));
  }

  async function complete() {
    setSaving(true);
    const supabase = getBrowserSupabase();
    await supabase.auth.updateUser({
      data: { onboarding_complete: true, onboarding_answers: answers },
    });
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
            i < step ? "w-8 bg-[#C7F56F]" : i === step ? "w-10 bg-[#C7F56F]" : "w-8 bg-gray-200"
          }`} />
        ))}
      </div>

      {/* Question */}
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-8 max-w-lg">
        {t(current.questionKey)} <span className="text-gray-300">*</span>
      </h1>

      {/* Options */}
      {current.layout === "horizontal" && (
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {options.map((option) => (
            <button key={option} onClick={() => select(option)}
              className={`rounded-2xl border px-6 py-3 text-sm font-medium transition-all ${
                selected === option
                  ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 font-semibold"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}>
              {option}
            </button>
          ))}
        </div>
      )}

      {current.layout === "wrap" && (
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mb-10">
          {options.map((option) => (
            <button key={option} onClick={() => select(option)}
              className={`rounded-2xl border px-5 py-2.5 text-sm font-medium transition-all ${
                selected === option
                  ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 font-semibold"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}>
              {option}
            </button>
          ))}
        </div>
      )}

      {current.layout === "vertical" && (
        <div className="flex flex-col gap-2.5 w-full max-w-sm mb-10">
          {options.map((option) => (
            <button key={option} onClick={() => select(option)}
              className={`rounded-2xl border px-5 py-3.5 text-sm font-medium text-left transition-all ${
                selected === option
                  ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 font-semibold"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}>
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-4">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t("onboarding.back")}
          </button>
        )}
        <button
          onClick={() => { if (isLast) { complete(); } else { setStep((s) => s + 1); } }}
          disabled={!selected || saving}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
            selected && !saving ? "bg-[#C7F56F] text-[#1a1a1a] hover:bg-[#b8e85e]" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? t("onboarding.saving") : isLast ? t("onboarding.getStarted") : t("onboarding.continue")}
          {!saving && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      <button onClick={complete} className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        {t("onboarding.skip")}
      </button>
    </div>
  );
}
