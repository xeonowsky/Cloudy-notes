// Kolory kart notatek i znaczenie przypisane każdemu kolorowi (kategoria).
// Plik bez zależności serwerowych — używa go walidacja (Zod) i komponenty.
// Klasy Tailwinda muszą być zapisane w całości (nie sklejane z kawałków),
// bo Tailwind szuka ich w kodzie jako zwykłego tekstu.
// Klucze (white, yellow…) są zapisane w bazie — nie zmieniaj ich, zmieniaj tylko opisy.

export const NOTE_COLORS = {
  white: {
    label: "Biały",
    category: "Ogólne",
    card: "bg-white border-gray-200",
    swatch: "bg-white",
    dot: "bg-gray-300",
  },
  yellow: {
    label: "Żółty",
    category: "Myśl",
    card: "bg-yellow-50 border-yellow-300",
    swatch: "bg-yellow-200",
    dot: "bg-yellow-400",
  },
  blue: {
    label: "Niebieski",
    category: "Biznes",
    card: "bg-sky-50 border-sky-300",
    swatch: "bg-sky-200",
    dot: "bg-sky-500",
  },
  mint: {
    label: "Miętowy",
    category: "Zadania",
    card: "bg-emerald-50 border-emerald-300",
    swatch: "bg-emerald-200",
    dot: "bg-emerald-500",
  },
  pink: {
    label: "Różowy",
    category: "Osobiste",
    card: "bg-pink-50 border-pink-300",
    swatch: "bg-pink-200",
    dot: "bg-pink-400",
  },
  purple: {
    label: "Fioletowy",
    category: "Nauka",
    card: "bg-violet-50 border-violet-300",
    swatch: "bg-violet-200",
    dot: "bg-violet-500",
  },
} as const;

export type NoteColor = keyof typeof NOTE_COLORS;

export const NOTE_COLOR_KEYS = Object.keys(NOTE_COLORS) as [NoteColor, ...NoteColor[]];
