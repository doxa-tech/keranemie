"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PartyNav({
  partyId,
  links,
}: {
  partyId: string;
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const base = `/admin/${partyId}`;

  return (
    <nav className="-mx-4 overflow-x-auto border-b px-4">
      <ul className="flex gap-4 text-sm">
        {links.map((link) => {
          const href = base + link.href;
          const active =
            link.href === "" ? pathname === base : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 py-2 whitespace-nowrap",
                  active
                    ? "border-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
