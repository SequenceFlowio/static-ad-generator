"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dark ? "/logo-white.png" : "/logo-black.png"}
            alt="SequenceFlow"
            className="h-24 w-auto"
          />
        </Link>

        <button
          onClick={toggleTheme}
          className="relative flex h-8 w-16 items-center rounded-full bg-gray-100 dark:bg-gray-800 p-1 transition-colors"
          aria-label="Thema wisselen"
        >
          <span
            className={`absolute h-6 w-6 rounded-full bg-[#1a1a1a] dark:bg-white shadow transition-all duration-300 ${dark ? "left-9" : "left-1"}`}
          />
          <svg
            className={`relative z-10 h-4 w-4 ml-0.5 transition-colors ${!dark ? "text-white" : "text-gray-400"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <svg
            className={`relative z-10 h-4 w-4 ml-auto mr-0.5 transition-colors ${dark ? "text-[#1a1a1a]" : "text-gray-400"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
