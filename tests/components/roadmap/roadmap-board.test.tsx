import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RoadmapEdge, RoadmapNode, RoadmapShape } from "@/app/lib/roadmap-types";
import { makeEdge, makeNode, makeShape } from "../../helpers/fixtures";

// Test integracyjny całej tablicy: prawdziwe komponenty, prawdziwy stan Reacta,
// a w miejscu Server Actions — atrapy, które sprawdzamy (czy i z czym zostały wywołane).
const actions = vi.hoisted(() => ({
  createRoadmapNode: vi.fn(),
  updateRoadmapNode: vi.fn(),
  moveRoadmapNode: vi.fn(),
  deleteRoadmapNode: vi.fn(),
  createRoadmapEdge: vi.fn(),
  deleteRoadmapEdge: vi.fn(),
  createRoadmapShape: vi.fn(),
  updateRoadmapShape: vi.fn(),
  deleteRoadmapShape: vi.fn(),
}));
vi.mock("@/app/actions/roadmap", () => actions);

const { default: RoadmapBoard } = await import("@/app/components/roadmap/roadmap-board");

beforeEach(() => {
  for (const action of Object.values(actions)) action.mockResolvedValue({ ok: true });
});

function setup(data: { nodes?: RoadmapNode[]; edges?: RoadmapEdge[]; shapes?: RoadmapShape[] } = {}) {
  const user = userEvent.setup();
  const utils = render(
    <RoadmapBoard initialNodes={data.nodes ?? []} initialEdges={data.edges ?? []} initialShapes={data.shapes ?? []} />,
  );
  const board = screen.getByRole("application", { name: "Tablica Board" });
  const card = (id: string) => utils.container.querySelector<HTMLElement>(`[data-node-id='${id}']`);
  const shapeEl = (id: string) => utils.container.querySelector<HTMLElement>(`[data-shape-id='${id}']`);
  return { user, board, card, shapeEl, ...utils };
}

// Pomocnik: przeciągnięcie wskaźnikiem. Start na elemencie, ruch i puszczenie
// na tablicy (po setPointerCapture zdarzenia i tak trafiają do niej).
// Widok startuje z przesunięciem (40, 40) i skalą 1, a getBoundingClientRect
// w jsdom zwraca same zera — więc świat = ekran - 40.
function drag(start: Element, board: Element, from: [number, number], to: [number, number]) {
  const opts = { pointerId: 1, button: 0 };
  fireEvent.pointerDown(start, { ...opts, clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(board, { ...opts, clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(board, { ...opts, clientX: to[0], clientY: to[1] });
}
const click = (el: Element, x = 0, y = 0) => drag(el, el, [x, y], [x, y]);

describe("karty stacku", () => {
  it("+ Element dodaje kartę, otwiera panel i zapisuje ją w bazie", async () => {
    const { user } = setup();
    expect(screen.getByText("Zacznij układać swój stack ☁️")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ Element" }));

    expect(screen.getByText("Nowy element", { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByText("Zacznij układać swój stack ☁️")).not.toBeInTheDocument();
    expect(actions.createRoadmapNode).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Nowy element", status: "todo", id: expect.any(String) }),
    );
    // nowa karta: fokus od razu w polu nazwy
    expect(screen.getByLabelText("Nazwa")).toHaveFocus();
  });

  it("zmiana nazwy w panelu aktualizuje kartę i zapisuje po wyjściu z pola", async () => {
    const { user } = setup({ nodes: [makeNode()] });
    click(document.querySelector("[data-node-id='node-1']")!);
    const input = screen.getByLabelText("Nazwa");
    await user.clear(input);
    await user.type(input, "Next.js");
    expect(document.querySelector("[data-node-id='node-1']")).toHaveTextContent("Next.js");
    expect(actions.updateRoadmapNode).not.toHaveBeenCalled();

    await user.tab();
    expect(actions.updateRoadmapNode).toHaveBeenCalledWith("node-1", { title: "Next.js", category: "Frontend", status: "todo" });
  });

  it("przeciągnięcie karty zmienia jej pozycję i zapisuje TYLKO pozycję końcową", () => {
    const { board, card } = setup({ nodes: [makeNode({ x: 100, y: 100 })] });
    const opts = { pointerId: 1, button: 0 };
    fireEvent.pointerDown(card("node-1")!, { ...opts, clientX: 150, clientY: 150 });
    fireEvent.pointerMove(board, { ...opts, clientX: 200, clientY: 170 });
    fireEvent.pointerMove(board, { ...opts, clientX: 250, clientY: 200 });
    expect(card("node-1")!.style.left).toBe("200px");
    expect(actions.moveRoadmapNode).not.toHaveBeenCalled();

    fireEvent.pointerUp(board, { ...opts, clientX: 250, clientY: 200 });
    expect(actions.moveRoadmapNode).toHaveBeenCalledTimes(1);
    expect(actions.moveRoadmapNode).toHaveBeenCalledWith("node-1", { x: 200, y: 150 });
  });

  it("ruch krótszy niż próg to kliknięcie — bez przesuwania i zapisu", () => {
    const { board, card } = setup({ nodes: [makeNode()] });
    drag(card("node-1")!, board, [150, 150], [152, 151]);
    expect(card("node-1")!.style.left).toBe("100px");
    expect(actions.moveRoadmapNode).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nazwa")).toHaveValue("React"); // ale karta zaznaczona
  });

  it("zmiana statusu aktualizuje licznik postępu", async () => {
    const { user, card } = setup({ nodes: [makeNode(), makeNode({ id: "node-2", status: "done" })] });
    expect(screen.getByText(/Opanowane:/).parentElement).toHaveTextContent("Opanowane: 1 / 2");
    click(card("node-1")!);
    await user.click(screen.getByRole("button", { name: "Opanowane" }));
    expect(screen.getByText(/Opanowane:/).parentElement).toHaveTextContent("Opanowane: 2 / 2");
    expect(actions.updateRoadmapNode).toHaveBeenCalledWith("node-1", expect.objectContaining({ status: "done" }));
  });

  it("Delete usuwa zaznaczoną kartę razem z jej strzałkami", async () => {
    const nodes = [makeNode(), makeNode({ id: "node-2", x: 500 })];
    const { user, card, container } = setup({ nodes, edges: [makeEdge()] });
    expect(container.querySelector("[data-edge-id]")).toBeTruthy();

    click(card("node-1")!);
    await user.keyboard("{Delete}");

    expect(card("node-1")).toBeNull();
    expect(container.querySelector("[data-edge-id]")).toBeNull();
    expect(actions.deleteRoadmapNode).toHaveBeenCalledWith("node-1");
  });

  it("Backspace w polu tekstowym kasuje litery, a NIE kartę", async () => {
    const { user, card } = setup({ nodes: [makeNode()] });
    click(card("node-1")!);
    await user.click(screen.getByLabelText("Nazwa"));
    await user.keyboard("{Backspace}");
    expect(card("node-1")).not.toBeNull();
    expect(actions.deleteRoadmapNode).not.toHaveBeenCalled();
  });
});

describe("łączenie strzałkami", () => {
  const nodes = [makeNode(), makeNode({ id: "node-2", title: "Next.js", x: 500 })];

  it("C → klik źródło → klik cel tworzy strzałkę", async () => {
    const { user, card, container } = setup({ nodes });
    await user.keyboard("c");
    expect(screen.getByText(/Kliknij element, od którego/)).toBeInTheDocument();

    click(card("node-1")!);
    expect(screen.getByText(/Teraz kliknij element docelowy/)).toBeInTheDocument();
    click(card("node-2")!);

    expect(actions.createRoadmapEdge).toHaveBeenCalledWith({ id: expect.any(String), sourceId: "node-1", targetId: "node-2" });
    expect(container.querySelectorAll("[data-edge-id]")).toHaveLength(1);
  });

  it("nie tworzy duplikatu ani strzałki do samej siebie", async () => {
    const { user, card } = setup({ nodes, edges: [makeEdge()] });
    await user.keyboard("c");
    click(card("node-1")!);
    click(card("node-2")!); // już istnieje
    click(card("node-1")!);
    click(card("node-1")!); // ta sama karta = anulowanie wyboru
    expect(actions.createRoadmapEdge).not.toHaveBeenCalled();
  });

  it("klik w strzałkę ją zaznacza, a panel pozwala ją usunąć", async () => {
    const { user, container } = setup({ nodes, edges: [makeEdge()] });
    click(container.querySelector("[data-edge-id='edge-1']")!);
    expect(screen.getByText("→", { exact: false })).toHaveTextContent("React → Next.js");
    await user.click(screen.getByRole("button", { name: "Usuń połączenie" }));
    expect(actions.deleteRoadmapEdge).toHaveBeenCalledWith("edge-1");
    expect(container.querySelector("[data-edge-id]")).toBeNull();
  });

  it("Esc wychodzi z trybu łączenia", async () => {
    const { user } = setup({ nodes });
    await user.keyboard("c");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("radio", { name: "Zaznacz" })).toBeChecked();
  });
});

describe("prostokąty", () => {
  it("R + przeciągnięcie rysuje prostokąt (w dowolną stronę) i zapisuje go", async () => {
    const { user, board } = setup();
    await user.keyboard("r");
    expect(screen.getByRole("radio", { name: "Prostokąt" })).toBeChecked();

    drag(board, board, [300, 250], [100, 100]); // od prawego dolnego do lewego górnego rogu

    expect(actions.createRoadmapShape).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "rect", x: 60, y: 60, w: 200, h: 150, color: "brand" }),
    );
    // po narysowaniu wraca zaznaczanie, a prostokąt jest zaznaczony
    expect(screen.getByRole("radio", { name: "Zaznacz" })).toBeChecked();
    expect(screen.getByRole("heading", { name: "Prostokąt" })).toBeInTheDocument();
  });

  it("samo kliknięcie narzędziem tworzy prostokąt w domyślnym rozmiarze", async () => {
    const { user, board } = setup();
    await user.keyboard("r");
    click(board, 140, 140);
    expect(actions.createRoadmapShape).toHaveBeenCalledWith(expect.objectContaining({ x: 100, y: 100, w: 280, h: 180 }));
  });

  it("uchwyt w rogu zmienia rozmiar (z minimalnym rozmiarem)", () => {
    const { board, shapeEl, container } = setup({ shapes: [makeShape({ kind: "rect", w: 200, h: 100 })] });
    click(shapeEl("shape-1")!, 50, 50);
    const handle = container.querySelector("[data-resize-id='shape-1']")!;

    drag(handle, board, [240, 140], [290, 170]);
    expect(actions.updateRoadmapShape).toHaveBeenLastCalledWith("shape-1", expect.objectContaining({ w: 250, h: 130 }));

    drag(handle, board, [290, 170], [-500, -500]);
    expect(actions.updateRoadmapShape).toHaveBeenLastCalledWith("shape-1", expect.objectContaining({ w: 40, h: 40 }));
  });

  it("przeciągnięcie kształtu przesuwa go i zapisuje cały stan", () => {
    const { board, shapeEl } = setup({ shapes: [makeShape({ text: "Abc" })] });
    drag(shapeEl("shape-1")!, board, [50, 50], [150, 80]);
    expect(actions.updateRoadmapShape).toHaveBeenCalledWith("shape-1", {
      x: 100, y: 30, w: 220, h: 120, text: "Abc", color: "amber",
    });
  });

  it("zmiana koloru w panelu zapisuje się od razu", async () => {
    const { user, shapeEl } = setup({ shapes: [makeShape()] });
    click(shapeEl("shape-1")!, 10, 10);
    await user.click(screen.getByRole("button", { name: "Fioletowy" }));
    expect(actions.updateRoadmapShape).toHaveBeenCalledWith("shape-1", expect.objectContaining({ color: "violet" }));
  });
});

describe("bloki tekstu", () => {
  it("T + klik wstawia blok w trybie pisania; tekst zapisuje się po wyjściu z pola", async () => {
    const { user, board } = setup();
    await user.keyboard("t");
    click(board, 140, 140);

    expect(actions.createRoadmapShape).toHaveBeenCalledWith(expect.objectContaining({ kind: "text", x: 100, y: 100 }));
    const textarea = screen.getByPlaceholderText("Wpisz tekst…");
    await vi.waitFor(() => expect(textarea).toHaveFocus());

    await user.keyboard("Hooki: useState");
    await user.keyboard("{Escape}");

    expect(screen.getByText("Hooki: useState")).toBeInTheDocument();
    expect(actions.updateRoadmapShape).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ text: "Hooki: useState" }));
  });

  it("dwuklik na pustej tablicy też wstawia blok tekstu", () => {
    const { board } = setup();
    fireEvent.doubleClick(board, { clientX: 240, clientY: 140 });
    expect(actions.createRoadmapShape).toHaveBeenCalledWith(expect.objectContaining({ kind: "text", x: 200, y: 100 }));
  });

  it("dwuklik na bloku włącza edycję jego tekstu", async () => {
    const { shapeEl } = setup({ shapes: [makeShape({ text: "stary" })] });
    fireEvent.doubleClick(shapeEl("shape-1")!);
    expect(await screen.findByDisplayValue("stary")).toBeInTheDocument();
  });

  it("Enter na zaznaczonym bloku włącza edycję, Delete usuwa", async () => {
    const { user, shapeEl } = setup({ shapes: [makeShape({ text: "x" })] });
    click(shapeEl("shape-1")!, 10, 10);
    await user.keyboard("{Enter}");
    expect(await screen.findByDisplayValue("x")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    click(shapeEl("shape-1")!, 10, 10);
    await user.keyboard("{Delete}");
    expect(shapeEl("shape-1")).toBeNull();
    expect(actions.deleteRoadmapShape).toHaveBeenCalledWith("shape-1");
  });
});

describe("widok i błędy", () => {
  it("przeciągnięcie pustego tła przesuwa widok i odznacza obiekty", () => {
    const { board, card } = setup({ nodes: [makeNode()] });
    click(card("node-1")!);
    drag(board, board, [500, 500], [600, 550]);
    const world = board.firstElementChild as HTMLElement;
    expect(world.style.transform).toBe("translate(140px, 90px) scale(1)");
    expect(screen.queryByLabelText("Nazwa")).not.toBeInTheDocument();
  });

  it("zoom przyciskami i kółkiem myszy (z limitem)", async () => {
    const { user, board } = setup();
    await user.click(screen.getByRole("button", { name: "Przybliż" }));
    expect(screen.getByText("120%")).toBeInTheDocument();

    for (let i = 0; i < 20; i++) fireEvent.wheel(board, { deltaY: -500 });
    expect(screen.getByText("200%")).toBeInTheDocument(); // MAX_SCALE

    for (let i = 0; i < 20; i++) fireEvent.wheel(board, { deltaY: 500 });
    expect(screen.getByText("30%")).toBeInTheDocument(); // MIN_SCALE
  });

  it("kółko myszy nie przewija strony (preventDefault)", () => {
    const { board } = setup();
    const event = new WheelEvent("wheel", { deltaY: 100, cancelable: true, bubbles: true });
    act(() => {
      board.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });

  it("Dopasuj ustawia widok tak, by objąć wszystkie obiekty", async () => {
    const { user, board } = setup({ nodes: [makeNode({ x: 0, y: 0 })], shapes: [makeShape({ x: 1000, y: 800 })] });
    await user.click(screen.getByRole("button", { name: "Dopasuj" }));
    // jsdom ma ekran 0×0, więc skala spada do minimum — ważne, że widok się zmienił
    expect((board.firstElementChild as HTMLElement).style.transform).toContain("scale(0.3)");
  });

  it("nieudany zapis pokazuje komunikat, który można zamknąć", async () => {
    actions.createRoadmapNode.mockResolvedValue({ ok: false, message: "Sesja wygasła — zaloguj się ponownie." });
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "+ Element" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Sesja wygasła");
    await user.click(within(alert).getByRole("button", { name: "Zamknij" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("brak połączenia (wyjątek) też kończy się komunikatem", async () => {
    actions.createRoadmapNode.mockRejectedValue(new Error("Failed to fetch"));
    const { user } = setup();
    await user.keyboard("n");
    expect(await screen.findByRole("alert")).toHaveTextContent("Brak połączenia z serwerem");
  });

  it("skróty z Ctrl są ignorowane (np. Ctrl+C nie włącza łączenia)", async () => {
    const { user } = setup();
    await user.keyboard("{Control>}c{/Control}");
    expect(screen.getByRole("radio", { name: "Zaznacz" })).toBeChecked();
  });
});
