"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { GenerationJob, GenerationDetail } from "@/types";

interface DetailSelection {
  job: GenerationJob;
  imageIndex: number;
}

export default function GalleryPage() {
  const params = useParams();
  const id = params.id as string;

  const [brandName, setBrandName] = useState("");
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DetailSelection | null>(null);

  useEffect(() => {
    async function load() {
      const [brandRes, jobsRes] = await Promise.all([
        fetch(`/api/brands/${id}`),
        fetch(`/api/brands/${id}/jobs`),
      ]);

      if (brandRes.ok) {
        const d = await brandRes.json();
        setBrandName(d.brand?.name ?? "Brand");
      }

      if (jobsRes.ok) {
        const all: GenerationJob[] = await jobsRes.json();
        // Only show completed jobs with images, newest first (API returns newest first already)
        setJobs(all.filter((j) => j.status === "done" && j.image_urls && j.image_urls.length > 0));
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function downloadImage(url: string, filename: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  }

  function exportJobJson(job: GenerationJob) {
    const payload = {
      exported_at: new Date().toISOString(),
      brand: brandName,
      template_name: job.template_name,
      template_number: job.template_number,
      resolution: job.resolution,
      generated_at: job.created_at,
      model: job.generation_detail?.model ?? null,
      background_prompt: job.generation_detail?.background_prompt ?? null,
      hook_variants: job.generation_detail?.hook_variants ?? null,
      image_urls: job.image_urls ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brandName}-${job.template_name}-${job.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const detailJob = detail?.job;
  const detailIndex = detail?.imageIndex ?? 0;
  const detailUrl = detailJob?.image_urls?.[detailIndex];
  const detailInfo: GenerationDetail | null = detailJob?.generation_detail ?? null;

  return (
    <div className="flex gap-6">
      {/* Main gallery */}
      <div className={`min-w-0 flex-1 transition-all ${detail ? "max-w-[calc(100%-360px)]" : ""}`}>
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Brands</Link>
          <span>/</span>
          <Link href={`/brands/${id}`} className="hover:text-gray-700 dark:hover:text-gray-200">{brandName}</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-200 font-medium">Gallery</span>
        </div>

        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{brandName} — Ad Gallery</h1>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">All generated ads, newest first. Click an image for details.</p>
          </div>
          <Link
            href={`/brands/${id}`}
            className="flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            ← Back to Brand
          </Link>
        </div>

        {/* 48-hour notice */}
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          Generated ads are kept for <strong className="mx-1">48 hours</strong> — download or export anything you want to keep.
        </div>

        {loading && <p className="text-sm text-gray-400 dark:text-gray-500">Loading gallery…</p>}

        {!loading && jobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No generated ads yet.</p>
            <Link
              href={`/brands/${id}`}
              className="mt-4 inline-block rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a]"
            >
              Run the pipeline
            </Link>
          </div>
        )}

        <div className="space-y-8">
          {jobs.map((job) => (
            <div key={job.id}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(job.created_at).toLocaleString()} · {job.resolution}
                  {job.generation_detail?.model && (
                    <span className="ml-2 rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 font-mono text-gray-500 dark:text-gray-400">
                      {job.generation_detail.model}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => exportJobJson(job)}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2"
                >
                  Export JSON
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {(job.image_urls ?? []).map((url, i) => {
                  const isActive = detail?.job.id === job.id && detail?.imageIndex === i;
                  return (
                    <div
                      key={i}
                      className={`group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${isActive ? "border-[#C7F56F]" : "border-transparent"}`}
                      onClick={() => setDetail(isActive ? null : { job, imageIndex: i })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${job.template_name} v${i + 1}`}
                        className="w-full rounded-[10px] border border-gray-200 dark:border-gray-700 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-end justify-between rounded-[10px] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-2 gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadImage(url, `${brandName}-${job.template_name}-v${i + 1}.png`); }}
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-gray-100"
                        >
                          Download
                        </button>
                        <span className="rounded-lg bg-black/60 px-2 py-1.5 text-xs text-white">
                          {isActive ? "Close" : "Details"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {detail && detailJob && detailUrl && (
        <aside className="w-[340px] flex-shrink-0">
          <div className="sticky top-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            {/* Image preview */}
            <div className="relative bg-gray-50 dark:bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detailUrl}
                alt="Selected ad"
                className="w-full object-contain max-h-64"
              />
              <button
                onClick={() => setDetail(null)}
                className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Meta */}
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">
                  {detailJob.template_name.replace(/-/g, " ")}
                </span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {detailJob.resolution}
                </span>
                {detailInfo?.model && (
                  <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs font-mono text-gray-600 dark:text-gray-300">
                    {detailInfo.model}
                  </span>
                )}
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400">
                  Hook {detailIndex + 1} of {detailJob.image_urls?.length}
                </span>
              </div>

              {/* Hook variant */}
              {detailInfo?.hook_variants?.[detailIndex] && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Hook Text</p>
                  <p className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
                    {detailInfo.hook_variants[detailIndex]}
                  </p>
                </div>
              )}

              {/* Background prompt */}
              {detailInfo?.background_prompt && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Background Prompt</p>
                  <p className="max-h-36 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-mono leading-relaxed text-gray-600 dark:text-gray-300">
                    {detailInfo.background_prompt}
                  </p>
                </div>
              )}

              {!detailInfo && (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">No detail available — generated before logging was added.</p>
              )}

              {/* Generated at */}
              <p className="text-xs text-gray-300 dark:text-gray-600">{new Date(detailJob.created_at).toLocaleString()}</p>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => downloadImage(detailUrl, `${brandName}-${detailJob.template_name}-v${detailIndex + 1}.png`)}
                  className="flex-1 rounded-lg bg-[#C7F56F] px-3 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]"
                >
                  Download
                </button>
                <button
                  onClick={() => exportJobJson(detailJob)}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Export JSON
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
