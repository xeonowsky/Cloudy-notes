import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/app/lib/session-cookie";

// Proxy (dawniej middleware) działa przed renderowaniem strony.
// Robi tylko szybkie, "optymistyczne" sprawdzenie: czy ciasteczko w ogóle jest.
// Prawdziwa weryfikacja sesji w bazie odbywa się na stronie (getCurrentUser).
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/logowanie", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Trasy wymagające zalogowania — dopisuj tu kolejne
  matcher: ["/konto/:path*", "/notatki/:path*"],
};
