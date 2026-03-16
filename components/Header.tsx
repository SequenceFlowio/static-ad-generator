"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "h-9 w-9 rounded-full transition-all duration-300 active:scale-95 p-1.5",
        isDark ? "bg-black text-white" : "bg-white text-black shadow-sm border border-gray-200"
      )}
      aria-label="Thema wisselen"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        strokeLinecap="round"
        viewBox="0 0 32 32"
        style={{ overflow: "hidden" }}
      >
        <clipPath id="theme-clip">
          <path
            d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
            style={{
              transform: isDark ? "translate(-12px, 10px)" : "translate(0, 0)",
              transition: "transform 0.35s ease-in-out",
            }}
          />
        </clipPath>
        <g clipPath="url(#theme-clip)">
          <circle
            cx="16"
            cy="16"
            style={{
              r: isDark ? "10" : "8",
              transition: "r 0.35s ease-in-out",
            } as React.CSSProperties}
          />
          <g
            stroke="currentColor"
            strokeWidth="1.5"
            style={{
              transform: isDark ? "rotate(-100deg) scale(0.5)" : "rotate(0deg) scale(1)",
              opacity: isDark ? 0 : 1,
              transformOrigin: "16px 16px",
              transition: "transform 0.35s ease-in-out, opacity 0.35s ease-in-out",
            }}
          >
            <path d="M16 5.5v-4" />
            <path d="M16 30.5v-4" />
            <path d="M1.5 16h4" />
            <path d="M26.5 16h4" />
            <path d="m23.4 8.6 2.8-2.8" />
            <path d="m5.7 26.3 2.9-2.9" />
            <path d="m5.8 5.8 2.8 2.8" />
            <path d="m23.4 23.4 2.9 2.9" />
          </g>
        </g>
      </svg>
    </button>
  );
}

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
          <Image
            src={dark ? "/Logo wit.png" : "/Logo zwart.png"}
            alt="SequenceFlow"
            width={480}
            height={108}
            className="h-24 w-auto"
            priority
          />
        </Link>
        <ThemeToggle isDark={dark} onToggle={toggleTheme} />
      </div>
    </header>
  );
}
