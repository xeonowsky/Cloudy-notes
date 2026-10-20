import { beforeEach, describe, expect, it, vi } from "vitest";
import { lastSql, USER, UUID_A, UUID_B, UUID_C } from "../../helpers/sql";

const mocks = vi.hoisted(() => ({ sql: vi.fn(), getCurrentUser: vi.fn() }));
vi.mock("@/app/lib/db", () => ({ sql: mocks.sql }));
vi.mock("@/app/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));

const actions = await import("@/app/actions/roadmap");
const { sql, getCurrentUser } = mocks;

const node = { id: UUID_A, title: "React", category: "Frontend", status: "todo", x: 10, y: 20 };
const shape = { id: UUID_A, kind: "text", x: 0, y: 0, w: 220, h: 120, text: "Notatka", color: "amber" };
const edge = { id: UUID_C, sourceId: UUID_A, targetId: UUID_B };

beforeEach(() => {
  getCurrentUser.mockResolvedValue(USER);
  sql.mockResolvedValue([{ id: UUID_A }]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// Każda akcja ze zestawem poprawnych argumentów — do testów wspólnych zachowań
const calls = {
  createRoadmapNode: () => actions.createRoadmapNode(node),
  updateRoadmapNode: () => actions.updateRoadmapNode(UUID_A, node),
  moveRoadmapNode: () => actions.moveRoadmapNode(UUID_A, { x: 1, y: 2 }),
  deleteRoadmapNode: () => actions.deleteRoadmapNode(UUID_A),
  createRoadmapEdge: () => actions.createRoadmapEdge(edge),
  deleteRoadmapEdge: () => actions.deleteRoadmapEdge(UUID_C),
  createRoadmapShape: () => actions.createRoadmapShape(shape),
  updateRoadmapShape: () => actions.updateRoadmapShape(UUID_A, shape),
  deleteRoadmapShape: () => actions.deleteRoadmapShape(UUID_A),
};

describe.each(Object.entries(calls))("%s", (_name, call) => {
  it("działa dla zalogowanego i zawsze filtruje po jego user_id", async () => {
    await expect(call()).resolves.toEqual({ ok: true });
    expect(lastSql(sql).values).toContain(USER.id);
  });

  it("bez sesji zwraca błąd i nie dotyka bazy", async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(call()).resolves.toEqual({ ok: false, message: expect.stringMatching(/Sesja wygasła/) });
    expect(sql).not.toHaveBeenCalled();
  });

  it("błąd bazy zamienia na komunikat (nie wyrzuca wyjątku do klienta)", async () => {
    sql.mockRejectedValue(new Error("connection reset"));
    await expect(call()).resolves.toEqual({ ok: false, message: expect.stringMatching(/Nie udało się/) });
  });
});

describe("walidacja argumentów", () => {
  it.each([
    ["createRoadmapNode z pustą nazwą", () => actions.createRoadmapNode({ ...node, title: " " })],
    ["createRoadmapNode z ułamkową pozycją", () => actions.createRoadmapNode({ ...node, x: 0.5 })],
    ["updateRoadmapNode ze złym id", () => actions.updateRoadmapNode("x", node)],
    ["updateRoadmapNode ze złym statusem", () => actions.updateRoadmapNode(UUID_A, { ...node, status: "?" })],
    ["moveRoadmapNode bez pozycji", () => actions.moveRoadmapNode(UUID_A, null)],
    ["deleteRoadmapNode ze złym id", () => actions.deleteRoadmapNode(42)],
    ["createRoadmapEdge do samej siebie", () => actions.createRoadmapEdge({ ...edge, targetId: UUID_A })],
    ["deleteRoadmapEdge ze złym id", () => actions.deleteRoadmapEdge("'; DROP TABLE x")],
    ["createRoadmapShape z nieznanym rodzajem", () => actions.createRoadmapShape({ ...shape, kind: "star" })],
    ["updateRoadmapShape za mały", () => actions.updateRoadmapShape(UUID_A, { ...shape, w: 1 })],
    ["deleteRoadmapShape ze złym id", () => actions.deleteRoadmapShape(undefined)],
  ])("%s → błąd bez zapytania", async (_label, call) => {
    const result = await call();
    expect(result.ok).toBe(false);
    expect(sql).not.toHaveBeenCalled();
  });
});

describe("szczegóły zapytań", () => {
  it("createRoadmapNode wstawia przycięte dane", async () => {
    await actions.createRoadmapNode({ ...node, title: "  Next.js  " });
    expect(lastSql(sql).values).toEqual([UUID_A, USER.id, "Next.js", "Frontend", "todo", 10, 20]);
  });

  it("updateRoadmapNode: 0 wierszy = nie znaleziono (np. cudza karta)", async () => {
    sql.mockResolvedValue([]);
    await expect(actions.updateRoadmapNode(UUID_A, node)).resolves.toEqual({
      ok: false,
      message: "Nie znaleziono elementu.",
    });
  });

  it("moveRoadmapNode zmienia tylko pozycję", async () => {
    await actions.moveRoadmapNode(UUID_A, { x: -5, y: 7, title: "hack" });
    const query = lastSql(sql);
    expect(query.text).toContain("SET x = $, y = $");
    expect(query.values).toEqual([-5, 7, UUID_A, USER.id]);
  });

  it("createRoadmapEdge sprawdza, że OBIE karty należą do użytkownika", async () => {
    await actions.createRoadmapEdge(edge);
    const query = lastSql(sql);
    expect(query.text).toContain("SELECT count(*) FROM roadmap_nodes WHERE user_id = $ AND id IN ($, $) ) = 2");
    expect(query.values).toEqual([UUID_C, USER.id, UUID_A, UUID_B, USER.id, UUID_A, UUID_B]);
  });

  it("createRoadmapEdge: brak wstawionego wiersza = błąd", async () => {
    sql.mockResolvedValue([]);
    await expect(actions.createRoadmapEdge(edge)).resolves.toMatchObject({ ok: false });
  });

  it("updateRoadmapShape nie pozwala zmienić rodzaju kształtu", async () => {
    await actions.updateRoadmapShape(UUID_A, { ...shape, kind: "rect" });
    const query = lastSql(sql);
    expect(query.text).not.toContain("kind");
    expect(query.values).toEqual([0, 0, 220, 120, "Notatka", "amber", UUID_A, USER.id]);
  });

  it("updateRoadmapShape: 0 wierszy = nie znaleziono", async () => {
    sql.mockResolvedValue([]);
    await expect(actions.updateRoadmapShape(UUID_A, shape)).resolves.toEqual({
      ok: false,
      message: "Nie znaleziono kształtu.",
    });
  });
});
