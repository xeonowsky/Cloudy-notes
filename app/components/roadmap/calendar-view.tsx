"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import {
  currentStreak,
  monthGrid,
  parseCalendar,
  serializeCalendar,
  todayIso,
  toggleDay,
  type CalendarData,
} from "@/app/lib/calendar";

type Props = {
  text: string;
  textClass: string;
  style: CSSProperties;
  // save = false: tylko widok (pisanie tytułu), true: zapis do bazy
  onChange: (text: string, save: boolean) => void;
};

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const monthName = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" });

// "Dziś" znamy dopiero w przeglądarce (strefa czasowa użytkownika). Na serwerze
// getServerSnapshot zwraca null — dzięki temu HTML z serwera i pierwszy render
// w przeglądarce są takie same (brak błędu hydratacji), a dzień dochodzi chwilę później.
const noSubscribe = () => () => {};
const useToday = () => useSyncExternalStore(noSubscribe, () => todayIso(), () => null);

// Kalendarz: klik w dzień stawia X (i od razu zapisuje), ponowny klik je zdejmuje.
// Dni i strzałki miesiąca to przyciski — tablica ignoruje w nie kliknięcia,
// więc nie przesuwają kafelka. Przesuwa się go za nagłówek albo puste miejsca.
export default function CalendarView({ text, textClass, style, onChange }: Props) {
  const data = parseCalendar(text);
  const today = useToday();
  const [monthOffset, setMonthOffset] = useState(0); // 0 = bieżący miesiąc, -1 = poprzedni…

  const update = (next: CalendarData, save: boolean) => onChange(serializeCalendar(next), save);

  return (
    <div className={`flex size-full flex-col gap-2 overflow-hidden p-3 ${textClass}`} style={style}>
      <input
        value={data.title}
        placeholder="Kalendarz"
        aria-label="Tytuł kalendarza"
        maxLength={80}
        onChange={(e) => update({ ...data, title: e.target.value }, false)}
        onBlur={() => update(data, true)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="w-full bg-transparent font-semibold outline-none placeholder:text-ink/35 dark:placeholder:text-white/35"
      />
      {today ? (
        <Month data={data} today={today} offset={monthOffset} onOffset={setMonthOffset} onToggle={(iso) => update(toggleDay(data, iso), true)} />
      ) : (
        <div className="min-h-0 flex-1" />
      )}
    </div>
  );
}

type MonthProps = {
  data: CalendarData;
  today: string;
  offset: number;
  onOffset: (offset: number) => void;
  onToggle: (iso: string) => void;
};

function Month({ data, today, offset, onOffset, onToggle }: MonthProps) {
  const [ty, tm] = today.split("-").map(Number);
  const first = new Date(ty, tm - 1 + offset, 1); // Date sam przenosi np. miesiąc 13 na styczeń
  const year = first.getFullYear();
  const month = first.getMonth();
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const marked = new Set(data.marked);
  const inMonth = data.marked.filter((d) => d.startsWith(prefix)).length;
  const streak = currentStreak(data.marked, today);
  const title = monthName.format(first);

  const navBtn =
    "grid size-[1.75em] cursor-pointer place-items-center rounded-md opacity-60 duration-150 hover:bg-ink/5 hover:opacity-100 dark:hover:bg-white/10";

  return (
    <>
      <div className="flex items-center justify-between gap-1">
        <button type="button" aria-label="Poprzedni miesiąc" onClick={() => onOffset(offset - 1)} className={navBtn}>
          ‹
        </button>
        <button
          type="button"
          onClick={() => onOffset(0)}
          title="Wróć do bieżącego miesiąca"
          className="cursor-pointer text-[0.9em] font-medium first-letter:uppercase"
        >
          {title}
        </button>
        <button type="button" aria-label="Następny miesiąc" onClick={() => onOffset(offset + 1)} className={navBtn}>
          ›
        </button>
      </div>

      {/* Nagłówek dni + zawsze 6 tygodni — wiersze dzielą wolne miejsce po równo */}
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-0.5 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-0.5 text-[0.7em] font-medium opacity-50">
            {d}
          </span>
        ))}
        {monthGrid(year, month).map((iso, i) => {
          if (!iso) return <span key={i} aria-hidden />;
          const done = marked.has(iso);
          const isToday = iso === today;
          const day = Number(iso.slice(8));
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={done}
              aria-label={`${day} — ${done ? "zaznaczony" : "niezaznaczony"}`}
              onClick={() => onToggle(iso)}
              className={`relative grid cursor-pointer place-items-center rounded-md text-[0.8em] tabular-nums duration-150 hover:bg-ink/5 dark:hover:bg-white/10 ${
                isToday ? "ring-2 ring-brand ring-inset" : ""
              }`}
            >
              <span className={done ? "opacity-35" : ""}>{day}</span>
              {done && (
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden
                  className="absolute inset-0 m-auto size-[80%] max-h-full text-rose-500 dark:text-rose-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                >
                  <path d="M4 4l12 12M16 4L4 16" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <p className="flex justify-between text-[0.75em] opacity-60">
        <span>
          W tym miesiącu: <strong className="tabular-nums">{inMonth}</strong>
        </span>
        <span>
          Seria: <strong className="tabular-nums">{streak}</strong> 🔥
        </span>
      </p>
    </>
  );
}
