import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const actions = vi.hoisted(() => ({ login: vi.fn(), signup: vi.fn(), logout: vi.fn() }));
vi.mock("@/app/actions/auth", () => actions);

const { default: LoginForm } = await import("@/app/components/login-form");
const { default: RegisterForm } = await import("@/app/components/register-form");

describe("LoginForm", () => {
  it("wysyła e-mail i hasło do akcji login", async () => {
    actions.login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "k@example.com");
    await user.type(screen.getByLabelText("Hasło"), "haslo1234");
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    await vi.waitFor(() => expect(actions.login).toHaveBeenCalled());
    const data = actions.login.mock.calls[0][1] as FormData;
    expect(Object.fromEntries(data)).toEqual({ email: "k@example.com", password: "haslo1234" });
  });

  it("po błędzie pokazuje komunikat i zostawia wpisany e-mail", async () => {
    actions.login.mockResolvedValue({ message: "Nieprawidłowy e-mail lub hasło.", values: { email: "k@example.com" } });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "k@example.com");
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nieprawidłowy e-mail lub hasło.");
    expect(screen.getByLabelText("E-mail")).toHaveValue("k@example.com");
  });

  it("ma link do rejestracji", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: "Załóż je za darmo" })).toHaveAttribute("href", "/register");
  });
});

describe("RegisterForm", () => {
  it("odhacza wymagania hasła podczas pisania", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByLabelText("Hasło"), "abc");
    expect(screen.getByText("Litera").closest("li")).toHaveTextContent("— spełnione");
    expect(screen.getByText("Cyfra").closest("li")).toHaveTextContent("— niespełnione");
  });

  it("pokazuje błędy pól z serwera", async () => {
    actions.signup.mockResolvedValue({
      errors: { email: ["Konto z tym adresem e-mail już istnieje."], terms: ["Zaakceptuj regulamin, aby założyć konto."] },
      values: { name: "Klaudiusz", email: "k@example.com" },
    });
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.click(screen.getByRole("button", { name: /Załóż konto/ }));

    expect(await screen.findByText("Konto z tym adresem e-mail już istnieje.")).toBeInTheDocument();
    expect(screen.getByText("Zaakceptuj regulamin, aby założyć konto.")).toBeInTheDocument();
    expect(screen.getByLabelText("Imię")).toHaveValue("Klaudiusz");
  });
});
