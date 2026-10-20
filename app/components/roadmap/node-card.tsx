import { NODE_H, NODE_W, ROADMAP_STATUSES, type RoadmapNode } from "@/app/lib/roadmap-types";

type Props = {
  node: RoadmapNode;
  selected: boolean;
  connectMode: boolean;
  isConnectSource: boolean;
};

// Sama karta nic nie "wie" o przeciąganiu — zdarzenia myszy obsługuje tablica.
// data-node-id pozwala tablicy rozpoznać, w którą kartę kliknięto.
export default function NodeCard({ node, selected, connectMode, isConnectSource }: Props) {
  const status = ROADMAP_STATUSES[node.status];

  return (
    <div
      data-node-id={node.id}
      style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
      className={`absolute flex flex-col justify-between rounded-xl border-2 bg-white px-3 py-2 shadow-[0_8px_20px_-12px_rgba(22,48,47,0.45)] select-none dark:bg-[#0f1f1e] ${status.card} ${
        connectMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
      } ${selected || isConnectSource ? "ring-4 ring-brand/45" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
        <span className="truncate tracking-wide text-ink/50 uppercase dark:text-white/50">
          {node.category || "Bez kategorii"}
        </span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 ${status.badge}`}>{status.label}</span>
      </div>
      <p className="line-clamp-2 text-sm leading-snug font-semibold text-ink dark:text-white">{node.title}</p>
    </div>
  );
}
