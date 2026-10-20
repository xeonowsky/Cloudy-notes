"use client";

import type { CSSProperties } from "react";
import { parseChecklist, serializeChecklist, type Checklist } from "@/app/lib/checklist";

type Props = {
  text: string;
  textClass: string;
  style: CSSProperties;
  // save = false: tylko widok (pisanie), true: zapis do bazy
  onChange: (text: string, save: boolean) => void;
};

const fieldClass = "min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink/35 dark:placeholder:text-white/35";

// Lista zadań. Pola i przyciski działają od razu, bez "trybu edycji" —
// tablica ignoruje kliknięcia w input/button, więc nie przesuwają one kafelka.
// Złapać i przesunąć listę można za nagłówek albo puste miejsce.
export default function ChecklistView({ text, textClass, style, onChange }: Props) {
  const list = parseChecklist(text);
  const done = list.items.filter((i) => i.done).length;
  const total = list.items.length;

  const update = (next: Checklist, save: boolean) => onChange(serializeChecklist(next), save);
  const setItem = (index: number, patch: Partial<Checklist["items"][number]>, save: boolean) =>
    update({ ...list, items: list.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }, save);

  return (
    <div className={`flex size-full flex-col gap-2 overflow-hidden p-3 ${textClass}`} style={style}>
      <div className="flex items-center gap-2">
        <input
          value={list.title}
          placeholder="Lista zadań"
          aria-label="Tytuł listy"
          maxLength={80}
          onChange={(e) => update({ ...list, title: e.target.value }, false)}
          onBlur={() => update(list, true)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={`${fieldClass} font-semibold`}
        />
        <span className="shrink-0 text-[0.8em] opacity-60 tabular-nums">
          {done}/{total}
        </span>
      </div>

      {/* Pasek postępu */}
      <div className="h-1.5 shrink-0 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-brand duration-300"
          style={{ width: total ? `${(done / total) * 100}%` : 0 }}
        />
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {list.items.map((item, i) => (
          <li key={i} className="group flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.done}
              aria-label={`Zrobione: ${item.text || "punkt"}`}
              onChange={(e) => setItem(i, { done: e.target.checked }, true)}
              className="size-[1em] shrink-0 cursor-pointer accent-brand-deep dark:accent-brand"
            />
            <input
              value={item.text}
              placeholder="Punkt"
              aria-label={`Punkt ${i + 1}`}
              maxLength={200}
              onChange={(e) => setItem(i, { text: e.target.value }, false)}
              onBlur={() => update(list, true)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className={`${fieldClass} ${item.done ? "line-through opacity-50" : ""}`}
            />
            <button
              type="button"
              aria-label={`Usuń punkt ${i + 1}`}
              onClick={() => update({ ...list, items: list.items.filter((_, j) => j !== i) }, true)}
              className="cursor-pointer px-1 text-[0.85em] opacity-0 duration-150 group-hover:opacity-50 hover:opacity-100! focus-visible:opacity-100"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* Nowy punkt: Enter dodaje i czyści pole, fokus zostaje — można wpisywać kolejne */}
      <input
        placeholder="+ Dodaj punkt"
        aria-label="Nowy punkt"
        maxLength={200}
        onKeyDown={(e) => {
          const value = e.currentTarget.value.trim();
          if (e.key !== "Enter" || !value) return;
          update({ ...list, items: [...list.items, { done: false, text: value }] }, true);
          e.currentTarget.value = "";
        }}
        // bez flex-1 — w kolumnie rozciągnąłby pole w pionie i zabrał miejsce liście
        className="w-full shrink-0 border-t border-ink/10 bg-transparent pt-2 outline-none placeholder:text-ink/35 dark:border-white/10 dark:placeholder:text-white/35"
      />
    </div>
  );
}
