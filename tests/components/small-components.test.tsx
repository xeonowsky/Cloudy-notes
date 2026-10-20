import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormAlert from "@/app/components/form-alert";
import SubmitButton from "@/app/components/submit-button";
import FormField from "@/app/components/form-field";
import PasswordRequirements from "@/app/components/password-requirements";
import MainButton from "@/app/components/button";
import FeatureIcon from "@/app/components/feature-icon";
import { CategoryBadge, PriorityBadge } from "@/app/components/note-meta";
import AuthShell from "@/app/components/auth/auth-shell";

describe("FormAlert", () => {
  it("bez komunikatu nic nie renderuje", () => {
    const { container } = render(<FormAlert />);
    expect(container).toBeEmptyDOMElement();
  });

  it("pokazuje komunikat jako alert", () => {
    render(<FormAlert message="Błąd!" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Błąd!");
  });
});

describe("SubmitButton", () => {
  it("w trakcie wysyłania jest zablokowany i zmienia tekst", () => {
    const { rerender } = render(<SubmitButton pending={false} text="Zapisz" pendingText="Zapisywanie…" />);
    expect(screen.getByRole("button", { name: "Zapisz" })).toBeEnabled();
    rerender(<SubmitButton pending text="Zapisz" pendingText="Zapisywanie…" />);
    expect(screen.getByRole("button", { name: "Zapisywanie…" })).toBeDisabled();
  });
});

describe("FormField", () => {
  it("łączy etykietę z polem i pokazuje błędy", () => {
    render(<FormField id="email" label="E-mail" errors={["Zły e-mail"]} />);
    const input = screen.getByLabelText("E-mail");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Zły e-mail");
  });

  it("hideErrors ukrywa listę błędów, ale pole dalej jest oznaczone jako błędne", () => {
    render(<FormField id="p" label="Hasło" errors={["x"]} hideErrors />);
    expect(screen.queryByText("x")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Hasło")).toHaveAttribute("aria-invalid", "true");
  });

  it("przycisk Pokaż/Ukryj przełącza widoczność hasła", async () => {
    const user = userEvent.setup();
    render(<FormField id="password" label="Hasło" type="password" />);
    const input = screen.getByLabelText("Hasło");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Pokaż hasło" }));
    expect(input).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ukryj hasło" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("pole sterowane woła onChange", async () => {
    const onChange = vi.fn();
    render(<FormField id="n" label="Imię" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Imię"), "a");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("PasswordRequirements", () => {
  const status = () => screen.getAllByRole("listitem").map((li) => li.textContent);

  it("odhacza spełnione reguły na żywo", () => {
    const { rerender } = render(<PasswordRequirements value="" showErrors={false} />);
    expect(status()).toEqual([
      "Co najmniej 8 znaków — niespełnione",
      "Litera — niespełnione",
      "Cyfra — niespełnione",
    ]);
    rerender(<PasswordRequirements value="abcdefg1" showErrors={false} />);
    expect(status().every((s) => s?.endsWith("— spełnione"))).toBe(true);
  });

  it("po nieudanej wysyłce niespełnione reguły są na czerwono", () => {
    render(<PasswordRequirements value="abc" showErrors />);
    expect(screen.getByText("Cyfra").closest("li")).toHaveClass("text-danger");
    expect(screen.getByText("Litera").closest("li")).not.toHaveClass("text-danger");
  });
});

describe("MainButton", () => {
  it("jest linkiem w obu wariantach", () => {
    render(
      <>
        <MainButton text="Główny" href="/a" />
        <MainButton text="Drugi" href="/b" isPrimary={false} />
      </>,
    );
    expect(screen.getByRole("link", { name: "Główny" })).toHaveAttribute("href", "/a");
    expect(screen.getByRole("link", { name: "Drugi" })).toHaveAttribute("href", "/b");
  });
});

describe("FeatureIcon", () => {
  it.each(["format", "list", "color", "lock"] as const)("rysuje ikonę %s", (icon) => {
    const { container } = render(<FeatureIcon icon={icon} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

describe("CategoryBadge / PriorityBadge", () => {
  it("kategoria wynika z koloru, a nieznany kolor wraca do domyślnego", () => {
    const { rerender } = render(<CategoryBadge color="blue" />);
    expect(screen.getByText("Biznes")).toBeInTheDocument();
    rerender(<CategoryBadge color={"zielony-neon" as never} />);
    expect(screen.getByText("Ogólne")).toBeInTheDocument();
  });

  it("ważność jest czytelna dla czytnika ekranu albo jako etykieta", () => {
    const { rerender } = render(<PriorityBadge priority={2} />);
    expect(screen.getByText("Ważność: Wysoki")).toHaveClass("sr-only");
    rerender(<PriorityBadge priority={0} showLabel />);
    expect(screen.getByText("Niski")).toBeInTheDocument();
  });
});

describe("AuthShell", () => {
  it("pokazuje tytuł, formularz i ukrywa dekorację przed czytnikami", () => {
    render(
      <AuthShell
        title="Witaj"
        subtitle="Zaloguj się"
        caption="Twoje notatki"
        notes={[{ title: "Przykład", content: "**Treść**", color: "yellow", rotate: 2, shift: "left" }]}
      >
        <form aria-label="formularz" />
      </AuthShell>,
    );
    expect(screen.getByRole("heading", { name: "Witaj" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "formularz" })).toBeInTheDocument();
    expect(screen.getByText("Twoje notatki").closest("aside")).toHaveAttribute("aria-hidden");
    // przykładowa notatka renderowana przez ten sam komponent Markdown
    expect(screen.getByText("Treść").tagName).toBe("STRONG");
  });
});
