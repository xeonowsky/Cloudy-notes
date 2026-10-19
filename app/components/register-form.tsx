"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import FormField from "./form-field";
import FormAlert from "./form-alert";
import SubmitButton from "./submit-button";
import PasswordRequirements from "./password-requirements";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  // Hasło trzymamy w stanie, żeby odhaczać wymagania podczas pisania
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormAlert message={state?.message} />

      <div className="flex flex-col gap-5">
        <FormField
          id="name"
          label="Imię"
          placeholder="Jan"
          autoComplete="given-name"
          defaultValue={state?.values?.name}
          errors={state?.errors?.name}
        />
        <FormField
          id="email"
          label="E-mail"
          type="email"
          placeholder="jan@example.com"
          autoComplete="email"
          defaultValue={state?.values?.email}
          errors={state?.errors?.email}
        />
        <FormField
          id="password"
          label="Hasło"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errors={state?.errors?.password}
          // błędy hasła pokazuje lista wymagań — bez dublowania komunikatów
          hideErrors
        >
          <PasswordRequirements value={password} showErrors={!!state?.errors?.password} />
        </FormField>
        <FormField
          id="confirmPassword"
          label="Powtórz hasło"
          type="password"
          autoComplete="new-password"
          errors={state?.errors?.confirmPassword}
        />
      </div>

      <div className="mt-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink/75 dark:text-[#e3f1f0]/75">
          <input
            type="checkbox"
            name="terms"
            aria-invalid={!!state?.errors?.terms}
            aria-describedby={state?.errors?.terms ? "terms-error" : undefined}
            className="mt-0.5 size-[1.125rem] shrink-0 cursor-pointer accent-brand-deep"
          />
          <span>
            Akceptuję{" "}
            <Link
              href="/regulamin"
              target="_blank"
              className="font-semibold text-brand-deep underline decoration-brand underline-offset-4 dark:text-brand"
            >
              Regulamin
            </Link>
            . Informacje o danych znajdziesz w{" "}
            <Link
              href="/polityka-prywatnosci"
              target="_blank"
              className="font-semibold text-brand-deep underline decoration-brand underline-offset-4 dark:text-brand"
            >
              Polityce prywatności
            </Link>
            .
          </span>
        </label>
        {state?.errors?.terms && (
          <p id="terms-error" className="mt-2 text-sm text-danger dark:text-[#f9a8a0]">
            {state.errors.terms[0]}
          </p>
        )}
      </div>

      <div className="mt-8">
        <SubmitButton pending={pending} text="Załóż konto" pendingText="Tworzenie konta…" />
      </div>

      <p className="mt-6 text-sm text-ink/70 dark:text-[#e3f1f0]/70">
        Masz już konto?{" "}
        <Link
          href="/logowanie"
          className="font-semibold text-brand-deep underline decoration-brand decoration-2 underline-offset-4 hover:decoration-brand-deep dark:text-brand"
        >
          Zaloguj się
        </Link>
      </p>
    </form>
  );
}
