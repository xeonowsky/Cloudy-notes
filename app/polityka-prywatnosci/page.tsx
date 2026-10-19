import type { Metadata } from "next";
import LegalPage, { Bullets, LegalSection } from "../components/legal/legal-page";
import { LEGAL } from "../lib/legal";

export const metadata: Metadata = { title: "Polityka prywatności | Cloudy Notes" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Polityka prywatności" current="polityka">
      <LegalSection title="1. Kto odpowiada za Twoje dane">
        <p>
          Administratorem danych osobowych jest {LEGAL.operator}, {LEGAL.address}. W sprawach dotyczących
          danych możesz pisać na adres {LEGAL.email}.
        </p>
      </LegalSection>

      <LegalSection title="2. Jakie dane przetwarzamy">
        <Bullets>
          <li>imię i adres e-mail, które podajesz przy rejestracji;</li>
          <li>
            hasło w postaci skrótu (hash) wyliczonego algorytmem scrypt, nie znamy Twojego hasła i nie da się
            go odczytać;
          </li>
          <li>treść, tytuły, kolory i daty Twoich notatek;</li>
          <li>dane sesji: losowy identyfikator zapisany w ciasteczku oraz datę jej wygaśnięcia;</li>
          <li>
            dane techniczne, takie jak adres IP i informacje o przeglądarce, które mogą trafiać do logów
            serwera dostawcy hostingu.
          </li>
        </Bullets>
      </LegalSection>

      <LegalSection title="3. Cele i podstawy prawne">
        <Bullets>
          <li>
            prowadzenie konta i przechowywanie notatek, czyli wykonanie umowy (art. 6 ust. 1 lit. b RODO);
          </li>
          <li>
            zapewnienie bezpieczeństwa serwisu i zapobieganie nadużyciom, czyli nasz prawnie uzasadniony
            interes (art. 6 ust. 1 lit. f RODO);
          </li>
          <li>obsługa reklamacji i wiadomości od Ciebie (art. 6 ust. 1 lit. b i f RODO);</li>
          <li>wypełnianie obowiązków wynikających z przepisów prawa (art. 6 ust. 1 lit. c RODO).</li>
        </Bullets>
      </LegalSection>

      <LegalSection title="4. Jak długo przechowujemy dane">
        <Bullets>
          <li>dane konta i notatki: do czasu usunięcia konta;</li>
          <li>notatkę usuniętą przez Ciebie usuwamy z bazy danych od razu;</li>
          <li>sesję: do wylogowania, najdłużej 30 dni;</li>
          <li>
            kopie zapasowe bazy danych mogą zawierać dane jeszcze przez ograniczony czas, zgodnie z polityką
            dostawcy bazy danych, po czym są nadpisywane.
          </li>
        </Bullets>
      </LegalSection>

      <LegalSection title="5. Komu przekazujemy dane">
        <p>Nie sprzedajemy danych i nie udostępniamy ich w celach reklamowych. Korzystamy z dostawców:</p>
        <Bullets>
          <li>
            Neon Inc.: baza danych, w której są przechowywane konta i notatki; serwery znajdują się w Stanach
            Zjednoczonych;
          </li>
          <li>{LEGAL.hosting}: hosting aplikacji.</li>
        </Bullets>
        <p>
          Dostawcy przetwarzają dane wyłącznie na nasze polecenie. Przekazanie danych poza Europejski Obszar
          Gospodarczy odbywa się na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję
          Europejską lub innego mechanizmu przewidzianego w rozdziale V RODO.
        </p>
        <p>
          Mamy techniczny dostęp do bazy danych, ale nie przeglądamy treści notatek, chyba że wymaga tego
          obsługa Twojego zgłoszenia albo przepisy prawa.
        </p>
      </LegalSection>

      <LegalSection title="6. Pliki cookie">
        <p>
          Serwis używa jednego ciasteczka,{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-sm dark:bg-white/10">cn_session</code>
          , które utrzymuje Cię w stanie zalogowania. Jest niezbędne do działania konta, dlatego nie wymaga
          zgody. Wygasa po 30 dniach albo po wylogowaniu. Nie używamy ciasteczek analitycznych ani
          reklamowych.
        </p>
      </LegalSection>

      <LegalSection title="7. Twoje prawa">
        <p>Masz prawo do:</p>
        <Bullets>
          <li>dostępu do swoich danych i otrzymania ich kopii;</li>
          <li>sprostowania danych;</li>
          <li>usunięcia danych;</li>
          <li>ograniczenia przetwarzania;</li>
          <li>przenoszenia danych;</li>
          <li>sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie.</li>
        </Bullets>
        <p>
          Aby skorzystać z tych praw, napisz na {LEGAL.email}. Masz też prawo wnieść skargę do Prezesa Urzędu
          Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).
        </p>
      </LegalSection>

      <LegalSection title="8. Czy musisz podać dane">
        <p>
          Podanie danych jest dobrowolne, ale bez imienia, adresu e-mail i hasła nie da się założyć konta. Nie
          podejmujemy wobec Ciebie decyzji w sposób zautomatyzowany i nie profilujemy Cię.
        </p>
      </LegalSection>

      <LegalSection title="9. Bezpieczeństwo">
        <Bullets>
          <li>połączenie z serwisem jest szyfrowane (HTTPS);</li>
          <li>hasła przechowujemy wyłącznie jako skrót scrypt z unikalną solą;</li>
          <li>ciasteczko sesji jest niedostępne dla skryptów na stronie (httpOnly);</li>
          <li>każda notatka jest powiązana z kontem i widoczna tylko dla jego właściciela.</li>
        </Bullets>
      </LegalSection>

      <LegalSection title="10. Zmiany polityki">
        <p>
          O istotnych zmianach tej polityki poinformujemy e-mailem. Aktualna wersja jest zawsze dostępna na
          tej stronie.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
