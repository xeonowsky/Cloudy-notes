import type { Note } from "@/app/lib/notes";
import { DEFAULT_TEXT_STYLE, type RoadmapEdge, type RoadmapNode, type RoadmapShape } from "@/app/lib/roadmap-types";

export function makeNote(patch: Partial<Note> = {}): Note {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "Zakupy",
    content: "- mleko\n- **chleb**",
    color: "yellow",
    priority: 1,
    pinned: false,
    created_at: new Date("2026-10-01T10:00:00Z"),
    updated_at: new Date("2026-10-15T10:00:00Z"),
    ...patch,
  };
}

export function makeNode(patch: Partial<RoadmapNode> = {}): RoadmapNode {
  return { id: "node-1", title: "React", category: "Frontend", status: "todo", x: 100, y: 100, ...patch };
}

export function makeEdge(patch: Partial<RoadmapEdge> = {}): RoadmapEdge {
  return { id: "edge-1", sourceId: "node-1", targetId: "node-2", ...patch };
}

export function makeShape(patch: Partial<RoadmapShape> = {}): RoadmapShape {
  return {
    id: "shape-1",
    kind: "text",
    x: 0,
    y: 0,
    w: 220,
    h: 120,
    text: "",
    color: "amber",
    noteId: null,
    ...DEFAULT_TEXT_STYLE,
    ...patch,
  };
}
