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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0d0d0d] p-6">
      <div className="flex w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-gray-900" style={{ minHeight: 580 }}>

        {/* Left — image panel */}
        <div className="relative w-[44%] flex-shrink-0">
          <Image
            src="/login image no text.jpg"
            alt="Ad example"
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
          {/* Headline */}
          <div className="absolute top-7 left-7 right-7">
            <p className="text-white text-5xl font-bold leading-[1.05]">
              Stop settling<br />for generic ads
            </p>
            <p className="mt-2 text-white/75 text-2xl italic leading-[1.1]">
              Generate ads that<br />actually convert
            </p>
          </div>
        </div>

        {/* Right — form */}
        <div className="relative flex-1 flex flex-col justify-center px-10 py-10 pt-28">
          {/* Logo — top-right corner */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="SequenceFlow" className="absolute top-6 right-8 h-20 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="SequenceFlow" className="absolute top-6 right-8 h-20 w-auto hidden dark:block" />

          {/* Heading block */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Create Your Account
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Join SequenceFlow and start generating ads that actually convert.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Your email</label>
            <input
              type="email"
              disabled
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Create Password</label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-5">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Confirm Password</label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Coming Soon button */}
          <button
            disabled
            className="w-full rounded-xl bg-gray-900 dark:bg-gray-700 px-4 py-3 text-sm font-semibold text-white/50 cursor-not-allowed mb-4"
          >
            Coming Soon
          </button>

          {/* Or divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Google button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm"
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
      </div>
    </div>
  );
}
