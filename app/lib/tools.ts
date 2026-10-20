import type { FeatureIcon } from "./features";

// Narzędzia aplikacji — jedno źródło dla menu "Narzędzia" (desktop),
// menu mobilnego i stopki. Nowe narzędzie = nowa pozycja tutaj.
export type AppTool = {
  href: string;
  title: string;
  description: string;
  icon: FeatureIcon;
};

export const TOOLS: AppTool[] = [
  {
    href: "/notatki",
    title: "Notatki",
    description: "Zapisuj pomysły, listy zadań i plany z formatowaniem.",
    icon: "notes",
  },
  {
    href: "/board",
    title: "Board",
    description: "Tablica do układania stacku wiedzy: karty, ramki, tekst i strzałki.",
    icon: "board",
  },
];

/** Czy adres należy do danego narzędzia (także podstrony, np. /notatki/nowa) */
export function isToolActive(tool: AppTool, pathname: string): boolean {
  return pathname === tool.href || pathname.startsWith(`${tool.href}/`);
}
