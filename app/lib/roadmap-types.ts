// Typy i stałe Board. Plik bez zależności serwerowych —
// używają go komponenty klienckie, walidacja (Zod) i server actions.
// (Zapytania do bazy są osobno w roadmap.ts, bo importują db — tego
// nie wolno wciągnąć do komponentu "use client".)

export const ROADMAP_STATUS_KEYS = ["todo", "learning", "done"] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUS_KEYS)[number];

// Pełne nazwy klas — Tailwind szuka ich w kodzie jako zwykłego tekstu
export const ROADMAP_STATUSES: Record<
  RoadmapStatus,
  { label: string; card: string; badge: string; dot: string }
> = {
  todo: {
    label: "Do nauki",
    card: "border-line dark:border-white/15",
    badge: "bg-mist text-ink/70 dark:bg-white/10 dark:text-white/70",
    dot: "bg-line",
  },
  learning: {
    label: "W trakcie",
    card: "border-amber-400",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200",
    dot: "bg-amber-400",
  },
  done: {
    label: "Opanowane",
    card: "border-brand",
    badge: "bg-brand-deep text-white dark:bg-brand dark:text-ink",
    dot: "bg-brand",
  },
};

// Podpowiedzi kategorii (pole jest wolnym tekstem — można wpisać własną)
export const ROADMAP_CATEGORY_HINTS = [
  "Frontend",
  "Backend",
  "Bazy danych",
  "DevOps",
  "Narzędzia",
  "Teoria",
  "Języki",
];

export type RoadmapNode = {
  id: string;
  title: string;
  category: string;
  status: RoadmapStatus;
  x: number; // pozycja lewego górnego rogu w "świecie" tablicy (nie na ekranie)
  y: number;
};

export type RoadmapEdge = {
  id: string;
  sourceId: string; // strzałka idzie od source do target
  targetId: string;
};

// Wynik server action — klient sprawdza ok i ewentualnie pokazuje message
export type ActionResult = { ok: true } | { ok: false; message: string };

// Stały rozmiar karty — dzięki temu strzałki można policzyć bez mierzenia DOM
export const NODE_W = 208;
export const NODE_H = 76;

// ---------- Kształty: prostokąty i klocki tekstowe ----------

export const SHAPE_KINDS = ["rect", "text"] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];

export const SHAPE_COLOR_KEYS = ["slate", "brand", "amber", "rose", "sky", "violet"] as const;
export type ShapeColor = (typeof SHAPE_COLOR_KEYS)[number];

// rect = ramka (przezroczyste wypełnienie), block = klocek tekstowy
export const SHAPE_COLORS: Record<ShapeColor, { label: string; rect: string; block: string; swatch: string }> = {
  slate: {
    label: "Szary",
    rect: "border-slate-400 bg-slate-400/10",
    block: "border-slate-300 bg-slate-50 dark:border-slate-400/40 dark:bg-slate-500/20",
    swatch: "bg-slate-400",
  },
  brand: {
    label: "Turkusowy",
    rect: "border-brand bg-brand/10",
    block: "border-brand/60 bg-mist dark:bg-brand/15",
    swatch: "bg-brand",
  },
  amber: {
    label: "Żółty",
    rect: "border-amber-400 bg-amber-400/10",
    block: "border-amber-300 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/15",
    swatch: "bg-amber-400",
  },
  rose: {
    label: "Różowy",
    rect: "border-rose-400 bg-rose-400/10",
    block: "border-rose-300 bg-rose-50 dark:border-rose-400/40 dark:bg-rose-400/15",
    swatch: "bg-rose-400",
  },
  sky: {
    label: "Niebieski",
    rect: "border-sky-400 bg-sky-400/10",
    block: "border-sky-300 bg-sky-50 dark:border-sky-400/40 dark:bg-sky-400/15",
    swatch: "bg-sky-400",
  },
  violet: {
    label: "Fioletowy",
    rect: "border-violet-400 bg-violet-400/10",
    block: "border-violet-300 bg-violet-50 dark:border-violet-400/40 dark:bg-violet-400/15",
    swatch: "bg-violet-400",
  },
};

export type RoadmapShape = {
  id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string; // dla prostokąta: etykieta, dla klocka: treść
  color: ShapeColor;
};

export const SHAPE_MIN = { rect: { w: 40, h: 40 }, text: { w: 80, h: 40 } } as const;
