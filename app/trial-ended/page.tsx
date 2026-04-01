"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import PricingModal from "@/components/PricingModal";

export default function TrialEndedPage() {
  const router = useRouter();
  const [showPricing, setShowPricing] = useState(false);

  async function handleSignOut() {
    await getBrowserSupabase().auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] flex items-center justify-center p-6">
      {/* No nav, no sidebar — fully locked */}
      <div className="w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="SequenceFlow" className="h-10 w-auto" />
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your free trial has ended</h1>
          <p className="mt-2 text-gray-500 text-sm leading-relaxed">
            Your 7-day trial is over. Upgrade to keep creating ads and content — your brand data is saved and ready to go.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowPricing(true)}
            className="w-full rounded-xl bg-[#C7F56F] py-3 text-sm font-bold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
          >
            View plans & upgrade →
          </button>
          <button
            onClick={handleSignOut}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {showPricing && (
        <PricingModal onClose={() => setShowPricing(false)} />
      )}
    </div>
  );
}
