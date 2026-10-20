import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { lastSql, sqlCalls, USER } from "../../helpers/sql";

// vi.hoisted — zmienne dostępne w fabrykach vi.mock (te są przenoszone na górę pliku)
const { sql, cookieStore } = vi.hoisted(() => ({
  sql: vi.fn(),
  cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/app/lib/db", () => ({ sql }));
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const { createSession, deleteSession, getCurrentUser } = await import("@/app/lib/session");
const { SESSION_COOKIE } = await import("@/app/lib/session-cookie");

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

beforeEach(() => {
  sql.mockResolvedValue([]);
});

describe("createSession", () => {
  it("zapisuje w bazie HASH tokenu, a sam token tylko w ciasteczku", async () => {
    await createSession(USER.id);

    const [name, token, options] = cookieStore.set.mock.calls[0];
    expect(name).toBe(SESSION_COOKIE);
    expect(token).toMatch(/^[\w-]{43}$/); // 32 bajty w base64url

    const insert = lastSql(sql);
    expect(insert.text).toContain("INSERT INTO sessions");
    expect(insert.values[0]).toBe(sha256(token));
    expect(insert.values).not.toContain(token);
    expect(insert.values[1]).toBe(USER.id);

    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    // ważność ok. 30 dni
    const days = (options.expires.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThanOrEqual(30);
  });
});

describe("getCurrentUser", () => {
  it("bez ciasteczka zwraca null i nie pyta bazy", async () => {
    cookieStore.get.mockReturnValue(undefined);
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });

  it("szuka sesji po hashu tokenu i sprawdza datę ważności", async () => {
    cookieStore.get.mockReturnValue({ value: "token-z-ciasteczka" });
    sql.mockResolvedValue([USER]);

    await expect(getCurrentUser()).resolves.toEqual(USER);
    const query = lastSql(sql);
    expect(query.values).toEqual([sha256("token-z-ciasteczka")]);
    expect(query.text).toContain("expires_at > now()");
  });

  it("zwraca null, gdy sesja wygasła lub nie istnieje", async () => {
    cookieStore.get.mockReturnValue({ value: "stary-token" });
    sql.mockResolvedValue([]);
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});

describe("deleteSession", () => {
  it("usuwa sesję z bazy i kasuje ciasteczko", async () => {
    cookieStore.get.mockReturnValue({ value: "abc" });
    await deleteSession();
    expect(lastSql(sql).values).toEqual([sha256("abc")]);
    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE);
  });

  it("bez ciasteczka tylko je kasuje (bez zapytania)", async () => {
    cookieStore.get.mockReturnValue(undefined);
    await deleteSession();
    expect(sqlCalls(sql)).toHaveLength(0);
    expect(cookieStore.delete).toHaveBeenCalled();
  });
});
