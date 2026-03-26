"use client";

import { useEffect, useState } from "react";

interface InspoImage {
  id: string;
  image_url: string;
}

interface Props {
  brandId: string;
  type: "ad" | "content";
  selected: string | null;
  onSelect: (url: string | null) => void;
}

export default function InspoPicker({ brandId, type, selected, onSelect }: Props) {
  const [images, setImages] = useState<InspoImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/inspo?type=${type}`)
      .then((r) => r.json())
      .then((d) => { setImages(Array.isArray(d) ? d : []); setLoaded(true); });
  }, [brandId, type]);

  if (!loaded || images.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
        Style reference <span className="font-normal text-gray-400 dark:text-gray-500">(optional — pick 1)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {images.map((img) => {
          const isSelected = selected === img.image_url;
          return (
            <button
              key={img.id}
              onClick={() => onSelect(isSelected ? null : img.image_url)}
              className={`relative h-14 w-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                isSelected
                  ? "border-[#C7F56F] ring-2 ring-[#C7F56F]/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt="Inspo" className="h-full w-full object-cover" />
              {isSelected && (
                <div className="absolute inset-0 bg-[#C7F56F]/20 flex items-center justify-center">
                  <span className="text-white text-sm font-bold drop-shadow">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
