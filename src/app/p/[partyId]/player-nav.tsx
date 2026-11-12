"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecksIcon, NewspaperIcon, TrophyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Bottom tab bar, within thumb reach on phones.
export function PlayerNav({ partyId }: { partyId: string }) {
  const t = useTranslations("PlayerNav");
  const pathname = usePathname();
  const base = `/p/${partyId}`;
  const links = [
    { href: base, label: t("challenges"), icon: ListChecksIcon },
    { href: `${base}/leaderboard`, label: t("leaderboard"), icon: TrophyIcon },
    { href: `${base}/feed`, label: t("feed"), icon: NewspaperIcon },
  ];

  return (
    <nav
      aria-label={t("label")}
      className="bg-background/95 fixed inset-x-0 bottom-0 z-10 border-t pb-[env(safe-area-inset-bottom,0px)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-xl">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === base
              ? pathname === base || pathname.startsWith(`${base}/challenges`)
              : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-xs",
                  active ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
