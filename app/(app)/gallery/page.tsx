"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useBrand } from "@/lib/brand-context";
import { Image as ImageIcon, Video, Download, ExternalLink } from "lucide-react";

type Tab = "ads" | "video";

interface AdJob {
  id: string;
  template_name: string;
  image_urls: string[];
  status: string;
  created_at: string;
  resolution: string;
}

interface VideoSession {
  id: string;
  video_style: string;
  platform: string;
  phase: string;
  video_url: string | null;
  created_at: string;
}

export default function GalleryPage() {
  const { brand } = useBrand();
  const [tab, setTab] = useState<Tab>("ads");
  const [adJobs, setAdJobs] = useState<AdJob[]>([]);
  const [videoSessions, setVideoSessions] = useState<VideoSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brand) return;
    setLoading(true);
    if (tab === "ads") {
      fetch(`/api/brands/${brand.id}/jobs`)
        .then(r => r.json())
        .then((data: AdJob[]) => setAdJobs((data ?? []).filter(j => j.status === "done" && j.image_urls?.length > 0)))
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/brands/${brand.id}/video-sessions`)
        .then(r => r.json())
        .then((data: VideoSession[]) => setVideoSessions((data ?? []).filter(s => s.phase === "done" && s.video_url)))
        .finally(() => setLoading(false));
    }
  }, [brand, tab]);

  const allImages = adJobs.flatMap(j => j.image_urls.map(url => ({ url, job: j })));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0e0e0e]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gallerij</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Alle gegenereerde content van {brand?.name ?? "je brand"}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
          {([
            { key: "ads", label: "Advertenties", icon: <ImageIcon size={14} />, count: allImages.length },
            { key: "video", label: "Video's", icon: <Video size={14} />, count: videoSessions.length },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? "border-[#C7F56F] text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && tab === "ads" && (
          <>
            {allImages.length === 0 ? (
              <EmptyState icon={<ImageIcon size={32} />} title="Nog geen advertenties" desc="Genereer je eerste advertentie via de Generator." />
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
                {allImages.map(({ url, job }, i) => (
                  <div key={`${job.id}-${i}`} className="break-inside-avoid group relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={url}
                      alt={job.template_name}
                      width={400}
                      height={600}
                      className="w-full object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs text-white/80 truncate">{job.template_name}</span>
                        <a
                          href={url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 flex-shrink-0 rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                          onClick={e => e.stopPropagation()}
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && tab === "video" && (
          <>
            {videoSessions.length === 0 ? (
              <EmptyState icon={<Video size={32} />} title="Nog geen video's" desc="Genereer je eerste video via de Video Generator." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {videoSessions.map(s => (
                  <div key={s.id} className="group relative overflow-hidden rounded-xl bg-gray-900 aspect-[9/16]">
                    <video
                      src={s.video_url!}
                      className="h-full w-full object-cover"
                      muted
                      loop
                      onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs text-white/80 capitalize">{s.video_style ?? s.platform}</span>
                        <div className="flex gap-1.5">
                          <a
                            href={s.video_url!}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                            onClick={e => e.stopPropagation()}
                          >
                            <Download size={13} />
                          </a>
                          <a
                            href={s.video_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{desc}</p>
    </div>
  );
}
