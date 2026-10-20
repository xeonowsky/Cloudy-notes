// Uruchamiane przed każdym plikiem testów komponentów.
import "@testing-library/jest-dom/vitest"; // dodaje expect(...).toBeInTheDocument() itd.
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Po każdym teście odmontowujemy wyrenderowane komponenty
afterEach(() => cleanup());

// jsdom nie implementuje przechwytywania wskaźnika — tablica Board go używa
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.releasePointerCapture = () => {};
  HTMLElement.prototype.hasPointerCapture = () => false;
}
