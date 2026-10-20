import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NodeCard from "@/app/components/roadmap/node-card";
import EdgesLayer from "@/app/components/roadmap/edges-layer";
import NodePanel from "@/app/components/roadmap/node-panel";
import ShapePanel from "@/app/components/roadmap/shape-panel";
import ShapeView from "@/app/components/roadmap/shape-view";
import Toolbar from "@/app/components/roadmap/toolbar";
import AddMenu from "@/app/components/roadmap/add-menu";
import ChecklistView from "@/app/components/roadmap/checklist-view";
import CalendarView from "@/app/components/roadmap/calendar-view";
import { nodeBox } from "@/app/components/roadmap/geometry";
import { NODE_H, NODE_W } from "@/app/lib/roadmap-types";
import { makeEdge, makeNode, makeShape } from "../../helpers/fixtures";

describe("NodeCard", () => {
  it("pokazuje nazwę, kategorię, status i pozycję", () => {
    const { container } = render(
      <NodeCard node={makeNode({ status: "done" })} selected={false} connectMode={false} isConnectSource={false} />,
    );
    const card = container.querySelector<HTMLElement>("[data-node-id='node-1']")!;
    expect(card).toHaveTextContent("React");
    expect(card).toHaveTextContent("Frontend");
    expect(card).toHaveTextContent("Opanowane");
    expect(card.style).toMatchObject({ left: "100px", top: "100px", width: `${NODE_W}px`, height: `${NODE_H}px` });
  });

  it("bez kategorii ma podpis zastępczy, a zaznaczenie dodaje obwódkę", () => {
    render(<NodeCard node={makeNode({ category: "" })} selected connectMode isConnectSource={false} />);
    const card = screen.getByText("Bez kategorii").closest("[data-node-id]");
    expect(card).toHaveClass("ring-4", "cursor-crosshair");
  });
});

describe("EdgesLayer", () => {
  const nodes = [makeNode({ id: "node-1", x: 0, y: 0 }), makeNode({ id: "node-2", x: 400, y: 0 })];
  const boxes = new Map(nodes.map((n) => [n.id, nodeBox(n)]));

  it("rysuje strzałkę z grotem i szeroką strefą kliknięcia", () => {
    const { container } = render(<EdgesLayer boxes={boxes} edges={[makeEdge()]} selectedEdgeId={null} preview={null} />);
    const hit = container.querySelector("[data-edge-id='edge-1']")!;
    expect(hit).toHaveAttribute("stroke-width", "16");
    expect(container.querySelector("line[marker-end='url(#rp-arrow)']")).toBeTruthy();
  });

  it("pomija strzałki do nieistniejących kart (np. właśnie usuniętych)", () => {
    const { container } = render(
      <EdgesLayer boxes={boxes} edges={[makeEdge({ targetId: "usunieta" })]} selectedEdgeId={null} preview={null} />,
    );
    expect(container.querySelectorAll("line")).toHaveLength(0);
  });

  it("zaznaczona strzałka i podgląd łączenia używają aktywnego grotu", () => {
    const { container } = render(
      <EdgesLayer boxes={boxes} edges={[makeEdge()]} selectedEdgeId="edge-1" preview={{ from: boxes.get("node-1")!, to: { x: 50, y: 300 } }} />,
    );
    const active = container.querySelectorAll("line[marker-end='url(#rp-arrow-active)']");
    expect(active).toHaveLength(2);
    expect(active[1]).toHaveAttribute("stroke-dasharray", "6 6");
  });

  it("łączy dowolne prostokąty — np. kartę z dużą ramką (koniec na brzegu ramki)", () => {
    const withShape = new Map(boxes).set("shape-1", { x: 0, y: 300, w: 600, h: 200 });
    const { container } = render(
      <EdgesLayer boxes={withShape} edges={[makeEdge({ targetId: "shape-1" })]} selectedEdgeId={null} preview={null} />,
    );
    const line = container.querySelector("line[marker-end='url(#rp-arrow)']")!;
    // od dolnej krawędzi karty (y = 76 + 2) do górnej krawędzi ramki (y = 300 - 6)
    expect(Number(line.getAttribute("y1"))).toBeCloseTo(NODE_H + 2);
    expect(Number(line.getAttribute("y2"))).toBeCloseTo(294);
  });
});

describe("NodePanel", () => {
  function setup(node = makeNode()) {
    const onChange = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    const utils = render(
      <NodePanel node={node} autoFocusTitle={false} onChange={onChange} onDelete={onDelete} onClose={onClose} />,
    );
    return { onChange, onDelete, onClose, user, ...utils };
  }

  it("focusTitleSignal (np. dwuklik na karcie) ustawia fokus w nazwie i zaznacza tekst", async () => {
    const { rerender } = setup();
    const input = screen.getByLabelText<HTMLInputElement>("Nazwa");
    expect(input).not.toHaveFocus();
    rerender(<NodePanel node={makeNode()} autoFocusTitle={false} focusTitleSignal={1} onChange={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />);
    await vi.waitFor(() => expect(input).toHaveFocus());
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("React".length);
  });

  it("pisanie zmienia tylko widok, zapis następuje po opuszczeniu pola", async () => {
    const { onChange, user } = setup();
    const input = screen.getByLabelText("Nazwa");
    await user.type(input, "!");
    expect(onChange).toHaveBeenLastCalledWith({ title: "React!" }, false);
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({ title: "React" }, true); // props się nie zmieniły w teście
  });

  it("pusta nazwa po zapisie zamienia się na 'Bez nazwy'", () => {
    const { onChange } = setup(makeNode({ title: "   " }));
    fireEvent.blur(screen.getByLabelText("Nazwa"));
    expect(onChange).toHaveBeenCalledWith({ title: "Bez nazwy" }, true);
  });

  it("Enter w polu kończy edycję (blur = zapis)", async () => {
    const { onChange, user } = setup();
    await user.click(screen.getByLabelText("Kategoria"));
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith({ category: "Frontend" }, true);
  });

  it("status zapisuje się od razu", async () => {
    const { onChange, user } = setup();
    expect(screen.getByRole("button", { name: "Do nauki" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "W trakcie" }));
    expect(onChange).toHaveBeenCalledWith({ status: "learning" }, true);
  });

  it("ma podpowiedzi kategorii, usuwanie i zamykanie", async () => {
    const { onDelete, onClose, user } = setup();
    expect(document.querySelectorAll("#roadmap-categories option").length).toBeGreaterThan(3);
    await user.click(screen.getByRole("button", { name: "Usuń element" }));
    await user.click(screen.getByRole("button", { name: "Zamknij panel" }));
    expect(onDelete).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ShapePanel", () => {
  it("zmienia kolor, włącza edycję i usuwa", async () => {
    const onColor = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <ShapePanel
        shape={makeShape({ kind: "rect", color: "brand" })}
        editing={false}
        onColor={onColor}
        onStyle={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole("heading", { name: "Prostokąt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Turkusowy" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Różowy" }));
    await user.click(screen.getByRole("button", { name: "Etykieta" }));
    await user.click(screen.getByRole("button", { name: "Usuń" }));
    expect(onColor).toHaveBeenCalledWith("rose");
    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });

  it("dla bloku tekstu ma inny tytuł i przycisk", () => {
    render(<ShapePanel shape={makeShape()} editing={false} onColor={vi.fn()} onStyle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Blok tekstu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edytuj tekst" })).toBeInTheDocument();
  });

  it("styl tekstu: rozmiar, kolor, pogrubienie, kursywa, wyrównanie", async () => {
    const onStyle = vi.fn();
    const user = userEvent.setup();
    render(<ShapePanel shape={makeShape()} editing={false} onColor={vi.fn()} onStyle={onStyle} onEdit={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Rozmiar 14" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Rozmiar 32" }));
    await user.click(screen.getByRole("button", { name: "Tekst: Różowy" }));
    await user.click(screen.getByRole("button", { name: "Pogrubienie" }));
    await user.click(screen.getByRole("button", { name: "Kursywa" }));
    await user.click(screen.getByRole("button", { name: "Do środka" }));

    expect(onStyle.mock.calls).toEqual([
      [{ fontSize: 32 }],
      [{ textColor: "rose" }],
      [{ bold: true }],
      [{ italic: true }],
      [{ align: "center" }],
    ]);
  });

  it("własny rozmiar: zapis po Enter, z ograniczeniem do zakresu", async () => {
    const onStyle = vi.fn();
    const user = userEvent.setup();
    render(<ShapePanel shape={makeShape()} editing={false} onColor={vi.fn()} onStyle={onStyle} onEdit={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByLabelText("Własny rozmiar tekstu");
    await user.clear(input);
    await user.type(input, "300{Enter}");
    expect(onStyle).toHaveBeenCalledWith({ fontSize: 96 });
  });

  it("w trakcie pisania: brak przycisku edycji, a klik w panel nie zabiera fokusu", () => {
    render(<ShapePanel shape={makeShape()} editing onColor={vi.fn()} onStyle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Edytuj tekst" })).not.toBeInTheDocument();
    // mousedown z preventDefault = przeglądarka nie przenosi fokusu na przycisk
    const notPrevented = fireEvent.mouseDown(screen.getByRole("button", { name: "Pogrubienie" }));
    expect(notPrevented).toBe(false);
  });
});

describe("ShapeView", () => {
  const noop = () => {};
  const handlers = { onTextChange: noop, onTextCommit: noop, onContentChange: noop };

  it("pusty blok tekstu ma podpowiedź, uchwyt rozmiaru tylko po zaznaczeniu", () => {
    const { container, rerender } = render(
      <ShapeView shape={makeShape()} selected={false} editing={false} onTextChange={noop} onTextCommit={noop} onContentChange={noop} />,
    );
    expect(screen.getByText("Dwuklik, aby pisać")).toBeInTheDocument();
    expect(container.querySelector("[data-resize-id]")).toBeNull();

    rerender(<ShapeView shape={makeShape()} selected editing={false} onTextChange={noop} onTextCommit={noop} onContentChange={noop} />);
    expect(container.querySelector("[data-resize-id='shape-1']")).toBeTruthy();
  });

  it("w trybie edycji pokazuje pole, ustawia w nim fokus i zapisuje po Esc", async () => {
    const onTextChange = vi.fn();
    const onTextCommit = vi.fn();
    const user = userEvent.setup();
    render(
      <ShapeView shape={makeShape({ text: "abc" })} selected editing onTextChange={onTextChange} onTextCommit={onTextCommit} onContentChange={noop} />,
    );
    const textarea = screen.getByPlaceholderText("Wpisz tekst…");
    await vi.waitFor(() => expect(textarea).toHaveFocus()); // fokus ustawiany w setTimeout
    expect((textarea as HTMLTextAreaElement).selectionStart).toBe(3); // kursor na końcu

    await user.keyboard("d");
    expect(onTextChange).toHaveBeenCalledWith("abcd");
    await user.keyboard("{Escape}");
    expect(onTextCommit).toHaveBeenCalled();
  });

  it("styl tekstu trafia do widoku: rozmiar, wyrównanie, kolor, pogrubienie, kursywa", () => {
    const shape = makeShape({ text: "Ważne", fontSize: 32, align: "right", textColor: "rose", bold: true, italic: true });
    render(<ShapeView shape={shape} selected={false} editing={false} onTextChange={noop} onTextCommit={noop} onContentChange={noop} />);
    const text = screen.getByText("Ważne");
    expect(text.style.fontSize).toBe("32px");
    expect(text.style.textAlign).toBe("right");
    expect(text).toHaveClass("text-rose-600", "font-bold", "italic");
  });

  it("blok kodu: czcionka mono, a Tab w edycji wstawia 2 spacje", async () => {
    const onTextChange = vi.fn();
    const user = userEvent.setup();
    const shape = makeShape({ kind: "code", text: "if (x)" });
    const { rerender } = render(
      <ShapeView shape={shape} selected={false} editing={false} {...handlers} onTextChange={onTextChange} />,
    );
    expect(screen.getByText("if (x)").style.fontFamily).toContain("monospace");

    rerender(<ShapeView shape={shape} selected editing {...handlers} onTextChange={onTextChange} />);
    const textarea = screen.getByDisplayValue("if (x)");
    await vi.waitFor(() => expect(textarea).toHaveFocus());
    await user.keyboard("{Tab}");
    expect(onTextChange).toHaveBeenCalledWith("if (x)  ");
    expect(textarea).toHaveFocus(); // fokus nie uciekł do następnego elementu
  });

  it("kafelek notatki: tytuł, podgląd i link; brak notatki = komunikat", () => {
    const note = { id: "n1", title: "Hooki", excerpt: "useState i useEffect", color: "purple" as const };
    const shape = makeShape({ kind: "note", noteId: "n1" });
    const { rerender } = render(<ShapeView shape={shape} selected={false} editing={false} note={note} {...handlers} />);
    expect(screen.getByText("Hooki")).toBeInTheDocument();
    expect(screen.getByText("useState i useEffect")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Otwórz notatkę →" })).toHaveAttribute("href", "/notatki/n1");

    rerender(<ShapeView shape={shape} selected={false} editing={false} {...handlers} />);
    expect(screen.getByText("Notatka niedostępna")).toBeInTheDocument();
  });

  it("prostokąt: etykieta w rogu, edycja w jednej linii (Enter kończy)", async () => {
    const onTextCommit = vi.fn();
    const user = userEvent.setup();
    const shape = makeShape({ kind: "rect", text: "Frontend", w: 400, h: 300 });
    const { rerender } = render(<ShapeView shape={shape} selected={false} editing={false} onTextChange={noop} onTextCommit={onTextCommit} onContentChange={noop} />);
    expect(screen.getByText("Frontend")).toBeInTheDocument();

    rerender(<ShapeView shape={shape} selected editing onTextChange={noop} onTextCommit={onTextCommit} onContentChange={noop} />);
    const input = screen.getByPlaceholderText("Etykieta ramki");
    expect(input.tagName).toBe("INPUT");
    await vi.waitFor(() => expect(input).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onTextCommit).toHaveBeenCalled();
  });
});

describe("AddMenu", () => {
  it("rozwija listę nowych obiektów i zamyka się po wyborze", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddMenu onAdd={onAdd} />);
    const trigger = screen.getByRole("button", { name: "+ Dodaj" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    const items = screen.getAllByRole("menuitem").map((i) => i.querySelector(".font-semibold")!.textContent);
    expect(items).toEqual(["Element stacku", "Karteczka", "Lista zadań", "Kalendarz", "Blok kodu", "Notatka z Cloudy Notes"]);

    await user.click(screen.getByRole("menuitem", { name: /Lista zadań/ }));
    expect(onAdd).toHaveBeenCalledWith("checklist");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Esc i klik obok zamykają menu", async () => {
    const user = userEvent.setup();
    render(<AddMenu onAdd={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "+ Dodaj" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ Dodaj" }));
    await user.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("ChecklistView", () => {
  const text = "# Nauka\n- [x] JSX\n- [ ] Hooki";
  const props = { textClass: "", style: {} };

  it("pokazuje tytuł, punkty i postęp", () => {
    render(<ChecklistView text={text} onChange={vi.fn()} {...props} />);
    expect(screen.getByLabelText("Tytuł listy")).toHaveValue("Nauka");
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Zrobione: JSX" })).toBeChecked();
    expect(screen.getByLabelText("Punkt 1")).toHaveClass("line-through");
  });

  it("odhaczenie, usunięcie i dodanie punktu zapisują od razu", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ChecklistView text={text} onChange={onChange} {...props} />);

    await user.click(screen.getByRole("checkbox", { name: "Zrobione: Hooki" }));
    expect(onChange).toHaveBeenLastCalledWith("# Nauka\n- [x] JSX\n- [x] Hooki", true);

    await user.click(screen.getByRole("button", { name: "Usuń punkt 1" }));
    expect(onChange).toHaveBeenLastCalledWith("# Nauka\n- [ ] Hooki", true);

    const input = screen.getByLabelText("Nowy punkt");
    await user.type(input, "useMemo{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("# Nauka\n- [x] JSX\n- [ ] Hooki\n- [ ] useMemo", true);
    expect(input).toHaveValue(""); // pole gotowe na kolejny punkt
    expect(input).toHaveFocus();
  });

  it("pisanie w punkcie: widok od razu, zapis po wyjściu z pola", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ChecklistView text={text} onChange={onChange} {...props} />);
    await user.type(screen.getByLabelText("Punkt 2"), "!");
    expect(onChange).toHaveBeenLastCalledWith("# Nauka\n- [x] JSX\n- [ ] Hooki!", false);
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(text, true);
  });
});

describe("CalendarView", () => {
  // Stały "dziś": 20 października 2026 (wtorek) — tylko zegar, timery działają normalnie
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 20, 12));
  });
  afterEach(() => vi.useRealTimers());

  const props = { textClass: "", style: {} };

  it("pokazuje bieżący miesiąc od poniedziałku, X na zaznaczonych dniach i statystyki", () => {
    render(<CalendarView text={"# Nauka\n2026-10-18\n2026-10-19\n2026-09-30"} onChange={vi.fn()} {...props} />);
    expect(screen.getByLabelText("Tytuł kalendarza")).toHaveValue("Nauka");
    expect(screen.getByText("październik 2026")).toBeInTheDocument();
    // 1 października 2026 to czwartek → 3 puste pola przed nim (Pn, Wt, Śr)
    const grid = screen.getByText("Pn").parentElement!;
    expect(Array.from(grid.children).slice(7, 11).map((el) => el.textContent)).toEqual(["", "", "", "1"]);
    expect(screen.getByRole("button", { name: "19 — zaznaczony" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "20 — niezaznaczony" })).toHaveClass("ring-2"); // dziś
    expect(screen.getByText(/W tym miesiącu:/)).toHaveTextContent("W tym miesiącu: 2");
    // dziś (20.) jeszcze bez X, więc seria liczy się od wczoraj: 19, 18 → 2
    expect(screen.getByText(/Seria:/)).toHaveTextContent("Seria: 2");
  });

  it("klik w dzień stawia X, ponowny klik go zdejmuje — zapis od razu", () => {
    const onChange = vi.fn();
    const { rerender } = render(<CalendarView text="" onChange={onChange} {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "5 — niezaznaczony" }));
    expect(onChange).toHaveBeenLastCalledWith("2026-10-05", true);

    rerender(<CalendarView text="2026-10-05" onChange={onChange} {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "5 — zaznaczony" }));
    expect(onChange).toHaveBeenLastCalledWith("", true);
  });

  it("strzałki zmieniają miesiąc, klik w nazwę wraca do bieżącego", () => {
    const onChange = vi.fn();
    render(<CalendarView text="" onChange={onChange} {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Następny miesiąc" }));
    fireEvent.click(screen.getByRole("button", { name: "Następny miesiąc" }));
    expect(screen.getByText("grudzień 2026")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Następny miesiąc" }));
    expect(screen.getByText("styczeń 2027")).toBeInTheDocument(); // przejście przez rok

    fireEvent.click(screen.getByRole("button", { name: "1 — niezaznaczony" }));
    expect(onChange).toHaveBeenLastCalledWith("2027-01-01", true);

    fireEvent.click(screen.getByText("styczeń 2027"));
    expect(screen.getByText("październik 2026")).toBeInTheDocument();
  });
});

describe("Toolbar", () => {
  it("zaznacza aktywne narzędzie i zgłasza zmiany", async () => {
    const onTool = vi.fn();
    const onZoom = vi.fn();
    const onFit = vi.fn();
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <Toolbar
        tool="rect"
        scale={1.5}
        onTool={onTool}
        onAdd={onAdd}
        onZoom={onZoom}
        onFit={onFit}
        fullscreen={false}
        onFullscreen={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Prostokąt" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Tekst" })).not.toBeChecked();
    expect(screen.getByText("150%")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Połącz" }));
    await user.click(screen.getByRole("button", { name: "Przybliż" }));
    await user.click(screen.getByRole("button", { name: "Oddal" }));
    await user.click(screen.getByRole("button", { name: "Dopasuj" }));
    await user.click(screen.getByRole("button", { name: "+ Dodaj" }));
    await user.click(screen.getByRole("menuitem", { name: /Element stacku/ }));

    expect(onTool).toHaveBeenCalledWith("connect");
    expect(onZoom).toHaveBeenNthCalledWith(1, 1.2);
    expect(onZoom.mock.calls[1][0]).toBeCloseTo(1 / 1.2);
    expect(onFit).toHaveBeenCalled();
    expect(onAdd).toHaveBeenCalledWith("node");
  });

  it("ma rączkę i przełącznik pełnego ekranu (z innym podpisem po włączeniu)", async () => {
    const onTool = vi.fn();
    const onFullscreen = vi.fn();
    const user = userEvent.setup();
    const props = { scale: 1, onTool, onAdd: vi.fn(), onZoom: vi.fn(), onFit: vi.fn(), onFullscreen };
    const { rerender } = render(<Toolbar tool="hand" fullscreen={false} {...props} />);

    expect(screen.getByRole("radio", { name: "Rączka" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Pełny ekran" }));
    expect(onFullscreen).toHaveBeenCalled();

    rerender(<Toolbar tool="hand" fullscreen {...props} />);
    expect(screen.getByRole("button", { name: "Wyjdź" })).toHaveAttribute("aria-pressed", "true");
  });
});
