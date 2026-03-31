"use client";

const TOP_PLANS = [
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
];

const AGENCY = {
  name: "Agency",
  price: "€249",
  period: "/mo",
  description: "For agencies & teams managing multiple brands",
  cta: "Upgrade to Agency",
  features: [
    "Unlimited stores",
    "Unlimited AI generations",
    "All ad templates",
    "Batch generation",
    "Dedicated support",
    "White-label options",
  ],
};

export default function PricingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#111] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose your plan</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Scale your ad generation with the right plan.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Top 3 plans — cards */}
          <div className="grid grid-cols-3 gap-4">
            {TOP_PLANS.map((plan) => (
              <div key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-5 ${
                  plan.highlight
                    ? "border-[#C7F56F] bg-[#C7F56F]/5"
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
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <svg className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-[#C7F56F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <button disabled={plan.ctaDisabled}
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

          {/* Agency — horizontal full-width card */}
          <div className="relative flex items-center gap-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <div className="w-44 flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{AGENCY.name}</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{AGENCY.price}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500">{AGENCY.period}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{AGENCY.description}</p>
            </div>

            <div className="flex flex-1 flex-wrap gap-x-6 gap-y-1.5">
              {AGENCY.features.map((f) => (
                <div key={f} className="flex items-center gap-1.5 text-xs">
                  <svg className="h-3.5 w-3.5 flex-shrink-0 text-[#C7F56F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">{f}</span>
                </div>
              ))}
            </div>

            <button className="flex-shrink-0 rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
              {AGENCY.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
