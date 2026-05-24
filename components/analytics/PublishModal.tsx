"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { FbAdInsights } from "@/types";

interface Campaign {
  id: string;
  name: string;
  status: string;
  adsets: { id: string; name: string; status: string }[];
}

interface PublishModalProps {
  brandId: string;
  target: FbAdInsights;
  onClose: () => void;
}

export default function PublishModal({ brandId, target, onClose }: PublishModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [adsetId, setAdsetId] = useState("");
  const [adName, setAdName] = useState(target.ad_name ?? "");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingCampaigns, setFetchingCampaigns] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/facebook/campaigns`)
      .then(r => r.json())
      .then(d => { setCampaigns(d.campaigns ?? []); })
      .catch(() => setError("Kon campagnes niet laden."))
      .finally(() => setFetchingCampaigns(false));
  }, [brandId]);

  const selectedCampaign = campaigns.find(c => c.id === campaignId);
  const adsets = selectedCampaign?.adsets ?? [];

  async function handlePublish() {
    if (!campaignId || !adsetId || !adName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/brands/${brandId}/facebook/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: target.creative_image_url,
          campaign_id: campaignId,
          adset_id: adsetId,
          ad_name: adName,
          message,
          link,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publiceren mislukt");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publiceren mislukt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
          <p className="font-semibold text-gray-900 dark:text-white">Publiceer naar Facebook Ads</p>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="mb-3 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Gepubliceerd!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">De ad is aangemaakt in Facebook Ads Manager (status: Gepauzeerd).</p>
            <button onClick={onClose} className="mt-4 rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
              Sluiten
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Preview */}
            {target.creative_image_url && (
              <div className="relative h-32 w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image src={target.creative_image_url} alt="" fill className="object-contain" unoptimized />
              </div>
            )}

            {/* Campaign */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Campagne</label>
              {fetchingCampaigns ? (
                <div className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ) : (
                <select
                  value={campaignId}
                  onChange={e => { setCampaignId(e.target.value); setAdsetId(""); }}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
                >
                  <option value="">Selecteer campagne…</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Adset */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Adset</label>
              <select
                value={adsetId}
                onChange={e => setAdsetId(e.target.value)}
                disabled={!campaignId}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 disabled:opacity-50"
              >
                <option value="">Selecteer adset…</option>
                {adsets.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Ad name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Ad naam</label>
              <input
                value={adName}
                onChange={e => setAdName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
              />
            </div>

            {/* Message */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Primaire tekst (optioneel)</label>
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Advertentietekst…"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
              />
            </div>

            {/* Link */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Doellink (URL)</label>
              <input
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://jouwwebshop.nl/product"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
              />
            </div>

            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                Annuleren
              </button>
              <button
                onClick={handlePublish}
                disabled={loading || !campaignId || !adsetId || !adName}
                className="flex-1 rounded-lg bg-[#C7F56F] py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Publiceren…" : "Publiceren"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
