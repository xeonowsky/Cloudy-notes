import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// scrypt jest wbudowany w Node.js — nie trzeba instalować bcrypta.
// Parametry: N = koszt CPU/pamięci, r = rozmiar bloku, p = równoległość.
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

function scryptAsync(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** Zwraca string do zapisania w bazie: scrypt$N$r$p$salt$hash */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16); // unikalna sól dla każdego hasła
  const hash = await scryptAsync(password, salt, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;

  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });

  // timingSafeEqual porównuje w stałym czasie — zwykłe === zdradzałoby,
  // ile bajtów się zgadza (atak czasowy).
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Hash "atrapa" — używany przy logowaniu na nieistniejący e-mail, żeby odpowiedź
// trwała tyle samo co przy złym haśle (nie da się po czasie zgadnąć, czy konto istnieje).
export const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(KEY_LENGTH).toString("base64");
