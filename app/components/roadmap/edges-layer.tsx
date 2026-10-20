import type { RoadmapEdge } from "@/app/lib/roadmap-types";
import { edgeLine, pointOnBox, type Box } from "./geometry";

type Props = {
  // Prostokąty WSZYSTKICH obiektów (karty i kształty) po id —
  // strzałka może zaczynać się i kończyć na dowolnym z nich
  boxes: Map<string, Box>;
  edges: RoadmapEdge[];
  selectedEdgeId: string | null;
  // podgląd strzałki w trybie łączenia: od obiektu do kursora
  preview: { from: Box; to: { x: number; y: number } } | null;
};

// Warstwa SVG ze strzałkami. Ma rozmiar 1×1 px z overflow: visible —
// rysujemy w tych samych współrzędnych co karty i kształty.
export default function EdgesLayer({ boxes, edges, selectedEdgeId, preview }: Props) {
  return (
    <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width="1" height="1" aria-hidden>
      <defs>
        {/* Grot strzałki — marker doklejany na końcu linii */}
        <marker id="rp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 10 5 0 10z" className="fill-ink/45 dark:fill-white/45" />
        </marker>
        <marker id="rp-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 10 5 0 10z" className="fill-brand-deep dark:fill-brand" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const source = boxes.get(edge.sourceId);
        const target = boxes.get(edge.targetId);
        if (!source || !target) return null;
        const { from, to } = edgeLine(source, target);
        const active = edge.id === selectedEdgeId;
        return (
          <g key={edge.id}>
            {/* Szeroka, przezroczysta linia = większy obszar do kliknięcia */}
            <line
              data-edge-id={edge.id}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="transparent"
              strokeWidth={16}
              className="pointer-events-auto cursor-pointer"
            />
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              strokeWidth={active ? 3 : 2}
              markerEnd={`url(#${active ? "rp-arrow-active" : "rp-arrow"})`}
              className={active ? "stroke-brand-deep dark:stroke-brand" : "stroke-ink/45 dark:stroke-white/45"}
            />
          </g>
        );
      })}

      {preview && (() => {
        const from = pointOnBox(preview.from, preview.to, 2);
        return (
          <line
            x1={from.x} y1={from.y} x2={preview.to.x} y2={preview.to.y}
            strokeWidth={2}
            strokeDasharray="6 6"
            markerEnd="url(#rp-arrow-active)"
            className="stroke-brand-deep dark:stroke-brand"
          />
        );
      })()}
    </svg>
  );
}
