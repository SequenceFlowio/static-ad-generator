"use client";

export default function MobileBlock() {
  return (
    <div className="lg:hidden fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#0d0d0d] px-8 text-center">
      <div className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-black.png" alt="SequenceFlow" className="h-8 w-auto mx-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt="SequenceFlow" className="h-8 w-auto mx-auto hidden dark:block" />
      </div>

      <div className="text-5xl mb-6">💻</div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Whoa, put the phone down.
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
        This tool is built for proper screens. Grab your laptop, make a coffee,
        and let's build some ads that actually convert.
      </p>

      <p className="mt-8 text-xs text-gray-300 dark:text-gray-600">
        ads.sequenceflow.io — desktop only
      </p>
    </div>
  );
}
