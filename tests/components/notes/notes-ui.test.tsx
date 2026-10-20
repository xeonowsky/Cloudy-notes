import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { makeNote } from "../../helpers/fixtures";

// Server Actions podmieniamy na atrapy — w teście komponentu nie chcemy bazy
const actions = vi.hoisted(() => ({ togglePin: vi.fn(), deleteNote: vi.fn(), setNotesView: vi.fn() }));
vi.mock("@/app/actions/notes", () => actions);

const { default: NoteCard } = await import("@/app/components/note-card");
const { default: NotesSplit } = await import("@/app/components/notes-split");
const { default: ViewToggle } = await import("@/app/components/view-toggle");
const { default: DeleteNoteButton } = await import("@/app/components/delete-note-button");

beforeEach(() => {
  actions.togglePin.mockResolvedValue(undefined);
});

describe("NoteCard", () => {
  it("pokazuje tytuł z linkiem, podgląd treści, kategorię i datę", () => {
    render(<NoteCard note={makeNote()} />);
    expect(screen.getByRole("link", { name: "Zakupy" })).toHaveAttribute("href", `/notatki/${makeNote().id}`);
    expect(screen.getByText("chleb").tagName).toBe("STRONG");
    expect(screen.getByText("Myśl")).toBeInTheDocument();
    expect(screen.getByText(/15 paź 2026/)).toBeInTheDocument();
  });

  it("przycisk przypinania zależy od stanu notatki", () => {
    const { rerender } = render(<NoteCard note={makeNote({ pinned: false })} />);
    expect(screen.getByRole("button", { name: "Przypnij notatkę" })).toBeInTheDocument();
    rerender(<NoteCard note={makeNote({ pinned: true })} />);
    expect(screen.getByRole("button", { name: "Odepnij notatkę" })).toBeInTheDocument();
  });

  it("pusta treść = brak podglądu", () => {
    const { container } = render(<NoteCard note={makeNote({ content: "   " })} />);
    expect(container.querySelector("ul")).toBeNull();
  });
});

describe("NotesSplit", () => {
  const notes = [
    makeNote({ id: "n1", title: "Pierwsza", pinned: true }),
    makeNote({ id: "n2", title: "Druga", content: "" }),
  ];

  it("bez wyboru pokazuje pierwszą notatkę", () => {
    render(<NotesSplit notes={notes} />);
    expect(screen.getByRole("heading", { level: 2, name: "Pierwsza" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Lista notatek" });
    expect(within(nav).getByRole("link", { name: /Pierwsza/ })).toHaveAttribute("aria-current", "true");
    expect(within(nav).getByLabelText("Przypięta")).toBeInTheDocument();
  });

  it("pokazuje notatkę wybraną w adresie (?n=)", () => {
    render(<NotesSplit notes={notes} selectedId="n2" />);
    expect(screen.getByRole("heading", { level: 2, name: "Druga" })).toBeInTheDocument();
    expect(screen.getByText("Ta notatka nie ma jeszcze treści.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edytuj" })).toHaveAttribute("href", "/notatki/n2");
  });

  it("nieznane id = pierwsza notatka", () => {
    render(<NotesSplit notes={notes} selectedId="nie-ma" />);
    expect(screen.getByRole("heading", { level: 2, name: "Pierwsza" })).toBeInTheDocument();
  });
});

describe("ViewToggle", () => {
  it("zaznacza aktualny widok", () => {
    render(<ViewToggle current="lista" />);
    expect(screen.getByRole("button", { name: "Lista" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Siatka" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("DeleteNoteButton", () => {
  it("anulowanie w oknie potwierdzenia NIE usuwa notatki", () => {
    const action = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteNoteButton action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Usuń notatkę" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });

  it("potwierdzenie wywołuje akcję", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<DeleteNoteButton action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Usuń notatkę" }));
    await vi.waitFor(() => expect(action).toHaveBeenCalled());
  });
});
