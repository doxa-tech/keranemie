import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { PartyStatus } from "@/lib/game/party";

const variants = {
  draft: "outline",
  open: "secondary",
  live: "default",
  ended: "outline",
} as const;

export function PartyStatusBadge({ status }: { status: PartyStatus }) {
  const t = useTranslations("PartyStatus");
  return <Badge variant={variants[status]}>{t(status)}</Badge>;
}
