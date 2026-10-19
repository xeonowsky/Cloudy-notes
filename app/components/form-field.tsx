"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
  errors?: string[];
  // Pole sterowane (np. hasło z wymaganiami na żywo) — opcjonalnie
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  // Dodatkowa treść pod polem, np. lista wymagań hasła
  children?: ReactNode;
  hideErrors?: boolean;
}

export default function FormField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  defaultValue,
  errors,
  value,
  onChange,
  children,
  hideErrors = false,
}: FormFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const hasError = !!errors?.length;
  const showErrors = hasError && !hideErrors;

  // Pole sterowane dostaje value, niesterowane — defaultValue
  const valueProps = value !== undefined ? { value, onChange } : { defaultValue };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink dark:text-[#e3f1f0]">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && visible ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={showErrors ? `${id}-error` : undefined}
          {...valueProps}
          className={`h-12 w-full rounded-xl border-[1.5px] bg-white px-4 text-base text-ink transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-ink/35 focus:ring-4 dark:bg-[#0d1f1e] dark:text-[#e3f1f0] dark:placeholder:text-white/30 ${
            isPassword ? "pr-20" : ""
          } ${
            hasError
              ? "border-danger focus:border-danger focus:ring-danger/15"
              : "border-line focus:border-brand-deep focus:ring-brand/25 dark:border-white/15 dark:focus:border-brand"
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
            className="absolute top-1/2 right-2 h-8 -translate-y-1/2 cursor-pointer rounded-lg px-3 text-sm font-medium text-brand-deep duration-200 hover:bg-mist focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none dark:text-brand dark:hover:bg-white/5"
          >
            {visible ? "Ukryj" : "Pokaż"}
          </button>
        )}
      </div>

      {children}

      {showErrors && (
        <ul id={`${id}-error`} className="flex flex-col gap-1 text-sm text-danger dark:text-[#f9a8a0]">
          {errors!.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
