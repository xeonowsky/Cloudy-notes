import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import NoteEditor from "../../components/note-editor";
import DeleteNoteButton from "../../components/delete-note-button";
import { getCurrentUser } from "../../lib/session";
import { getNoteForUser } from "../../lib/notes";
import { deleteNote, updateNote } from "../../actions/notes";

export const metadata: Metadata = { title: "Edycja notatki | Cloudy Notes" };

// W Next 16 params to Promise — trzeba je "odczekać" (await)
export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  const { id } = await params;
  const note = await getNoteForUser(user.id, id);
  if (!note) notFound(); // nie istnieje albo należy do kogoś innego

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl">Edycja notatki</h2>
        {/* .bind(null, id) tworzy nową funkcję z już wpisanym id notatki */}
        <DeleteNoteButton action={deleteNote.bind(null, note.id)} />
      </div>
      <NoteEditor
        action={updateNote.bind(null, note.id)}
        submitLabel="Zapisz zmiany"
        initial={{
          title: note.title,
          content: note.content,
          color: note.color,
          priority: note.priority,
          pinned: note.pinned,
        }}
      />
    </div>
  );
}
