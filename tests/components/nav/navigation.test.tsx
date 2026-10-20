import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USER } from "../../helpers/sql";

const mocks = vi.hoisted(() => ({ pathname: "/", getCurrentUser: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/app/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/app/actions/auth", () => ({ logout: vi.fn(), login: vi.fn(), signup: vi.fn() }));

const { default: NavLinks } = await import("@/app/components/nav/nav-links");
const { default: FeaturesMenu } = await import("@/app/components/nav/features-menu");
const { default: MobileMenu } = await import("@/app/components/nav/mobile-menu");
const { default: ToolsMenu } = await import("@/app/components/nav/tools-menu");
const { default: MainNavbar } = await import("@/app/components/navbar");
const { default: Footer } = await import("@/app/components/footer");
const { FEATURES } = await import("@/app/lib/features");

beforeEach(() => {
  mocks.pathname = "/";
  mocks.getCurrentUser.mockResolvedValue(null);
});

describe("NavLinks", () => {
  const links = [
    { name: "Notatki", href: "/notatki" },
    { name: "Kontakt", href: "/contact" },
  ];

  it("oznacza aktywny link — także na podstronach", () => {
    mocks.pathname = "/notatki/nowa";
    render(<NavLinks links={links} />);
    expect(screen.getByRole("link", { name: "Notatki" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Kontakt" })).not.toHaveAttribute("aria-current");
  });

  it("pusta lista = nic", () => {
    const { container } = render(<NavLinks links={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("FeaturesMenu", () => {
  it("otwiera się kliknięciem i zamyka Escape", async () => {
    const user = userEvent.setup();
    render(<FeaturesMenu loggedIn={false} />);
    const toggle = screen.getByRole("button", { name: "Możliwości" });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link")).toHaveLength(FEATURES.length + 1);

    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("zamyka się po kliknięciu poza menu", async () => {
    const user = userEvent.setup();
    render(
      <>
        <FeaturesMenu loggedIn={false} />
        <p>poza</p>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Możliwości" }));
    fireEvent.pointerDown(screen.getByText("poza"));
    expect(screen.getByRole("button", { name: "Możliwości" })).toHaveAttribute("aria-expanded", "false");
  });

  it("karta CTA zależy od zalogowania", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FeaturesMenu loggedIn={false} />);
    await user.click(screen.getByRole("button", { name: "Możliwości" }));
    expect(screen.getByRole("link", { name: "Załóż konto" })).toHaveAttribute("href", "/register");

    rerender(<FeaturesMenu loggedIn />);
    expect(screen.getByRole("link", { name: "Nowa notatka" })).toHaveAttribute("href", "/notatki/nowa");
  });
});

describe("ToolsMenu (Narzędzia)", () => {
  it("rozwija listę narzędzi: Notatki i Board z opisami", async () => {
    const user = userEvent.setup();
    render(<ToolsMenu />);
    const toggle = screen.getByRole("button", { name: "Narzędzia" });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Notatki/ })).toHaveAttribute("href", "/notatki");
    expect(screen.getByRole("link", { name: /Board/ })).toHaveAttribute("href", "/board");
    expect(screen.getByText(/stacku wiedzy/)).toBeInTheDocument();
  });

  it("wybranie narzędzia zamyka menu", async () => {
    const user = userEvent.setup();
    render(<ToolsMenu />);
    await user.click(screen.getByRole("button", { name: "Narzędzia" }));
    await user.click(screen.getByRole("link", { name: /Board/ }));
    expect(screen.getByRole("button", { name: "Narzędzia" })).toHaveAttribute("aria-expanded", "false");
  });

  it("na stronie narzędzia przycisk jest wyróżniony, a narzędzie oznaczone jako aktywne", async () => {
    mocks.pathname = "/notatki/nowa";
    const user = userEvent.setup();
    render(<ToolsMenu />);
    const toggle = screen.getByRole("button", { name: "Narzędzia" });
    expect(toggle).toHaveClass("font-semibold");

    await user.click(toggle);
    expect(screen.getByRole("link", { name: /Notatki/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Board/ })).not.toHaveAttribute("aria-current");
  });

  it("poza narzędziami przycisk nie jest wyróżniony", () => {
    mocks.pathname = "/konto";
    render(<ToolsMenu />);
    expect(screen.getByRole("button", { name: "Narzędzia" })).not.toHaveClass("font-semibold");
  });
});

describe("MobileMenu", () => {
  it("dla gościa ma logowanie i rejestrację, bez narzędzi", () => {
    render(<MobileMenu links={[]} userName={null} />);
    expect(screen.getByRole("link", { name: "Zaloguj się" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Załóż konto" })).toBeInTheDocument();
    expect(screen.queryByText("Narzędzia")).not.toBeInTheDocument();
  });

  it("dla zalogowanego: imię, sekcja Narzędzia i wylogowanie", () => {
    mocks.pathname = "/board";
    render(<MobileMenu links={[{ name: "Konto", href: "/konto" }]} userName="Klaudiusz" />);
    expect(screen.getByText("Klaudiusz")).toBeInTheDocument();
    expect(screen.getByText("Narzędzia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Board" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Notatki" })).toHaveAttribute("href", "/notatki");
    expect(screen.getByRole("button", { name: "Wyloguj się" })).toBeInTheDocument();
  });
});

// Navbar i Footer to async Server Components — Vitest nie wyrenderuje ich
// jako <Komponent />, ale można je wywołać jak funkcję i wyrenderować wynik.
describe("MainNavbar (Server Component)", () => {
  it("gość widzi logowanie i rejestrację, bez menu Narzędzia", async () => {
    render(await MainNavbar());
    const nav = screen.getByRole("navigation", { name: "Menu główne" });
    expect(within(nav).getAllByRole("link", { name: "Zaloguj się" }).length).toBeGreaterThan(0);
    expect(within(nav).queryByRole("button", { name: "Narzędzia" })).not.toBeInTheDocument();
  });

  it("zalogowany: Możliwości po lewej, Narzędzia po prawej obok Kontaktu", async () => {
    mocks.getCurrentUser.mockResolvedValue(USER);
    const user = userEvent.setup();
    render(await MainNavbar());

    const tools = screen.getByRole("button", { name: "Narzędzia" });
    const features = screen.getByRole("button", { name: "Możliwości" });
    const contact = screen.getAllByRole("link", { name: "Kontakt" })[0];
    const right = contact.closest("div.ml-auto")!;
    expect(right).toContainElement(tools); // ta sama (prawa) grupa co Kontakt
    expect(right).not.toContainElement(features);
    // Narzędzia stoją bezpośrednio przed Kontaktem
    expect(tools.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(tools);
    // szukamy w panelu przy przycisku — menu mobilne też ma link Board
    expect(within(tools.parentElement!).getByRole("link", { name: /Board/ })).toHaveAttribute("href", "/board");
    // Konto jest pod awatarem z imieniem, a nie jako osobny link na górze
    expect(screen.getAllByRole("link", { name: /Klaudiusz/ })[0]).toHaveAttribute("href", "/konto");
    expect(screen.getByRole("button", { name: "Wyloguj" })).toBeInTheDocument();
  });
});

describe("Footer (Server Component)", () => {
  it("linki zależą od zalogowania, rok jest aktualny", async () => {
    render(await Footer());
    expect(screen.getByRole("link", { name: "Załóż konto" })).toBeInTheDocument();
    expect(screen.getByText(`© ${new Date().getFullYear()} Cloudy Notes`)).toBeInTheDocument();
  });

  it("zalogowany widzi swoje skróty", async () => {
    mocks.getCurrentUser.mockResolvedValue(USER);
    render(await Footer());
    expect(screen.getByRole("link", { name: "Moje notatki" })).toHaveAttribute("href", "/notatki");
    expect(screen.getByRole("link", { name: "Board" })).toHaveAttribute("href", "/board");
    expect(screen.getByRole("link", { name: "Regulamin" })).toHaveAttribute("href", "/regulamin");
  });
});
