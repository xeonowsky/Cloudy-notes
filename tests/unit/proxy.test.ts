import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";
import { SESSION_COOKIE } from "@/app/lib/session-cookie";

describe("proxy (ochrona tras)", () => {
  it("bez ciasteczka sesji przekierowuje na /logowanie", () => {
    const response = proxy(new NextRequest("http://localhost/notatki"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/logowanie");
  });

  it("z ciasteczkiem przepuszcza dalej", () => {
    const request = new NextRequest("http://localhost/board", {
      headers: { cookie: `${SESSION_COOKIE}=cokolwiek` },
    });
    const response = proxy(request);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("chroni wszystkie prywatne sekcje", () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining(["/konto/:path*", "/notatki/:path*", "/board/:path*"]),
    );
  });
});
