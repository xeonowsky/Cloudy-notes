// Lista możliwości aplikacji — jedno źródło dla menu i strony głównej.
// "notes" i "board" to ikony narzędzi (menu Narzędzia, app/lib/tools.ts)
export type FeatureIcon = "format" | "list" | "color" | "lock" | "notes" | "board";

export type Feature = {
  id: string; // kotwica na stronie głównej, np. /#formatowanie
  icon: FeatureIcon;
  title: string;
  description: string;
};

export const FEATURES: Feature[] = [
  {
    id: "formatowanie",
    icon: "format",
    title: "Formatowanie",
    description: "Pogrubienia, nagłówki i zakreślacz jednym kliknięciem albo skrótem Ctrl+B.",
  },
  {
    id: "listy",
    icon: "list",
    title: "Listy zadań",
    description: "Checklisty, listy punktowane i numerowane prosto w treści notatki.",
  },
  {
    id: "kolory",
    icon: "color",
    title: "Kolory i przypinanie",
    description: "Sześć kolorów kart, a najważniejsze notatki zawsze na górze listy.",
  },
  {
    id: "prywatnosc",
    icon: "lock",
    title: "Prywatność",
    description: "Notatki widzisz tylko ty, a hasło nigdy nie jest zapisywane wprost.",
  },
];
