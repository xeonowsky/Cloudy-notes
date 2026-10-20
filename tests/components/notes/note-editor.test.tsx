import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteEditor from "@/app/components/note-editor";
import type { NoteFormState } from "@/app/lib/definitions";

function setup(initialContent = "", action = vi.fn<(s: NoteFormState, f: FormData) => Promise<NoteFormState>>()) {
  const user = userEvent.setup();
  render(
    <NoteEditor
      action={action}
      submitLabel="Zapisz notatkę"
      initial={{ title: "Tytuł", content: initialContent, color: "white", priority: 1, pinned: false }}
    />,
  );
  const textarea = screen.getByPlaceholderText(/Zacznij pisać/) as HTMLTextAreaElement;
  return { user, textarea, action };
}

const tool = (title: string) => screen.getByTitle(title);

describe("NoteEditor — pasek formatowania", () => {
  it("pogrubia zaznaczony tekst", async () => {
    const { user, textarea } = setup("ala ma kota");
    textarea.setSelectionRange(4, 6); // "ma"
    await user.click(tool("Pogrubienie (Ctrl+B)"));
    expect(textarea).toHaveValue("ala **ma** kota");
  });

  it("bez zaznaczenia wstawia tekst przykładowy", async () => {
    const { user, textarea } = setup("");
    await user.click(tool("Kursywa (Ctrl+I)"));
    expect(textarea).toHaveValue("*tekst*");
  });

  it("link ma osobne znaczniki przed i po", async () => {
    const { user, textarea } = setup("");
    await user.click(tool("Link"));
    expect(textarea).toHaveValue("[opis linku](https://)");
  });

  it("lista numerowana numeruje każdą zaznaczoną linię", async () => {
    const { user, textarea } = setup("jeden\ndwa\ntrzy");
    textarea.setSelectionRange(0, textarea.value.length);
    await user.click(tool("Lista numerowana"));
    expect(textarea).toHaveValue("1. jeden\n2. dwa\n3. trzy");
  });

  it("nagłówek dotyczy całej linii, w której stoi kursor", async () => {
    const { user, textarea } = setup("pierwsza\ndruga");
    textarea.setSelectionRange(12, 12); // w środku "druga"
    await user.click(tool("Duży nagłówek"));
    expect(textarea).toHaveValue("pierwsza\n# druga");
  });

  it("linia pozioma wstawia się w miejscu kursora", async () => {
    const { user, textarea } = setup("ab");
    textarea.setSelectionRange(1, 1);
    await user.click(tool("Linia oddzielająca"));
    expect(textarea).toHaveValue("a\n---\nb");
  });

  // Każdy przycisk paska: [tytuł, wynik dla zaznaczonego słowa "x" w linii "x"]
  it.each([
    ["Przekreślenie", "~~x~~"],
    ["Zakreślacz", "==x=="],
    ["Kod", "`x`"],
    ["Mniejszy nagłówek", "## x"],
    ["Lista punktowana", "- x"],
    ["Checklista", "- [ ] x"],
    ["Cytat", "> x"],
  ])("przycisk %s", async (title, expected) => {
    const { user, textarea } = setup("x");
    textarea.setSelectionRange(0, 1);
    await user.click(tool(title));
    expect(textarea).toHaveValue(expected);
  });

  it("skrót Ctrl+I to kursywa, a inne skróty z Ctrl nic nie zmieniają", async () => {
    const { user, textarea } = setup("");
    textarea.focus();
    await user.keyboard("{Control>}i{/Control}");
    expect(textarea).toHaveValue("*tekst*");
    await user.keyboard("{Control>}k{/Control}");
    expect(textarea).toHaveValue("*tekst*");
  });

  it("skrót Ctrl+B pogrubia", async () => {
    const { user, textarea } = setup("");
    textarea.focus();
    await user.keyboard("{Control>}b{/Control}");
    expect(textarea).toHaveValue("**tekst**");
  });
});

describe("NoteEditor — reszta formularza", () => {
  it("licznik znaków i podgląd Markdowna", async () => {
    const { user, textarea } = setup("");
    await user.type(textarea, "## Plan");
    expect(screen.getByText("7 / 20 000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Podgląd" }));
    expect(screen.getByRole("heading", { level: 3, name: "Plan" })).toBeInTheDocument();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("pusty podgląd ma komunikat", async () => {
    const { user } = setup("");
    await user.click(screen.getByRole("button", { name: "Podgląd" }));
    expect(screen.getByText("Nic tu jeszcze nie ma.")).toBeInTheDocument();
  });

  it("wysyła wszystkie pola formularza do akcji", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { user } = setup("treść", action);
    await user.click(screen.getByText("Biznes"));
    await user.click(screen.getByText("Wysoki"));
    await user.click(screen.getByLabelText("Przypnij na górze listy"));
    await user.click(screen.getByRole("button", { name: "Zapisz notatkę" }));

    await vi.waitFor(() => expect(action).toHaveBeenCalled());
    const data = action.mock.calls[0][1] as FormData;
    expect(Object.fromEntries(data)).toEqual({
      title: "Tytuł",
      content: "treść",
      color: "blue",
      priority: "2",
      pinned: "on",
    });
  });

  it("treść jest wysyłana także z zakładki Podgląd", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { user } = setup("ukryta treść", action);
    await user.click(screen.getByRole("button", { name: "Podgląd" }));
    await user.click(screen.getByRole("button", { name: "Zapisz notatkę" }));
    await vi.waitFor(() => expect(action).toHaveBeenCalled());
    expect((action.mock.calls[0][1] as FormData).get("content")).toBe("ukryta treść");
  });

  it("pokazuje błędy zwrócone przez serwer i NIE czyści treści", async () => {
    const action = vi.fn().mockResolvedValue({
      message: "Nie udało się zapisać notatki.",
      errors: { title: ["Tytuł nie może być pusty."] },
    });
    const { user, textarea } = setup("ważna treść", action);
    await user.click(screen.getByRole("button", { name: "Zapisz notatkę" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się zapisać notatki.");
    expect(screen.getByText("Tytuł nie może być pusty.")).toBeInTheDocument();
    expect(textarea).toHaveValue("ważna treść");
  });
});
