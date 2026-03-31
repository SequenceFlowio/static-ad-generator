"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";

const STEPS = [
  {
    id: "role",
    question: "What best describes your work?",
    type: "single" as const,
    options: ["Agency", "Brand", "Freelancer", "Other"],
  },
  {
    id: "source",
    question: "Where did you hear about us?",
    type: "single" as const,
    options: [
      "X / Twitter", "LinkedIn", "Reddit", "Instagram", "TikTok",
      "Google Search", "YouTube", "Newsletter", "Podcast",
      "Word of mouth", "From a friend / colleague", "From a client", "Ad I saw", "Other",
    ],
  },
  {
    id: "goal",
    question: "What do you want to achieve?",
    type: "single" as const,
    options: [
      "Create high-converting ads",
      "Generate social content at scale",
      "Scale ad production for clients",
      "Launch campaigns faster",
      "Something else",
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const selected = answers[current.id];
  const isLast = step === STEPS.length - 1;

  function select(option: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: option }));
  }

  async function complete() {
    setSaving(true);
    const supabase = getBrowserSupabase();
    await supabase.auth.updateUser({
      data: {
        onboarding_complete: true,
        onboarding_answers: answers,
      },
    });
    router.replace("/");
  }

  async function handleContinue() {
    if (isLast) {
      await complete();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function handleSkip() {
    await complete();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < step
                ? "w-8 bg-[#C7F56F]"
                : i === step
                ? "w-10 bg-[#C7F56F]"
                : "w-8 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-8 max-w-md">
        {current.question} <span className="text-gray-300">*</span>
      </h1>

      {/* Options */}
      <div className={`flex flex-wrap justify-center gap-3 max-w-xl mb-10 ${
        current.options.length > 6 ? "" : "flex-col items-stretch max-w-sm"
      }`}>
        {current.options.map((option) => (
          <button
            key={option}
            onClick={() => select(option)}
            className={`rounded-2xl border px-5 py-3 text-sm font-medium transition-all text-left ${
              selected === option
                ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 font-semibold"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        <button
          onClick={handleContinue}
          disabled={!selected || saving}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
            selected && !saving
              ? "bg-[#C7F56F] text-[#1a1a1a] hover:bg-[#b8e85e]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving…" : isLast ? "Get Started" : "Continue"}
          {!saving && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      <button
        onClick={handleSkip}
        className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
