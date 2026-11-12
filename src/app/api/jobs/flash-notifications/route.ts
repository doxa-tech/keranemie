import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { announceStartedFlashChallenges } from "@/lib/flash-notifications";

// Called every minute by the database scheduler (pg_cron + pg_net).
export async function POST(request: NextRequest) {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const announced = await announceStartedFlashChallenges();
  return NextResponse.json({ announced });
}

function isAuthorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
