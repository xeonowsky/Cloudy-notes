import Link from "next/link";
import Markdown from "./markdown";
import { CategoryBadge, PriorityBadge } from "./note-meta";
import { togglePin } from "@/app/actions/notes";
import { NOTE_COLORS } from "@/app/lib/note-colors";
import type { Note } from "@/app/lib/notes";

export default function NoteCard({ note }: { note: Note }) {
  const edited = new Date(note.updated_at).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article
      className={`group relative flex flex-col gap-3 border-2 rounded-2xl p-5 text-gray-900 shadow-sm hover:shadow-md duration-300 ${NOTE_COLORS[note.color]?.card ?? NOTE_COLORS.white.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold break-words">
          <Link
            href={`/notatki/${note.id}`}
            className="hover:text-[#3a9e9a] duration-300 after:absolute after:inset-0"
          >
            {note.title}
          </Link>
        </h3>

        {/* relative z-10 — przycisk nad "rozciągniętym" linkiem karty */}
        <form action={togglePin.bind(null, note.id)} className="relative z-10 shrink-0">
          <button
            type="submit"
            title={note.pinned ? "Odepnij" : "Przypnij"}
            aria-label={note.pinned ? "Odepnij notatkę" : "Przypnij notatkę"}
            className={`rounded-full p-1.5 duration-300 cursor-pointer hover:bg-black/10 ${
              note.pinned
                ? "text-[#3a9e9a]"
                : "text-gray-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill={note.pinned ? "currentColor" : "none"}
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
      </div>

      {/* Podgląd treści — ucięty, z wygaszeniem na dole */}
      {note.content.trim() && (
        <div className="relative max-h-48 overflow-hidden text-sm [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
          <Markdown content={note.content} />
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3">
        <CategoryBadge color={note.color} />
        <PriorityBadge priority={note.priority} />
        <span className="ml-auto text-xs text-gray-500">{edited}</span>
      </div>
    </article>
  );
}
