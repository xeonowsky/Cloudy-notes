interface SubmitButtonProps {
  pending: boolean;
  text: string;
  pendingText: string;
}

export default function SubmitButton({ pending, text, pendingText }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-deep px-5 font-semibold text-white duration-200 hover:bg-[#174744] focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 dark:bg-brand dark:text-ink dark:hover:bg-[#7fd6d2]"
    >
      {pending && (
        <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {pending ? pendingText : text}
    </button>
  );
}
