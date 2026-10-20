"use client";

import { useEffect, useId, useRef, useState } from "react";

// Wspólna logika rozwijanych menu w nagłówku ("Narzędzia", "Możliwości").
// Własny hook = funkcja zaczynająca się od "use", która korzysta z innych hooków.
// Dzięki temu oba menu zamykają się tak samo: ponownym kliknięciem przycisku,
// klawiszem Escape albo kliknięciem poza menu.
export function useDropdown<T extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<T>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // sprzątanie: usuwamy nasłuchiwanie, gdy menu się zamknie
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return {
    open,
    rootRef,
    panelId,
    toggle: () => setOpen((v) => !v),
    close: () => setOpen(false),
    // propsy dla przycisku otwierającego — dostępność w jednym miejscu
    buttonProps: { "aria-expanded": open, "aria-controls": panelId },
  };
}
