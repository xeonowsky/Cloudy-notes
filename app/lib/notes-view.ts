// Nazwa ciasteczka z wybranym widokiem notatek. Osobny plik, bo plik
// z "use server" może eksportować wyłącznie funkcje async.
export const NOTES_VIEW_COOKIE = "cn_notes_view";

export type NotesView = "siatka" | "lista";
