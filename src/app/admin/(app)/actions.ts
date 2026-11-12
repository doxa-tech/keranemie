"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { parties, partyAdmins } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { isUniqueViolation } from "@/lib/db-errors";
import { generateJoinCode } from "@/lib/game/party";
import {
  parsePartyForm,
  partyFormError,
  submittedValues,
  type PartyFormState,
} from "@/lib/party-form";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createParty(
  _prev: PartyFormState,
  formData: FormData,
): Promise<PartyFormState> {
  const user = await requireAdmin();
  const parsed = parsePartyForm(formData);
  if (!parsed.success) {
    return {
      error: partyFormError(parsed.error),
      values: submittedValues(formData),
    };
  }
  const { name, description, startsAt, endsAt } = parsed.data;

  // Retry on the rare join code collision.
  let partyId: string | undefined;
  for (let attempt = 0; attempt < 5 && !partyId; attempt++) {
    try {
      partyId = await db.transaction(async (tx) => {
        const [party] = await tx
          .insert(parties)
          .values({
            name,
            description: description || null,
            joinCode: generateJoinCode(),
            startsAt,
            endsAt,
            createdBy: user.id,
          })
          .returning({ id: parties.id });
        await tx
          .insert(partyAdmins)
          .values({ partyId: party.id, userId: user.id, role: "owner" });
        return party.id;
      });
    } catch (error) {
      if (!isUniqueViolation(error, "parties_join_code_unique")) throw error;
    }
  }
  if (!partyId) throw new Error("Could not generate a unique join code");

  redirect(`/admin/${partyId}`);
}
