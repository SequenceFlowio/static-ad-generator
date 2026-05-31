export interface EnvironmentPreset {
  key: string;
  label: string;
  labelNl: string;
  emoji: string;
  gradient: string; // Tailwind gradient classes for card background
  style: "realistic" | "unrealistic";
  promptHint: string; // appended to script generation context
}

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    key: "studio",
    label: "Studio",
    labelNl: "Studio",
    emoji: "📸",
    gradient: "from-slate-100 to-slate-300",
    style: "realistic",
    promptHint: "clean white photo studio with soft box lighting and neutral background",
  },
  {
    key: "bedroom",
    label: "Bedroom",
    labelNl: "Slaapkamer",
    emoji: "🛏️",
    gradient: "from-amber-50 to-amber-200",
    style: "realistic",
    promptHint: "cozy modern bedroom with warm soft lighting and minimalist décor",
  },
  {
    key: "kitchen",
    label: "Kitchen",
    labelNl: "Keuken",
    emoji: "🍳",
    gradient: "from-yellow-50 to-orange-100",
    style: "realistic",
    promptHint: "bright minimalist kitchen with marble counters and natural window light",
  },
  {
    key: "living-room",
    label: "Living Room",
    labelNl: "Woonkamer",
    emoji: "🛋️",
    gradient: "from-stone-100 to-stone-300",
    style: "realistic",
    promptHint: "stylish modern living room with warm ambient lighting",
  },
  {
    key: "outdoor",
    label: "Outdoor",
    labelNl: "Buiten",
    emoji: "🌿",
    gradient: "from-green-100 to-emerald-200",
    style: "realistic",
    promptHint: "lush outdoor setting with golden hour sunlight and greenery",
  },
  {
    key: "beach",
    label: "Beach",
    labelNl: "Strand",
    emoji: "🏖️",
    gradient: "from-sky-100 to-blue-200",
    style: "realistic",
    promptHint: "sunny sandy beach with turquoise water and clear blue sky",
  },
  {
    key: "gym",
    label: "Gym",
    labelNl: "Sportschool",
    emoji: "💪",
    gradient: "from-gray-100 to-gray-300",
    style: "realistic",
    promptHint: "modern fitness studio with industrial lighting and mirrors",
  },
  {
    key: "cafe",
    label: "Café",
    labelNl: "Café",
    emoji: "☕",
    gradient: "from-amber-100 to-brown-200",
    style: "realistic",
    promptHint: "cozy café with warm Edison bulb lighting and wooden textures",
  },
  {
    key: "forest",
    label: "Forest",
    labelNl: "Bos",
    emoji: "🌲",
    gradient: "from-green-200 to-teal-300",
    style: "realistic",
    promptHint: "dense forest with dappled sunlight filtering through trees",
  },
  {
    key: "abstract",
    label: "Abstract",
    labelNl: "Abstract",
    emoji: "🎨",
    gradient: "from-purple-200 to-pink-300",
    style: "unrealistic",
    promptHint: "abstract colorful background with soft gradient shapes and light leaks",
  },
  {
    key: "neon",
    label: "Neon City",
    labelNl: "Neon Stad",
    emoji: "🌆",
    gradient: "from-violet-300 to-fuchsia-400",
    style: "unrealistic",
    promptHint: "cyberpunk neon-lit cityscape at night with glowing signs and rain reflections",
  },
  {
    key: "space",
    label: "Space",
    labelNl: "Ruimte",
    emoji: "🚀",
    gradient: "from-indigo-900 to-purple-950",
    style: "unrealistic",
    promptHint: "futuristic outer space setting with stars, nebula colors, and sci-fi atmosphere",
  },
  {
    key: "custom",
    label: "Custom",
    labelNl: "Eigen",
    emoji: "✏️",
    gradient: "from-gray-100 to-gray-200",
    style: "realistic",
    promptHint: "",
  },
];

export function getEnvironmentPreset(key: string): EnvironmentPreset | undefined {
  return ENVIRONMENT_PRESETS.find((p) => p.key === key);
}
