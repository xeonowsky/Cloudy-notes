import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Bullets, LegalSection, Points } from "../components/legal/legal-page";
import { LEGAL } from "../lib/legal";

export const metadata: Metadata = { title: "Regulamin | Cloudy Notes" };

const link = "font-medium text-brand-deep underline decoration-brand underline-offset-4 dark:text-brand";

export default function TermsPage() {
  return (
    <LegalPage title="Regulamin" current="regulamin">
      <LegalSection title="§ 1. Postanowienia ogólne">
        <Points>
          <li>
            Regulamin określa zasady korzystania z serwisu {LEGAL.serviceName} dostępnego w przeglądarce
            internetowej (dalej: Serwis).
          </li>
          <li>
            Usługodawcą jest {LEGAL.operator}, {LEGAL.address}, e-mail: {LEGAL.email} (dalej: Usługodawca).
          </li>
          <li>
            Regulamin jest regulaminem, o którym mowa w art. 8 ustawy z dnia 18 lipca 2002 r. o świadczeniu
            usług drogą elektroniczną.
          </li>
          <li>
            Użyte pojęcia oznaczają:
            <Bullets>
              <li>Użytkownik: osoba fizyczna korzystająca z Serwisu;</li>
              <li>Konto: indywidualny dostęp do Serwisu chroniony adresem e-mail i hasłem;</li>
              <li>Notatka: treść zapisana przez Użytkownika w Serwisie.</li>
            </Bullets>
          </li>
        </Points>
      </LegalSection>

      <LegalSection title="§ 2. Rodzaj i zakres usług">
        <Points>
          <li>
            Usługodawca świadczy usługę prowadzenia Konta, w ramach której Użytkownik może tworzyć, edytować,
            formatować, oznaczać kolorami, przypinać i usuwać Notatki.
          </li>
          <li>Usługi są bezpłatne.</li>
          <li>Notatki są dostępne wyłącznie dla Użytkownika, który je utworzył.</li>
        </Points>
      </LegalSection>

      <LegalSection title="§ 3. Wymagania techniczne">
        <p>Do korzystania z Serwisu potrzebne są:</p>
        <Bullets>
          <li>urządzenie z dostępem do internetu;</li>
          <li>aktualna przeglądarka internetowa z włączoną obsługą JavaScript i plików cookie;</li>
          <li>aktywny adres e-mail.</li>
        </Bullets>
      </LegalSection>

      <LegalSection title="§ 4. Konto">
        <Points>
          <li>Aby założyć Konto, Użytkownik podaje imię, adres e-mail i hasło oraz akceptuje Regulamin.</li>
          <li>Umowa o świadczenie usług zostaje zawarta z chwilą założenia Konta, na czas nieokreślony.</li>
          <li>Użytkownik odpowiada za zachowanie hasła w tajemnicy i nie udostępnia Konta innym osobom.</li>
          <li>
            Użytkownik może w każdej chwili rozwiązać umowę, wysyłając prośbę o usunięcie Konta na adres{" "}
            {LEGAL.email}. Usunięcie Konta oznacza trwałe usunięcie wszystkich Notatek.
          </li>
          <li>
            Usługodawca może rozwiązać umowę z zachowaniem 14-dniowego okresu wypowiedzenia, a bez okresu
            wypowiedzenia, jeśli Użytkownik rażąco narusza Regulamin, w szczególności § 5.
          </li>
        </Points>
      </LegalSection>

      <LegalSection title="§ 5. Zasady korzystania">
        <Points>
          <li>Zakazane jest dostarczanie przez Użytkownika treści o charakterze bezprawnym.</li>
          <li>
            Zakazane są działania zakłócające pracę Serwisu, w tym próby uzyskania dostępu do cudzych Kont lub
            Notatek.
          </li>
          <li>
            Usługodawca nie przegląda Notatek w zwykłym toku działania Serwisu. Po otrzymaniu urzędowego
            zawiadomienia lub wiarygodnej wiadomości o bezprawnym charakterze treści Usługodawca może
            uniemożliwić do niej dostęp.
          </li>
        </Points>
      </LegalSection>

      <LegalSection title="§ 6. Odpowiedzialność">
        <Points>
          <li>
            Usługodawca dokłada starań, aby Serwis działał bez przerw, ale zastrzega możliwość krótkich przerw
            technicznych potrzebnych do konserwacji i rozwoju.
          </li>
          <li>Usługodawca zaleca przechowywanie kopii szczególnie ważnych treści również poza Serwisem.</li>
          <li>
            Postanowienia Regulaminu nie wyłączają ani nie ograniczają odpowiedzialności Usługodawcy w
            zakresie, w jakim nie pozwalają na to przepisy prawa, w szczególności wobec konsumentów.
          </li>
        </Points>
      </LegalSection>

      <LegalSection title="§ 7. Reklamacje">
        <Points>
          <li>Reklamacje dotyczące działania Serwisu można składać na adres {LEGAL.email}.</li>
          <li>Reklamacja powinna zawierać adres e-mail Konta oraz opis problemu.</li>
          <li>
            Usługodawca odpowiada na reklamację w ciągu 14 dni od jej otrzymania, na adres e-mail nadawcy.
          </li>
        </Points>
      </LegalSection>

      <LegalSection title="§ 8. Dane osobowe">
        <p>
          Zasady przetwarzania danych osobowych opisuje{" "}
          <Link href="/polityka-prywatnosci" className={link}>
            Polityka prywatności
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="§ 9. Postanowienia końcowe">
        <Points>
          <li>
            Usługodawca może zmienić Regulamin z ważnych przyczyn, np. zmiany przepisów lub zakresu usług. O
            zmianach Użytkownik zostanie poinformowany e-mailem co najmniej 14 dni przed ich wejściem w życie.
            Jeśli nie akceptuje zmian, może usunąć Konto.
          </li>
          <li>W sprawach nieuregulowanych stosuje się prawo polskie.</li>
          <li>
            Regulamin nie ogranicza praw, które przysługują konsumentom na podstawie bezwzględnie
            obowiązujących przepisów prawa.
          </li>
        </Points>
      </LegalSection>
    </LegalPage>
  );
}
