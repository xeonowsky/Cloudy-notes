"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NOTES_VIEW_COOKIE, type NotesView } from "@/app/lib/notes-view";
import { revalidatePath } from "next/cache";
import { sql } from "@/app/lib/db";
import { getCurrentUser, type User } from "@/app/lib/session";
import {
  NoteIdSchema,
  NoteSchema,
  toFieldErrors,
  type NoteFormState,
} from "@/app/lib/definitions";

// Każda akcja zaczyna się od sprawdzenia, KTO ją wywołuje.
// Server Action to publiczny endpoint — da się go wywołać z pominięciem
// formularza, więc nie wystarczy, że strona jest chroniona.
async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");
  return user;
}

export async function createNote(_prev: NoteFormState, formData: FormData): Promise<NoteFormState> {
  const user = await requireUser();

  const result = NoteSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { errors: toFieldErrors(result.error) };

  const { title, content, color, priority, pinned } = result.data;
  try {
    await sql`
      INSERT INTO notes (user_id, title, content, color, priority, pinned)
      VALUES (${user.id}, ${title}, ${content}, ${color}, ${priority}, ${pinned})
    `;
  } catch (error) {
    console.error("Błąd tworzenia notatki:", error);
    return { message: "Nie udało się zapisać notatki. Spróbuj ponownie." };
  }

  revalidatePath("/notatki"); // lista notatek ma się odświeżyć
  redirect("/notatki");
}

// noteId jest "przypięte" do akcji przez .bind(null, id) na stronie edycji,
// dlatego jest pierwszym parametrem — przed stanem i FormData.
export async function updateNote(
  noteId: string,
  _prev: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const user = await requireUser();
  if (!NoteIdSchema.safeParse(noteId).success) return { message: "Nie znaleziono notatki." };

  const result = NoteSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { errors: toFieldErrors(result.error) };

  const { title, content, color, priority, pinned } = result.data;
  try {
    const rows = await sql`
      UPDATE notes
      SET title = ${title}, content = ${content}, color = ${color},
          priority = ${priority}, pinned = ${pinned}, updated_at = now()
      WHERE id = ${noteId} AND user_id = ${user.id}
      RETURNING id
    `;
    // 0 wierszy = notatka nie istnieje albo należy do kogoś innego
    if (rows.length === 0) return { message: "Nie znaleziono notatki." };
  } catch (error) {
    console.error("Błąd zapisu notatki:", error);
    return { message: "Nie udało się zapisać zmian. Spróbuj ponownie." };
  }

  revalidatePath("/notatki");
  redirect("/notatki");
}

export async function deleteNote(noteId: string): Promise<void> {
  const user = await requireUser();
  if (NoteIdSchema.safeParse(noteId).success) {
    await sql`DELETE FROM notes WHERE id = ${noteId} AND user_id = ${user.id}`;
  }
  revalidatePath("/notatki");
  redirect("/notatki");
}

export async function togglePin(noteId: string): Promise<void> {
  const user = await requireUser();
  if (!NoteIdSchema.safeParse(noteId).success) return;

  // NOT pinned — baza sama odwraca wartość, nie musimy jej najpierw czytać
  await sql`
    UPDATE notes SET pinned = NOT pinned
    WHERE id = ${noteId} AND user_id = ${user.id}
  `;
  revalidatePath("/notatki");
}

// ---------- Widok listy notatek (siatka / lista) ----------

// Zapamiętujemy wybór w ciasteczku, żeby widok nie wracał do domyślnego
// po zapisaniu albo usunięciu notatki.
export async function setNotesView(view: NotesView): Promise<void> {
  const safe = view === "lista" ? "lista" : "siatka"; // argument mógł zostać podmieniony
  (await cookies()).set(NOTES_VIEW_COOKIE, safe, {
    path: "/notatki",
    maxAge: 60 * 60 * 24 * 365, // rok
    sameSite: "lax",
  });
  redirect("/notatki");
}
