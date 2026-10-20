import { describe, expect, it } from "vitest";
import { parseChecklist, serializeChecklist } from "@/app/lib/checklist";
import { noteExcerpt, toBoardNote } from "@/app/lib/board-notes";

describe("lista zadań (Markdown w polu text)", () => {
  it("czyta tytuł i punkty, także z * i dużym X", () => {
    expect(parseChecklist("# Nauka\n- [x] JSX\n* [X] Props\n- [ ] Hooki")).toEqual({
      title: "Nauka",
      items: [
        { done: true, text: "JSX" },
        { done: true, text: "Props" },
        { done: false, text: "Hooki" },
      ],
    });
  });

  it("pusty tekst = pusta lista bez tytułu", () => {
    expect(parseChecklist("")).toEqual({ title: "", items: [] });
  });

  it("zapis i odczyt dają to samo (round-trip)", () => {
    const list = { title: "Plan", items: [{ done: false, text: "A" }, { done: true, text: "B" }] };
    expect(serializeChecklist(list)).toBe("# Plan\n- [ ] A\n- [x] B");
    expect(parseChecklist(serializeChecklist(list))).toEqual(list);
  });

  it("bez tytułu nie ma linii nagłówka, a enter w punkcie nie psuje formatu", () => {
    expect(serializeChecklist({ title: "  ", items: [{ done: false, text: "a\nb" }] })).toBe("- [ ] a b");
  });
});

describe("podgląd notatki na tablicy", () => {
  it("usuwa znaczniki Markdowna i skleja w jedną linię", () => {
    expect(noteExcerpt("# Tytuł\n- **mleko**\n- [chleb](https://x.pl)\n```js\nkod\n```\n> cytat")).toBe(
      "Tytuł mleko chleb cytat",
    );
  });

  it("przycina długą treść z wielokropkiem", () => {
    const excerpt = noteExcerpt("a ".repeat(200), 20);
    expect(excerpt.length).toBeLessThanOrEqual(20);
    expect(excerpt.endsWith("…")).toBe(true);
  });

  it("toBoardNote przekazuje tylko potrzebne pola", () => {
    expect(toBoardNote({ id: "1", title: "T", content: "*x*", color: "mint" })).toEqual({
      id: "1",
      title: "T",
      excerpt: "x",
      color: "mint",
    });
  });
});
