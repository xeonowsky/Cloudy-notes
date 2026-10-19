"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { name: string; href: string };

// Komponent kliencki tylko po to, żeby znać aktualny adres (usePathname)
// i podświetlić aktywny link.
export default function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  if (links.length === 0) return null;

  return (
    <ul className="flex items-center gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`relative rounded-lg px-3 py-2 text-[0.9375rem] duration-200 hover:bg-mist hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none dark:hover:bg-white/5 dark:hover:text-white ${
                active
                  ? "font-semibold text-ink after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-brand dark:text-white"
                  : "text-ink/65 dark:text-white/65"
              }`}
            >
              {link.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
