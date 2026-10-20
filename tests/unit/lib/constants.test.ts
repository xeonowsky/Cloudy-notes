import { describe, expect, it } from "vitest";
import { NOTE_COLOR_KEYS, NOTE_COLORS } from "@/app/lib/note-colors";
import { PRIORITIES, priorityLabel } from "@/app/lib/priority";
import { FEATURES } from "@/app/lib/features";
import { LEGAL, legalIncomplete } from "@/app/lib/legal";
import {
  ROADMAP_STATUS_KEYS,
  ROADMAP_STATUSES,
  SHAPE_COLOR_KEYS,
  SHAPE_COLORS,
  SHAPE_KINDS,
  SHAPE_MIN,
} from "@/app/lib/roadmap-types";

// Testy "spójności": klucze zapisywane w bazie muszą mieć opis w UI
// i odwrotnie. Łapią np. dodanie koloru do listy bez dopisania klas.

describe("kolory notatek", () => {
  it("każdy klucz ma komplet opisów", () => {
    expect(Object.keys(NOTE_COLORS)).toEqual([...NOTE_COLOR_KEYS]);
    for (const color of Object.values(NOTE_COLORS)) {
      expect(color).toEqual(
        expect.objectContaining({ label: expect.any(String), category: expect.any(String), card: expect.any(String) }),
      );
    }
  });
});

describe("priorytety", () => {
  it("mają etykiety dla 0, 1 i 2", () => {
    expect(PRIORITIES.map((p) => p.value).sort()).toEqual([0, 1, 2]);
    expect(priorityLabel(2)).toBe("Wysoki");
    expect(priorityLabel(0)).toBe("Niski");
  });

  it('nieznana wartość wraca jako "Normalny"', () => {
    expect(priorityLabel(7 as never)).toBe("Normalny");
  });
});

describe("lista możliwości", () => {
  it("ma unikalne kotwice", () => {
    const ids = FEATURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("dane prawne", () => {
  it("legalIncomplete wykrywa pola [do uzupełnienia]", () => {
    const hasPlaceholder = Object.values(LEGAL).some((v) => v.startsWith("["));
    expect(legalIncomplete).toBe(hasPlaceholder);
  });
});

describe("stałe Board", () => {
  it("każdy status ma opis i klasy", () => {
    expect(Object.keys(ROADMAP_STATUSES).sort()).toEqual([...ROADMAP_STATUS_KEYS].sort());
  });

  it("każdy kolor kształtu ma klasy dla ramki i klocka", () => {
    expect(Object.keys(SHAPE_COLORS).sort()).toEqual([...SHAPE_COLOR_KEYS].sort());
    for (const c of Object.values(SHAPE_COLORS)) {
      expect(c.rect && c.block && c.swatch).toBeTruthy();
    }
  });

  it("każdy rodzaj kształtu ma minimalny rozmiar", () => {
    expect(Object.keys(SHAPE_MIN).sort()).toEqual([...SHAPE_KINDS].sort());
  });
});

describe("narzędzia (menu Narzędzia)", () => {
  it("Notatki i Board, każde z opisem i ikoną", async () => {
    const { TOOLS } = await import("@/app/lib/tools");
    expect(TOOLS.map((t) => [t.title, t.href])).toEqual([
      ["Notatki", "/notatki"],
      ["Board", "/board"],
    ]);
    for (const tool of TOOLS) expect(tool.description.length).toBeGreaterThan(10);
  });

  it("isToolActive obejmuje podstrony, ale nie podobne adresy", async () => {
    const { TOOLS, isToolActive } = await import("@/app/lib/tools");
    const notes = TOOLS[0];
    expect(isToolActive(notes, "/notatki")).toBe(true);
    expect(isToolActive(notes, "/notatki/nowa")).toBe(true);
    expect(isToolActive(notes, "/notatkiX")).toBe(false);
    expect(isToolActive(notes, "/board")).toBe(false);
  });
});
