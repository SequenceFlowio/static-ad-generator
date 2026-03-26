"use client";

import { useEffect, useRef, useState } from "react";

interface InspoImage {
  id: string;
  image_url: string;
  created_at: string;
}

interface Props {
  brandId: string;
  type: "ad" | "content";
  label: string;
}

const MAX = 20;

export default function InspoLibrary({ brandId, type, label }: Props) {
  const [images, setImages] = useState<InspoImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/inspo?type=${type}`)
      .then((r) => r.json())
      .then((d) => setImages(Array.isArray(d) ? d : []));
  }, [brandId, type]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Only allow up to remaining slots
    const remaining = MAX - images.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    for (const file of toUpload) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch(`/api/brands/${brandId}/inspo`, { method: "POST", body: fd });
      if (res.ok) {
        const img = await res.json();
        setImages((prev) => [img, ...prev]);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(inspoId: string) {
    setDeletingId(inspoId);
    await fetch(`/api/brands/${brandId}/inspo/${inspoId}`, { method: "DELETE" });
    setImages((prev) => prev.filter((i) => i.id !== inspoId));
    setDeletingId(null);
  }

  const atLimit = images.length >= MAX;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</p>
        <span className="text-xs text-gray-400 dark:text-gray-500">{images.length}/{MAX}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.image_url} alt="Inspo" className="h-full w-full object-cover" />
            <button
              onClick={() => handleDelete(img.id)}
              disabled={deletingId === img.id}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium"
            >
              {deletingId === img.id ? "…" : "Remove"}
            </button>
          </div>
        ))}

        {!atLimit && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:border-[#C7F56F] hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xs disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-[10px]">Uploading…</span>
            ) : (
              <>
                <span className="text-lg font-light">+</span>
                <span className="text-[10px]">Add</span>
              </>
            )}
          </button>
        )}

        {atLimit && (
          <div className="aspect-square rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-[10px] text-gray-400 dark:text-gray-500 text-center px-2">
            Limit reached
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
