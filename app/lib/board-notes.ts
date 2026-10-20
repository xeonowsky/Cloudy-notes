import type { Note } from "./notes";
import type { BoardNote } from "./roadmap-types";

// Krótki podgląd treści notatki na tablicy: bez znaczników Markdowna,
// w jednej linii i przycięty — pełna treść jest na stronie notatki.
export function noteExcerpt(content: string, max = 160): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ") // bloki kodu
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // [tekst](link) → tekst
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "") // nagłówki, cytaty, listy
    .replace(/[*_`~]/g, "") // pogrubienia, kursywa, kod
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
}

export function toBoardNote(note: Pick<Note, "id" | "title" | "content" | "color">): BoardNote {
  return { id: note.id, title: note.title, excerpt: noteExcerpt(note.content), color: note.color };
}
