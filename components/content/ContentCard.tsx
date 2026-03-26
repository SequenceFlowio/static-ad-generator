"use client";

import { CONTENT_TEMPLATES, PLATFORMS } from "@/lib/content-templates";

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
  session: ContentSession;
  onDelete: (id: string) => void;
  onClick: (session: ContentSession) => void;
}

export default function ContentCard({ session, onDelete, onClick }: Props) {
  const template = CONTENT_TEMPLATES.find((t) => t.name === session.template_name);
  const platform = PLATFORMS.find((p) => p.value === session.platform);

  return (
    <div className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:border-[#C7F56F] hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onClick(session)}>

      {/* Image or placeholder */}
      <div className="aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden">
        {session.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.image_url} alt="Content" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-gray-300 dark:text-gray-600">
            <span className="text-3xl">{template?.icon ?? "🖼️"}</span>
            {session.status === "generating" && (
              <span className="text-xs text-blue-400 animate-pulse">Generating…</span>
            )}
            {session.status === "failed" && (
              <span className="text-xs text-red-400">Failed</span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{template?.icon}</span>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{template?.label ?? session.template_name}</p>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{platform?.label ?? session.platform}</p>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-red-50 dark:bg-red-900/20 px-2 py-1 text-xs text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
      >
        Delete
      </button>
    </div>
  );
}
