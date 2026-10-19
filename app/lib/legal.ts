// Dane do regulaminu i polityki prywatności — uzupełnij przed publikacją.
// Wartości w [nawiasach] to miejsca do wypełnienia; dopóki tu są,
// strony prawne pokazują w trybie deweloperskim żółte przypomnienie.

export const LEGAL = {
  serviceName: "Cloudy Notes",
  operator: "[Imię i nazwisko albo nazwa firmy]",
  address: "[Adres do korespondencji]",
  email: "[adres e-mail do kontaktu]",
  // Gdzie działa aplikacja (serwer Next.js), np. "Vercel Inc., USA"
  hosting: "[dostawca hostingu aplikacji]",
  updated: "20 października 2026",
};

export const legalIncomplete = Object.values(LEGAL).some((value) => value.startsWith("["));
