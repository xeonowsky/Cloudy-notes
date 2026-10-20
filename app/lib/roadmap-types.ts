// Typy i stałe Board. Plik bez zależności serwerowych —
// używają go komponenty klienckie, walidacja (Zod) i server actions.
// (Zapytania do bazy są osobno w roadmap.ts, bo importują db — tego
// nie wolno wciągnąć do komponentu "use client".)

import type { NoteColor } from "./note-colors";

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

// Strzałka może łączyć DOWOLNE obiekty: kartę z kartą, kartę z ramką,
// blok tekstu z kartą itd. sourceId/targetId to id karty albo kształtu.
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

// ---------- Kształty: wszystko na tablicy oprócz kart stacku ----------
// rect      — ramka do grupowania (etykieta u góry)
// text      — blok tekstu
// sticky    — karteczka post-it
// code      — blok kodu (czcionka o stałej szerokości)
// checklist — lista zadań, w polu text zapisana jak w Markdownie: "- [x] zadanie"
// note      — podgląd notatki z Cloudy Notes (noteId)
// calendar  — kalendarz, klik w dzień stawia X; w text: tytuł + daty "2026-10-20"

export const SHAPE_KINDS = ["rect", "text", "sticky", "code", "checklist", "note", "calendar"] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];

export const SHAPE_KIND_LABELS: Record<ShapeKind, string> = {
  rect: "Prostokąt",
  text: "Blok tekstu",
  sticky: "Karteczka",
  code: "Blok kodu",
  checklist: "Lista zadań",
  note: "Notatka",
  calendar: "Kalendarz",
};

export const SHAPE_COLOR_KEYS = ["slate", "brand", "amber", "rose", "sky", "violet"] as const;
export type ShapeColor = (typeof SHAPE_COLOR_KEYS)[number];

// rect = ramka (przezroczyste wypełnienie), block = klocek tekstowy / lista,
// sticky = pełny, jasny kolor karteczki (taki sam w trybie ciemnym),
// accent = sama obwódka (blok kodu ma ciemne tło)
export const SHAPE_COLORS: Record<
  ShapeColor,
  { label: string; rect: string; block: string; sticky: string; accent: string; swatch: string }
> = {
  slate: {
    label: "Szary",
    rect: "border-slate-400 bg-slate-400/10",
    block: "border-slate-300 bg-slate-50 dark:border-slate-400/40 dark:bg-slate-500/20",
    sticky: "bg-slate-200",
    accent: "border-slate-500",
    swatch: "bg-slate-400",
  },
  brand: {
    label: "Turkusowy",
    rect: "border-brand bg-brand/10",
    block: "border-brand/60 bg-mist dark:bg-brand/15",
    sticky: "bg-[#b9e6e3]",
    accent: "border-brand",
    swatch: "bg-brand",
  },
  amber: {
    label: "Żółty",
    rect: "border-amber-400 bg-amber-400/10",
    block: "border-amber-300 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/15",
    sticky: "bg-amber-200",
    accent: "border-amber-400",
    swatch: "bg-amber-400",
  },
  rose: {
    label: "Różowy",
    rect: "border-rose-400 bg-rose-400/10",
    block: "border-rose-300 bg-rose-50 dark:border-rose-400/40 dark:bg-rose-400/15",
    sticky: "bg-rose-200",
    accent: "border-rose-400",
    swatch: "bg-rose-400",
  },
  sky: {
    label: "Niebieski",
    rect: "border-sky-400 bg-sky-400/10",
    block: "border-sky-300 bg-sky-50 dark:border-sky-400/40 dark:bg-sky-400/15",
    sticky: "bg-sky-200",
    accent: "border-sky-400",
    swatch: "bg-sky-400",
  },
  violet: {
    label: "Fioletowy",
    rect: "border-violet-400 bg-violet-400/10",
    block: "border-violet-300 bg-violet-50 dark:border-violet-400/40 dark:bg-violet-400/15",
    sticky: "bg-violet-200",
    accent: "border-violet-400",
    swatch: "bg-violet-400",
  },
};

// ---------- Styl tekstu w kształtach ----------

export const TEXT_COLOR_KEYS = ["ink", "brand", "amber", "rose", "sky", "violet"] as const;
export type TextColor = (typeof TEXT_COLOR_KEYS)[number];

export const TEXT_COLORS: Record<TextColor, { label: string; text: string; swatch: string }> = {
  ink: { label: "Domyślny", text: "text-ink dark:text-white", swatch: "bg-ink dark:bg-white" },
  brand: { label: "Turkusowy", text: "text-brand-deep dark:text-brand", swatch: "bg-brand-deep dark:bg-brand" },
  amber: { label: "Żółty", text: "text-amber-600 dark:text-amber-300", swatch: "bg-amber-500" },
  rose: { label: "Różowy", text: "text-rose-600 dark:text-rose-300", swatch: "bg-rose-500" },
  sky: { label: "Niebieski", text: "text-sky-600 dark:text-sky-300", swatch: "bg-sky-500" },
  violet: { label: "Fioletowy", text: "text-violet-600 dark:text-violet-300", swatch: "bg-violet-500" },
};

export const TEXT_ALIGNS = ["left", "center", "right"] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

// Gotowe rozmiary w panelu (px w jednostkach tablicy — skalują się z zoomem)
export const FONT_SIZES = [12, 14, 18, 24, 32, 48] as const;
export const FONT_SIZE_RANGE = { min: 10, max: 96 } as const;

export type ShapeTextStyle = {
  fontSize: number;
  textColor: TextColor;
  bold: boolean;
  italic: boolean;
  align: TextAlign;
};

export const DEFAULT_TEXT_STYLE: ShapeTextStyle = {
  fontSize: 14,
  textColor: "ink",
  bold: false,
  italic: false,
  align: "left",
};

export type RoadmapShape = {
  id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string; // etykieta ramki / treść bloku / punkty listy zadań
  color: ShapeColor;
  noteId: string | null; // tylko dla kind = "note": która notatka jest pokazana
} & ShapeTextStyle;

export const SHAPE_MIN: Record<ShapeKind, { w: number; h: number }> = {
  rect: { w: 40, h: 40 },
  text: { w: 80, h: 40 },
  sticky: { w: 80, h: 80 },
  code: { w: 120, h: 60 },
  checklist: { w: 160, h: 100 },
  note: { w: 160, h: 80 },
  calendar: { w: 220, h: 240 },
};

// Startowy wygląd nowych obiektów z menu "+ Dodaj"
export const SHAPE_DEFAULTS: Record<ShapeKind, { w: number; h: number; color: ShapeColor; fontSize: number }> = {
  rect: { w: 280, h: 180, color: "brand", fontSize: 14 },
  text: { w: 220, h: 120, color: "amber", fontSize: 14 },
  sticky: { w: 200, h: 200, color: "amber", fontSize: 18 },
  code: { w: 340, h: 180, color: "slate", fontSize: 13 },
  checklist: { w: 260, h: 240, color: "brand", fontSize: 14 },
  note: { w: 280, h: 160, color: "slate", fontSize: 14 },
  calendar: { w: 300, h: 330, color: "sky", fontSize: 14 },
};

// Notatka z Cloudy Notes w wersji dla tablicy — tylko to, co pokazuje kafelek
export type BoardNote = { id: string; title: string; excerpt: string; color: NoteColor };
