"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  createRoadmapEdge,
  createRoadmapNode,
  createRoadmapShape,
  deleteRoadmapEdge,
  deleteRoadmapNode,
  deleteRoadmapShape,
  moveRoadmapNode,
  updateRoadmapNode,
  updateRoadmapShape,
} from "@/app/actions/roadmap";
import {
  NODE_H,
  NODE_W,
  SHAPE_MIN,
  type ActionResult,
  type RoadmapEdge,
  type RoadmapNode,
  type RoadmapShape,
  type ShapeKind,
} from "@/app/lib/roadmap-types";
import NodeCard from "./node-card";
import EdgesLayer from "./edges-layer";
import NodePanel from "./node-panel";
import ShapeView from "./shape-view";
import ShapePanel from "./shape-panel";
import Toolbar, { type Tool } from "./toolbar";
import { clamp } from "./geometry";

// ─────────────────────────────────────────────────────────────
// Jak działa tablica (whiteboard):
//
// 1. "Świat" — karty i kształty mają współrzędne x/y niezależne od ekranu.
// 2. "Widok" (view) — przesunięcie i skala kamery. Cały świat siedzi
//    w jednym <div> z transform: translate(x, y) scale(s).
//    ekran = świat * scale + przesunięcie
//    świat = (ekran - przesunięcie) / scale
// 3. Narzędzie (tool) decyduje, co robi kliknięcie w tablicę:
//    select  — zaznacz / przeciągnij / zmień rozmiar / przesuń widok
//    rect    — przeciągnij, aby narysować prostokąt
//    text    — kliknij, aby wstawić blok tekstu
//    connect — kliknij kartę źródłową, potem docelową
// 4. Zdarzenia wskaźnika obsługuje JEDEN element — viewport. Po kliknięciu
//    sprawdzamy, CO kliknięto (data-node-id, data-shape-id…) i zapamiętujemy
//    trwającą interakcję w refie. setPointerCapture daje nam ruchy myszy
//    nawet poza tablicą. Pointer events działają też dotykowo.
// 5. Optimistic UI — zmiana trafia od razu do stanu Reacta, a server
//    action zapisuje ją w tle. Gdy zapis się nie uda, pokazujemy błąd.
// ─────────────────────────────────────────────────────────────

type View = { x: number; y: number; scale: number };
type Selection = { kind: "node" | "edge" | "shape"; id: string } | null;

// Interakcja trwająca między pointerdown a pointerup. Trzymamy ją w useRef,
// bo zmienia się przy każdym ruchu myszy, a sama nie wpływa na wygląd.
type Drag = { pointerId: number; startX: number; startY: number };
type Interaction =
  | (Drag & { kind: "pan"; origX: number; origY: number })
  | (Drag & { kind: "move"; target: "node" | "shape"; id: string; origX: number; origY: number; moved: boolean })
  | (Drag & { kind: "resize"; id: string; origW: number; origH: number; moved: boolean })
  | (Drag & { kind: "draw"; id: string; originX: number; originY: number })
  | null;

const MIN_SCALE = 0.3;
const MAX_SCALE = 2;
const DRAG_THRESHOLD = 4; // px — mniejszy ruch traktujemy jako zwykłe kliknięcie
const GRID = 24; // odstęp kropek w tle

const TOOL_HINTS: Record<Tool, string | null> = {
  select: null,
  rect: "Przeciągnij po tablicy, aby narysować prostokąt",
  text: "Kliknij w tablicę, aby wstawić blok tekstu",
  connect: "Kliknij element, od którego ma wyjść strzałka",
};

type Props = { initialNodes: RoadmapNode[]; initialEdges: RoadmapEdge[]; initialShapes: RoadmapShape[] };

export default function RoadmapBoard({ initialNodes, initialEdges, initialShapes }: Props) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [shapes, setShapes] = useState(initialShapes);
  const [view, setView] = useState<View>({ x: 40, y: 40, scale: 1 });
  const [tool, setTool] = useState<Tool>("select");
  const [selection, setSelection] = useState<Selection>(null);
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  const viewportRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<Interaction>(null);

  const selectedNode = selection?.kind === "node" ? nodes.find((n) => n.id === selection.id) : undefined;
  const selectedEdge = selection?.kind === "edge" ? edges.find((e) => e.id === selection.id) : undefined;
  const selectedShape = selection?.kind === "shape" ? shapes.find((s) => s.id === selection.id) : undefined;
  const connectSource = connectFrom ? nodes.find((n) => n.id === connectFrom) : undefined;
  const doneCount = nodes.filter((n) => n.status === "done").length;

  // Ramki pod spodem, klocki tekstowe nad nimi (w obrębie rodzaju: kolejność tworzenia)
  const orderedShapes = [...shapes.filter((s) => s.kind === "rect"), ...shapes.filter((s) => s.kind === "text")];

  // ---------- zapis w tle ----------

  function persist(call: () => Promise<ActionResult>) {
    startTransition(async () => {
      try {
        const result = await call();
        if (!result.ok) setError(result.message);
      } catch {
        setError("Brak połączenia z serwerem — zmiany mogły się nie zapisać.");
      }
    });
  }

  function saveShape(shape: RoadmapShape) {
    const { x, y, w, h, text, color } = shape;
    persist(() => updateRoadmapShape(shape.id, { x, y, w, h, text, color }));
  }

  // ---------- współrzędne ----------

  function toWorld(clientX: number, clientY: number) {
    const rect = viewportRef.current!.getBoundingClientRect();
    return {
      x: Math.round((clientX - rect.left - view.x) / view.scale),
      y: Math.round((clientY - rect.top - view.y) / view.scale),
    };
  }

  // Ruch myszy w pikselach ekranu → przesunięcie w jednostkach świata
  function worldDelta(it: Drag, clientX: number, clientY: number) {
    return { dx: (clientX - it.startX) / view.scale, dy: (clientY - it.startY) / view.scale };
  }

  // ---------- narzędzia ----------

  function changeTool(next: Tool) {
    setTool(next);
    setConnectFrom(null);
    setCursor(null);
    setEditingShapeId(null);
    if (next !== "select") setSelection(null);
  }

  // ---------- karty (elementy stacku) ----------

  function addNode() {
    const rect = viewportRef.current!.getBoundingClientRect();
    // lekki rozrzut, żeby kolejne karty nie lądowały idealnie na sobie
    const jitter = () => Math.round((Math.random() - 0.5) * 80);
    const node: RoadmapNode = {
      id: crypto.randomUUID(),
      title: "Nowy element",
      category: "",
      status: "todo",
      x: Math.round((rect.width / 2 - view.x) / view.scale - NODE_W / 2) + jitter(),
      y: Math.round((rect.height / 2 - view.y) / view.scale - NODE_H / 2) + jitter(),
    };
    setNodes((ns) => [...ns, node]);
    changeTool("select");
    setSelection({ kind: "node", id: node.id });
    setJustCreatedId(node.id);
    persist(() => createRoadmapNode(node));
  }

  function changeNode(id: string, patch: Partial<RoadmapNode>, save: boolean) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const next = { ...node, ...patch };
    setNodes((ns) => ns.map((n) => (n.id === id ? next : n)));
    if (save) {
      persist(() => updateRoadmapNode(id, { title: next.title, category: next.category, status: next.status }));
    }
  }

  function connect(sourceId: string, targetId: string) {
    const exists = edges.some((e) => e.sourceId === sourceId && e.targetId === targetId);
    if (exists || sourceId === targetId) return;
    const edge: RoadmapEdge = { id: crypto.randomUUID(), sourceId, targetId };
    setEdges((es) => [...es, edge]);
    persist(() => createRoadmapEdge(edge));
  }

  // ---------- kształty ----------

  function newShape(kind: ShapeKind, x: number, y: number, w: number, h: number): RoadmapShape {
    return { id: crypto.randomUUID(), kind, x, y, w, h, text: "", color: kind === "rect" ? "brand" : "amber" };
  }

  // Blok tekstu: od razu zaznaczony i w trybie pisania
  function addTextBlock(x: number, y: number) {
    const shape = newShape("text", x, y, 220, 120);
    setShapes((ss) => [...ss, shape]);
    setTool("select");
    setSelection({ kind: "shape", id: shape.id });
    setEditingShapeId(shape.id);
    persist(() => createRoadmapShape(shape));
  }

  function changeShape(id: string, patch: Partial<RoadmapShape>, save: boolean) {
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;
    const next = { ...shape, ...patch };
    setShapes((ss) => ss.map((s) => (s.id === id ? next : s)));
    if (save) saveShape(next);
  }

  function startEditing(id: string) {
    setSelection({ kind: "shape", id });
    setEditingShapeId(id);
  }

  // ---------- usuwanie ----------

  function deleteSelected() {
    if (!selection) return;
    const { kind, id } = selection;
    if (kind === "node") {
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.sourceId !== id && e.targetId !== id));
      persist(() => deleteRoadmapNode(id));
    } else if (kind === "edge") {
      setEdges((es) => es.filter((e) => e.id !== id));
      persist(() => deleteRoadmapEdge(id));
    } else {
      setShapes((ss) => ss.filter((s) => s.id !== id));
      persist(() => deleteRoadmapShape(id));
    }
    setSelection(null);
    setEditingShapeId(null);
  }

  // ---------- zoom ----------

  // Zoom "wokół punktu": punkt pod kursorem zostaje w tym samym miejscu ekranu
  function zoomAt(px: number, py: number, factor: number) {
    setView((v) => {
      const scale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
      const k = scale / v.scale;
      return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  }

  function zoomFromCenter(factor: number) {
    const rect = viewportRef.current!.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, factor);
  }

  // Kamera tak, żeby wszystko (karty i kształty) zmieściło się na ekranie
  function fitToContent() {
    const rect = viewportRef.current!.getBoundingClientRect();
    const boxes = [
      ...nodes.map((n) => ({ x: n.x, y: n.y, w: NODE_W, h: NODE_H })),
      ...shapes.map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h })),
    ];
    if (boxes.length === 0) {
      setView({ x: 40, y: 40, scale: 1 });
      return;
    }
    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    const pad = 80;
    const scale = clamp(
      Math.min((rect.width - pad * 2) / (maxX - minX), (rect.height - pad * 2) / (maxY - minY)),
      MIN_SCALE,
      1,
    );
    setView({
      scale,
      x: rect.width / 2 - ((minX + maxX) / 2) * scale,
      y: rect.height / 2 - ((minY + maxY) / 2) * scale,
    });
  }

  // ---------- zdarzenia wskaźnika ----------

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return; // tylko lewy przycisk / dotyk
    const target = e.target as Element;
    if (target.closest("input, textarea")) return; // klik w pole tekstowe = zwykła edycja

    const nodeId = target.closest<HTMLElement>("[data-node-id]")?.dataset.nodeId;
    const edgeId = target.closest<SVGElement>("[data-edge-id]")?.dataset.edgeId;
    const shapeId = target.closest<HTMLElement>("[data-shape-id]")?.dataset.shapeId;
    const resizeId = target.closest<HTMLElement>("[data-resize-id]")?.dataset.resizeId;
    const drag: Drag = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };

    // --- narzędzie: łączenie (tylko między kartami stacku) ---
    if (tool === "connect") {
      if (!nodeId) {
        setConnectFrom(null);
        setCursor(null);
      } else if (!connectFrom || connectFrom === nodeId) {
        setConnectFrom(connectFrom === nodeId ? null : nodeId);
        setCursor(toWorld(e.clientX, e.clientY));
      } else {
        connect(connectFrom, nodeId);
        setConnectFrom(null);
        setCursor(null);
      }
      return;
    }

    // --- narzędzie: tekst — klik wstawia blok ---
    if (tool === "text") {
      const p = toWorld(e.clientX, e.clientY);
      addTextBlock(p.x, p.y);
      return;
    }

    // Zdejmujemy fokus z pól (panel, edytowany tekst) — onBlur zapisze zmiany
    (document.activeElement as HTMLElement | null)?.blur();
    setEditingShapeId(null);
    e.currentTarget.setPointerCapture(e.pointerId);

    // --- narzędzie: prostokąt — rysujemy od punktu kliknięcia ---
    if (tool === "rect") {
      const p = toWorld(e.clientX, e.clientY);
      const shape = newShape("rect", p.x, p.y, 1, 1);
      setShapes((ss) => [...ss, shape]);
      interaction.current = { ...drag, kind: "draw", id: shape.id, originX: p.x, originY: p.y };
      return;
    }

    // --- narzędzie: zaznaczanie ---
    if (edgeId) {
      setSelection({ kind: "edge", id: edgeId });
      return;
    }

    const node = nodeId ? nodes.find((n) => n.id === nodeId) : undefined;
    const shape = !node && (resizeId ?? shapeId) ? shapes.find((s) => s.id === (resizeId ?? shapeId)) : undefined;

    if (shape && resizeId) {
      interaction.current = { ...drag, kind: "resize", id: shape.id, origW: shape.w, origH: shape.h, moved: false };
    } else if (node || shape) {
      const item = (node ?? shape)!;
      const target = node ? "node" : "shape";
      interaction.current = { ...drag, kind: "move", target, id: item.id, origX: item.x, origY: item.y, moved: false };
      setSelection({ kind: target, id: item.id });
      setJustCreatedId(null); // autofocus nazwy tylko zaraz po utworzeniu karty
    } else {
      interaction.current = { ...drag, kind: "pan", origX: view.x, origY: view.y };
      setSelection(null);
    }
  }

  // Wylicza nowy stan przeciąganego obiektu — używane w trakcie ruchu i na końcu
  type Box = { x?: number; y?: number; w?: number; h?: number };
  function applyDrag(it: NonNullable<Interaction>, clientX: number, clientY: number): Box | null {
    const { dx, dy } = worldDelta(it, clientX, clientY);

    if (it.kind === "move") {
      const pos = { x: Math.round(it.origX + dx), y: Math.round(it.origY + dy) };
      if (it.target === "node") setNodes((ns) => ns.map((n) => (n.id === it.id ? { ...n, ...pos } : n)));
      else setShapes((ss) => ss.map((s) => (s.id === it.id ? { ...s, ...pos } : s)));
      return pos;
    }
    if (it.kind === "resize") {
      const shape = shapes.find((s) => s.id === it.id);
      if (!shape) return null;
      const min = SHAPE_MIN[shape.kind];
      const size = { w: Math.round(Math.max(min.w, it.origW + dx)), h: Math.round(Math.max(min.h, it.origH + dy)) };
      setShapes((ss) => ss.map((s) => (s.id === it.id ? { ...s, ...size } : s)));
      return size;
    }
    if (it.kind === "draw") {
      // Rysować można w każdą stronę — prostokąt zaczyna się w mniejszym z punktów
      const p = toWorld(clientX, clientY);
      const box = {
        x: Math.min(it.originX, p.x),
        y: Math.min(it.originY, p.y),
        w: Math.abs(p.x - it.originX),
        h: Math.abs(p.y - it.originY),
      };
      setShapes((ss) => ss.map((s) => (s.id === it.id ? { ...s, ...box } : s)));
      return box;
    }
    return null;
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (tool === "connect" && connectFrom) setCursor(toWorld(e.clientX, e.clientY));

    const it = interaction.current;
    if (!it || it.pointerId !== e.pointerId) return;

    if (it.kind === "pan") {
      const dx = e.clientX - it.startX;
      const dy = e.clientY - it.startY;
      setView((v) => ({ ...v, x: it.origX + dx, y: it.origY + dy }));
      return;
    }
    if ((it.kind === "move" || it.kind === "resize") && !it.moved) {
      if (Math.hypot(e.clientX - it.startX, e.clientY - it.startY) < DRAG_THRESHOLD) return;
      it.moved = true;
    }
    applyDrag(it, e.clientX, e.clientY);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const it = interaction.current;
    if (!it || it.pointerId !== e.pointerId) return;
    interaction.current = null;
    if (it.kind === "pan") return;
    if ((it.kind === "move" || it.kind === "resize") && !it.moved) return;

    // Do bazy zapisujemy tylko stan końcowy, nie każdy piksel ruchu
    const result = applyDrag(it, e.clientX, e.clientY);
    if (!result) return;

    if (it.kind === "move" && it.target === "node") {
      persist(() => moveRoadmapNode(it.id, result));
      return;
    }
    const shape = shapes.find((s) => s.id === it.id);
    if (!shape) return;

    if (it.kind === "draw") {
      // Samo kliknięcie (bez przeciągnięcia) = prostokąt w domyślnym rozmiarze
      const tooSmall = (result.w ?? 0) < SHAPE_MIN.rect.w || (result.h ?? 0) < SHAPE_MIN.rect.h;
      const final = { ...shape, ...result, ...(tooSmall ? { w: 280, h: 180 } : {}) };
      setShapes((ss) => ss.map((s) => (s.id === final.id ? final : s)));
      setTool("select");
      setSelection({ kind: "shape", id: final.id });
      persist(() => createRoadmapShape(final));
      return;
    }
    saveShape({ ...shape, ...result });
  }

  // Dwuklik: na kształcie — edycja tekstu, na pustym tle — nowy blok tekstu
  function handleDoubleClick(e: ReactMouseEvent<HTMLDivElement>) {
    if (tool !== "select") return;
    const target = e.target as Element;
    if (target.closest("input, textarea, [data-node-id], [data-edge-id]")) return;
    const shapeId = target.closest<HTMLElement>("[data-shape-id]")?.dataset.shapeId;
    if (shapeId) {
      startEditing(shapeId);
    } else {
      const p = toWorld(e.clientX, e.clientY);
      addTextBlock(p.x, p.y);
    }
  }

  // ---------- skróty klawiszowe i kółko myszy ----------

  // useEffectEvent: funkcja zawsze widzi aktualny stan, a mimo to efekt
  // niżej nie musi się podpinać od nowa po każdej zmianie stanu.
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    const el = document.activeElement;
    const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return; // pisanie w polu ma pierwszeństwo

    const key = e.key.toLowerCase();
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteSelected();
    } else if (e.key === "Escape") {
      changeTool("select");
      setSelection(null);
    } else if (e.key === "Enter" && selection?.kind === "shape") {
      e.preventDefault();
      startEditing(selection.id);
    } else if (key === "n") addNode();
    else if (key === "v") changeTool("select");
    else if (key === "r") changeTool("rect");
    else if (key === "t") changeTool("text");
    else if (key === "c") changeTool("connect");
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const zoomAtEvent = useEffectEvent(zoomAt);

  // Kółko myszy = zoom. Reactowy onWheel jest "pasywny" i nie pozwala
  // wywołać preventDefault (strona by się przewijała), dlatego podpinamy
  // natywny listener z { passive: false }.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      zoomAtEvent(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0015));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ---------- render ----------

  const hint = tool === "connect" && connectFrom ? "Teraz kliknij element docelowy" : TOOL_HINTS[tool];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f7fbfb] dark:bg-[#0c1414]">
      {/* Viewport — tu trafiają wszystkie zdarzenia wskaźnika */}
      <div
        ref={viewportRef}
        role="application"
        aria-label="Tablica Board"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className={`absolute inset-0 touch-none text-ink/15 dark:text-white/10 ${
          tool === "select" ? "cursor-grab active:cursor-grabbing" : tool === "text" ? "cursor-text" : "cursor-crosshair"
        }`}
        style={{
          // Kropkowana siatka przesuwa się i skaluje razem z widokiem
          backgroundImage: "radial-gradient(currentColor 1.2px, transparent 1.2px)",
          backgroundSize: `${GRID * view.scale}px ${GRID * view.scale}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          {/* Kolejność warstw: kształty → strzałki → karty stacku */}
          {orderedShapes.map((shape) => (
            <ShapeView
              key={shape.id}
              shape={shape}
              selected={selectedShape?.id === shape.id}
              editing={editingShapeId === shape.id}
              onTextChange={(text) => changeShape(shape.id, { text }, false)}
              onTextCommit={() => {
                saveShape(shape);
                setEditingShapeId(null);
              }}
            />
          ))}
          <EdgesLayer
            nodes={nodes}
            edges={edges}
            selectedEdgeId={selectedEdge?.id ?? null}
            preview={connectSource && cursor ? { from: connectSource, to: cursor } : null}
          />
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              selected={selectedNode?.id === node.id}
              connectMode={tool === "connect"}
              isConnectSource={connectFrom === node.id}
            />
          ))}
        </div>
      </div>

      <Toolbar
        tool={tool}
        scale={view.scale}
        onTool={changeTool}
        onAddNode={addNode}
        onZoom={zoomFromCenter}
        onFit={fitToContent}
      />

      {/* Postęp + status zapisu */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-xl border border-line bg-white/95 px-3 py-2 text-xs text-ink/70 shadow-sm dark:border-white/10 dark:bg-[#0f1f1e]/95 dark:text-white/70">
        <span>
          Opanowane: <strong className="text-ink dark:text-white">{doneCount}</strong> / {nodes.length}
        </span>
        <span aria-live="polite">{isSaving ? "Zapisywanie…" : "Zapisano"}</span>
      </div>

      {/* Podpowiedź aktywnego narzędzia */}
      {hint && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-deep px-4 py-2 text-sm whitespace-nowrap text-white shadow-lg sm:bottom-4 dark:bg-brand dark:text-ink">
          {hint} · Esc kończy
        </div>
      )}

      {/* Pusta tablica */}
      {nodes.length === 0 && shapes.length === 0 && tool === "select" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
          <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand bg-white/90 p-8 text-center dark:bg-[#0f1f1e]/90">
            <p className="text-lg text-ink dark:text-white">Zacznij układać swój stack ☁️</p>
            <p className="text-sm text-ink/60 dark:text-white/60">
              Dodaj technologię, obrysuj grupę prostokątem (R), dopisz notatkę blokiem tekstu (T) i połącz elementy
              strzałkami (C).
            </p>
            <button
              type="button"
              onClick={addNode}
              className="flex h-9 cursor-pointer items-center rounded-lg bg-brand-deep px-3 text-sm font-medium text-white hover:bg-[#174744] dark:bg-brand dark:text-ink"
            >
              + Pierwszy element
            </button>
          </div>
        </div>
      )}

      {/* Panele zaznaczenia — key wymusza nowy panel dla innego obiektu */}
      {selectedNode && (
        <NodePanel
          key={selectedNode.id}
          node={selectedNode}
          autoFocusTitle={selectedNode.id === justCreatedId}
          onChange={(patch, save) => changeNode(selectedNode.id, patch, save)}
          onDelete={deleteSelected}
          onClose={() => setSelection(null)}
        />
      )}

      {selectedShape && editingShapeId !== selectedShape.id && (
        <ShapePanel
          key={selectedShape.id}
          shape={selectedShape}
          onColor={(color) => changeShape(selectedShape.id, { color }, true)}
          onEdit={() => startEditing(selectedShape.id)}
          onDelete={deleteSelected}
          onClose={() => setSelection(null)}
        />
      )}

      {selectedEdge && (
        <div className="absolute top-4 right-4 z-20 flex w-72 max-w-[calc(100%-2rem)] flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-lg dark:border-white/10 dark:bg-[#0f1f1e]">
          <p className="text-sm text-ink dark:text-white">
            <span className="font-semibold">{nodes.find((n) => n.id === selectedEdge.sourceId)?.title}</span>
            {" → "}
            <span className="font-semibold">{nodes.find((n) => n.id === selectedEdge.targetId)?.title}</span>
          </p>
          <button
            type="button"
            onClick={deleteSelected}
            className="cursor-pointer rounded-lg border border-danger/30 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5"
          >
            Usuń połączenie
          </button>
        </div>
      )}

      {/* Błąd zapisu */}
      {error && (
        <div role="alert" className="absolute right-4 bottom-4 z-30 flex max-w-sm items-start gap-3 rounded-xl border border-danger/30 bg-white p-3 text-sm text-danger shadow-lg dark:bg-[#1a1010]">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Zamknij" className="cursor-pointer">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
