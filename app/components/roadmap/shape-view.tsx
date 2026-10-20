"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { NOTE_COLORS } from "@/app/lib/note-colors";
import { SHAPE_COLORS, TEXT_COLORS, type BoardNote, type RoadmapShape } from "@/app/lib/roadmap-types";
import ChecklistView from "./checklist-view";
import CalendarView from "./calendar-view";

type Props = {
  shape: RoadmapShape;
  selected: boolean;
  editing: boolean;
  note?: BoardNote; // dla kafelka "note" — dane notatki (undefined = usunięta / brak)
  onTextChange: (text: string) => void;
  onTextCommit: () => void;
  // lista zadań i kalendarz zapisują się same (odhaczenie / X = od razu zapis)
  onContentChange: (text: string, save: boolean) => void;
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Wygląd kontenera zależnie od rodzaju kształtu
function frameClass(shape: RoadmapShape, note?: BoardNote) {
  const color = SHAPE_COLORS[shape.color];
  switch (shape.kind) {
    case "rect":
      return `rounded-2xl border-2 ${color.rect}`;
    case "sticky":
      return `rounded-sm shadow-[0_14px_24px_-14px_rgba(0,0,0,0.55)] ${color.sticky}`;
    case "code":
      return `rounded-xl border-2 bg-[#16302f] shadow-[0_8px_20px_-14px_rgba(22,48,47,0.5)] dark:bg-black/60 ${color.accent}`;
    case "note":
      return `rounded-xl border-2 shadow-[0_8px_20px_-14px_rgba(22,48,47,0.5)] ${note ? NOTE_COLORS[note.color].card : "border-dashed border-line bg-white dark:border-white/20 dark:bg-[#0f1f1e]"}`;
    default: // text, checklist, calendar
      return `rounded-xl border shadow-[0_8px_20px_-14px_rgba(22,48,47,0.5)] ${color.block}`;
  }
}

// Kolor tekstu. Karteczka ma jasne tło także w trybie ciemnym, a blok kodu
// zawsze ciemne — dla nich "Domyślny" kolor musi być stały, nie zależny od motywu.
function textColorClass(shape: RoadmapShape) {
  if (shape.textColor === "ink") {
    if (shape.kind === "sticky") return "text-ink";
    if (shape.kind === "code") return "text-slate-100";
  }
  return TEXT_COLORS[shape.textColor].text;
}

// Kształt na tablicy: ramka, tekst, karteczka, kod, lista zadań albo notatka.
// Przesuwanie i zmianę rozmiaru obsługuje tablica — tu jest tylko wygląd
// i edycja treści. data-shape-id / data-resize-id mówią tablicy, co kliknięto.
export default function ShapeView({ shape, selected, editing, note, onTextChange, onTextCommit, onContentChange }: Props) {
  const isRect = shape.kind === "rect";
  const isCode = shape.kind === "code";

  // Styl tekstu: rozmiar i wyrównanie jako style inline (dowolna liczba px),
  // kolor / pogrubienie / kursywa jako klasy Tailwinda (działa tryb ciemny).
  const textStyle: CSSProperties = {
    fontSize: shape.fontSize,
    textAlign: shape.align,
    ...(isCode ? { fontFamily: MONO } : {}),
  };
  const textClass = `${textColorClass(shape)} ${shape.italic ? "italic" : ""} ${
    shape.bold ? "font-bold" : isRect ? "font-medium" : "font-normal"
  }`;
  const placeholderClass =
    shape.kind === "sticky" ? "text-ink/40" : isCode ? "text-slate-400" : "text-ink/40 dark:text-white/40";

  let content;
  if (isRect) {
    // Etykieta ramki u góry, np. "Frontend" — wyrównanie lewo / środek / prawo
    content = (
      <div className="absolute inset-x-3 top-2">
        {editing ? (
          <EditableText
            value={shape.text}
            singleLine
            placeholder="Etykieta ramki"
            onChange={onTextChange}
            onCommit={onTextCommit}
            style={textStyle}
            className={`w-full rounded-md bg-white/80 px-1.5 py-0.5 leading-snug outline-none dark:bg-black/40 ${textClass}`}
          />
        ) : (
          <span
            style={textStyle}
            className={`block truncate leading-snug select-none ${shape.text ? textClass : placeholderClass}`}
          >
            {shape.text || (selected ? "Dwuklik — dodaj etykietę" : "")}
          </span>
        )}
      </div>
    );
  } else if (shape.kind === "checklist") {
    content = <ChecklistView text={shape.text} textClass={textClass} style={textStyle} onChange={onContentChange} />;
  } else if (shape.kind === "calendar") {
    content = <CalendarView text={shape.text} textClass={textClass} style={textStyle} onChange={onContentChange} />;
  } else if (shape.kind === "note") {
    content = <NoteTile note={note} style={{ fontSize: shape.fontSize }} />;
  } else if (editing) {
    content = (
      <EditableText
        value={shape.text}
        placeholder={isCode ? "// wklej albo wpisz kod" : "Wpisz tekst…"}
        code={isCode}
        onChange={onTextChange}
        onCommit={onTextCommit}
        style={textStyle}
        className={`size-full resize-none bg-transparent p-3 outline-none ${isCode ? "leading-normal" : "leading-relaxed"} ${textClass}`}
      />
    );
  } else {
    content = (
      <p
        style={textStyle}
        className={`size-full overflow-hidden p-3 break-words select-none ${
          isCode ? "leading-normal whitespace-pre" : "leading-relaxed whitespace-pre-wrap"
        } ${shape.text ? textClass : placeholderClass}`}
      >
        {shape.text || (isCode ? "// dwuklik, aby wpisać kod" : "Dwuklik, aby pisać")}
      </p>
    );
  }

  return (
    <div
      data-shape-id={shape.id}
      style={{ left: shape.x, top: shape.y, width: shape.w, height: shape.h }}
      className={`absolute ${frameClass(shape, note)} ${selected ? "ring-4 ring-brand/45" : ""}`}
    >
      {content}

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

// Kafelek notatki: tytuł, początek treści i link do pełnej notatki
function NoteTile({ note, style }: { note?: BoardNote; style: CSSProperties }) {
  if (!note) {
    return (
      <div style={style} className="flex size-full flex-col justify-center gap-1 p-3 text-ink/60 select-none dark:text-white/60">
        <p className="font-semibold">Notatka niedostępna</p>
        <p className="text-[0.85em]">Została usunięta albo nie wybrano żadnej. Dwuklik — wybierz inną.</p>
      </div>
    );
  }
  return (
    <div style={style} className="flex size-full flex-col gap-1.5 overflow-hidden p-3 text-ink select-none">
      <div className="flex items-start gap-2">
        <span aria-hidden className={`mt-[0.45em] size-2 shrink-0 rounded-full ${NOTE_COLORS[note.color].dot}`} />
        <p className="line-clamp-2 flex-1 font-semibold leading-snug">{note.title}</p>
      </div>
      <p className="line-clamp-4 min-h-0 flex-1 text-[0.85em] leading-relaxed text-ink/70">
        {note.excerpt || "Pusta notatka"}
      </p>
      <Link
        href={`/notatki/${note.id}`}
        className="self-start text-[0.85em] font-medium text-brand-deep underline-offset-2 hover:underline"
      >
        Otwórz notatkę →
      </Link>
    </div>
  );
}

type EditableTextProps = {
  value: string;
  placeholder: string;
  singleLine?: boolean;
  code?: boolean;
  className: string;
  style?: CSSProperties;
  onChange: (text: string) => void;
  onCommit: () => void;
};

// Pole edycji tekstu. Fokus ustawiamy w setTimeout, a nie przez autoFocus:
// pole pojawia się w trakcie kliknięcia, a przeglądarka po kliknięciu sama
// przestawia fokus — autoFocus zostałby od razu "zabrany" (blur = koniec edycji).
function EditableText({ value, placeholder, singleLine, code, className, style, onChange, onCommit }: EditableTextProps) {
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
    style,
    spellCheck: code ? false : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onBlur: onCommit,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Esc kończy edycję; w etykiecie także Enter
      if (e.key === "Escape" || (singleLine && e.key === "Enter")) {
        e.currentTarget.blur();
        return;
      }
      // W kodzie Tab wstawia 2 spacje zamiast przenosić fokus dalej
      if (code && e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const el = e.currentTarget;
        const { selectionStart: start, selectionEnd: end } = el;
        onChange(`${el.value.slice(0, start ?? 0)}  ${el.value.slice(end ?? 0)}`);
        // kursor za wstawionymi spacjami — po tym, jak React wpisze nową wartość
        requestAnimationFrame(() => el.setSelectionRange((start ?? 0) + 2, (start ?? 0) + 2));
      }
    },
  };

  return singleLine ? <input {...shared} maxLength={80} /> : <textarea {...shared} maxLength={2000} />;
}
