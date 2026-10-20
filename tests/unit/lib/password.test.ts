import { describe, expect, it } from "vitest";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/app/lib/password";

describe("hashPassword / verifyPassword", () => {
  it("zapisuje hash w formacie scrypt$N$r$p$sól$hash", async () => {
    const stored = await hashPassword("haslo1234");
    const parts = stored.split("$");
    expect(parts).toHaveLength(6);
    expect(parts.slice(0, 4)).toEqual(["scrypt", "16384", "8", "1"]);
    expect(stored).not.toContain("haslo1234");
  });

  it("weryfikuje poprawne hasło i odrzuca złe", async () => {
    const stored = await hashPassword("haslo1234");
    await expect(verifyPassword("haslo1234", stored)).resolves.toBe(true);
    await expect(verifyPassword("haslo12345", stored)).resolves.toBe(false);
  });

  it("dla tego samego hasła daje różne hashe (losowa sól)", async () => {
    const [a, b] = await Promise.all([hashPassword("takie-samo1"), hashPassword("takie-samo1")]);
    expect(a).not.toBe(b);
  });

  it.each(["", "bcrypt$1$2$3$4$5", "scrypt$16384$8$1$$", "zupełnie-nie-hash"])(
    "zwraca false dla uszkodzonego zapisu: %j",
    async (stored) => {
      await expect(verifyPassword("cokolwiek", stored)).resolves.toBe(false);
    },
  );

  it("hash-atrapa nigdy nie pasuje do żadnego hasła", async () => {
    await expect(verifyPassword("", DUMMY_HASH)).resolves.toBe(false);
    await expect(verifyPassword("haslo1234", DUMMY_HASH)).resolves.toBe(false);
  });
});
