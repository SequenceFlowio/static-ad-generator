"use client";

const PLANS = [
  {
    name: "Trial",
    price: "€0",
    period: "/7 days",
    description: "Try everything free",
    cta: "Current plan",
    ctaDisabled: true,
    highlight: false,
    badge: "7-day trial",
    features: [
      "1 store",
      "50 AI generations",
      "All ad templates",
      "Content generator",
      "No watermark",
      "—",
      "—",
    ],
  },
  {
    name: "Starter",
    price: "€49",
    period: "/mo",
    description: "For solo creators",
    cta: "Upgrade to Starter",
    ctaDisabled: false,
    highlight: false,
    features: [
      "1 store",
      "500 AI generations/mo",
      "All ad templates",
      "Content generator",
      "Inspo library",
      "—",
      "—",
    ],
  },
  {
    name: "Pro",
    price: "€89",
    period: "/mo",
    description: "For growing brands",
    cta: "Upgrade to Pro",
    ctaDisabled: false,
    highlight: true,
    badge: "Most popular",
    features: [
      "3 stores",
      "2,000 AI generations/mo",
      "All ad templates",
      "Content generator",
      "Inspo library",
      "Batch generation",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    price: "€249",
    period: "/mo",
    description: "For agencies & teams",
    cta: "Upgrade to Agency",
    ctaDisabled: false,
    highlight: false,
    features: [
      "Unlimited stores",
      "Unlimited generations",
      "All ad templates",
      "Content generator",
      "Inspo library",
      "Batch generation",
      "Dedicated support",
    ],
  },
];

const FEATURE_LABELS = [
  "Stores",
  "AI generations",
  "Ad templates",
  "Content generator",
  "Inspo library",
  "Batch generation",
  "Support",
];

export default function PricingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#111] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose your plan</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Scale your ad generation with the right plan.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plans grid */}
        <div className="p-6 grid grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-5 ${
                plan.highlight
                  ? "border-[#C7F56F] bg-[#C7F56F]/5 dark:bg-[#C7F56F]/5"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#C7F56F] px-3 py-1 text-[10px] font-bold text-[#1a1a1a] whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">{plan.period}</span>
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{plan.description}</p>
              </div>

              <ul className="mb-5 flex-1 space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    {f === "—" ? (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-[#C7F56F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-300">{f}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.ctaDisabled}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  plan.ctaDisabled
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-default"
                    : plan.highlight
                    ? "bg-[#C7F56F] text-[#1a1a1a] hover:bg-[#b8e85e]"
                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature labels row */}
        <div className="px-6 pb-6">
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="grid grid-cols-5 bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5">
              <p className="col-span-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Feature</p>
              {["Trial", "Starter", "Pro", "Agency"].map((p) => (
                <p key={p} className="text-xs font-semibold text-center text-gray-500 dark:text-gray-400">{p}</p>
              ))}
            </div>
            {FEATURE_LABELS.map((label, i) => (
              <div key={label} className={`grid grid-cols-5 px-4 py-2.5 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"}`}>
                <p className="col-span-1 text-xs text-gray-700 dark:text-gray-300">{label}</p>
                {PLANS.map((plan) => (
                  <p key={plan.name} className={`text-xs text-center ${plan.features[i] === "—" ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"}`}>
                    {plan.features[i]}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
