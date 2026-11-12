import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Countdown } from "@/components/countdown";
import {
  RejectionReason,
  SubmissionStatus,
} from "@/components/submission-status";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PlayerChallenge } from "@/lib/submissions";

export function ChallengeList({
  partyId,
  items,
}: {
  partyId: string;
  items: PlayerChallenge[];
}) {
  const t = useTranslations("Player");

  // To do: available and not done yet, running flash challenges first.
  const todo = items
    .filter((i) => i.available && !i.active)
    .sort((a, b) => flashFirst(a) - flashFirst(b));
  // Done: submitted, or rejected and no longer available.
  const done = items.filter((i) => i.active || (!i.available && i.latest));

  return (
    <Tabs defaultValue="todo">
      <TabsList className="w-full">
        <TabsTrigger value="todo">
          {t("todo")} ({todo.length})
        </TabsTrigger>
        <TabsTrigger value="done">
          {t("done")} ({done.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="todo" className="pt-2">
        {todo.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {t("nothingToDo")}
          </p>
        ) : (
          <ul className="space-y-2" aria-label={t("todo")}>
            {todo.map((item) => (
              <ChallengeRow key={item.challenge.id} partyId={partyId} item={item} />
            ))}
          </ul>
        )}
      </TabsContent>
      <TabsContent value="done" className="pt-2">
        {done.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {t("nothingDone")}
          </p>
        ) : (
          <ul className="space-y-2" aria-label={t("done")}>
            {done.map((item) => (
              <ChallengeRow key={item.challenge.id} partyId={partyId} item={item} />
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}

function flashFirst(item: PlayerChallenge) {
  return item.challenge.kind === "flash" ? 0 : 1;
}

function ChallengeRow({
  partyId,
  item,
}: {
  partyId: string;
  item: PlayerChallenge;
}) {
  const t = useTranslations("Player");
  const tf = useTranslations("ChallengeForm");
  const { challenge, active, latest, available, endsAt } = item;
  const shown = active ?? latest;
  const isRunningFlash = challenge.kind === "flash" && available && endsAt;

  return (
    <li>
      <Link
        href={`/p/${partyId}/challenges/${challenge.id}`}
        className="hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-3 transition-colors data-[flash=true]:border-amber-500 data-[flash=true]:bg-amber-500/5"
        data-flash={isRunningFlash ? "true" : undefined}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{challenge.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">
              {tf(`types.${challenge.type}`)} ·{" "}
              {t("points", { count: challenge.points })}
            </span>
            {isRunningFlash && (
              <Badge className="bg-amber-500 text-white">
                {t("flashEndsIn")}&nbsp;
                <Countdown to={endsAt.toISOString()} />
              </Badge>
            )}
            {shown && <SubmissionStatus submission={shown} />}
          </div>
          {shown && <RejectionReason submission={shown} />}
        </div>
        <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
      </Link>
    </li>
  );
}
