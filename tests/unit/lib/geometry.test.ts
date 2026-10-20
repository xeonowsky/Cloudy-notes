import { describe, expect, it } from "vitest";
import { clamp, edgeLine, nodeCenter, pointOnBorder } from "@/app/components/roadmap/geometry";
import { NODE_H, NODE_W, type RoadmapNode } from "@/app/lib/roadmap-types";

const node = (x: number, y: number): RoadmapNode => ({ id: `${x},${y}`, title: "", category: "", status: "todo", x, y });

describe("geometria strzałek", () => {
  it("środek karty", () => {
    expect(nodeCenter(node(100, 50))).toEqual({ x: 100 + NODE_W / 2, y: 50 + NODE_H / 2 });
  });

  it("punkt na krawędzi w poziomie: dokładnie na prawym boku", () => {
    expect(pointOnBorder({ x: 0, y: 0 }, { x: 1000, y: 0 })).toEqual({ x: NODE_W / 2, y: 0 });
  });

  it("punkt na krawędzi w pionie: dokładnie na dolnym boku (+ odstęp)", () => {
    expect(pointOnBorder({ x: 0, y: 0 }, { x: 0, y: -500 }, 4)).toEqual({ x: 0, y: -(NODE_H / 2 + 4) });
  });

  it("gdy cel jest w środku, zwraca środek (bez dzielenia przez zero)", () => {
    expect(pointOnBorder({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
  });

  it("strzałka zaczyna się i kończy na brzegach kart, nie w środkach", () => {
    const { from, to } = edgeLine(node(0, 0), node(500, 0));
    expect(from.x).toBeCloseTo(NODE_W + 2);
    expect(to.x).toBeCloseTo(500 - 6);
    expect(from.y).toBe(NODE_H / 2);
    expect(to.y).toBe(NODE_H / 2);
  });
});

describe("clamp", () => {
  it.each([
    [5, 0, 10, 5],
    [-1, 0, 10, 0],
    [11, 0, 10, 10],
  ])("clamp(%d, %d, %d) = %d", (value, min, max, expected) => {
    expect(clamp(value, min, max)).toBe(expected);
  });
});
