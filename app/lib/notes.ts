import { sql } from "./db";
import { NoteIdSchema } from "./definitions";
import type { NoteColor } from "./note-colors";
import type { Priority } from "./priority";

// Warstwa dostępu do danych: KAŻDE zapytanie ma warunek user_id.
// Dzięki temu nawet jeśli ktoś podmieni id w adresie, nie zobaczy
// cudzej notatki — baza po prostu jej nie zwróci.

export type Note = {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  priority: Priority;
  pinned: boolean;
  created_at: Date;
  updated_at: Date;
};

export async function getNotesForUser(userId: string): Promise<Note[]> {
  const rows = await sql`
    SELECT id, title, content, color, priority, pinned, created_at, updated_at
    FROM notes
    WHERE user_id = ${userId}
    ORDER BY pinned DESC, updated_at DESC
  `;
  return rows as Note[];
}

export async function getNoteForUser(userId: string, noteId: string): Promise<Note | null> {
  // Niepoprawne UUID wywołałoby błąd Postgresa — odrzucamy je wcześniej
  if (!NoteIdSchema.safeParse(noteId).success) return null;

  const rows = await sql`
    SELECT id, title, content, color, priority, pinned, created_at, updated_at
    FROM notes
    WHERE id = ${noteId} AND user_id = ${userId}
  `;
  return (rows[0] as Note | undefined) ?? null;
}
