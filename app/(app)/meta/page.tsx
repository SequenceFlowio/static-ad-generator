"use client";

import { useState, useEffect, useCallback } from "react";
import { useBrand } from "@/lib/brand-context";
import type { FacebookConnection } from "@/types";

interface FbPage { id: string; name: string; category?: string }

function PageSetupSection({ brandId, onSaved }: { brandId: string; onSaved: () => void }) {
  const [pages, setPages] = useState<FbPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [manualPageId, setManualPageId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/facebook/pages`)
      .then(r => r.json())
      .then(d => setPages(Array.isArray(d.pages) ? d.pages : []))
      .catch(() => setPages([]))
      .finally(() => setLoadingPages(false));
  }, [brandId]);

  async function handleSave() {
    const pageId = pages.length > 0 ? selectedPageId : manualPageId.trim();
    if (!pageId) { setError("Voer een Page ID in."); return; }
    const page = pages.find(p => p.id === pageId);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/brands/${brandId}/facebook/pages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId, page_name: page?.name ?? null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Fout"); }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Facebook Pagina koppelen</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Nodig om posts te publiceren naar Facebook en Instagram.</p>
      </div>

      {loadingPages ? (
        <div className="h-9 w-full rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ) : pages.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPageId}
            onChange={e => setSelectedPageId(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          >
            <option value="">Selecteer pagina…</option>
            {pages.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving || !selectedPageId}
            className="rounded-lg bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            {saving ? "Opslaan…" : "Koppelen"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400">
            Geen pagina&apos;s automatisch gevonden. Kopieer je Page ID uit{" "}
            <a
              href="https://business.facebook.com/settings/pages"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Meta Business Manager → Settings → Pages
            </a>
            {" "}en plak het hier.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={manualPageId}
              onChange={e => setManualPageId(e.target.value)}
              placeholder="123456789012345"
              className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={handleSave}
              disabled={saving || !manualPageId.trim()}
              className="rounded-lg bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              {saving ? "Opslaan…" : "Koppelen"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function InstagramSetupSection({ brandId, pageId, currentIgUserId, onSaved }: { brandId: string; pageId: string; currentIgUserId: string | null; onSaved: () => void }) {
  const [fetching, setFetching] = useState(false);
  const [manualIgId, setManualIgId] = useState(currentIgUserId ?? "");
  const [showManual, setShowManual] = useState(!!currentIgUserId);
  const [editing, setEditing] = useState(!currentIgUserId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAutoFetch() {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch(`/api/brands/${brandId}/facebook/pages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fout");
      if (data.ig_user_id) {
        onSaved();
      } else {
        setShowManual(true);
        setError("Instagram Business-account niet automatisch gevonden. Voer het ID handmatig in.");
      }
    } catch (e) {
      setShowManual(true);
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }

  async function handleManualSave() {
    const id = manualIgId.trim();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/brands/${brandId}/facebook/pages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId, ig_user_id: id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Fout"); }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Instagram koppelen</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Nodig om posts te publiceren naar Instagram. Je Instagram account moet gekoppeld zijn aan je Facebook Pagina.
          </p>
        </div>
        {currentIgUserId && !editing && (
          <button
            onClick={() => { setEditing(true); setShowManual(true); setManualIgId(currentIgUserId); setError(null); }}
            className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Wijzigen
          </button>
        )}
      </div>

      {currentIgUserId && !editing ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2">
          <svg className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{currentIgUserId}</span>
        </div>
      ) : !showManual ? (
        <button
          onClick={handleAutoFetch}
          disabled={fetching}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {fetching ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Ophalen…
            </>
          ) : "Instagram automatisch koppelen"}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">Hoe vind je je Instagram Business Account ID?</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Ga naar <a href="https://business.facebook.com/settings/instagram-accounts" target="_blank" rel="noopener noreferrer" className="underline text-[#1877F2]">Meta Business Manager → Instagram-accounts</a></li>
              <li>Klik op je account → kopieer het ID uit de URL of de instellingen</li>
              <li>Of: ga naar instagram.com → Profiel → Instellingen → Account → Verbonden accounts</li>
            </ol>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={manualIgId}
              onChange={e => setManualIgId(e.target.value)}
              placeholder="17841480755305284"
              className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={handleManualSave}
              disabled={saving || !manualIgId.trim()}
              className="rounded-lg bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {!currentIgUserId && (
              <button onClick={() => { setShowManual(false); setError(null); }} className="text-xs text-gray-400 hover:text-gray-600 underline">
                ← Opnieuw automatisch proberen
              </button>
            )}
            {currentIgUserId && (
              <button onClick={() => { setEditing(false); setError(null); setManualIgId(currentIgUserId); }} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Annuleren
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-amber-600 dark:text-amber-400">{error}</p>}
    </div>
  );
}

export default function MetaPage() {
  const { brand, brands, loading: brandLoading } = useBrand();
  const [connection, setConnection] = useState<FacebookConnection | null>(null);
  const [loadingConn, setLoadingConn] = useState(false);

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

  useEffect(() => {
    if (brand) loadConnection(brand.id);
    else setConnection(null);
  }, [brand?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConnect() {
    if (!brand) return;
    const res = await fetch(`/api/auth/facebook?brand_id=${brand.id}`);
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleDisconnect() {
    if (!brand) return;
    await fetch(`/api/brands/${brand.id}/facebook/connection`, { method: "DELETE" });
    setConnection(null);
  }

  if (brandLoading) {
    return (
      <div className="max-w-2xl">
        <div className="h-8 w-48 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse mb-6" />
        <div className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!brand && brands.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Meta account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Maak eerst een brand aan om een Meta account te koppelen.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meta account</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Verbind je Facebook Ads account en pagina voor {brand?.name}.
        </p>
      </div>

      {/* Connection card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2]/10">
            <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Facebook Ads</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Analytics, synchronisatie en publiceren</p>
          </div>
          <div className="ml-auto">
            {loadingConn ? (
              <div className="h-7 w-24 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : connection ? (
              <span className="flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Verbonden
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Niet verbonden
              </span>
            )}
          </div>
        </div>

        {!loadingConn && connection && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Ads account</span>
              <span className="font-medium text-gray-900 dark:text-white">{connection.fb_account_name ?? connection.fb_account_id}</span>
            </div>
            {connection.page_name && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Facebook pagina</span>
                <span className="font-medium text-gray-900 dark:text-white">{connection.page_name}</span>
              </div>
            )}
            {connection.page_id && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Page ID</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">{connection.page_id}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Instagram</span>
              {connection.ig_user_id ? (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Gekoppeld
                </span>
              ) : (
                <span className="text-amber-500 dark:text-amber-400 font-medium">Niet gekoppeld</span>
              )}
            </div>
            {connection.token_expires_at && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Token verloopt</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(connection.token_expires_at).toLocaleDateString("nl-NL")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Page setup if connected but no page */}
        {!loadingConn && connection && !connection.page_id && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <PageSetupSection brandId={brand!.id} onSaved={() => loadConnection(brand!.id)} />
          </div>
        )}

        {/* Instagram setup — always shown when page is linked */}
        {!loadingConn && connection && connection.page_id && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <InstagramSetupSection
              brandId={brand!.id}
              pageId={connection.page_id}
              currentIgUserId={connection.ig_user_id ?? null}
              onSaved={() => loadConnection(brand!.id)}
            />
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex gap-2">
          {!loadingConn && !connection ? (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 rounded-lg bg-[#1877F2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#166FE5] transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Verbind Facebook Ads
            </button>
          ) : !loadingConn && connection ? (
            <>
              <button
                onClick={handleConnect}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Opnieuw verbinden
              </button>
              <button
                onClick={handleDisconnect}
                className="rounded-lg border border-red-200 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Verbreken
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Info block */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-semibold text-gray-700 dark:text-gray-300">Wat heb je nodig?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Een Facebook account met toegang tot een Ads account</li>
          <li>Beheerderstoegang tot een Facebook Pagina</li>
          <li>Een Instagram Business account gekoppeld aan de Facebook Pagina</li>
          <li>Voor Business Manager: kopieer je Page ID via business.facebook.com → Settings → Pages</li>
        </ul>
      </div>
    </div>
  );
}
