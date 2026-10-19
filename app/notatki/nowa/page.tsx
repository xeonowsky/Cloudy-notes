import type { Metadata } from "next";
import { redirect } from "next/navigation";
import NoteEditor from "../../components/note-editor";
import { getCurrentUser } from "../../lib/session";
import { createNote } from "../../actions/notes";

export const metadata: Metadata = { title: "Nowa notatka | Cloudy Notes" };

export default async function NewNotePage() {
  if (!(await getCurrentUser())) redirect("/logowanie");

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10 flex flex-col gap-6">
      <h2 className="text-2xl">Nowa notatka</h2>
      <NoteEditor action={createNote} submitLabel="Zapisz notatkę" />
    </div>
  );
}
