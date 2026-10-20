import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RedirectError, USER } from "../../helpers/sql";
import { makeNode, makeNote } from "../../helpers/fixtures";

// Strony to async Server Components: wywołujemy je jak funkcje (await Page())
// i renderujemy wynik. Wszystko, co sięga do bazy i ciasteczek, jest atrapą.

class NotFoundError extends Error {}

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getNotesForUser: vi.fn(),
  getNoteForUser: vi.fn(),
  getRoadmapForUser: vi.fn(),
  cookieValue: undefined as string | undefined,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  redirect: (url: string) => {
    throw new RedirectError(url);
  },
  notFound: () => {
    throw new NotFoundError();
  },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (mocks.cookieValue ? { value: mocks.cookieValue } : undefined) }),
}));
vi.mock("@/app/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/app/lib/notes", () => ({ getNotesForUser: mocks.getNotesForUser, getNoteForUser: mocks.getNoteForUser }));
vi.mock("@/app/lib/roadmap", () => ({ getRoadmapForUser: mocks.getRoadmapForUser }));
vi.mock("@/app/actions/auth", () => ({ login: vi.fn(), signup: vi.fn(), logout: vi.fn() }));
vi.mock("@/app/actions/notes", () => ({
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  togglePin: vi.fn(),
  setNotesView: vi.fn(),
}));
vi.mock("@/app/actions/roadmap", () => ({}));

const pages = {
  home: (await import("@/app/page")).default,
  account: (await import("@/app/konto/page")).default,
  login: (await import("@/app/logowanie/page")).default,
  register: (await import("@/app/register/page")).default,
  notes: (await import("@/app/notatki/page")).default,
  newNote: (await import("@/app/notatki/nowa/page")).default,
  editNote: (await import("@/app/notatki/[id]/page")).default,
  board: (await import("@/app/board/page")).default,
  terms: (await import("@/app/regulamin/page")).default,
  privacy: (await import("@/app/polityka-prywatnosci/page")).default,
};

const noSearch = { searchParams: Promise.resolve({}) };

beforeEach(() => {
  mocks.getCurrentUser.mockResolvedValue(USER);
  mocks.getNotesForUser.mockResolvedValue([]);
  mocks.getRoadmapForUser.mockResolvedValue({ nodes: [], edges: [], shapes: [] });
  mocks.cookieValue = undefined;
});

describe("strony chronione przekierowują niezalogowanych na /logowanie", () => {
  it.each([
    ["konto", () => pages.account()],
    ["notatki", () => pages.notes(noSearch)],
    ["nowa notatka", () => pages.newNote()],
    ["edycja notatki", () => pages.editNote({ params: Promise.resolve({ id: "x" }) })],
    ["board", () => pages.board()],
  ])("%s", async (_name, page) => {
    mocks.getCurrentUser.mockResolvedValue(null);
    await expect(page()).rejects.toThrow(new RedirectError("/logowanie"));
  });
});

describe("logowanie i rejestracja", () => {
  it.each([
    ["logowanie", () => pages.login()],
    ["rejestracja", () => pages.register()],
  ])("%s: zalogowany trafia do notatek", async (_name, page) => {
    await expect(page()).rejects.toThrow(new RedirectError("/notatki"));
  });

  it("gość widzi formularz logowania", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    render(await pages.login());
    expect(screen.getByRole("heading", { level: 1, name: "Zaloguj się" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("gość widzi formularz rejestracji", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    render(await pages.register());
    expect(screen.getByLabelText("Powtórz hasło")).toBeInTheDocument();
  });
});

describe("strona główna", () => {
  it("gość dostaje zaproszenie do rejestracji", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    render(await pages.home());
    // CTA jest w hero i na dole strony
    for (const link of screen.getAllByRole("link", { name: "Załóż darmowe konto" })) {
      expect(link).toHaveAttribute("href", "/register");
    }
    expect(screen.getByText("Bez karty płatniczej i bez limitu notatek.")).toBeInTheDocument();
  });

  it("zalogowany — link do notatek", async () => {
    render(await pages.home());
    expect(screen.getByRole("link", { name: "Przejdź do notatek" })).toHaveAttribute("href", "/notatki");
  });
});

describe("notatki", () => {
  it("pusta lista zachęca do pierwszej notatki", async () => {
    render(await pages.notes(noSearch));
    expect(screen.getByText("Jeszcze nic tu nie ma")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Utwórz notatkę" })).toBeInTheDocument();
  });

  it("siatka dzieli notatki na przypięte i pozostałe", async () => {
    mocks.getNotesForUser.mockResolvedValue([
      makeNote({ id: "1", title: "Przypięta", pinned: true }),
      makeNote({ id: "2", title: "Zwykła" }),
    ]);
    render(await pages.notes(noSearch));
    expect(screen.getByText("Liczba notatek: 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Przypięte" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pozostałe" })).toBeInTheDocument();
  });

  it("widok z ciasteczka: lista", async () => {
    mocks.cookieValue = "lista";
    mocks.getNotesForUser.mockResolvedValue([makeNote()]);
    render(await pages.notes(noSearch));
    expect(screen.getByRole("navigation", { name: "Lista notatek" })).toBeInTheDocument();
  });

  it("edycja: cudza lub nieistniejąca notatka = 404", async () => {
    mocks.getNoteForUser.mockResolvedValue(null);
    await expect(pages.editNote({ params: Promise.resolve({ id: "x" }) })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("edycja: formularz wypełniony danymi notatki", async () => {
    mocks.getNoteForUser.mockResolvedValue(makeNote({ title: "Do edycji" }));
    render(await pages.editNote({ params: Promise.resolve({ id: makeNote().id }) }));
    expect(screen.getByLabelText("Tytuł")).toHaveValue("Do edycji");
    expect(mocks.getNoteForUser).toHaveBeenCalledWith(USER.id, makeNote().id);
  });

  it("nowa notatka: pusty formularz", async () => {
    render(await pages.newNote());
    expect(screen.getByLabelText("Tytuł")).toHaveValue("");
  });
});

describe("konto i Board", () => {
  it("konto pokazuje dane użytkownika", async () => {
    render(await pages.account());
    expect(screen.getByText(USER.email, { exact: false })).toBeInTheDocument();
  });

  it("Board ładuje tablicę z danymi zalogowanego", async () => {
    mocks.getRoadmapForUser.mockResolvedValue({ nodes: [makeNode({ title: "TypeScript" })], edges: [], shapes: [] });
    render(await pages.board());
    expect(mocks.getRoadmapForUser).toHaveBeenCalledWith(USER.id);
    expect(screen.getByRole("heading", { level: 1, name: "Board" })).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });
});

describe("strony prawne", () => {
  it.each([
    ["regulamin", () => pages.terms(), "Regulamin"],
    ["polityka", () => pages.privacy(), "Polityka prywatności"],
  ])("%s ma nagłówek i zakładki", (_name, page, heading) => {
    render(page());
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Regulamin" }).length).toBeGreaterThan(0);
  });
});
