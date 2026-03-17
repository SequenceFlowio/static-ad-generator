"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    // getSession() automatically detects and exchanges both:
    // - PKCE flow: code param in URL
    // - Implicit flow: access_token in URL hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/");
      } else {
        router.replace("/login?error=auth_failed");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f7] dark:bg-[#0d0d0d]">
      <p className="text-sm text-gray-400">Signing in…</p>
    </div>
  );
}
