export interface AvatarPreset {
  key: string;
  label: string;
  labelNl: string;
  emoji: string;
  gradient: string; // Tailwind gradient classes
  promptHint: string; // character description appended to script generation
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    key: "young-woman",
    label: "Young Woman",
    labelNl: "Jonge Vrouw",
    emoji: "👩",
    gradient: "from-pink-100 to-rose-200",
    promptHint: "young woman in her mid-20s with a casual, approachable style",
  },
  {
    key: "young-man",
    label: "Young Man",
    labelNl: "Jonge Man",
    emoji: "👨",
    gradient: "from-blue-100 to-sky-200",
    promptHint: "young man in his mid-20s with a casual, confident style",
  },
  {
    key: "influencer",
    label: "Influencer",
    labelNl: "Influencer",
    emoji: "✨",
    gradient: "from-yellow-100 to-amber-200",
    promptHint: "stylish young woman with influencer aesthetic, on-trend fashion and glowing skin",
  },
  {
    key: "fitness",
    label: "Fitness",
    labelNl: "Fitness",
    emoji: "🏋️",
    gradient: "from-green-100 to-emerald-200",
    promptHint: "fit athletic person in workout attire with energetic confident presence",
  },
  {
    key: "professional",
    label: "Professional",
    labelNl: "Professional",
    emoji: "👩‍💼",
    gradient: "from-slate-100 to-gray-200",
    promptHint: "professional woman in her 30s dressed in business casual attire",
  },
  {
    key: "mom",
    label: "Mom",
    labelNl: "Moeder",
    emoji: "👩‍👧",
    gradient: "from-orange-100 to-amber-100",
    promptHint: "friendly relatable mom in her early 30s–40s with a warm, trustworthy look",
  },
  {
    key: "custom",
    label: "Upload / Generate",
    labelNl: "Upload / Genereer",
    emoji: "📷",
    gradient: "from-gray-100 to-gray-200",
    promptHint: "",
  },
];

export function getAvatarPreset(key: string): AvatarPreset | undefined {
  return AVATAR_PRESETS.find((p) => p.key === key);
}
