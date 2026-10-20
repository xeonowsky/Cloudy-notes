// Kalendarz na tablicy ("habit tracker"): klik w dzień stawia X.
// Zapis w kolumnie text — tytuł i zaznaczone dni, po jednym w linii:
//
//   # Nauka codziennie
//   2026-10-01
//   2026-10-02
//
// Daty w formacie ISO (RRRR-MM-DD) sortują się alfabetycznie tak samo jak
// w czasie, więc wystarczy zwykłe .sort().

export type CalendarData = { title: string; marked: string[] };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function parseCalendar(text: string): CalendarData {
  let title = "";
  const marked = new Set<string>();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (ISO.test(line)) marked.add(line);
    else if (!title && line) title = line.replace(/^#+\s*/, "").trim();
  }
  return { title, marked: [...marked].sort() };
}

export function serializeCalendar({ title, marked }: CalendarData): string {
  const lines = [...new Set(marked)].sort();
  if (title.trim()) lines.unshift(`# ${title.trim()}`);
  return lines.join("\n");
}

/** Zaznacza dzień albo zdejmuje zaznaczenie, jeśli już był. */
export function toggleDay(data: CalendarData, iso: string): CalendarData {
  const marked = data.marked.includes(iso) ? data.marked.filter((d) => d !== iso) : [...data.marked, iso].sort();
  return { ...data, marked };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Data ISO z części (miesiąc liczony od 0, jak w Date). */
export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** Dzisiejsza data ISO w strefie czasowej przeglądarki (nie UTC!). */
export function todayIso(now = new Date()): string {
  return isoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Siatka miesiąca: zawsze 6 tygodni × 7 dni (stała wysokość kafelka),
 * tydzień od poniedziałku. null = pole przed 1. albo po ostatnim dniu.
 */
export function monthGrid(year: number, month: number): (string | null)[] {
  // getDay(): 0 = niedziela … 6 = sobota → przesuwamy tak, by poniedziałek był 0
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate(); // dzień 0 następnego miesiąca = ostatni dzień tego
  return Array.from({ length: 42 }, (_, i) => {
    const day = i - offset + 1;
    return day >= 1 && day <= days ? isoDate(year, month, day) : null;
  });
}

/**
 * Seria: ile kolejnych dni z rzędu jest zaznaczonych, licząc wstecz od dziś.
 * Niezaznaczone "dziś" nie przerywa serii (dzień jeszcze trwa) — liczymy wtedy od wczoraj.
 */
export function currentStreak(marked: string[], today: string): number {
  const set = new Set(marked);
  const [y, m, d] = today.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  if (!set.has(today)) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (set.has(todayIso(day))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}
