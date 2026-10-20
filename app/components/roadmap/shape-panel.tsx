import { SHAPE_COLOR_KEYS, SHAPE_COLORS, type RoadmapShape, type ShapeColor } from "@/app/lib/roadmap-types";

type Props = {
  shape: RoadmapShape;
  onColor: (color: ShapeColor) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function ShapePanel({ shape, onColor, onEdit, onDelete, onClose }: Props) {
  return (
    <aside className="absolute top-4 right-4 z-20 flex w-64 max-w-[calc(100%-2rem)] flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_28px_60px_-28px_rgba(22,48,47,0.45)] dark:border-white/10 dark:bg-[#0f1f1e]">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink dark:text-white">{shape.kind === "rect" ? "Prostokąt" : "Blok tekstu"}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij panel"
          className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink/60 hover:bg-mist dark:text-white/60 dark:hover:bg-white/5"
        >
          ✕
        </button>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink dark:text-white">Kolor</legend>
        <div className="flex flex-wrap gap-2">
          {SHAPE_COLOR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              title={SHAPE_COLORS[key].label}
              aria-label={SHAPE_COLORS[key].label}
              aria-pressed={shape.color === key}
              onClick={() => onColor(key)}
              className={`size-7 cursor-pointer rounded-full ${SHAPE_COLORS[key].swatch} ${
                shape.color === key ? "ring-2 ring-ink ring-offset-2 dark:ring-white dark:ring-offset-[#0f1f1e]" : ""
              }`}
            />
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink duration-200 hover:bg-mist dark:border-white/15 dark:text-white dark:hover:bg-white/5"
        >
          {shape.kind === "rect" ? "Etykieta" : "Edytuj tekst"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 cursor-pointer rounded-lg border border-danger/30 px-3 py-2 text-sm font-medium text-danger duration-200 hover:bg-danger/5"
        >
          Usuń
        </button>
      </div>
      <p className="text-xs text-ink/50 dark:text-white/50">Przeciągnij róg, aby zmienić rozmiar. Dwuklik edytuje tekst.</p>
    </aside>
  );
}
