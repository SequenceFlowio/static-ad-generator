"use client";

import { useEffect, useState } from "react";
import type { BrandDnaData, Product } from "@/types";
import ContentCard from "./ContentCard";
import ContentGenerator from "./ContentGenerator";

interface ContentSession {
  id: string;
  template_name: string;
  platform: string;
  caption: string | null;
  image_url: string | null;
  image_prompt: string | null;
  status: string;
  created_at: string;
}


interface Props {
  brandId: string;
  brandDna: BrandDnaData | null;
  products: Product[];
}

export default function ContentGrid({ brandId, brandDna, products }: Props) {
  const [sessions, setSessions] = useState<ContentSession[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [activeSession, setActiveSession] = useState<ContentSession | null>(null);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/content`)
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []));
  }, [brandId]);

  async function handleDelete(id: string) {
    await fetch(`/api/brands/${brandId}/content/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function handleCreated(session: ContentSession) {
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === session.id);
      if (existing) return prev.map((s) => (s.id === session.id ? session : s));
      return [session, ...prev];
    });
  }

  const disabled = !brandDna;

  return (
    <div>
      {/* Show generator panel */}
      {(showGenerator || activeSession) && brandDna && (
        <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <ContentGenerator
            brandId={brandId}
            brandDna={brandDna}
            products={products}
            onCreated={(s) => { handleCreated(s); setActiveSession(null); }}
            onClose={() => { setShowGenerator(false); setActiveSession(null); }}
          />
        </div>
      )}

      {/* Grid */}
      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
        {sessions.map((s) => (
          <ContentCard
            key={s.id}
            session={s}
            onDelete={handleDelete}
            onClick={(session) => { setActiveSession(session); setShowGenerator(false); }}
          />
        ))}

        <button
          onClick={() => { setShowGenerator(true); setActiveSession(null); }}
          disabled={disabled}
          className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-5 hover:border-[#C7F56F] transition-all flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 min-h-[140px] disabled:pointer-events-none"
        >
          <span className="text-2xl font-light">+</span>
          <span className="text-sm font-medium">New Content</span>
        </button>
      </div>

      {disabled && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Complete Brand DNA first to enable content generation.</p>
      )}
    </div>
  );
}
