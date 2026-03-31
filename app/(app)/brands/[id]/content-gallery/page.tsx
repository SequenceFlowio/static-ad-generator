"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

const TEMPLATE_ICONS: Record<string, string> = {
  "tips-tricks": "💡",
  "about-brand": "🏷️",
  "about-product": "📦",
  "using-product": "🤳",
  "testimonial": "⭐",
  "lifestyle": "🌿",
  "before-after": "↔️",
  "behind-scenes": "🎬",
  "seasonal-trend": "📅",
};

export default function ContentGalleryPage() {
  const params = useParams();
  const id = params.id as string;

  const [brandName, setBrandName] = useState("");
  const [sessions, setSessions] = useState<ContentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ContentSession | null>(null);

  useEffect(() => {
    async function load() {
      const [brandRes, sessionsRes] = await Promise.all([
        fetch(`/api/brands/${id}`),
        fetch(`/api/brands/${id}/content`),
      ]);

      if (brandRes.ok) {
        const d = await brandRes.json();
        setBrandName(d.brand?.name ?? "Brand");
      }

      if (sessionsRes.ok) {
        const all: ContentSession[] = await sessionsRes.json();
        setSessions(all.filter((s) => s.status === "done" && s.image_url));
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function handleDelete(sessionId: string) {
    await fetch(`/api/brands/${id}/content/${sessionId}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (detail?.id === sessionId) setDetail(null);
  }

  return (
    <div className="flex gap-6">
      {/* Main gallery */}
      <div className={`min-w-0 flex-1 transition-all ${detail ? "max-w-[calc(100%-360px)]" : ""}`}>
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Brands</Link>
          <span>/</span>
          <Link href={`/brands/${id}`} className="hover:text-gray-700 dark:hover:text-gray-200">{brandName}</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-200 font-medium">Content Gallery</span>
        </div>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{brandName} — Content Gallery</h1>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">All generated social content, newest first. Click an item for details.</p>
          </div>
          <Link
            href={`/brands/${id}`}
            className="flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            ← Back to Brand
          </Link>
        </div>

        {loading && <p className="text-sm text-gray-400 dark:text-gray-500">Loading gallery…</p>}

        {!loading && sessions.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No generated content yet.</p>
            <Link
              href={`/brands/${id}`}
              className="mt-4 inline-block rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a]"
            >
              Generate content
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {sessions.map((s) => {
            const isActive = detail?.id === s.id;
            const icon = TEMPLATE_ICONS[s.template_name] ?? "📄";
            return (
              <div
                key={s.id}
                onClick={() => setDetail(isActive ? null : s)}
                className={`group cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${
                  isActive
                    ? "border-[#C7F56F]"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {s.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.image_url}
                      alt={s.template_name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">{icon}</div>
                  )}
                </div>
                {/* Meta */}
                <div className="bg-white dark:bg-gray-900 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{icon}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 capitalize">
                      {s.template_name.replace(/-/g, " ")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 capitalize">
                      {s.platform}
                    </span>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {detail && (
        <aside className="w-[340px] flex-shrink-0">
          <div className="sticky top-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            {/* Image */}
            <div className="relative bg-gray-50 dark:bg-gray-800">
              {detail.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.image_url}
                  alt="Generated content"
                  className="w-full object-contain max-h-72"
                />
              ) : (
                <div className="flex h-40 items-center justify-center text-4xl">
                  {TEMPLATE_ICONS[detail.template_name] ?? "📄"}
                </div>
              )}
              <button
                onClick={() => setDetail(null)}
                className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Meta badges */}
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">
                  {detail.template_name.replace(/-/g, " ")}
                </span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">
                  {detail.platform}
                </span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(detail.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Caption */}
              {detail.caption && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Caption</p>
                  <div className="max-h-52 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-mono leading-relaxed text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {detail.caption}
                  </div>
                </div>
              )}

              {/* Image prompt */}
              {detail.image_prompt && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Image Prompt</p>
                  <p className="max-h-24 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-mono leading-relaxed text-gray-500 dark:text-gray-400">
                    {detail.image_prompt}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {detail.image_url && (
                  <a
                    href={detail.image_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-[#C7F56F] px-3 py-2 text-center text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]"
                  >
                    Download image
                  </a>
                )}
                <button
                  onClick={() => handleDelete(detail.id)}
                  className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
