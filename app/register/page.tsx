import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RegisterForm from "../components/register-form";
import AuthShell from "../components/auth/auth-shell";
import type { SampleNote } from "../components/auth/sample-notes";
import { getCurrentUser } from "../lib/session";

export const metadata: Metadata = { title: "Rejestracja | Cloudy Notes" };

const NOTES: SampleNote[] = [
  {
    title: "Pierwsze kroki",
    content: "- [x] Załóż konto\n- [ ] Napisz pierwszą notatkę\n- [ ] Przypnij najważniejszą",
    color: "mint",
    rotate: -3,
    shift: "left",
  },
  {
    title: "Formatowanie",
    content: "Tekst może być **pogrubiony**, *pochylony* albo ==zakreślony==.\n\n`Ctrl+B` działa też tutaj.",
    color: "pink",
    rotate: 2.5,
    shift: "right",
  },
  {
    title: "Kolory",
    content: "Sześć kolorów kart, żeby szybko odróżnić studia od zakupów.",
    color: "purple",
    rotate: -1,
    shift: "center",
  },
];

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/notatki");

  return (
    <AuthShell
      title="Załóż konto"
      subtitle="Za darmo. Wystarczy imię, e-mail i hasło."
      notes={NOTES}
      caption="Po rejestracji od razu trafisz do swoich notatek."
    >
      <RegisterForm />
    </AuthShell>
  );
}
