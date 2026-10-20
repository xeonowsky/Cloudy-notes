import { describe, expect, it } from "vitest";
import {
  currentStreak,
  isoDate,
  monthGrid,
  parseCalendar,
  serializeCalendar,
  todayIso,
  toggleDay,
} from "@/app/lib/calendar";

describe("kalendarz — zapis w polu text", () => {
  it("czyta tytuł i daty, pomija śmieci i duplikaty, sortuje", () => {
    expect(parseCalendar("# Nauka\n2026-10-03\nbzdura? nie, to tytuł był wyżej\n2026-10-01\n2026-10-03")).toEqual({
      title: "Nauka",
      marked: ["2026-10-01", "2026-10-03"],
    });
  });

  it("zapis i odczyt dają to samo, a bez tytułu są same daty", () => {
    const data = { title: "Sport", marked: ["2026-10-02", "2026-10-01"] };
    expect(serializeCalendar(data)).toBe("# Sport\n2026-10-01\n2026-10-02");
    expect(parseCalendar(serializeCalendar(data))).toEqual({ title: "Sport", marked: ["2026-10-01", "2026-10-02"] });
    expect(serializeCalendar({ title: "", marked: ["2026-01-05"] })).toBe("2026-01-05");
  });

  it("toggleDay stawia i zdejmuje X", () => {
    const once = toggleDay({ title: "", marked: ["2026-10-05"] }, "2026-10-01");
    expect(once.marked).toEqual(["2026-10-01", "2026-10-05"]);
    expect(toggleDay(once, "2026-10-05").marked).toEqual(["2026-10-01"]);
  });
});

describe("kalendarz — daty", () => {
  it("isoDate i todayIso dopełniają zerami i używają czasu lokalnego", () => {
    expect(isoDate(2026, 0, 5)).toBe("2026-01-05");
    expect(todayIso(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });

  it("siatka: 42 pola, tydzień od poniedziałku", () => {
    const grid = monthGrid(2026, 9); // październik 2026 zaczyna się w czwartek
    expect(grid).toHaveLength(42);
    expect(grid.slice(0, 4)).toEqual([null, null, null, "2026-10-01"]);
    expect(grid.filter(Boolean)).toHaveLength(31);
    expect(monthGrid(2026, 1).filter(Boolean)).toHaveLength(28); // luty 2026
    expect(monthGrid(2028, 1).filter(Boolean)).toHaveLength(29); // rok przestępny
    expect(monthGrid(2026, 5)[0]).toBe("2026-06-01"); // czerwiec 2026 zaczyna się w poniedziałek
  });

  it("seria liczy dni z rzędu; niezaznaczone dziś jej nie przerywa", () => {
    const marked = ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"];
    expect(currentStreak(marked, "2026-10-02")).toBe(4); // przez koniec miesiąca
    expect(currentStreak(marked, "2026-10-03")).toBe(4); // dziś jeszcze bez X
    expect(currentStreak(marked, "2026-10-04")).toBe(0); // wczoraj przerwa
    expect(currentStreak([], "2026-10-04")).toBe(0);
  });
});
