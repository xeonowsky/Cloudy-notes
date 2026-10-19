import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../lib/session";
import { logout } from "../actions/auth";

export const metadata: Metadata = { title: "Moje konto | Cloudy Notes" };

export default async function AccountPage() {
  // Właściwe sprawdzenie uprawnień — proxy.ts sprawdza tylko, czy ciasteczko
  // istnieje, a tutaj weryfikujemy sesję w bazie.
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 gap-6">
      <h2 className="text-2xl">Cześć, {user.name}!</h2>
      <p>
        Zalogowano jako <span className="font-medium">{user.email}</span>
      </p>

      <Link href="/notatki" className="text-[#68cbc7] font-medium hover:underline">
        Przejdź do notatek →
      </Link>

      {/* Server Action można podpiąć bezpośrednio pod formularz w Server Component */}
      <form action={logout}>
        <button
          type="submit"
          className="border-[#68cbc7] border-2 shadow-md text-black rounded-4xl px-6 py-2 hover:text-white hover:bg-[#68cbc7] duration-500 cursor-pointer"
        >
          Wyloguj się
        </button>
      </form>
    </div>
  );
}
