"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEAM_COLORS } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { createTeam, updateTeam, type TeamFormState } from "./actions";

type Team = { id: string; name: string; color: string; emoji: string | null };

// Without `team`: an inline "add team" form. With `team`: an edit button
// opening the same form in a dialog.
export function TeamForm({
  partyId,
  team,
  triggerLabel,
  defaultColorIndex = 0,
}: {
  partyId: string;
  team?: Team;
  triggerLabel?: string;
  defaultColorIndex?: number;
}) {
  const t = useTranslations("Teams");
  const [open, setOpen] = useState(false);

  if (!team) {
    return (
      <Fields
        partyId={partyId}
        defaultColor={TEAM_COLORS[defaultColorIndex % TEAM_COLORS.length]}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTitle", { name: team.name })}</DialogTitle>
        </DialogHeader>
        <Fields
          partyId={partyId}
          team={team}
          defaultColor={team.color}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function Fields({
  partyId,
  team,
  defaultColor,
  onSaved,
}: {
  partyId: string;
  team?: Team;
  defaultColor: string;
  onSaved?: () => void;
}) {
  const t = useTranslations("Teams");
  const [state, formAction, pending] = useActionState<TeamFormState, FormData>(
    team ? updateTeam.bind(null, partyId, team.id) : createTeam.bind(null, partyId),
    {},
  );
  const [color, setColor] = useState(defaultColor);
  const idPrefix = team ? `team-${team.id}` : "new-team";

  useEffect(() => {
    if (state.saved) onSaved?.();
  }, [state.saved, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>{t("name")}</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          required
          maxLength={40}
          defaultValue={team?.name}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-emoji`}>{t("emoji")}</Label>
        <Input
          id={`${idPrefix}-emoji`}
          name="emoji"
          maxLength={8}
          className="w-20"
          defaultValue={team?.emoji ?? ""}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("color")}</legend>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap gap-2">
          {TEAM_COLORS.map((c, i) => (
            <button
              key={c}
              type="button"
              aria-label={t("colorOption", { index: i + 1 })}
              aria-pressed={c === color}
              onClick={() => setColor(c)}
              className={cn(
                "size-8 rounded-full ring-offset-2 transition",
                c === color && "ring-foreground ring-2",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>
      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {team ? t("save") : t("add")}
      </Button>
    </form>
  );
}
