import { beforeEach, describe, expect, it, vi } from "vitest";
import { lastSql, sqlCalls, USER, UUID_A } from "../../helpers/sql";

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock("@/app/lib/db", () => ({ sql }));

const { getNoteForUser, getNotesForUser } = await import("@/app/lib/notes");
const { getRoadmapForUser } = await import("@/app/lib/roadmap");

beforeEach(() => {
  sql.mockResolvedValue([]);
});

describe("notatki", () => {
  it("lista notatek jest filtrowana po user_id i posortowana (przypięte, potem najnowsze)", async () => {
    await getNotesForUser(USER.id);
    const query = lastSql(sql);
    expect(query.text).toContain("WHERE user_id = $");
    expect(query.text).toContain("ORDER BY pinned DESC, updated_at DESC");
    expect(query.values).toEqual([USER.id]);
  });

  it("pojedyncza notatka wymaga zgodności id ORAZ właściciela", async () => {
    sql.mockResolvedValue([{ id: UUID_A, title: "T" }]);
    await expect(getNoteForUser(USER.id, UUID_A)).resolves.toMatchObject({ id: UUID_A });
    expect(lastSql(sql).values).toEqual([UUID_A, USER.id]);
  });

  it("zwraca null dla nieistniejącej notatki", async () => {
    await expect(getNoteForUser(USER.id, UUID_A)).resolves.toBeNull();
  });

  it("niepoprawne id odrzuca bez pytania bazy", async () => {
    await expect(getNoteForUser(USER.id, "nie-uuid")).resolves.toBeNull();
    expect(sqlCalls(sql)).toHaveLength(0);
  });
});

describe("Board", () => {
  it("pobiera karty, strzałki i kształty tylko zalogowanego użytkownika", async () => {
    const node = { id: UUID_A, title: "React", category: "", status: "todo", x: 0, y: 0 };
    sql
      .mockResolvedValueOnce([node])
      .mockResolvedValueOnce([{ id: "e", sourceId: "a", targetId: "b" }])
      .mockResolvedValueOnce([{ id: "s", kind: "rect" }]);

    const roadmap = await getRoadmapForUser(USER.id);

    expect(roadmap.nodes).toEqual([node]);
    expect(roadmap.edges).toHaveLength(1);
    expect(roadmap.shapes).toHaveLength(1);
    const calls = sqlCalls(sql);
    expect(calls).toHaveLength(3);
    for (const call of calls) expect(call.values).toEqual([USER.id]);
    expect(calls[1].text).toContain('source_id AS "sourceId"');
  });
});
