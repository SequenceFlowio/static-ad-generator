"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Brand, FacebookConnection, FbAdInsights } from "@/types";
import MetricCard from "@/components/analytics/MetricCard";
import SpendChart from "@/components/analytics/SpendChart";
import RoasChart from "@/components/analytics/RoasChart";
import AdTable from "@/components/analytics/AdTable";
import PublishModal from "@/components/analytics/PublishModal";

type DatePreset = "last_7d" | "last_14d" | "last_30d";

interface Totals {
  total_spend: number;
  total_reach: number;
  total_impressions: number;
  total_purchases: number;
  total_purchase_value: number;
  avg_roas: number;
  avg_frequency: number;
  avg_cpp: number;
}

function BrandPicker({ onSelect }: { onSelect: (b: Brand) => void }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  useEffect(() => {
    fetch("/api/brands").then(r => r.json()).then(d => setBrands(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      {brands.map(b => (
        <button
          key={b.id}
          onClick={() => onSelect(b)}
          className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-[#C7F56F] hover:bg-[#C7F56F]/10 transition-colors"
        >
          {b.name}
        </button>
      ))}
    </div>
  );
}

function fmtEur(n: number) {
  return `€${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtNum(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [connection, setConnection] = useState<FacebookConnection | null>(null);
  const [loadingConn, setLoadingConn] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("last_7d");
  const [insights, setInsights] = useState<FbAdInsights[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [publishTarget, setPublishTarget] = useState<FbAdInsights | null>(null);

  // Handle query params from OAuth callback
  useEffect(() => {
    const brandIdParam = searchParams.get("brand_id");
    const connectedParam = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      console.error("FB OAuth error:", errorParam);
    }
    if (brandIdParam && connectedParam === "1") {
      // Remove params without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      url.searchParams.delete("brand_id");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const loadConnection = useCallback(async (brandId: string) => {
    setLoadingConn(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/facebook/connection`);
      const data = await res.json();
      setConnection(data.connection ?? null);
    } catch {
      setConnection(null);
    } finally {
      setLoadingConn(false);
    }
  }, []);

  const loadInsights = useCallback(async (brandId: string, preset: DatePreset) => {
    setLoadingInsights(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/facebook/analytics?date_preset=${preset}`);
      const data = await res.json();
      setInsights(data.insights ?? []);
      setTotals(data.totals ?? null);
    } catch {
      setInsights([]);
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  async function handleSelectBrand(b: Brand) {
    setBrand(b);
    setInsights([]);
    setTotals(null);
    await loadConnection(b.id);
    await loadInsights(b.id, datePreset);
  }

  async function handleConnect() {
    if (!brand) return;
    const res = await fetch(`/api/auth/facebook?brand_id=${brand.id}`);
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  async function handleDisconnect() {
    if (!brand) return;
    await fetch(`/api/brands/${brand.id}/facebook/connection`, { method: "DELETE" });
    setConnection(null);
    setInsights([]);
    setTotals(null);
  }

  async function handleSync() {
    if (!brand || !connection) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/brands/${brand.id}/facebook/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_preset: datePreset }),
      });
      const data = await res.json();
      if (data.last_synced_at) setLastSynced(data.last_synced_at);
      await loadInsights(brand.id, datePreset);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDatePreset(preset: DatePreset) {
    setDatePreset(preset);
    if (brand) await loadInsights(brand.id, preset);
  }

  function handleVariation(insight: FbAdInsights) {
    if (!brand || !insight.creative_image_url) return;
    router.push(
      `/generation/ads?ref_image=${encodeURIComponent(insight.creative_image_url)}&brand_id=${brand.id}`
    );
  }

  // Build chart data from insights (group by date_start → sum per day)
  const spendByDate = Object.values(
    insights.reduce<Record<string, { date: string; spend: number; roas: number; count: number }>>((acc, row) => {
      const d = row.date_start ?? "?";
      if (!acc[d]) acc[d] = { date: d, spend: 0, roas: 0, count: 0 };
      acc[d].spend += Number(row.spend);
      acc[d].roas += Number(row.purchase_roas);
      acc[d].count++;
      return acc;
    }, {})
  ).sort((a, b) => a.date.localeCompare(b.date));

  const roasData = spendByDate.map(d => ({ date: d.date, roas: d.count > 0 ? d.roas / d.count : 0 }));

  const PRESETS: { key: DatePreset; label: string }[] = [
    { key: "last_7d", label: "7 dagen" },
    { key: "last_14d", label: "14 dagen" },
    { key: "last_30d", label: "30 dagen" },
  ];

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Link href="/generation" className="hover:text-gray-600 dark:hover:text-gray-300">Genereren</Link>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-300">Analytics</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h1>

      {/* Brand picker */}
      {!brand ? (
        <div>
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Selecteer een brand om analytics te bekijken:</p>
          <BrandPicker onSelect={handleSelectBrand} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Brand + connection bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { setBrand(null); setConnection(null); setInsights([]); setTotals(null); }}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ← Wissel brand
            </button>
            <span className="font-semibold text-gray-900 dark:text-white">{brand.name}</span>

            <div className="ml-auto flex items-center gap-2">
              {loadingConn ? (
                <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              ) : connection ? (
                <>
                  <span className="flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {connection.fb_account_name ?? connection.fb_account_id}
                  </span>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-1.5 rounded-lg bg-[#C7F56F] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-60"
                  >
                    {syncing ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Synchroniseren…
                      </>
                    ) : "Synchroniseren"}
                  </button>
                  {lastSynced && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Gesynchroniseerd {new Date(lastSynced).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  <button
                    onClick={handleDisconnect}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Verbreken
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={false}
                  className="flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166FE5] transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Verbind Facebook Ads
                </button>
              )}
            </div>
          </div>

          {connection && (
            <>
              {/* Date preset tabs */}
              <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
                {PRESETS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => handleDatePreset(p.key)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                      datePreset === p.key
                        ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Metric cards */}
              {loadingInsights ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  ))}
                </div>
              ) : totals ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <MetricCard label="ROAS" value={`${totals.avg_roas.toFixed(2)}×`} sub="gemiddeld" />
                  <MetricCard label="Reach" value={fmtNum(totals.total_reach)} sub="unieke personen" />
                  <MetricCard label="Frequency" value={totals.avg_frequency.toFixed(1)} sub="gem. per persoon" />
                  <MetricCard label="Spend" value={fmtEur(totals.total_spend)} sub="totaal uitgegeven" />
                  <MetricCard label="Omzet" value={fmtEur(totals.total_purchase_value)} sub="totale aankoopwaarde" />
                  <MetricCard label="CPP" value={fmtEur(totals.avg_cpp)} sub="kosten per aankoop" />
                </div>
              ) : null}

              {/* Charts */}
              {insights.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Spend per dag</p>
                    <SpendChart data={spendByDate} />
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">ROAS trend</p>
                    <RoasChart data={roasData} />
                  </div>
                </div>
              )}

              {/* Ad table */}
              <div>
                <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Ads {insights.length > 0 && <span className="text-gray-400 dark:text-gray-500 font-normal">({insights.length})</span>}
                </p>
                {loadingInsights ? (
                  <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ) : (
                  <AdTable
                    insights={insights}
                    onVariation={handleVariation}
                    onPublish={setPublishTarget}
                  />
                )}
              </div>
            </>
          )}

          {!connection && !loadingConn && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2]/10">
                <svg className="h-7 w-7 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">Verbind je Facebook Ads account</h3>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Bekijk ROAS, reach, frequency en spend van al je ads. Genereer variaties en publiceer creatives rechtstreeks vanuit SequenceFlow.
              </p>
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 rounded-lg bg-[#1877F2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#166FE5] transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Verbind Facebook Ads →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Publish modal */}
      {publishTarget && brand && (
        <PublishModal
          brandId={brand.id}
          target={publishTarget}
          onClose={() => setPublishTarget(null)}
        />
      )}
    </div>
  );
}
