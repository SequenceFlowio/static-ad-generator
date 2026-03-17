"use client";

import { useState } from "react";
import Image from "next/image";
import { getBrowserSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — login */}
      <div className="flex flex-col justify-center w-full max-w-md px-10 py-12 bg-white dark:bg-gray-900">
        {/* Logo */}
        <div className="mb-12">
          <img src="/logo-black.png" alt="SequenceFlow" className="h-10 w-auto dark:hidden" />
          <img src="/logo-white.png" alt="SequenceFlow" className="h-10 w-auto hidden dark:block" />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Log in to your account.
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in with Google to access the ad generator.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Google button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>

      {/* Right — showcase image */}
      <div className="hidden lg:flex flex-1 relative bg-gray-100 dark:bg-gray-800">
        <Image
          src="/Stop settling for generic ads, generate ads that actually convert.jpg"
          alt="Ad example"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        {/* Subtle gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          <p className="text-white text-lg font-semibold leading-snug drop-shadow">Generate ads that actually convert.</p>
          <p className="text-white/70 text-sm mt-1 drop-shadow">Powered by SequenceFlow</p>
        </div>
      </div>
    </div>
  );
}
