import type { CSSProperties } from "react";
import Markdown from "../markdown";
import { NOTE_COLORS, type NoteColor } from "@/app/lib/note-colors";

export type SampleNote = {
  title: string;
  content: string; // Markdown — renderowany tym samym komponentem co prawdziwe notatki
  color: NoteColor;
  rotate: number; // stopnie
  shift: "left" | "right" | "center";
};

const SHIFT = { left: "-ml-24", right: "ml-24", center: "" } as const;

export default function SampleNotes({ notes }: { notes: SampleNote[] }) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      {notes.map((note, i) => (
        <article
          key={note.title}
          className={`note-settle w-72 rounded-2xl border-2 p-5 text-gray-900 shadow-[0_22px_40px_-26px_rgba(22,48,47,0.55)] ${NOTE_COLORS[note.color].card} ${SHIFT[note.shift]} ${i > 0 ? "-mt-5" : ""}`}
          style={{ "--r": `${note.rotate}deg`, animationDelay: `${150 + i * 140}ms` } as CSSProperties}
        >
          <h2 className="mb-2 font-bold">{note.title}</h2>
          <div className="text-sm">
            <Markdown content={note.content} />
          </div>
        </article>
      ))}
    </div>
  );
}
