"use client";

import type { FormEvent } from "react";

// Dostaje gotową Server Action z przypiętym id (deleteNote.bind(null, id)).
// Komponent kliencki jest potrzebny tylko po to, żeby zapytać o potwierdzenie.
export default function DeleteNoteButton({ action }: { action: () => Promise<void> }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Na pewno usunąć tę notatkę? Tego nie da się cofnąć.")) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={confirmDelete}>
      <button
        type="submit"
        className="text-sm text-red-600 border-2 border-red-200 rounded-4xl px-4 py-2 hover:bg-red-600 hover:text-white hover:border-red-600 duration-300 cursor-pointer"
      >
        Usuń notatkę
      </button>
    </form>
  );
}
