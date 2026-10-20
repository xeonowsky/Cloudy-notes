import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NodeCard from "@/app/components/roadmap/node-card";
import EdgesLayer from "@/app/components/roadmap/edges-layer";
import NodePanel from "@/app/components/roadmap/node-panel";
import ShapePanel from "@/app/components/roadmap/shape-panel";
import ShapeView from "@/app/components/roadmap/shape-view";
import Toolbar from "@/app/components/roadmap/toolbar";
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

  it("rysuje strzałkę z grotem i szeroką strefą kliknięcia", () => {
    const { container } = render(<EdgesLayer nodes={nodes} edges={[makeEdge()]} selectedEdgeId={null} preview={null} />);
    const hit = container.querySelector("[data-edge-id='edge-1']")!;
    expect(hit).toHaveAttribute("stroke-width", "16");
    expect(container.querySelector("line[marker-end='url(#rp-arrow)']")).toBeTruthy();
  });

  it("pomija strzałki do nieistniejących kart (np. właśnie usuniętych)", () => {
    const { container } = render(
      <EdgesLayer nodes={nodes} edges={[makeEdge({ targetId: "usunieta" })]} selectedEdgeId={null} preview={null} />,
    );
    expect(container.querySelectorAll("line")).toHaveLength(0);
  });

  it("zaznaczona strzałka i podgląd łączenia używają aktywnego grotu", () => {
    const { container } = render(
      <EdgesLayer nodes={nodes} edges={[makeEdge()]} selectedEdgeId="edge-1" preview={{ from: nodes[0], to: { x: 50, y: 300 } }} />,
    );
    const active = container.querySelectorAll("line[marker-end='url(#rp-arrow-active)']");
    expect(active).toHaveLength(2);
    expect(active[1]).toHaveAttribute("stroke-dasharray", "6 6");
  });
});

describe("NodePanel", () => {
  function setup(node = makeNode()) {
    const onChange = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<NodePanel node={node} autoFocusTitle={false} onChange={onChange} onDelete={onDelete} onClose={onClose} />);
    return { onChange, onDelete, onClose, user };
  }

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
    render(<ShapePanel shape={makeShape({ kind: "rect", color: "brand" })} onColor={onColor} onEdit={onEdit} onDelete={onDelete} onClose={() => {}} />);

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
    render(<ShapePanel shape={makeShape()} onColor={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Blok tekstu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edytuj tekst" })).toBeInTheDocument();
  });
});

describe("ShapeView", () => {
  const noop = () => {};

  it("pusty blok tekstu ma podpowiedź, uchwyt rozmiaru tylko po zaznaczeniu", () => {
    const { container, rerender } = render(
      <ShapeView shape={makeShape()} selected={false} editing={false} onTextChange={noop} onTextCommit={noop} />,
    );
    expect(screen.getByText("Dwuklik, aby pisać")).toBeInTheDocument();
    expect(container.querySelector("[data-resize-id]")).toBeNull();

    rerender(<ShapeView shape={makeShape()} selected editing={false} onTextChange={noop} onTextCommit={noop} />);
    expect(container.querySelector("[data-resize-id='shape-1']")).toBeTruthy();
  });

  it("w trybie edycji pokazuje pole, ustawia w nim fokus i zapisuje po Esc", async () => {
    const onTextChange = vi.fn();
    const onTextCommit = vi.fn();
    const user = userEvent.setup();
    render(
      <ShapeView shape={makeShape({ text: "abc" })} selected editing onTextChange={onTextChange} onTextCommit={onTextCommit} />,
    );
    const textarea = screen.getByPlaceholderText("Wpisz tekst…");
    await vi.waitFor(() => expect(textarea).toHaveFocus()); // fokus ustawiany w setTimeout
    expect((textarea as HTMLTextAreaElement).selectionStart).toBe(3); // kursor na końcu

    await user.keyboard("d");
    expect(onTextChange).toHaveBeenCalledWith("abcd");
    await user.keyboard("{Escape}");
    expect(onTextCommit).toHaveBeenCalled();
  });

  it("prostokąt: etykieta w rogu, edycja w jednej linii (Enter kończy)", async () => {
    const onTextCommit = vi.fn();
    const user = userEvent.setup();
    const shape = makeShape({ kind: "rect", text: "Frontend", w: 400, h: 300 });
    const { rerender } = render(<ShapeView shape={shape} selected={false} editing={false} onTextChange={noop} onTextCommit={onTextCommit} />);
    expect(screen.getByText("Frontend")).toBeInTheDocument();

    rerender(<ShapeView shape={shape} selected editing onTextChange={noop} onTextCommit={onTextCommit} />);
    const input = screen.getByPlaceholderText("Etykieta ramki");
    expect(input.tagName).toBe("INPUT");
    await vi.waitFor(() => expect(input).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onTextCommit).toHaveBeenCalled();
  });
});

describe("Toolbar", () => {
  it("zaznacza aktywne narzędzie i zgłasza zmiany", async () => {
    const onTool = vi.fn();
    const onZoom = vi.fn();
    const onFit = vi.fn();
    const onAddNode = vi.fn();
    const user = userEvent.setup();
    render(<Toolbar tool="rect" scale={1.5} onTool={onTool} onAddNode={onAddNode} onZoom={onZoom} onFit={onFit} />);

    expect(screen.getByRole("radio", { name: "Prostokąt" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Tekst" })).not.toBeChecked();
    expect(screen.getByText("150%")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Połącz" }));
    await user.click(screen.getByRole("button", { name: "Przybliż" }));
    await user.click(screen.getByRole("button", { name: "Oddal" }));
    await user.click(screen.getByRole("button", { name: "Dopasuj" }));
    await user.click(screen.getByRole("button", { name: "+ Element" }));

    expect(onTool).toHaveBeenCalledWith("connect");
    expect(onZoom).toHaveBeenNthCalledWith(1, 1.2);
    expect(onZoom.mock.calls[1][0]).toBeCloseTo(1 / 1.2);
    expect(onFit).toHaveBeenCalled();
    expect(onAddNode).toHaveBeenCalled();
  });
});
