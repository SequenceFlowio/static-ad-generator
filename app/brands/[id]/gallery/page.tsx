"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { GenerationJob } from "@/types";

interface GroupedJobs {
  template_number: number;
  template_name: string;
  jobs: GenerationJob[];
}

export default function GalleryPage() {
  const params = useParams();
  const id = params.id as string;

  const [brandName, setBrandName] = useState("");
  const [groups, setGroups] = useState<GroupedJobs[]>([]);
  const [loading, setLoading] = useState(true);

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
        const jobs: GenerationJob[] = await jobsRes.json();
        const doneJobs = jobs.filter(
          (j) => j.status === "done" && j.image_urls && j.image_urls.length > 0
        );

        // Group by template
        const map = new Map<number, GroupedJobs>();
        for (const job of doneJobs) {
          const key = job.template_number;
          if (!map.has(key)) {
            map.set(key, {
              template_number: key,
              template_name: job.template_name,
              jobs: [],
            });
          }
          map.get(key)!.jobs.push(job);
        }

        setGroups(
          Array.from(map.values()).sort(
            (a, b) => a.template_number - b.template_number
          )
        );
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
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-700">Brands</Link>
        <span>/</span>
        <Link href={`/brands/${id}`} className="hover:text-gray-700">{brandName}</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Gallery</span>
      </div>

      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{brandName} — Ad Gallery</h1>
          <p className="mt-1 text-sm text-gray-400">All generated ads, grouped by template.</p>
        </div>
        <Link
          href={`/brands/${id}`}
          className="flex-shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          ← Back to Brand
        </Link>
      </div>

      {/* 48-hour notice */}
      <div className="mb-8 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
        Generated ads are kept for <strong className="mx-1">48 hours</strong> — download anything you want to keep.
      </div>

      {loading && <p className="text-sm text-gray-400">Loading gallery…</p>}

      {!loading && groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm">No generated ads yet.</p>
          <Link
            href={`/brands/${id}`}
            className="mt-4 inline-block rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a]"
          >
            Run the pipeline
          </Link>
        </div>
      )}

      <div className="space-y-12">
        {groups.map((group) => (
          <section key={group.template_number}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-semibold capitalize">
                Template {String(group.template_number).padStart(2, "0")} —{" "}
                {group.template_name.replace(/-/g, " ")}
              </h2>
              <span className="h-px flex-1 bg-[#C7F56F]" />
            </div>

            {group.jobs.map((job) => (
              <div key={job.id} className="mb-6">
                <p className="mb-3 text-xs text-gray-400">
                  Generated {new Date(job.created_at).toLocaleString()} · {job.resolution}
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {(job.image_urls ?? []).map((url, i) => (
                    <div key={i} className="group relative">
                      <img
                        src={url}
                        alt={`${group.template_name} v${i + 1}`}
                        className="w-full rounded-xl border border-gray-200 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            downloadImage(
                              url,
                              `${brandName}-${group.template_name}-v${i + 1}.png`
                            )
                          }
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-gray-100"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
