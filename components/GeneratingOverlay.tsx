"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Reading the brand DNA...",
  "Checking your vibe...",
  "Starting the engines...",
  "Talking to the AI...",
  "Pixel by pixel...",
  "Making it look good...",
  "Almost there...",
  "Adding the finishing touches...",
  "Because details matter...",
  "Wrapping up...",
];

interface Props {
  visible: boolean;
  progress: number; // 0–100
  message?: string; // override auto-cycling message
}

export default function GeneratingOverlay({ visible, progress, message }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setMsgIndex(0);
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-white dark:bg-gray-900 px-10 py-10 shadow-2xl">
        {/* Circular progress ring */}
        <div className="relative flex items-center justify-center">
          <svg width="100" height="100" className="-rotate-90">
            {/* Track */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-100 dark:text-gray-700"
            />
            {/* Progress */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#C7F56F"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <span className="absolute text-lg font-bold text-gray-900 dark:text-white">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Status message */}
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center max-w-[200px]">
          {message ?? MESSAGES[msgIndex]}
        </p>
      </div>
    </div>
  );
}
