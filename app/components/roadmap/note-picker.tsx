"use client";

import Link from "next/link";
import { useState } from "react";
import { NOTE_COLORS } from "@/app/lib/note-colors";
import type { BoardNote } from "@/app/lib/roadmap-types";

type Props = {
  notes: BoardNote[];
  currentId: string | null;
  onPick: (noteId: string) => void;
  onClose: () => void;
};

// Okno wyboru notatki z Cloudy Notes (dodanie kafelka albo podmiana notatki).
export default function NotePicker({ notes, currentId, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const found = q ? notes.filter((n) => `${n.title} ${n.excerpt}`.toLowerCase().includes(q)) : notes;

  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-ink/30 p-4 dark:bg-black/50"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()} // klik w tło zamyka
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Wybierz notatkę"
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          e.stopPropagation(); // Esc zamyka tylko okno — nie dociera do skrótów tablicy
          onClose();
        }}
        className="flex max-h-[min(32rem,100%)] w-full max-w-md flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-[0_28px_60px_-28px_rgba(22,48,47,0.45)] dark:border-white/10 dark:bg-[#0f1f1e]"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink dark:text-white">Wybierz notatkę</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink/60 hover:bg-mist dark:text-white/60 dark:hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-ink/70 dark:text-white/70">
            Nie masz jeszcze notatek.{" "}
            <Link href="/notatki/nowa" className="font-medium text-brand-deep underline dark:text-brand">
              Utwórz pierwszą
            </Link>
          </p>
        ) : (
          <>
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj w notatkach…"
              aria-label="Szukaj notatki"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <ul className="-mx-1 flex min-h-0 flex-col gap-1 overflow-y-auto px-1">
              {found.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => onPick(note.id)}
                    aria-current={note.id === currentId ? "true" : undefined}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-xl p-2.5 text-left duration-200 hover:bg-mist/70 dark:hover:bg-white/5 ${
                      note.id === currentId ? "bg-mist/70 dark:bg-white/5" : ""
                    }`}
                  >
                    <span aria-hidden className={`mt-1.5 size-2.5 shrink-0 rounded-full ${NOTE_COLORS[note.color].dot}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink dark:text-white">{note.title}</span>
                      {note.excerpt && (
                        <span className="line-clamp-2 text-xs text-ink/60 dark:text-white/60">{note.excerpt}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
              {found.length === 0 && <li className="p-2 text-sm text-ink/60 dark:text-white/60">Brak wyników.</li>}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
