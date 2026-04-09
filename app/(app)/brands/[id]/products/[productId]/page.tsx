"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { useLanguage } from "@/components/LanguageProvider";

const MAX_IMAGES = 6;

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { lang, t } = useLanguage();

  useEffect(() => {
    async function load() {
      const [brandRes, productRes] = await Promise.all([
        fetch(`/api/brands/${brandId}`),
        fetch(`/api/brands/${brandId}/products/${productId}`),
      ]);
      if (brandRes.ok) {
        const d = await brandRes.json();
        setBrandName(d.brand?.name ?? "Brand");
      }
      if (!productRes.ok) { router.push(`/brands/${brandId}`); return; }
      const productData = await productRes.json();
      const p: Product = productData.product ?? productData;
      setProduct(p);
      setEditName(p.name);
      setEditDescription(p.description ?? "");
      setEditUrl(p.url ?? "");
      setLoading(false);
    }
    load();
  }, [brandId, productId, router]);

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    const res = await fetch(`/api/brands/${brandId}/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDescription, url: editUrl }),
    });
    if (res.ok) {
      const updated: Product = await res.json();
      setProduct(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(lang === "nl"
      ? `"${product?.name}" verwijderen? Dit kan niet ongedaan worden gemaakt.`
      : `Delete "${product?.name}"? This cannot be undone.`
    )) return;
    setDeleting(true);
    await fetch(`/api/brands/${brandId}/products/${productId}`, { method: "DELETE" });
    router.push(`/brands/${brandId}`);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !product) return;
    if ((product.image_urls?.length ?? 0) >= MAX_IMAGES) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/brands/${brandId}/products/${productId}/images`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const updated: Product = await res.json();
      setProduct(updated);
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteImage(url: string) {
    if (!product) return;
    setDeletingImageUrl(url);
    const res = await fetch(`/api/brands/${brandId}/products/${productId}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      const updated: Product = await res.json();
      setProduct(updated);
    }
    setDeletingImageUrl(null);
  }

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>;
  if (!product) return null;

  const images = product.image_urls ?? [];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/stores" className="hover:text-gray-700 dark:hover:text-gray-200">{t("nav.stores")}</Link>
        <span>/</span>
        <Link href={`/brands/${brandId}`} className="hover:text-gray-700 dark:hover:text-gray-200">{brandName}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{product.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
          {product.url && (
            <a href={product.url} target="_blank" rel="noopener noreferrer"
              className="mt-1 text-xs text-gray-400 dark:text-gray-500 hover:underline">{product.url}</a>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t("product.edit")}
            </button>
          ) : null}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            {deleting ? t("product.deleting") : t("product.delete")}
          </button>
        </div>
      </div>

      {/* Info section */}
      <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
        {editing ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("product.productName")}</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#C7F56F]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("product.description")}</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#C7F56F] resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("product.productUrl")}</label>
              <input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#C7F56F]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
              >
                {saving ? t("product.saving") : t("product.save")}
              </button>
              <button
                onClick={() => { setEditing(false); setEditName(product.name); setEditDescription(product.description ?? ""); setEditUrl(product.url ?? ""); }}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t("product.cancel")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">{t("product.name")}</p>
              <p className="text-sm text-gray-900 dark:text-white">{product.name}</p>
            </div>
            {product.description && (
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">{t("product.description")}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
            {product.url && (
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">URL</p>
                <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#C7F56F] hover:underline">{product.url}</a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Images */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("product.images")}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{images.length}/{MAX_IMAGES} — {t("product.imagesDesc")}</p>
          </div>
          {images.length < MAX_IMAGES && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="rounded-lg bg-[#C7F56F] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
              >
                {uploadingImage ? t("product.uploading") : t("product.addImage")}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((url, i) => (
            <div key={url} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <Image src={url} alt={`Product image ${i + 1}`} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDeleteImage(url)}
                  disabled={deletingImageUrl === url}
                  className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-white disabled:opacity-50"
                >
                  {deletingImageUrl === url ? "…" : t("product.remove")}
                </button>
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[#C7F56F] flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className="text-2xl">+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
