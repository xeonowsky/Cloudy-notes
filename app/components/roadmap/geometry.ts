import { NODE_H, NODE_W, type RoadmapNode } from "@/app/lib/roadmap-types";

type Point = { x: number; y: number };

// Prostokąt w świecie tablicy — tak samo opisujemy kartę i kształt,
// dzięki temu strzałki działają między dowolnymi obiektami.
export type Box = { x: number; y: number; w: number; h: number };

export function nodeBox(node: RoadmapNode): Box {
  return { x: node.x, y: node.y, w: NODE_W, h: NODE_H };
}

const toBox = (item: Box | RoadmapNode): Box => ("w" in item ? item : nodeBox(item));

export function boxCenter(box: Box): Point {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

export function nodeCenter(node: RoadmapNode): Point {
  return boxCenter(nodeBox(node));
}

/**
 * Punkt na krawędzi prostokąta (o połówkach `half`) w kierunku `toward`.
 * Idziemy od środka w stronę celu i skalujemy wektor tak,
 * żeby skończył się dokładnie na brzegu (+ mały odstęp `gap`).
 * Domyślnie prostokąt ma rozmiar karty.
 */
export function pointOnBorder(
  center: Point,
  toward: Point,
  gap = 0,
  half: { w: number; h: number } = { w: NODE_W / 2, h: NODE_H / 2 },
): Point {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) return center;
  // x / 0 w JS daje Infinity, więc Math.min wybierze drugą wartość
  const scale = Math.min((half.w + gap) / Math.abs(dx), (half.h + gap) / Math.abs(dy));
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

/** Punkt na brzegu dowolnego prostokąta w stronę `toward`. */
export function pointOnBox(box: Box, toward: Point, gap = 0): Point {
  return pointOnBorder(boxCenter(box), toward, gap, { w: box.w / 2, h: box.h / 2 });
}

/** Początek i koniec strzałki między dwoma obiektami (kartami albo kształtami). */
export function edgeLine(source: Box | RoadmapNode, target: Box | RoadmapNode) {
  const a = toBox(source);
  const b = toBox(target);
  return { from: pointOnBox(a, boxCenter(b), 2), to: pointOnBox(b, boxCenter(a), 6) };
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
