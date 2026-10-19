import { NOTE_COLORS, type NoteColor } from "@/app/lib/note-colors";
import { priorityLabel, type Priority } from "@/app/lib/priority";

/** Kategoria wynikająca z koloru: kolorowa kropka + nazwa (np. "Biznes") */
export function CategoryBadge({ color }: { color: NoteColor }) {
  const meta = NOTE_COLORS[color] ?? NOTE_COLORS.white;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-ink ring-1 ring-black/5">
      <span aria-hidden className={`size-2 rounded-full ${meta.dot}`} />
      {meta.category}
    </span>
  );
}

/** Ważność jako trzy słupki — im wyższa, tym więcej wypełnionych */
export function PriorityBadge({ priority, showLabel = false }: { priority: Priority; showLabel?: boolean }) {
  const high = priority === 2;
  return (
    <span
      title={`Ważność: ${priorityLabel(priority)}`}
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${high ? "text-danger" : "text-ink/55"}`}
    >
      <span aria-hidden className="flex items-end gap-[2px]">
        {[0, 1, 2].map((level) => (
          <span
            key={level}
            className={`w-[3px] rounded-full ${["h-1.5", "h-2.5", "h-3.5"][level]} ${
              level <= priority ? (high ? "bg-danger" : "bg-ink/55") : "bg-ink/15"
            }`}
          />
        ))}
      </span>
      {showLabel ? (
        priorityLabel(priority)
      ) : (
        <span className="sr-only">Ważność: {priorityLabel(priority)}</span>
      )}
    </span>
  );
}
