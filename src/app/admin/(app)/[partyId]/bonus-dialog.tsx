"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { NativeSelect } from "@/components/native-select";
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
import { grantBonus, type BonusState } from "./actions";

export function BonusDialog({
  partyId,
  teams,
  players,
}: {
  partyId: string;
  teams: { id: string; name: string }[];
  players: { id: string; displayName: string }[];
}) {
  const t = useTranslations("Dashboard.bonus");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<BonusState, FormData>(
    async (prev, formData) => {
      const result = await grantBonus(partyId, prev, formData);
      if (result.saved) {
        toast.success(t("saved"));
        setOpen(false);
      }
      return result;
    },
    {},
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        {t("open")}
      </DialogTrigger>
      <DialogContent closeLabel={tc("close")}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bonus-target">{t("target")}</Label>
            <NativeSelect id="bonus-target" name="target" required>
              <optgroup label={t("teams")}>
                {teams.map((team) => (
                  <option key={team.id} value={`team:${team.id}`}>
                    {team.name}
                  </option>
                ))}
              </optgroup>
              {players.length > 0 && (
                <optgroup label={t("players")}>
                  {players.map((player) => (
                    <option key={player.id} value={`player:${player.id}`}>
                      {player.displayName}
                    </option>
                  ))}
                </optgroup>
              )}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bonus-points">{t("points")}</Label>
            <Input
              id="bonus-points"
              name="points"
              type="number"
              inputMode="numeric"
              required
            />
            <p className="text-muted-foreground text-xs">{t("pointsHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bonus-reason">{t("reason")}</Label>
            <Input id="bonus-reason" name="reason" maxLength={200} required />
          </div>
          {state.error && (
            <p className="text-destructive text-sm" role="alert">
              {t("invalid")}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {t("submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
