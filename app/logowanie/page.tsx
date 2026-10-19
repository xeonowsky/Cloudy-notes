import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "../components/login-form";
import AuthShell from "../components/auth/auth-shell";
import type { SampleNote } from "../components/auth/sample-notes";
import { getCurrentUser } from "../lib/session";

export const metadata: Metadata = { title: "Logowanie | Cloudy Notes" };

const NOTES: SampleNote[] = [
  {
    title: "Na weekend",
    content: "- [x] Wysłać raport\n- [ ] Kupić kawę ziarnistą\n- [ ] Rower do serwisu",
    color: "yellow",
    rotate: -4,
    shift: "left",
  },
  {
    title: "Pomysł",
    content: "**Aplikacja z przepisami**, która robi listę zakupów z ==zaznaczonych składników==.",
    color: "mint",
    rotate: 3,
    shift: "right",
  },
  {
    title: "Na ścianę",
    content: "> Prosta notatka dziś jest lepsza niż idealna jutro.",
    color: "blue",
    rotate: -1.5,
    shift: "center",
  },
];

export default async function LoginPage() {
  // Zalogowany użytkownik nie ma tu czego szukać
  if (await getCurrentUser()) redirect("/notatki");

  return (
    <AuthShell
      title="Zaloguj się"
      subtitle="Twoje notatki czekają tam, gdzie je zostawiłeś."
      notes={NOTES}
      caption="Tak wyglądają notatki w Cloudy Notes: listy zadań, zakreślenia i kolorowe karty."
    >
      <LoginForm />
    </AuthShell>
  );
}
