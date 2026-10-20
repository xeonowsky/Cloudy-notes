import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RoadmapBoard from "../components/roadmap/roadmap-board";
import { getCurrentUser } from "../lib/session";
import { getRoadmapForUser } from "../lib/roadmap";
import { getNotesForUser } from "../lib/notes";
import { toBoardNote } from "../lib/board-notes";

export const metadata: Metadata = { title: "Board | Cloudy Notes" };

// Strona serwerowa: sprawdza sesję i pobiera dane z bazy.
// Całą interakcję (przeciąganie, zoom) robi komponent kliencki RoadmapBoard,
// który dostaje dane startowe jako propsy.
export default async function BoardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  // Tablica i notatki (do kafelków "Notatka z Cloudy Notes") — równolegle
  const [{ nodes, edges, shapes }, notes] = await Promise.all([
    getRoadmapForUser(user.id),
    getNotesForUser(user.id),
  ]);

  return (
    // 4rem = wysokość navbaru, tablica zajmuje resztę ekranu
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <h1 className="text-2xl font-semibold text-ink dark:text-white">Board</h1>
        <p className="text-sm text-ink/60 dark:text-white/60">
          Ułóż swój stack wiedzy: dodawaj technologie, grupuj je w ramki, dopisuj notatki i łącz strzałkami w kolejności nauki.
        </p>
      </div>
      <div className="relative min-h-0 flex-1 border-t border-line dark:border-white/10">
        <RoadmapBoard
          initialNodes={nodes}
          initialEdges={edges}
          initialShapes={shapes}
          notes={notes.map(toBoardNote)}
        />
      </div>
    </div>
  );
}
