import type { VideoStyle, VideoPlatform } from "./video-script-generator";

export interface VideoPreset {
  key: string;
  label: string;
  labelNl: string;
  desc: string;
  descNl: string;
  icon: string;
  badge?: string;
  video_style: VideoStyle;
  platform: VideoPlatform;
  num_scenes: number;
  includes_person: boolean;
}

// Add new presets here — they appear automatically in the video wizard.
export const VIDEO_PRESETS: VideoPreset[] = [
  {
    key: "ugc-review",
    label: "UGC Review",
    labelNl: "UGC Review",
    desc: "Authentic creator-style. Real person, handheld feel.",
    descNl: "Echte creator-vibe. Persoon met handheld smartphone feel.",
    icon: "📱",
    video_style: "ugc",
    platform: "tiktok",
    num_scenes: 5,
    includes_person: true,
  },
  {
    key: "lifestyle",
    label: "Lifestyle",
    labelNl: "Lifestyle",
    desc: "Aspirational, real-world. Warm and relatable.",
    descNl: "Aspirationeel en herkenbaar. Warm gevoel.",
    icon: "✨",
    video_style: "lifestyle",
    platform: "instagram-reels",
    num_scenes: 5,
    includes_person: true,
  },
  {
    key: "product-hero",
    label: "Product Hero",
    labelNl: "Product Hero",
    desc: "Cinematic product reveal. No person needed.",
    descNl: "Cinematisch product reveal. Geen persoon nodig.",
    icon: "🎬",
    video_style: "product-hero",
    platform: "instagram-reels",
    num_scenes: 4,
    includes_person: false,
  },
  {
    key: "animation",
    label: "Pixar Style",
    labelNl: "Pixar Stijl",
    desc: "3D animated. Colorful, cinematic, character-driven.",
    descNl: "3D animatie. Kleurrijk, filmisch, karakter-gedreven.",
    icon: "🎨",
    badge: "NEW",
    video_style: "animation",
    platform: "instagram-reels",
    num_scenes: 5,
    includes_person: false,
  },
  {
    key: "cinematic",
    label: "Cinematic",
    labelNl: "Cinematisch",
    desc: "Premium film quality. Bold visual storytelling.",
    descNl: "Premium filmkwaliteit. Sterke visuele storytelling.",
    icon: "🎥",
    video_style: "cinematic",
    platform: "youtube-shorts",
    num_scenes: 6,
    includes_person: false,
  },
];
