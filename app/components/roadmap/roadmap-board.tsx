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
  DEFAULT_TEXT_STYLE,
  NODE_H,
  NODE_W,
  SHAPE_DEFAULTS,
  SHAPE_KIND_LABELS,
  SHAPE_MIN,
  type ActionResult,
  type BoardNote,
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
import NotePicker from "./note-picker";
import type { AddKind } from "./add-menu";
import { parseChecklist } from "@/app/lib/checklist";
import { parseCalendar } from "@/app/lib/calendar";
import { clamp, nodeBox, type Box } from "./geometry";

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
//    hand    — tylko przesuwanie widoku (obiektów nie da się ruszyć);
//              to samo daje przytrzymana SPACJA albo środkowy przycisk myszy
//    rect    — przeciągnij, aby narysować prostokąt
//    text    — kliknij, aby wstawić blok tekstu
//    connect — kliknij obiekt źródłowy (kartę LUB kształt), potem docelowy
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
  hand: "Przeciągaj, aby przesuwać widok",
  rect: "Przeciągnij po tablicy, aby narysować prostokąt",
  text: "Kliknij w tablicę, aby wstawić blok tekstu",
  connect: "Kliknij element, od którego ma wyjść strzałka",
};

type Props = {
  initialNodes: RoadmapNode[];
  initialEdges: RoadmapEdge[];
  initialShapes: RoadmapShape[];
  notes?: BoardNote[]; // notatki użytkownika — do kafelków "Notatka z Cloudy Notes"
};

// Okno wyboru notatki: shapeId = null → nowy kafelek, id → podmiana notatki w kafelku
type Picker = { shapeId: string | null } | null;

export default function RoadmapBoard({ initialNodes, initialEdges, initialShapes, notes = [] }: Props) {
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
  const [spaceHeld, setSpaceHeld] = useState(false); // przytrzymana spacja = chwilowa rączka
  const [isPanning, setIsPanning] = useState(false); // tylko do kursora "zaciśniętej dłoni"
  const [fullscreen, setFullscreen] = useState(false);
  const [focusTitleSignal, setFocusTitleSignal] = useState(0);
  const [picker, setPicker] = useState<Picker>(null);
  const [isSaving, startTransition] = useTransition();

  const viewportRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<Interaction>(null);

  const selectedNode = selection?.kind === "node" ? nodes.find((n) => n.id === selection.id) : undefined;
  const selectedEdge = selection?.kind === "edge" ? edges.find((e) => e.id === selection.id) : undefined;
  const selectedShape = selection?.kind === "shape" ? shapes.find((s) => s.id === selection.id) : undefined;
  const doneCount = nodes.filter((n) => n.status === "done").length;

  // Tryb "rączki": widok można tylko przesuwać, obiekty są nieklikalne
  const panMode = tool === "hand" || spaceHeld;

  // Prostokąt każdego obiektu po id — strzałki łączą karty i kształty bez rozróżnienia
  const boxes = new Map<string, Box>([
    ...nodes.map((n) => [n.id, nodeBox(n)] as const),
    ...shapes.map((s) => [s.id, { x: s.x, y: s.y, w: s.w, h: s.h }] as const),
  ]);
  const connectSource = connectFrom ? boxes.get(connectFrom) : undefined;

  // Podpis obiektu w panelu strzałki: nazwa karty, tekst kształtu albo jego rodzaj
  function itemLabel(id: string) {
    const node = nodes.find((n) => n.id === id);
    if (node) return node.title;
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return "?";
    const text =
      shape.kind === "note"
        ? (notesById.get(shape.noteId ?? "")?.title ?? "")
        : shape.kind === "checklist"
          ? parseChecklist(shape.text).title
          : shape.kind === "calendar"
            ? parseCalendar(shape.text).title
            : shape.text.trim().split("\n")[0];
    if (text) return text.length > 30 ? `${text.slice(0, 30)}…` : text;
    return SHAPE_KIND_LABELS[shape.kind];
  }

  // Ramki pod spodem, cała reszta nad nimi (w obrębie grupy: kolejność tworzenia)
  const orderedShapes = [...shapes.filter((s) => s.kind === "rect"), ...shapes.filter((s) => s.kind !== "rect")];
  const notesById = new Map(notes.map((n) => [n.id, n]));

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
    // Wysyłamy cały stan kształtu (bez id i rodzaju — tych nie da się zmienić)
    const { x, y, w, h, text, color, noteId, fontSize, textColor, bold, italic, align } = shape;
    persist(() =>
      updateRoadmapShape(shape.id, { x, y, w, h, text, color, noteId, fontSize, textColor, bold, italic, align }),
    );
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

  // Lewy górny róg obiektu o rozmiarze w×h tak, by wypadł na środku ekranu.
  // Lekki rozrzut — żeby kolejne obiekty nie lądowały idealnie na sobie.
  function centerSpot(w: number, h: number) {
    const rect = viewportRef.current!.getBoundingClientRect();
    const jitter = () => Math.round((Math.random() - 0.5) * 80);
    return {
      x: Math.round((rect.width / 2 - view.x) / view.scale - w / 2) + jitter(),
      y: Math.round((rect.height / 2 - view.y) / view.scale - h / 2) + jitter(),
    };
  }

  function addNode() {
    const node: RoadmapNode = {
      id: crypto.randomUUID(),
      title: "Nowy element",
      category: "",
      status: "todo",
      ...centerSpot(NODE_W, NODE_H),
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
    const { color, fontSize } = SHAPE_DEFAULTS[kind];
    return { id: crypto.randomUUID(), kind, x, y, w, h, text: "", color, noteId: null, ...DEFAULT_TEXT_STYLE, fontSize };
  }

  // Nowy obiekt z menu "+ Dodaj" — na środku ekranu, od razu zaznaczony
  function addShape(kind: ShapeKind, noteId: string | null = null) {
    const { w, h } = SHAPE_DEFAULTS[kind];
    const { x, y } = centerSpot(w, h);
    const shape = { ...newShape(kind, x, y, w, h), noteId };
    setShapes((ss) => [...ss, shape]);
    changeTool("select");
    setSelection({ kind: "shape", id: shape.id });
    // karteczka i kod: od razu można pisać
    if (kind === "sticky" || kind === "code") setEditingShapeId(shape.id);
    persist(() => createRoadmapShape(shape));
  }

  function handleAdd(kind: AddKind) {
    if (kind === "node") addNode();
    else if (kind === "note") setPicker({ shapeId: null }); // najpierw wybór notatki
    else addShape(kind);
  }

  function pickNote(noteId: string) {
    if (picker?.shapeId) changeShape(picker.shapeId, { noteId }, true);
    else addShape("note", noteId);
    setPicker(null);
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

  // "Edycja" zależy od rodzaju: tekst — pisanie, notatka — wybór innej,
  // lista zadań i kalendarz — nic (ich pola i dni działają cały czas)
  function editShape(id: string) {
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;
    setSelection({ kind: "shape", id });
    if (shape.kind === "note") setPicker({ shapeId: id });
    else if (shape.kind !== "checklist" && shape.kind !== "calendar") setEditingShapeId(id);
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
      setEdges((es) => es.filter((e) => e.sourceId !== id && e.targetId !== id));
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

  // Przesuwanie widoku — wspólne dla pustego tła, rączki, spacji i środkowego przycisku
  function startPan(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    interaction.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      kind: "pan",
      origX: view.x,
      origY: view.y,
    };
    setIsPanning(true);
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const middle = e.button === 1;
    if (e.button !== 0 && !middle) return; // lewy przycisk / dotyk, środkowy = przesuwanie
    const target = e.target as Element;
    // klik w pole, przycisk albo link wewnątrz obiektu (np. lista zadań, kafelek notatki) = zwykłe działanie
    if (!middle && target.closest("input, textarea, button, a")) return;

    // Rączka (narzędzie H, przytrzymana spacja albo środkowy przycisk):
    // zawsze przesuwamy widok — nie zaznaczamy i nie ruszamy obiektów
    if (panMode || middle) {
      e.preventDefault();
      startPan(e);
      return;
    }

    const nodeId = target.closest<HTMLElement>("[data-node-id]")?.dataset.nodeId;
    const edgeId = target.closest<SVGElement>("[data-edge-id]")?.dataset.edgeId;
    const shapeId = target.closest<HTMLElement>("[data-shape-id]")?.dataset.shapeId;
    const resizeId = target.closest<HTMLElement>("[data-resize-id]")?.dataset.resizeId;
    const drag: Drag = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };

    // --- narzędzie: łączenie — dowolne obiekty: karty, prostokąty, bloki tekstu ---
    if (tool === "connect") {
      const itemId = nodeId ?? resizeId ?? shapeId;
      if (!itemId) {
        setConnectFrom(null);
        setCursor(null);
      } else if (!connectFrom || connectFrom === itemId) {
        setConnectFrom(connectFrom === itemId ? null : itemId);
        setCursor(toWorld(e.clientX, e.clientY));
      } else {
        connect(connectFrom, itemId);
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
      startPan(e);
      setSelection(null);
    }
  }

  // Wylicza nowy stan przeciąganego obiektu — używane w trakcie ruchu i na końcu
  type DragResult = { x?: number; y?: number; w?: number; h?: number };
  function applyDrag(it: NonNullable<Interaction>, clientX: number, clientY: number): DragResult | null {
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
    if (it.kind === "pan") {
      setIsPanning(false);
      return;
    }
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
      const final = { ...shape, ...result, ...(tooSmall ? { w: SHAPE_DEFAULTS.rect.w, h: SHAPE_DEFAULTS.rect.h } : {}) };
      setShapes((ss) => ss.map((s) => (s.id === final.id ? final : s)));
      setTool("select");
      setSelection({ kind: "shape", id: final.id });
      persist(() => createRoadmapShape(final));
      return;
    }
    saveShape({ ...shape, ...result });
  }

  // Dwuklik: na karcie — edycja nazwy w panelu, na kształcie — edycja tekstu,
  // na pustym tle — nowa notatka (blok tekstu)
  function handleDoubleClick(e: ReactMouseEvent<HTMLDivElement>) {
    if (tool !== "select" || panMode) return;
    const target = e.target as Element;
    if (target.closest("input, textarea, button, a, [data-edge-id]")) return;
    const nodeId = target.closest<HTMLElement>("[data-node-id]")?.dataset.nodeId;
    const shapeId = target.closest<HTMLElement>("[data-shape-id]")?.dataset.shapeId;
    if (nodeId) {
      setSelection({ kind: "node", id: nodeId });
      setFocusTitleSignal((n) => n + 1);
    } else if (shapeId) {
      editShape(shapeId);
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

    // Otwarte okno wyboru notatki: skróty tablicy nie działają, Esc je zamyka
    if (picker) {
      if (e.key === "Escape") setPicker(null);
      return;
    }

    // Spacja: rączka, dopóki klawisz jest wciśnięty. preventDefault — żeby strona
    // się nie przewijała, a przycisk z fokusem (np. w toolbarze) się nie "kliknął".
    if (e.code === "Space") {
      e.preventDefault();
      if (!e.repeat) setSpaceHeld(true);
      return;
    }

    const key = e.key.toLowerCase();
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteSelected();
    } else if (e.key === "Escape") {
      // Esc najpierw kończy narzędzie / zaznaczenie, a gdy nie ma czego kończyć — pełny ekran
      if (tool === "select" && !selection && fullscreen) setFullscreen(false);
      changeTool("select");
      setSelection(null);
    } else if (e.key === "Enter" && selection?.kind === "shape") {
      e.preventDefault();
      editShape(selection.id);
    } else if (key === "n") addNode();
    else if (key === "v") changeTool("select");
    else if (key === "h") changeTool("hand");
    else if (key === "f") setFullscreen((f) => !f);
    else if (key === "r") changeTool("rect");
    else if (key === "t") changeTool("text");
    else if (key === "c") changeTool("connect");
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyDown(e);
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      setSpaceHeld((held) => {
        if (held) e.preventDefault(); // puszczenie spacji nie "klika" przycisku z fokusem
        return false;
      });
    };
    // Przełączenie karty / okna ze wciśniętą spacją — keyup by do nas nie dotarł
    const release = () => setSpaceHeld(false);
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", release);
    };
  }, []);

  // Pełny ekran: tablica przykrywa navbar i stopkę (position: fixed),
  // a strona pod spodem nie może się przewijać
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

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

  const cursorClass = panMode
    ? isPanning
      ? "cursor-grabbing"
      : "cursor-grab"
    : tool === "select"
      ? "cursor-grab active:cursor-grabbing"
      : tool === "text"
        ? "cursor-text"
        : "cursor-crosshair";

  return (
    <div
      className={`overflow-hidden bg-[#f7fbfb] dark:bg-[#0c1414] ${
        fullscreen ? "fixed inset-0 z-50" : "absolute inset-0"
      }`}
    >
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
        // Środkowy przycisk w Windows włącza "autoprzewijanie" — blokujemy je
        onMouseDown={(e) => e.button === 1 && e.preventDefault()}
        className={`absolute inset-0 touch-none text-ink/15 dark:text-white/10 ${cursorClass}`}
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
              selected={selectedShape?.id === shape.id || connectFrom === shape.id}
              editing={editingShapeId === shape.id}
              note={shape.noteId ? notesById.get(shape.noteId) : undefined}
              onContentChange={(text, save) => changeShape(shape.id, { text }, save)}
              onTextChange={(text) => changeShape(shape.id, { text }, false)}
              onTextCommit={() => {
                saveShape(shape);
                setEditingShapeId(null);
              }}
            />
          ))}
          <EdgesLayer
            boxes={boxes}
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

        {/* Rączka: przezroczysta warstwa NAD obiektami — kliknięcia trafiają w nią,
            więc żadnej karty ani kształtu nie da się złapać, a kursor to zawsze dłoń */}
        {panMode && <div data-pan-layer aria-hidden className="absolute inset-0" />}
      </div>

      <Toolbar
        tool={tool}
        scale={view.scale}
        onTool={changeTool}
        onAdd={handleAdd}
        onZoom={zoomFromCenter}
        onFit={fitToContent}
        fullscreen={fullscreen}
        onFullscreen={() => setFullscreen((f) => !f)}
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
              Dodaj technologię, obrysuj grupę prostokątem (R), dopisz notatkę blokiem tekstu (T lub dwuklik) i połącz
              dowolne obiekty strzałkami (C). Spacja + przeciąganie przesuwa widok.
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
          focusTitleSignal={focusTitleSignal}
          onChange={(patch, save) => changeNode(selectedNode.id, patch, save)}
          onDelete={deleteSelected}
          onClose={() => setSelection(null)}
        />
      )}

      {selectedShape && (
        <ShapePanel
          key={selectedShape.id}
          shape={selectedShape}
          editing={editingShapeId === selectedShape.id}
          onColor={(color) => changeShape(selectedShape.id, { color }, true)}
          onStyle={(patch) => changeShape(selectedShape.id, patch, true)}
          onEdit={() => editShape(selectedShape.id)}
          onDelete={deleteSelected}
          onClose={() => setSelection(null)}
        />
      )}

      {selectedEdge && (
        <div className="absolute top-4 right-4 z-20 flex w-72 max-w-[calc(100%-2rem)] flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-lg dark:border-white/10 dark:bg-[#0f1f1e]">
          <p className="text-sm text-ink dark:text-white">
            <span className="font-semibold">{itemLabel(selectedEdge.sourceId)}</span>
            {" → "}
            <span className="font-semibold">{itemLabel(selectedEdge.targetId)}</span>
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

      {picker && (
        <NotePicker
          notes={notes}
          currentId={picker.shapeId ? (shapes.find((s) => s.id === picker.shapeId)?.noteId ?? null) : null}
          onPick={pickNote}
          onClose={() => setPicker(null)}
        />
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
