import { beforeEach, describe, expect, it, vi } from "vitest";
import { formData, lastSql, RedirectError, sqlCalls, USER } from "../../helpers/sql";

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("@/app/lib/db", () => ({ sql: mocks.sql }));
vi.mock("@/app/lib/session", () => ({ createSession: mocks.createSession, deleteSession: mocks.deleteSession }));
vi.mock("@/app/lib/password", () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
  DUMMY_HASH: "DUMMY",
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectError(url);
  },
}));

const { login, logout, signup } = await import("@/app/actions/auth");
const { sql, createSession, deleteSession, hashPassword, verifyPassword } = mocks;

const signupFields = {
  name: "Klaudiusz",
  email: "K@Example.com",
  password: "haslo1234",
  confirmPassword: "haslo1234",
  terms: "on",
};

beforeEach(() => {
  hashPassword.mockResolvedValue("scrypt$hash");
  vi.spyOn(console, "error").mockImplementation(() => {}); // ciche logi błędów w testach
});

describe("signup", () => {
  it("przy błędach walidacji zwraca błędy i wpisane wartości (bez hasła)", async () => {
    const state = await signup(undefined, formData({ ...signupFields, email: "zly", password: "x" }));
    expect(state?.errors?.email).toBeDefined();
    expect(state?.errors?.password).toBeDefined();
    expect(state?.values).toEqual({ name: "Klaudiusz", email: "zly" });
    expect(sql).not.toHaveBeenCalled();
  });

  it("zapisuje hash hasła (nie hasło), tworzy sesję i przekierowuje do notatek", async () => {
    sql.mockResolvedValue([{ id: USER.id }]);

    await expect(signup(undefined, formData(signupFields))).rejects.toThrow(new RedirectError("/notatki"));

    expect(hashPassword).toHaveBeenCalledWith("haslo1234");
    const insert = lastSql(sql);
    expect(insert.values).toEqual(["Klaudiusz", "k@example.com", "scrypt$hash"]);
    expect(insert.values).not.toContain("haslo1234");
    expect(createSession).toHaveBeenCalledWith(USER.id);
  });

  it("zajęty e-mail = błąd przy polu e-mail, bez sesji", async () => {
    sql.mockResolvedValue([]); // ON CONFLICT DO NOTHING → brak RETURNING
    const state = await signup(undefined, formData(signupFields));
    expect(state?.errors?.email).toEqual(["Konto z tym adresem e-mail już istnieje."]);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("błąd bazy = ogólny komunikat", async () => {
    sql.mockRejectedValue(new Error("baza leży"));
    const state = await signup(undefined, formData(signupFields));
    expect(state?.message).toMatch(/Coś poszło nie tak/);
  });
});

describe("login", () => {
  const fields = { email: " K@Example.com ", password: "haslo1234" };

  it("poprawne dane → sesja i przekierowanie", async () => {
    sql.mockResolvedValue([{ id: USER.id, password_hash: "prawdziwy" }]);
    verifyPassword.mockResolvedValue(true);

    await expect(login(undefined, formData(fields))).rejects.toThrow(new RedirectError("/notatki"));
    expect(lastSql(sql).values).toEqual(["k@example.com"]);
    expect(verifyPassword).toHaveBeenCalledWith("haslo1234", "prawdziwy");
    expect(createSession).toHaveBeenCalledWith(USER.id);
  });

  it("złe hasło → ten sam komunikat co przy nieistniejącym koncie", async () => {
    sql.mockResolvedValue([{ id: USER.id, password_hash: "prawdziwy" }]);
    verifyPassword.mockResolvedValue(false);
    const wrongPassword = await login(undefined, formData(fields));

    sql.mockResolvedValue([]);
    const noUser = await login(undefined, formData(fields));

    expect(wrongPassword?.message).toBe("Nieprawidłowy e-mail lub hasło.");
    expect(noUser?.message).toBe(wrongPassword?.message);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("dla nieistniejącego konta i tak liczy hash (atrapa) — ochrona przed atakiem czasowym", async () => {
    sql.mockResolvedValue([]);
    verifyPassword.mockResolvedValue(false);
    await login(undefined, formData(fields));
    expect(verifyPassword).toHaveBeenCalledWith("haslo1234", "DUMMY");
  });

  it("puste pola → błędy walidacji bez zapytania do bazy", async () => {
    const state = await login(undefined, formData({ email: "", password: "" }));
    expect(Object.keys(state?.errors ?? {})).toEqual(["email", "password"]);
    expect(sqlCalls(sql)).toHaveLength(0);
  });

  it("błąd bazy = ogólny komunikat", async () => {
    sql.mockRejectedValue(new Error("timeout"));
    const state = await login(undefined, formData(fields));
    expect(state?.message).toMatch(/Coś poszło nie tak/);
  });
});

describe("logout", () => {
  it("usuwa sesję i przekierowuje na logowanie", async () => {
    await expect(logout()).rejects.toThrow(new RedirectError("/logowanie"));
    expect(deleteSession).toHaveBeenCalled();
  });
});
