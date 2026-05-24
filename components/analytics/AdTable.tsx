"use client";

import Image from "next/image";
import type { FbAdInsights } from "@/types";

const REC_CONFIG = {
  kill:  { label: "Kill",    color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  wait:  { label: "Wacht",   color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
  scale: { label: "Scale",   color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
  vary:  { label: "Variatie", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
} as const;

function fmt(n: number, prefix = "") {
  if (n >= 1000) return `${prefix}${(n / 1000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(n < 10 ? 2 : 0)}`;
}

interface AdTableProps {
  insights: FbAdInsights[];
  onVariation: (insight: FbAdInsights) => void;
  onPublish: (insight: FbAdInsights) => void;
}

export default function AdTable({ insights, onVariation, onPublish }: AdTableProps) {
  if (insights.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">
        Nog geen ads gesynchroniseerd. Klik op &quot;Synchroniseren&quot; om te beginnen.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-12">Img</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Naam</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Spend</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">ROAS</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Reach</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Freq</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">CPP</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Suggestie</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Acties</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {insights.map((row) => {
            const rec = row.ai_recommendation ? REC_CONFIG[row.ai_recommendation] : null;
            return (
              <tr key={row.id} className="bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-3 py-2.5">
                  {row.creative_image_url ? (
                    <div className="relative h-9 w-9 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <Image src={row.creative_image_url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="h-9 w-9 rounded bg-gray-100 dark:bg-gray-800" />
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{row.ad_name ?? "—"}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[160px]">{row.campaign_name ?? ""}</p>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.ad_status === "ACTIVE"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}>
                    {row.ad_status ?? "—"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700 dark:text-gray-200 tabular-nums">€{Number(row.spend).toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span className={Number(row.purchase_roas) >= 2 ? "text-green-600 dark:text-green-400 font-semibold" : "text-gray-700 dark:text-gray-200"}>
                    {Number(row.purchase_roas).toFixed(2)}×
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700 dark:text-gray-200 tabular-nums">{fmt(Number(row.reach))}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span className={Number(row.frequency) > 4 ? "text-orange-600 dark:text-orange-400 font-semibold" : "text-gray-700 dark:text-gray-200"}>
                    {Number(row.frequency).toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700 dark:text-gray-200 tabular-nums">€{Number(row.cpp).toFixed(2)}</td>
                <td className="px-3 py-2.5">
                  {rec ? (
                    <div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${rec.color}`}>
                        {rec.label}
                      </span>
                      {row.ai_reason && (
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 max-w-[200px] line-clamp-2">{row.ai_reason}</p>
                      )}
                    </div>
                  ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    {row.creative_image_url && (
                      <button
                        onClick={() => onVariation(row)}
                        className="rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-[#C7F56F] hover:text-[#1a1a1a] transition-colors whitespace-nowrap"
                      >
                        Variatie →
                      </button>
                    )}
                    <button
                      onClick={() => onPublish(row)}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-[#C7F56F] hover:text-[#1a1a1a] dark:hover:text-white transition-colors whitespace-nowrap"
                    >
                      Publiceer →
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
