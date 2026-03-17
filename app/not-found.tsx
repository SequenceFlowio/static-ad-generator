import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0d0d0d] px-8 text-center">
      <div className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-black.png" alt="SequenceFlow" className="h-8 w-auto mx-auto" />
      </div>

      <p className="text-8xl font-black text-[#C7F56F] mb-4">404</p>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        This page doesn&apos;t convert.
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mb-8">
        Whoever designed this user journey really dropped the ball. Let&apos;s
        get you back somewhere useful.
      </p>

      <Link
        href="/"
        className="rounded-lg bg-[#C7F56F] px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
