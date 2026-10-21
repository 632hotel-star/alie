import meta from "./asset-meta.json";

type Variant = { w: number; h: number };
type Meta = Record<string, Record<string, Variant>>;
const m = meta as Meta;

export type Stage = {
  id: 1 | 2 | 3 | 4 | 5;
  key: string;
  name: string;
  tagline: string;
  /** file base name under /characters, or null when the artwork has not been supplied yet */
  file: string | null;
  gold?: boolean;
};

/**
 * The five stages of the same Greek hero (engraved, neo-classical).
 * Stage 1 ("the neglected one") has not been supplied yet: drop `public/characters/stage-1-{640,960,1254}.webp`
 * (run `npm run assets` after adding the source as assets-src/1b.webp) and set `file: "stage-1"` to enable it everywhere.
 */
export const stages: Stage[] = [
  { id: 1, key: "neglect", name: "المهمل", tagline: "البداية قبل أي التزام", file: null },
  { id: 2, key: "beginner", name: "المبتدئ", tagline: "أول وزن وأول خطوة", file: "stage-2" },
  { id: 3, key: "strong", name: "القوي", tagline: "ثقة وانتظام", file: "stage-3" },
  { id: 4, key: "beast", name: "الوحش", tagline: "قوة بحضور بطولي", file: "stage-4" },
  { id: 5, key: "iron", name: "آكل الحديد", tagline: "المرحلة الأسطورية", file: "stage-5", gold: true },
];

export const availableStages = stages.filter((s) => s.file);

export function charImg(file: string) {
  const sizes = m[file];
  const heights = Object.keys(sizes).map(Number).sort((a, b) => a - b);
  const srcSet = heights.map((h) => `/characters/${file}-${h}.webp ${sizes[String(h)].w}w`).join(", ");
  const mid = heights[Math.min(1, heights.length - 1)];
  const full = sizes[String(heights[heights.length - 1])];
  const small = heights[0];
  return { src: `/characters/${file}-${mid}.webp`, srcSet, thumb: `/characters/${file}-${small}.webp`, width: full.w, height: full.h, ratio: full.w / full.h };
}

export const logo = { src: "/brand/logo-512.webp", small: "/brand/logo-96.webp", medium: "/brand/logo-192.webp" };
