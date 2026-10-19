import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MainButton from "../components/button";
import NoteCard from "../components/note-card";
import NotesSplit from "../components/notes-split";
import ViewToggle from "../components/view-toggle";
import { getCurrentUser } from "../lib/session";
import { getNotesForUser } from "../lib/notes";
import { NOTES_VIEW_COOKIE, type NotesView } from "../lib/notes-view";

export const metadata: Metadata = { title: "Moje notatki | Cloudy Notes" };

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  const [notes, { n: selectedId }, cookieStore] = await Promise.all([
    getNotesForUser(user.id),
    searchParams,
    cookies(),
  ]);
  const view: NotesView = cookieStore.get(NOTES_VIEW_COOKIE)?.value === "lista" ? "lista" : "siatka";

  const pinned = notes.filter((n) => n.pinned);
  const others = notes.filter((n) => !n.pinned);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink dark:text-white">Twoje notatki</h1>
          <p className="text-sm text-ink/60 dark:text-white/60">
            {notes.length === 0 ? "Jeszcze nic tu nie ma" : `Liczba notatek: ${notes.length}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {notes.length > 0 && <ViewToggle current={view} />}
          <MainButton text="+ Nowa notatka" href="/notatki/nowa" />
        </div>
      </div>

      {notes.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-brand p-12 text-center">
          <p className="text-lg">Zapisz swój pierwszy pomysł ☁️</p>
          <MainButton isPrimary={false} text="Utwórz notatkę" href="/notatki/nowa" />
        </div>
      )}

      {notes.length > 0 && view === "lista" && <NotesSplit notes={notes} selectedId={selectedId} />}

      {notes.length > 0 && view === "siatka" && (
        <>
          {pinned.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-ink/60 dark:text-white/60">Przypięte</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pinned.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="flex flex-col gap-3">
              {pinned.length > 0 && (
                <h2 className="text-sm font-semibold text-ink/60 dark:text-white/60">Pozostałe</h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
