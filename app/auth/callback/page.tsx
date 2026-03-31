"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";

const WHITELISTED_EMAILS = ["sequenceflownl@gmail.com"];

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabase();

    async function handleSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const user = session.user;
      const email = user.email ?? "";
      const onboardingDone = user.user_metadata?.onboarding_complete === true;
      const isWhitelisted = WHITELISTED_EMAILS.includes(email);

      if (!onboardingDone && !isWhitelisted) {
        router.replace("/onboarding");
      } else {
        router.replace("/");
      }
    }

    // onAuthStateChange fires when the OAuth hash is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handleSession();
      }
    });

    // Also check immediately
    handleSession();

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f7] dark:bg-[#0d0d0d]">
      <p className="text-sm text-gray-400">Signing in…</p>
    </div>
  );
}
