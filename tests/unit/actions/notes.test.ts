import { beforeEach, describe, expect, it, vi } from "vitest";
import { formData, lastSql, RedirectError, sqlCalls, USER, UUID_A } from "../../helpers/sql";

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
  getCurrentUser: vi.fn(),
  revalidatePath: vi.fn(),
  cookieStore: { set: vi.fn() },
}));

vi.mock("@/app/lib/db", () => ({ sql: mocks.sql }));
vi.mock("@/app/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ cookies: async () => mocks.cookieStore }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectError(url);
  },
}));

const { createNote, deleteNote, setNotesView, togglePin, updateNote } = await import("@/app/actions/notes");
const { sql, getCurrentUser, revalidatePath, cookieStore } = mocks;

const note = { title: " Zakupy ", content: "- mleko", color: "yellow", priority: "2", pinned: "on" };

beforeEach(() => {
  getCurrentUser.mockResolvedValue(USER);
  sql.mockResolvedValue([{ id: UUID_A }]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ochrona akcji", () => {
  it.each([
    ["createNote", () => createNote(undefined, formData(note))],
    ["updateNote", () => updateNote(UUID_A, undefined, formData(note))],
    ["deleteNote", () => deleteNote(UUID_A)],
    ["togglePin", () => togglePin(UUID_A)],
  ])("%s bez zalogowania przekierowuje na /logowanie i nie dotyka bazy", async (_name, call) => {
    getCurrentUser.mockResolvedValue(null);
    await expect(call()).rejects.toThrow(new RedirectError("/logowanie"));
    expect(sql).not.toHaveBeenCalled();
  });
});

describe("createNote", () => {
  it("zapisuje oczyszczone dane z user_id zalogowanego", async () => {
    await expect(createNote(undefined, formData(note))).rejects.toThrow(new RedirectError("/notatki"));
    expect(lastSql(sql).values).toEqual([USER.id, "Zakupy", "- mleko", "yellow", 2, true]);
    expect(revalidatePath).toHaveBeenCalledWith("/notatki");
  });

  it("zwraca błędy walidacji", async () => {
    const state = await createNote(undefined, formData({ title: "" }));
    expect(state?.errors?.title).toEqual(["Tytuł nie może być pusty."]);
    expect(sql).not.toHaveBeenCalled();
  });

  it("błąd bazy = komunikat, bez przekierowania", async () => {
    sql.mockRejectedValue(new Error("x"));
    const state = await createNote(undefined, formData(note));
    expect(state?.message).toMatch(/Nie udało się zapisać/);
  });
});

describe("updateNote", () => {
  it("aktualizuje tylko notatkę zalogowanego (WHERE id AND user_id)", async () => {
    await expect(updateNote(UUID_A, undefined, formData(note))).rejects.toThrow(RedirectError);
    const query = lastSql(sql);
    expect(query.text).toContain("WHERE id = $ AND user_id = $");
    expect(query.values.slice(-2)).toEqual([UUID_A, USER.id]);
  });

  it("cudza / nieistniejąca notatka → komunikat", async () => {
    sql.mockResolvedValue([]);
    const state = await updateNote(UUID_A, undefined, formData(note));
    expect(state?.message).toBe("Nie znaleziono notatki.");
  });

  it("niepoprawne id odrzuca bez zapytania", async () => {
    const state = await updateNote("../etc", undefined, formData(note));
    expect(state?.message).toBe("Nie znaleziono notatki.");
    expect(sql).not.toHaveBeenCalled();
  });
});

describe("deleteNote i togglePin", () => {
  it("deleteNote usuwa z warunkiem właściciela", async () => {
    await expect(deleteNote(UUID_A)).rejects.toThrow(RedirectError);
    expect(lastSql(sql).values).toEqual([UUID_A, USER.id]);
  });

  it("deleteNote z niepoprawnym id nie pyta bazy, ale przekierowuje", async () => {
    await expect(deleteNote("zle-id")).rejects.toThrow(RedirectError);
    expect(sqlCalls(sql)).toHaveLength(0);
  });

  it("togglePin odwraca wartość w bazie (NOT pinned)", async () => {
    await togglePin(UUID_A);
    expect(lastSql(sql).text).toContain("SET pinned = NOT pinned");
    expect(revalidatePath).toHaveBeenCalledWith("/notatki");
  });

  it("togglePin z niepoprawnym id nic nie robi", async () => {
    await togglePin("zle-id");
    expect(sql).not.toHaveBeenCalled();
  });
});

describe("setNotesView", () => {
  it("zapisuje wybór w ciasteczku", async () => {
    await expect(setNotesView("lista")).rejects.toThrow(RedirectError);
    expect(cookieStore.set).toHaveBeenCalledWith("cn_notes_view", "lista", expect.objectContaining({ path: "/notatki" }));
  });

  it("podmienioną wartość zamienia na domyślną siatkę", async () => {
    await expect(setNotesView("<script>" as never)).rejects.toThrow(RedirectError);
    expect(cookieStore.set.mock.calls[0][1]).toBe("siatka");
  });
});
