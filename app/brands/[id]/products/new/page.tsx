"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProductPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleScrape() {
    if (!url.trim()) return;
    setScraping(true);
    setScrapeError("");
    const res = await fetch(`/api/brands/${brandId}/products/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = await res.json();
    setScraping(false);
    if (!res.ok) { setScrapeError(data.error ?? "Scrape failed"); return; }
    if (data.name) setName(data.name);
    if (data.description) setDescription(data.description);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/brands/${brandId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        url: url.trim() || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to create product."); return; }
    router.push(`/brands/${brandId}/products/${data.id}`);
  }

  const base = "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30";

  return (
    <div className="max-w-lg">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Brands</Link>
        <span>/</span>
        <Link href={`/brands/${brandId}`} className="hover:text-gray-700 dark:hover:text-gray-200">Brand</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">New Product</span>
      </div>

      <h1 className="mb-6 text-xl font-bold">Add Product</h1>

      <div className="space-y-5">
        {/* URL field with scrape */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Product URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourbrand.com/products/your-product"
              className={`${base} flex-1`}
            />
            <button
              onClick={handleScrape}
              disabled={scraping || !url.trim()}
              className="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 whitespace-nowrap"
            >
              {scraping ? "Scraping…" : "Auto-fill ▶"}
            </button>
          </div>
          {scrapeError && <p className="mt-1 text-xs text-red-500">{scrapeError}</p>}
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Optional — paste the product page URL to auto-fill name and description.</p>
        </div>

        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Product Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 19-piece Kitchen Set"
            className={base}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short product description — helps AI write better ad copy"
            rows={3}
            className={`${base} resize-y`}
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link
            href={`/brands/${brandId}`}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Product →"}
          </button>
        </div>
      </div>
    </div>
  );
}
