import {
  ROADMAP_CATEGORY_HINTS,
  ROADMAP_STATUS_KEYS,
  ROADMAP_STATUSES,
  type RoadmapNode,
} from "@/app/lib/roadmap-types";

type Props = {
  node: RoadmapNode;
  autoFocusTitle: boolean;
  // save = false: tylko zmiana na ekranie (pisanie), true: zapis do bazy
  onChange: (patch: Partial<RoadmapNode>, save: boolean) => void;
  onDelete: () => void;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-white/15 dark:bg-white/5 dark:text-white";

// Panel edycji zaznaczonej karty. Tekst zapisujemy przy opuszczeniu pola (onBlur),
// a nie przy każdym znaku — inaczej wysyłalibyśmy zapytanie po każdym klawiszu.
export default function NodePanel({ node, autoFocusTitle, onChange, onDelete, onClose }: Props) {
  return (
    <aside className="absolute top-4 right-4 z-20 flex w-72 max-w-[calc(100%-2rem)] flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_28px_60px_-28px_rgba(22,48,47,0.45)] dark:border-white/10 dark:bg-[#0f1f1e]">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink dark:text-white">Element</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij panel"
          className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink/60 hover:bg-mist dark:text-white/60 dark:hover:bg-white/5"
        >
          ✕
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-ink dark:text-white">
        Nazwa
        <input
          className={inputClass}
          value={node.title}
          maxLength={80}
          autoFocus={autoFocusTitle}
          onFocus={autoFocusTitle ? (e) => e.currentTarget.select() : undefined}
          onChange={(e) => onChange({ title: e.target.value }, false)}
          onBlur={() => onChange({ title: node.title.trim() || "Bez nazwy" }, true)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-ink dark:text-white">
        Kategoria
        <input
          className={inputClass}
          value={node.category}
          maxLength={40}
          list="roadmap-categories"
          placeholder="np. Frontend"
          onChange={(e) => onChange({ category: e.target.value }, false)}
          onBlur={() => onChange({ category: node.category.trim() }, true)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
        <datalist id="roadmap-categories">
          {ROADMAP_CATEGORY_HINTS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium text-ink dark:text-white">Status</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-mist p-1 dark:bg-white/5">
          {ROADMAP_STATUS_KEYS.map((key) => {
            const active = node.status === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ status: key }, true)}
                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium duration-200 ${
                  active
                    ? "bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white"
                    : "text-ink/60 hover:text-ink dark:text-white/60 dark:hover:text-white"
                }`}
              >
                <span aria-hidden className={`size-2 rounded-full ${ROADMAP_STATUSES[key].dot}`} />
                {ROADMAP_STATUSES[key].label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={onDelete}
        className="cursor-pointer rounded-lg border border-danger/30 px-3 py-2 text-sm font-medium text-danger duration-200 hover:bg-danger/5"
      >
        Usuń element
      </button>
    </aside>
  );
}
