import { beforeEach, describe, expect, it, vi } from "vitest";
import { lastSql, USER, UUID_A, UUID_B, UUID_C } from "../../helpers/sql";

const mocks = vi.hoisted(() => ({ sql: vi.fn(), getCurrentUser: vi.fn() }));
vi.mock("@/app/lib/db", () => ({ sql: mocks.sql }));
vi.mock("@/app/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));

const actions = await import("@/app/actions/roadmap");
const { sql, getCurrentUser } = mocks;

const node = { id: UUID_A, title: "React", category: "Frontend", status: "todo", x: 10, y: 20 };
const style = { fontSize: 18, textColor: "rose", bold: true, italic: false, align: "center" };
const shape = { id: UUID_A, kind: "text", x: 0, y: 0, w: 220, h: 120, text: "Notatka", color: "amber", noteId: null, ...style };
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
    ["updateRoadmapShape z ogromną czcionką", () => actions.updateRoadmapShape(UUID_A, { ...shape, fontSize: 500 })],
    ["createRoadmapShape bez stylu tekstu", () => actions.createRoadmapShape({ ...shape, align: undefined })],
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

  it("createRoadmapEdge sprawdza, że OBA końce (karty lub kształty) należą do użytkownika", async () => {
    await actions.createRoadmapEdge(edge);
    const query = lastSql(sql);
    expect(query.text).toContain("SELECT id FROM roadmap_nodes WHERE user_id = $ AND id IN ($, $)");
    expect(query.text).toContain("UNION ALL SELECT id FROM roadmap_shapes WHERE user_id = $ AND id IN ($, $)");
    expect(query.text).toContain(") = 2");
    expect(query.values).toEqual([UUID_C, USER.id, UUID_A, UUID_B, USER.id, UUID_A, UUID_B, USER.id, UUID_A, UUID_B]);
  });

  it.each([
    ["deleteRoadmapNode", "roadmap_nodes", () => actions.deleteRoadmapNode(UUID_A)],
    ["deleteRoadmapShape", "roadmap_shapes", () => actions.deleteRoadmapShape(UUID_A)],
  ])("%s usuwa obiekt RAZEM z jego strzałkami w jednym zapytaniu", async (_name, table, call) => {
    await call();
    expect(sql).toHaveBeenCalledTimes(1);
    const query = lastSql(sql);
    expect(query.text).toContain("DELETE FROM roadmap_edges WHERE user_id = $ AND (source_id = $ OR target_id = $)");
    expect(query.text).toContain(`DELETE FROM ${table} WHERE id = $ AND user_id = $`);
    expect(query.values).toEqual([USER.id, UUID_A, UUID_A, UUID_A, USER.id]);
  });

  it("createRoadmapShape zapisuje styl tekstu", async () => {
    await actions.createRoadmapShape(shape);
    expect(lastSql(sql).values).toEqual([
      UUID_A, USER.id, "text", 0, 0, 220, 120, "Notatka", "amber", null, 18, "rose", true, false, "center",
      null, null, USER.id, // warunek: brak notatki albo notatka użytkownika
    ]);
  });

  it("kafelek notatki: tylko WŁASNA notatka, cudza = błąd", async () => {
    const noteShape = { ...shape, kind: "note", noteId: UUID_B };
    await actions.createRoadmapShape(noteShape);
    const query = lastSql(sql);
    expect(query.text).toContain("WHERE $::uuid IS NULL OR EXISTS (SELECT 1 FROM notes WHERE id = $ AND user_id = $)");
    expect(query.values.slice(-3)).toEqual([UUID_B, UUID_B, USER.id]);

    sql.mockResolvedValue([]); // notatka nie należy do użytkownika — nic nie wstawiono
    await expect(actions.createRoadmapShape(noteShape)).resolves.toEqual({ ok: false, message: "Nie znaleziono notatki." });
    await expect(actions.updateRoadmapShape(UUID_A, noteShape)).resolves.toMatchObject({ ok: false });
    expect(lastSql(sql).text).toContain("EXISTS (SELECT 1 FROM notes WHERE id = $ AND user_id = $)");
  });

  it("createRoadmapEdge: brak wstawionego wiersza = błąd", async () => {
    sql.mockResolvedValue([]);
    await expect(actions.createRoadmapEdge(edge)).resolves.toMatchObject({ ok: false });
  });

  it("updateRoadmapShape nie pozwala zmienić rodzaju kształtu", async () => {
    await actions.updateRoadmapShape(UUID_A, { ...shape, kind: "rect" });
    const query = lastSql(sql);
    expect(query.text).not.toContain("kind");
    expect(query.values).toEqual([
      0, 0, 220, 120, "Notatka", "amber", null, 18, "rose", true, false, "center", UUID_A, USER.id, null, null, USER.id,
    ]);
  });

  it("updateRoadmapShape: 0 wierszy = nie znaleziono", async () => {
    sql.mockResolvedValue([]);
    await expect(actions.updateRoadmapShape(UUID_A, shape)).resolves.toEqual({
      ok: false,
      message: "Nie znaleziono kształtu.",
    });
  });
});
