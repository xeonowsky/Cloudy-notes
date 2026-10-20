import { NODE_H, NODE_W, type RoadmapNode } from "@/app/lib/roadmap-types";

type Point = { x: number; y: number };

export function nodeCenter(node: RoadmapNode): Point {
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 };
}

/**
 * Punkt na krawędzi karty (prostokąta) w kierunku `toward`.
 * Idziemy od środka karty w stronę celu i skalujemy wektor tak,
 * żeby skończył się dokładnie na brzegu (+ mały odstęp `gap`).
 */
export function pointOnBorder(center: Point, toward: Point, gap = 0): Point {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) return center;
  // x / 0 w JS daje Infinity, więc Math.min wybierze drugą wartość
  const scale = Math.min((NODE_W / 2 + gap) / Math.abs(dx), (NODE_H / 2 + gap) / Math.abs(dy));
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

/** Początek i koniec strzałki między dwiema kartami. */
export function edgeLine(source: RoadmapNode, target: RoadmapNode) {
  const a = nodeCenter(source);
  const b = nodeCenter(target);
  return { from: pointOnBorder(a, b, 2), to: pointOnBorder(b, a, 6) };
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
