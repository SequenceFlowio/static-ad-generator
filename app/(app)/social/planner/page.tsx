"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import type { Brand } from "@/types";

interface SocialPost {
  id: string;
  brand_id: string;
  platforms: string[];
  media_type: string;
  image_urls: string[];
  video_url: string | null;
  caption: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  fb_post_id: string | null;
  ig_post_id: string | null;
  source: string;
  error_message: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  publishing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  published: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  facebook: "👍",
};

function BrandPicker({ onSelect }: { onSelect: (b: Brand) => void }) {
  const { lang } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/brands").then(r => r.json()).then(d => { setBrands(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>;
  if (brands.length === 0) return <div className="text-center py-10"><Link href="/stores" className="rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a]">{lang === "nl" ? "Store aanmaken" : "Create a store"}</Link></div>;
  return (
    <div>
      <p className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{lang === "nl" ? "Kies een store" : "Choose a store"}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {brands.map(b => (
          <button key={b.id} onClick={() => onSelect(b)} className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 text-left hover:border-[#C7F56F]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{b.name}</p>
            {b.url && <p className="text-[11px] text-gray-400 truncate mt-0.5">{b.url}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── New Post Modal ───────────────────────────────────────────────────────────

function NewPostModal({
  brandId,
  initialImageUrl,
  onClose,
  onCreated,
}: {
  brandId: string;
  initialImageUrl?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { lang } = useLanguage();
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:5" | "9:16" | "16:9">("1:1");

  function togglePlatform(p: string) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      // Step 1: get a signed upload URL from our API (no file data sent)
      const res = await fetch(`/api/brands/${brandId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type }),
      });
      const { signed_url, public_url } = await res.json() as { signed_url: string; public_url: string };

      // Step 2: upload file directly to Supabase Storage (browser → Supabase, no Vercel hop)
      const uploadRes = await fetch(signed_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      setImageUrl(public_url);
    } catch {
      // silently fail — user can retry
    }
    setUploading(false);
  }

  async function handleSave(publishNow: boolean) {
    if (!imageUrl) return;
    if (publishNow) setPublishing(true); else setSaving(true);
    const res = await fetch(`/api/brands/${brandId}/social/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platforms,
        media_type: "image",
        image_urls: [imageUrl],
        caption,
        scheduled_at: scheduledAt || null,
        source: "manual",
        aspect_ratio: aspectRatio,
      }),
    });
    const post = await res.json();
    if (publishNow && post.id) {
      await fetch(`/api/brands/${brandId}/social/posts/${post.id}/publish`, { method: "POST" });
    }
    setPublishing(false);
    setSaving(false);
    onCreated();
  }

  const RATIOS: { key: "1:1" | "4:5" | "9:16" | "16:9"; label: string; tw: string }[] = [
    { key: "1:1",  label: "1:1",  tw: "aspect-square" },
    { key: "4:5",  label: "4:5",  tw: "aspect-[4/5]" },
    { key: "9:16", label: "9:16", tw: "aspect-[9/16]" },
    { key: "16:9", label: "16:9", tw: "aspect-video" },
  ];
  const currentRatio = RATIOS.find(r => r.key === aspectRatio)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header — fixed */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {lang === "nl" ? "Nieuwe post" : "New post"}
          </h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Image + aspect ratio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {lang === "nl" ? "Afbeelding" : "Image"}
              </p>
              {imageUrl && (
                <div className="flex gap-1">
                  {RATIOS.map(r => (
                    <button key={r.key} onClick={() => setAspectRatio(r.key)}
                      className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        aspectRatio === r.key
                          ? "bg-[#C7F56F] text-[#1a1a1a]"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {imageUrl ? (
              <div className={`relative rounded-xl overflow-hidden w-full max-w-[280px] mx-auto ${currentRatio.tw}`}>
                <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
                <button onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-[#C7F56F] transition-colors">
                <input type="file" accept="image/*,video/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                {uploading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C7F56F] border-t-transparent" />
                ) : (
                  <>
                    <svg className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-xs text-gray-400">{lang === "nl" ? "Upload of sleep een afbeelding" : "Upload or drag an image"}</p>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Caption */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Caption</p>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3}
              placeholder={lang === "nl" ? "Schrijf een caption…" : "Write a caption…"}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50 resize-none" />
          </div>

          {/* Platforms */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Platform</p>
            <div className="flex gap-2">
              {["instagram", "facebook"].map(p => (
                <button key={p} onClick={() => togglePlatform(p)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    platforms.includes(p) ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                  {PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {lang === "nl" ? "Inplannen (optioneel)" : "Schedule (optional)"}
            </p>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50" />
          </div>
        </div>

        {/* Footer — fixed */}
        <div className="flex gap-2 border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex-shrink-0">
          <button onClick={() => handleSave(false)} disabled={!imageUrl || saving || publishing}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
            {saving ? "…" : scheduledAt ? (lang === "nl" ? "Inplannen →" : "Schedule →") : (lang === "nl" ? "Concept" : "Draft")}
          </button>
          <button onClick={() => handleSave(true)} disabled={!imageUrl || saving || publishing}
            className="flex-1 rounded-lg bg-[#C7F56F] py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40">
            {publishing ? (lang === "nl" ? "Publiceren…" : "Publishing…") : (lang === "nl" ? "Nu publiceren →" : "Publish now →")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Planner inner ────────────────────────────────────────────────────────────

function PlannerInner() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialBrandId = searchParams.get("brand_id");
  const initialImageUrl = searchParams.get("image_url") ?? undefined;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewPost, setShowNewPost] = useState(!!initialImageUrl);
  const [filter, setFilter] = useState<"all" | "scheduled" | "published" | "draft">("all");
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Auto-select brand if brand_id in URL
  useEffect(() => {
    if (initialBrandId && !brand) {
      fetch("/api/brands").then(r => r.json()).then((brands: Brand[]) => {
        const found = brands.find(b => b.id === initialBrandId);
        if (found) { setBrand(found); }
      });
    }
  }, [initialBrandId, brand]);

  const loadPosts = useCallback(async (b: Brand) => {
    setLoading(true);
    const res = await fetch(`/api/brands/${b.id}/social/posts`);
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { if (brand) loadPosts(brand); }, [brand, loadPosts]);

  async function handlePublishNow(post: SocialPost) {
    if (!brand) return;
    setPublishingId(post.id);
    await fetch(`/api/brands/${brand.id}/social/posts/${post.id}/publish`, { method: "POST" });
    await loadPosts(brand);
    setPublishingId(null);
  }

  async function handleDelete(post: SocialPost) {
    if (!brand || !confirm(lang === "nl" ? "Post verwijderen?" : "Delete post?")) return;
    await fetch(`/api/brands/${brand.id}/social/posts/${post.id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== post.id));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(lang === "nl" ? "nl-NL" : "en-GB", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  const filtered = posts.filter(p => filter === "all" || p.status === filter);

  if (!brand) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planner</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Plan en publiceer content op Instagram & Facebook." : "Plan and publish content to Instagram & Facebook."}
          </p>
        </div>
        <BrandPicker onSelect={setBrand} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {showNewPost && brand && (
        <NewPostModal
          brandId={brand.id}
          initialImageUrl={initialImageUrl}
          onClose={() => setShowNewPost(false)}
          onCreated={() => { setShowNewPost(false); loadPosts(brand); }}
        />
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setBrand(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">← {lang === "nl" ? "Stores" : "Stores"}</button>
            <span className="text-xs text-gray-300 dark:text-gray-600">/</span>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{brand.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planner</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/social/create?brand_id=${brand.id}`}
            className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-[#C7F56F] hover:text-gray-900 dark:hover:text-white">
            {lang === "nl" ? "Content maken" : "Create content"}
          </Link>
          <button onClick={() => setShowNewPost(true)}
            className="rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
            + {lang === "nl" ? "Uploaden" : "Upload"}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
        {(["all", "scheduled", "published", "draft"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"
            }`}>
            {f === "all" ? (lang === "nl" ? "Alles" : "All") :
             f === "scheduled" ? (lang === "nl" ? "Ingepland" : "Scheduled") :
             f === "published" ? (lang === "nl" ? "Gepubliceerd" : "Published") :
             (lang === "nl" ? "Concept" : "Draft")}
            {" "}
            <span className="text-gray-400 font-normal">
              {f === "all" ? posts.length : posts.filter(p => p.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C7F56F] border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            {lang === "nl" ? "Geen posts gevonden." : "No posts found."}
          </p>
          <button onClick={() => setShowNewPost(true)}
            className="rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a]">
            + {lang === "nl" ? "Eerste post aanmaken" : "Create first post"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="flex gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                {post.image_urls?.[0] ? (
                  <Image src={post.image_urls[0]} alt="" width={72} height={72} className="rounded-xl object-cover w-[72px] h-[72px]" unoptimized />
                ) : (
                  <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <svg className="h-6 w-6 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[post.status] ?? STATUS_STYLES.draft}`}>
                    {post.status}
                  </span>
                  {post.platforms.map(p => (
                    <span key={p} className="text-[11px] text-gray-400">{PLATFORM_ICONS[p]} {p}</span>
                  ))}
                  {post.source === "ads_bridge" && (
                    <span className="rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                      Ad creative
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug line-clamp-2">
                  {post.caption || <span className="italic text-gray-400">No caption</span>}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {post.scheduled_at
                    ? `📅 ${formatDate(post.scheduled_at)}`
                    : post.published_at
                    ? `✓ ${formatDate(post.published_at)}`
                    : (lang === "nl" ? "Concept" : "Draft")}
                </p>
                {post.error_message && (
                  <p className="mt-1 text-[11px] text-red-500 truncate">⚠ {post.error_message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {(post.status === "draft" || post.status === "failed") && (
                  <button onClick={() => handlePublishNow(post)} disabled={publishingId === post.id}
                    className="rounded-lg bg-[#C7F56F] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50 whitespace-nowrap">
                    {publishingId === post.id ? "…" : (lang === "nl" ? "Nu publiceren" : "Publish now")}
                  </button>
                )}
                <button onClick={() => handleDelete(post)}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-500">
                  {lang === "nl" ? "Verwijder" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense>
      <PlannerInner />
    </Suspense>
  );
}
