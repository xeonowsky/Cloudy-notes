"use client";

import { useEffect, useRef } from "react";
import { SHAPE_COLORS, type RoadmapShape } from "@/app/lib/roadmap-types";

type Props = {
  shape: RoadmapShape;
  selected: boolean;
  editing: boolean;
  onTextChange: (text: string) => void;
  onTextCommit: () => void;
};

// Prostokąt (ramka z etykietą) albo klocek z tekstem.
// Przesuwanie i zmianę rozmiaru obsługuje tablica — tu jest tylko wygląd
// i edycja tekstu. data-shape-id / data-resize-id mówią tablicy, co kliknięto.
export default function ShapeView({ shape, selected, editing, onTextChange, onTextCommit }: Props) {
  const color = SHAPE_COLORS[shape.color];
  const isRect = shape.kind === "rect";

  return (
    <div
      data-shape-id={shape.id}
      style={{ left: shape.x, top: shape.y, width: shape.w, height: shape.h }}
      className={`absolute ${
        isRect ? `rounded-2xl border-2 ${color.rect}` : `rounded-xl border shadow-[0_8px_20px_-14px_rgba(22,48,47,0.5)] ${color.block}`
      } ${selected ? "ring-4 ring-brand/45" : ""}`}
    >
      {isRect ? (
        // Etykieta ramki w lewym górnym rogu, np. "Frontend"
        <div className="absolute top-2 left-3 max-w-[calc(100%-1.5rem)]">
          {editing ? (
            <EditableText
              value={shape.text}
              singleLine
              placeholder="Etykieta ramki"
              onChange={onTextChange}
              onCommit={onTextCommit}
              className="w-56 max-w-full rounded-md bg-white/80 px-1.5 py-0.5 text-sm font-semibold text-ink outline-none dark:bg-black/40 dark:text-white"
            />
          ) : (
            <span className="block truncate text-sm font-semibold text-ink/75 select-none dark:text-white/75">
              {shape.text || (selected ? "Dwuklik — dodaj etykietę" : "")}
            </span>
          )}
        </div>
      ) : editing ? (
        <EditableText
          value={shape.text}
          placeholder="Wpisz tekst…"
          onChange={onTextChange}
          onCommit={onTextCommit}
          className="size-full resize-none bg-transparent p-3 text-sm leading-relaxed text-ink outline-none dark:text-white"
        />
      ) : (
        <p
          className={`size-full overflow-hidden p-3 text-sm leading-relaxed break-words whitespace-pre-wrap select-none ${
            shape.text ? "text-ink dark:text-white" : "text-ink/40 dark:text-white/40"
          }`}
        >
          {shape.text || "Dwuklik, aby pisać"}
        </p>
      )}

      {/* Uchwyt zmiany rozmiaru — tylko na zaznaczonym kształcie */}
      {selected && !editing && (
        <div
          data-resize-id={shape.id}
          aria-hidden
          className="absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-sm border-2 border-brand-deep bg-white dark:border-brand dark:bg-[#0f1f1e]"
        />
      )}
    </div>
  );
}

type EditableTextProps = {
  value: string;
  placeholder: string;
  singleLine?: boolean;
  className: string;
  onChange: (text: string) => void;
  onCommit: () => void;
};

// Pole edycji tekstu. Fokus ustawiamy w setTimeout, a nie przez autoFocus:
// pole pojawia się w trakcie kliknięcia, a przeglądarka po kliknięciu sama
// przestawia fokus — autoFocus zostałby od razu "zabrany" (blur = koniec edycji).
function EditableText({ value, placeholder, singleLine, className, onChange, onCommit }: EditableTextProps) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length); // kursor na końcu
    });
    return () => clearTimeout(id);
  }, []);

  const shared = {
    ref,
    value,
    placeholder,
    className,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onBlur: onCommit,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Esc kończy edycję; w etykiecie także Enter
      if (e.key === "Escape" || (singleLine && e.key === "Enter")) e.currentTarget.blur();
    },
  };

  return singleLine ? <input {...shared} maxLength={80} /> : <textarea {...shared} maxLength={2000} />;
}
