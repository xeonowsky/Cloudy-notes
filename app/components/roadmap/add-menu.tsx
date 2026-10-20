"use client";

import type { ReactNode } from "react";
import { useDropdown } from "../nav/use-dropdown";

export type AddKind = "node" | "sticky" | "code" | "checklist" | "calendar" | "note";

type Props = { onAdd: (kind: AddKind) => void };

const ITEMS: { kind: AddKind; label: string; description: string; shortcut?: string; icon: ReactNode }[] = [
  {
    kind: "node",
    label: "Element stacku",
    description: "Technologia ze statusem nauki",
    shortcut: "N",
    icon: <rect x="3" y="5" width="14" height="10" rx="2.5" />,
  },
  {
    kind: "sticky",
    label: "Karteczka",
    description: "Kolorowa karteczka na szybką myśl",
    icon: <path d="M4 3.5h12v8.5l-4 4.5H4zM12 16.5V12h4" />,
  },
  {
    kind: "checklist",
    label: "Lista zadań",
    description: "Punkty do odhaczania z postępem",
    icon: <path d="M3.5 5.5l1.5 1.5 2.5-3M3.5 12.5l1.5 1.5 2.5-3M10 6h6.5M10 13h6.5" />,
  },
  {
    kind: "calendar",
    label: "Kalendarz",
    description: "Klik w dzień stawia X — śledź nawyki",
    icon: <path d="M3.5 5h13v11.5h-13zM3.5 8.5h13M7 3v3.5M13 3v3.5M8 11l3 3M11 11l-3 3" />,
  },
  {
    kind: "code",
    label: "Blok kodu",
    description: "Snippet z czcionką o stałej szerokości",
    icon: <path d="M7 6l-4 4 4 4M13 6l4 4-4 4M11 4.5l-2 11" />,
  },
  {
    kind: "note",
    label: "Notatka z Cloudy Notes",
    description: "Podgląd notatki z linkiem do niej",
    icon: <path d="M5 3h7l3 3v11H5zM12 3v3h3M7.5 10h5M7.5 13h5" />,
  },
];

// Rozwijane menu "+ Dodaj" w toolbarze tablicy. Zamykanie (klik obok, Esc)
// daje wspólny hook useDropdown — ten sam, którego używa menu w nagłówku.
export default function AddMenu({ onAdd }: Props) {
  const { open, rootRef, panelId, toggle, close, buttonProps } = useDropdown();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        {...buttonProps}
        aria-haspopup="menu"
        className="flex h-9 cursor-pointer items-center gap-1 rounded-lg bg-brand-deep px-3 text-sm font-medium text-white duration-200 hover:bg-[#174744] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none dark:bg-brand dark:text-ink dark:hover:bg-[#7fd6d2]"
      >
        + Dodaj
        <svg viewBox="0 0 20 20" className={`size-4 duration-200 ${open ? "rotate-180" : ""}`} fill="currentColor" aria-hidden>
          <path d="M5.2 7.7a.75.75 0 0 1 1.06 0L10 11.44l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.76a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label="Dodaj do tablicy"
          className="absolute top-[calc(100%+8px)] left-0 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-1.5 shadow-[0_28px_60px_-28px_rgba(22,48,47,0.45)] dark:border-white/10 dark:bg-[#0f1f1e]"
        >
          {ITEMS.map((item) => (
            <button
              key={item.kind}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onAdd(item.kind);
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-left duration-200 hover:bg-mist/70 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none dark:hover:bg-white/5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-mist text-brand-deep dark:bg-white/10 dark:text-brand">
                <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {item.icon}
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink dark:text-white">{item.label}</span>
                <span className="block text-xs text-ink/60 dark:text-white/60">{item.description}</span>
              </span>
              {item.shortcut && (
                <kbd className="rounded border border-line px-1.5 text-xs text-ink/50 dark:border-white/15 dark:text-white/50">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
