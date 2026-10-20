import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import {
  FONT_SIZE_RANGE,
  FONT_SIZES,
  SHAPE_COLOR_KEYS,
  SHAPE_COLORS,
  SHAPE_KIND_LABELS,
  TEXT_ALIGNS,
  TEXT_COLOR_KEYS,
  TEXT_COLORS,
  type RoadmapShape,
  type ShapeColor,
  type ShapeKind,
  type ShapeTextStyle,
  type TextAlign,
} from "@/app/lib/roadmap-types";
import { clamp } from "./geometry";

type Props = {
  shape: RoadmapShape;
  editing: boolean;
  onColor: (color: ShapeColor) => void;
  onStyle: (patch: Partial<ShapeTextStyle>) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

const legend = "mb-2 text-sm font-medium text-ink dark:text-white";
const toggle = (on: boolean) =>
  `grid h-8 min-w-8 cursor-pointer place-items-center rounded-lg px-2 text-sm duration-200 ${
    on
      ? "bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white"
      : "text-ink/60 hover:text-ink dark:text-white/60 dark:hover:text-white"
  }`;

// Co robi przycisk "edycji" dla danego rodzaju (lista zadań edytuje się sama)
const EDIT_LABELS: Record<ShapeKind, string | null> = {
  rect: "Etykieta",
  text: "Edytuj tekst",
  sticky: "Edytuj tekst",
  code: "Edytuj kod",
  checklist: null,
  note: "Zmień notatkę",
  calendar: null,
};

const ALIGN_LABELS: Record<TextAlign, string> = { left: "Do lewej", center: "Do środka", right: "Do prawej" };
const ALIGN_ICONS: Record<TextAlign, ReactNode> = {
  left: <path d="M3 5h14M3 10h9M3 15h12" />,
  center: <path d="M3 5h14M5.5 10h9M4 15h12" />,
  right: <path d="M3 5h14M8 10h9M5 15h12" />,
};

// Panel zaznaczonego kształtu: kolor ramki/tła + styl tekstu.
// Działa także w trakcie pisania — onMouseDown z preventDefault sprawia,
// że klik w przycisk NIE zabiera fokusu z edytowanego tekstu (nie kończy edycji).
export default function ShapePanel({ shape, editing, onColor, onStyle, onEdit, onDelete, onClose }: Props) {
  // Kafelek notatki ma kolor i treść z samej notatki — bez koloru i stylu tekstu
  const styled = shape.kind !== "note";
  const editLabel = EDIT_LABELS[shape.kind];

  function keepFocus(e: ReactMouseEvent) {
    if (!(e.target as Element).closest("input")) e.preventDefault();
  }

  return (
    <aside
      onMouseDown={keepFocus}
      className="absolute top-4 right-4 z-20 flex max-h-[calc(100%-2rem)] w-72 max-w-[calc(100%-2rem)] flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-white p-4 shadow-[0_28px_60px_-28px_rgba(22,48,47,0.45)] dark:border-white/10 dark:bg-[#0f1f1e]"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink dark:text-white">{SHAPE_KIND_LABELS[shape.kind]}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij panel"
          className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink/60 hover:bg-mist dark:text-white/60 dark:hover:bg-white/5"
        >
          ✕
        </button>
      </div>

      {styled && (
      <>
      <fieldset>
        <legend className={legend}>Kolor</legend>
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

      <fieldset>
        <legend className={legend}>Rozmiar tekstu</legend>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 flex-wrap gap-1 rounded-xl bg-mist p-1 dark:bg-white/5">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                aria-label={`Rozmiar ${size}`}
                aria-pressed={shape.fontSize === size}
                onClick={() => onStyle({ fontSize: size })}
                className={`${toggle(shape.fontSize === size)} flex-1 text-xs tabular-nums`}
              >
                {size}
              </button>
            ))}
          </div>
          {/* Własny rozmiar — zapis po wyjściu z pola albo Enter */}
          <input
            key={shape.fontSize}
            type="number"
            aria-label="Własny rozmiar tekstu"
            min={FONT_SIZE_RANGE.min}
            max={FONT_SIZE_RANGE.max}
            defaultValue={shape.fontSize}
            onBlur={(e) => {
              const value = Math.round(Number(e.currentTarget.value));
              if (Number.isFinite(value) && value !== shape.fontSize) {
                onStyle({ fontSize: clamp(value, FONT_SIZE_RANGE.min, FONT_SIZE_RANGE.max) });
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="h-9 w-14 rounded-lg border border-line bg-white px-2 text-sm text-ink tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-white/15 dark:bg-white/5 dark:text-white"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Kolor tekstu</legend>
        <div className="flex flex-wrap gap-2">
          {TEXT_COLOR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              title={`Tekst: ${TEXT_COLORS[key].label}`}
              aria-label={`Tekst: ${TEXT_COLORS[key].label}`}
              aria-pressed={shape.textColor === key}
              onClick={() => onStyle({ textColor: key })}
              className={`grid size-7 cursor-pointer place-items-center rounded-full border border-line dark:border-white/15 ${
                shape.textColor === key ? "ring-2 ring-ink ring-offset-2 dark:ring-white dark:ring-offset-[#0f1f1e]" : ""
              }`}
            >
              <span aria-hidden className={`size-4 rounded-full ${TEXT_COLORS[key].swatch}`} />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Styl</legend>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-xl bg-mist p-1 dark:bg-white/5">
            <button
              type="button"
              aria-label="Pogrubienie"
              aria-pressed={shape.bold}
              onClick={() => onStyle({ bold: !shape.bold })}
              className={`${toggle(shape.bold)} font-bold`}
            >
              B
            </button>
            <button
              type="button"
              aria-label="Kursywa"
              aria-pressed={shape.italic}
              onClick={() => onStyle({ italic: !shape.italic })}
              className={`${toggle(shape.italic)} font-serif italic`}
            >
              I
            </button>
          </div>
          <div className="flex gap-1 rounded-xl bg-mist p-1 dark:bg-white/5">
            {TEXT_ALIGNS.map((align) => (
              <button
                key={align}
                type="button"
                aria-label={ALIGN_LABELS[align]}
                aria-pressed={shape.align === align}
                onClick={() => onStyle({ align })}
                className={toggle(shape.align === align)}
              >
                <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
                  {ALIGN_ICONS[align]}
                </svg>
              </button>
            ))}
          </div>
        </div>
      </fieldset>
      </>
      )}

      <div className="flex gap-2">
        {!editing && editLabel && (
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink duration-200 hover:bg-mist dark:border-white/15 dark:text-white dark:hover:bg-white/5"
          >
            {editLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 cursor-pointer rounded-lg border border-danger/30 px-3 py-2 text-sm font-medium text-danger duration-200 hover:bg-danger/5"
        >
          Usuń
        </button>
      </div>
      <p className="text-xs text-ink/50 dark:text-white/50">
        Przeciągnij róg, aby zmienić rozmiar.{" "}
        {shape.kind === "checklist"
          ? "Punkty edytujesz bezpośrednio na liście."
          : shape.kind === "calendar"
            ? "Klik w dzień stawia albo zdejmuje X."
            : "Dwuklik edytuje treść."}
      </p>
    </aside>
  );
}
