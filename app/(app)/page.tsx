"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Brand } from "@/types";

function BrandCard({
  brand,
  deleting,
  onDelete,
}: {
  brand: Brand;
  deleting: boolean;
  onDelete: (e: React.MouseEvent, brand: Brand) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/brands/${brand.id}`}
        className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 hover:border-[#C7F56F] hover:shadow-sm transition-all"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold">{brand.name}</h2>
            {brand.url && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]">{brand.url}</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          {new Date(brand.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </Link>
      {hovered && (
        <button
          onClick={(e) => onDelete(e, brand)}
          disabled={deleting}
          className="absolute top-3 right-3 flex items-center justify-center h-6 w-6 rounded-md text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          title="Delete brand"
        >
          {deleting ? "…" : "✕"}
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => {
        setBrands(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, brand: Brand) {
    e.preventDefault();
    if (!confirm(`Delete "${brand.name}"? This cannot be undone.`)) return;
    setDeletingId(brand.id);
    await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
    setBrands((prev) => prev.filter((b) => b.id !== brand.id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Each brand runs the 3-phase ad pipeline independently.
          </p>
        </div>
        <Link
          href="/brands/new"
          className="rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
        >
          + New Brand
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading brands…</p>
      )}

      {!loading && brands.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No brands yet.</p>
          <Link
            href="/brands/new"
            className="mt-4 inline-block rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]"
          >
            Add your first brand
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <BrandCard
            key={brand.id}
            brand={brand}
            deleting={deletingId === brand.id}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
