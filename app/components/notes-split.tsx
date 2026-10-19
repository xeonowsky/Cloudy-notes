import Link from "next/link";
import Markdown from "./markdown";
import DeleteNoteButton from "./delete-note-button";
import { CategoryBadge, PriorityBadge } from "./note-meta";
import { deleteNote, togglePin } from "@/app/actions/notes";
import { NOTE_COLORS } from "@/app/lib/note-colors";
import type { Note } from "@/app/lib/notes";

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });

interface NotesSplitProps {
  notes: Note[];
  selectedId?: string; // id z adresu (?n=…), jeśli użytkownik coś kliknął
}

// Widok "lista": po lewej kolumna z tytułami, po prawej treść wybranej notatki.
// Wybór trzymamy w adresie URL (?n=id) — da się go skopiować i działa przycisk "wstecz".
export default function NotesSplit({ notes, selectedId }: NotesSplitProps) {
  const selected = notes.find((n) => n.id === selectedId) ?? notes[0];
  // Na telefonie: bez ?n= pokazujemy samą listę, z ?n= — samą treść
  const hasSelection = !!selectedId && selected?.id === selectedId;

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      {/* Lewa kolumna */}
      <nav
        aria-label="Lista notatek"
        className={`lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1 ${hasSelection ? "hidden lg:block" : ""}`}
      >
        <ul className="flex flex-col gap-1.5">
          {notes.map((note) => {
            const active = note.id === selected?.id;
            return (
              <li key={note.id}>
                <Link
                  href={`/notatki?n=${note.id}`}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`flex gap-3 rounded-xl px-3 py-3 duration-200 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                    active
                      ? "bg-white shadow-[0_8px_24px_-16px_rgba(22,48,47,0.5)] ring-1 ring-line dark:bg-white/10 dark:ring-white/10"
                      : "hover:bg-mist dark:hover:bg-white/5"
                  }`}
                >
                  {/* pasek w kolorze kategorii */}
                  <span
                    aria-hidden
                    className={`w-1 shrink-0 rounded-full ${NOTE_COLORS[note.color]?.dot ?? "bg-gray-300"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink dark:text-white">{note.title}</span>
                      {note.pinned && (
                        <svg
                          viewBox="0 0 24 24"
                          className="size-3.5 shrink-0 text-brand-deep dark:text-brand"
                          fill="currentColor"
                          aria-label="Przypięta"
                        >
                          <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                        </svg>
                      )}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <CategoryBadge color={note.color} />
                      <PriorityBadge priority={note.priority} />
                      <span className="text-xs text-ink/45 dark:text-white/45">
                        {formatDate(note.updated_at)}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Prawa strona — treść */}
      {selected && (
        <article
          className={`rounded-2xl border-2 p-6 text-gray-900 sm:p-8 ${NOTE_COLORS[selected.color]?.card ?? NOTE_COLORS.white.card} ${
            hasSelection ? "" : "hidden lg:block"
          }`}
        >
          <Link
            href="/notatki"
            scroll={false}
            className="mb-4 inline-flex text-sm font-medium text-brand-deep lg:hidden"
          >
            ← Wszystkie notatki
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <CategoryBadge color={selected.color} />
                <PriorityBadge priority={selected.priority} showLabel />
              </div>
              <h2 className="mt-3 text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] break-words">
                {selected.title}
              </h2>
              <p className="mt-1 text-sm text-ink/50">Edytowano {formatDate(selected.updated_at)}</p>
            </div>

            <div className="flex items-center gap-2">
              <form action={togglePin.bind(null, selected.id)}>
                <button
                  type="submit"
                  title={selected.pinned ? "Odepnij" : "Przypnij"}
                  aria-label={selected.pinned ? "Odepnij notatkę" : "Przypnij notatkę"}
                  className={`grid size-10 cursor-pointer place-items-center rounded-xl border border-black/10 bg-white/70 duration-200 hover:bg-white ${
                    selected.pinned ? "text-brand-deep" : "text-ink/45"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-[18px]"
                    fill={selected.pinned ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                  </svg>
                </button>
              </form>
              <Link
                href={`/notatki/${selected.id}`}
                className="rounded-xl bg-brand-deep px-4 py-2.5 text-sm font-semibold text-white duration-200 hover:bg-[#174744]"
              >
                Edytuj
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t border-black/10 pt-6">
            {selected.content.trim() ? (
              <Markdown content={selected.content} />
            ) : (
              <p className="text-ink/45">Ta notatka nie ma jeszcze treści.</p>
            )}
          </div>

          <div className="mt-10 flex justify-end">
            <DeleteNoteButton action={deleteNote.bind(null, selected.id)} />
          </div>
        </article>
      )}
    </div>
  );
}
