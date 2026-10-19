"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import FormField from "./form-field";
import FormAlert from "./form-alert";
import SubmitButton from "./submit-button";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  // Ręczne wysłanie zamiast <form action> — React 19 nie wyczyści wtedy pól po błędzie
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    // noValidate — błędy pokazujemy sami (spójnie z serwerem), bez dymków przeglądarki
    <form onSubmit={handleSubmit} noValidate>
      <FormAlert message={state?.message} />

      <div className="flex flex-col gap-5">
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
          autoComplete="current-password"
          errors={state?.errors?.password}
        />
      </div>

      <div className="mt-8">
        <SubmitButton pending={pending} text="Zaloguj się" pendingText="Logowanie…" />
      </div>

      <p className="mt-6 text-sm text-ink/70 dark:text-[#e3f1f0]/70">
        Nie masz konta?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-deep underline decoration-brand decoration-2 underline-offset-4 hover:decoration-brand-deep dark:text-brand"
        >
          Załóż je za darmo
        </Link>
      </p>
    </form>
  );
}
