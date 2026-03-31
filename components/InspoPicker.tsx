"use client";

import { useEffect, useState } from "react";

interface InspoImage {
  id: string;
  image_url: string;
}

interface Props {
  brandId: string;
  type: "ad" | "content";
  selected: string[];
  onSelect: (urls: string[]) => void;
  max?: number;
}

export default function InspoPicker({ brandId, type, selected, onSelect, max = 2 }: Props) {
  const [images, setImages] = useState<InspoImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/inspo?type=${type}`)
      .then((r) => r.json())
      .then((d) => { setImages(Array.isArray(d) ? d : []); setLoaded(true); });
  }, [brandId, type]);

  if (!loaded || images.length === 0) return null;

  function toggle(url: string) {
    if (selected.includes(url)) {
      onSelect(selected.filter((u) => u !== url));
    } else if (selected.length < max) {
      onSelect([...selected, url]);
    } else {
      // Replace oldest selection
      onSelect([...selected.slice(1), url]);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Style reference <span className="font-normal text-gray-400 dark:text-gray-500">(optional — pick up to {max})</span>
        </p>
        {selected.length > 0 && (
          <span className="text-xs text-[#C7F56F] font-medium">{selected.length}/{max} selected</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((img) => {
          const isSelected = selected.includes(img.image_url);
          const selIndex = selected.indexOf(img.image_url);
          return (
            <button
              key={img.id}
              onClick={() => toggle(img.image_url)}
              className={`relative h-20 w-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                isSelected
                  ? "border-[#C7F56F] ring-2 ring-[#C7F56F]/30 scale-105"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt="Inspo" className="h-full w-full object-cover" />
              {isSelected && (
                <div className="absolute inset-0 bg-[#C7F56F]/20 flex items-start justify-end p-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C7F56F] text-[10px] font-bold text-[#1a1a1a]">
                    {selIndex + 1}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
