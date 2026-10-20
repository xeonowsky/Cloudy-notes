# Testy Cloudy Notes

Vitest + React Testing Library (zgodnie z dokumentacją Next.js 16).

```bash
npm test                # tryb "watch" — testy odpalają się po każdej zmianie pliku
npm run test:run        # jednorazowo (np. przed commitem)
npm run test:coverage   # + raport pokrycia w folderze coverage/ (otwórz coverage/index.html)
npx vitest run tests/components/roadmap   # tylko wybrany folder
npx vitest -t "przeciągnięcie"            # tylko testy z tym tekstem w nazwie
```

## Układ

| Folder | Środowisko | Co testuje |
| --- | --- | --- |
| `tests/unit/lib` | Node | walidacja Zod, hasła (scrypt), sesje, zapytania do bazy, geometria strzałek, stałe |
| `tests/unit/actions` | Node | Server Actions: kto może je wywołać, walidacja, jakie SQL idzie do bazy |
| `tests/unit/proxy.test.ts` | Node | ochrona tras w `proxy.ts` |
| `tests/components` | jsdom | komponenty Reacta: render, kliknięcia, klawiatura, formularze |
| `tests/components/pages` | jsdom | strony (async Server Components) — przekierowania i treść |
| `tests/components/roadmap` | jsdom | części tablicy + test integracyjny całej tablicy Board |

## Najważniejsze techniki

- **Atrapy (mocki)** — `vi.mock("@/app/lib/db", ...)` podmienia bazę, więc testy nie
  potrzebują Neona ani internetu. `tests/helpers/sql.ts` odczytuje, jakie zapytanie
  "poszło" do bazy (`lastSql(sql).values`).
- **`vi.hoisted`** — `vi.mock` jest przenoszone na samą górę pliku, więc zmienne
  używane w fabryce mocka trzeba utworzyć przez `vi.hoisted`.
- **`redirect()`** z Next.js rzuca wyjątek — w testach rzuca `RedirectError`,
  a sprawdzamy `rejects.toThrow(new RedirectError("/notatki"))`.
- **Async Server Components** (strony, navbar, stopka) — Vitest ich nie wyrenderuje
  jako `<Strona />`, ale można je wywołać jak funkcję: `render(await Strona())`.
- **Szukaj elementów tak jak użytkownik** — `getByRole("button", { name: "Usuń" })`,
  `getByLabelText("Nazwa")`, a nie po klasach CSS. Przy okazji wychodzą braki
  dostępności (dlatego tablica dostała `role="application"` i `aria-label`).
- **`it.fails`** — test, który *ma* nie przechodzić. Używamy go do opisania znanego
  błędu (kursywa w pogrubieniu w `markdown.tsx`). Gdy błąd naprawisz, Vitest
  zgłosi ten test — wtedy zmień `it.fails` na `it`.

## Czego tu nie ma

Testy nie łączą się z prawdziwą bazą ani przeglądarką. Pełną ścieżkę
(logowanie → notatka → Board w prawdziwym Chrome) sprawdziłyby testy E2E
w Playwright — to dobry kolejny krok.
