import { expect, type Browser, type Page } from "@playwright/test";
import postgres from "postgres";

const MAILPIT_URL = "http://127.0.0.1:55324";

// A unique email per test, so tests don't share admins or parties.
export function uniqueEmail(prefix = "admin") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

// Waits for the latest email sent to `to` in the local Mailpit inbox and
// returns the first link in it.
async function magicLinkFor(to: string): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const search = await fetch(
          `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
        ).then((r) => r.json());
        const id = search.messages?.[0]?.ID;
        if (!id) return undefined;
        const message = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`).then(
          (r) => r.json(),
        );
        link = (message.Text as string).match(/https?:\/\/\S+/)?.[0];
        return link;
      },
      { timeout: 15_000 },
    )
    .toBeTruthy();
  return link!;
}

// Signs in as an admin through the magic link flow. Stays on the current
// page if it is already the login page (e.g. with a `next` parameter).
export async function loginAsAdmin(
  page: Page,
  email = uniqueEmail(),
  expectedPath = "/admin",
) {
  if (!new URL(page.url(), "http://x").pathname.startsWith("/admin/login")) {
    await page.goto("/admin/login");
  }
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();
  await page.goto(await magicLinkFor(email));
  await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
  return email;
}

// Creates a party from the admin home and returns its id. Times are
// datetime-local values in the browser's time zone.
export async function createParty(
  page: Page,
  {
    name = "Test party",
    startsAt = "2030-07-01T18:00",
    endsAt = "2030-07-01T23:00",
  }: { name?: string; startsAt?: string; endsAt?: string } = {},
) {
  await page.goto("/admin/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Start").fill(startsAt);
  await page.getByLabel("End").fill(endsAt);
  await page.getByRole("button", { name: "Create party" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  return page.url().split("/admin/")[1];
}

// Adds teams to a party from the teams page.
export async function addTeams(page: Page, partyId: string, names: string[]) {
  await page.goto(`/admin/${partyId}/teams`);
  for (const name of names) {
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Add a team" }).click();
    await expect(
      page.getByRole("list", { name: "Teams" }).getByText(name),
    ).toBeVisible();
  }
}

// Runs a lifecycle step from the settings page ("Open the party", "Start
// now" or "End now"), confirming the dialog.
export async function lifecycle(page: Page, partyId: string, step: string) {
  await page.goto(`/admin/${partyId}/settings`);
  await page.getByRole("button", { name: step }).click();
  await page.getByRole("dialog").getByRole("button", { name: step }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

// Reads the join code from the share page.
export async function joinCode(page: Page, partyId: string) {
  await page.goto(`/admin/${partyId}/share`);
  return (await page.getByTestId("join-code").textContent())!;
}

// Joins a party as a player in a fresh phone-sized browser context.
export async function joinAsPlayer(
  browser: Browser,
  code: string,
  name: string,
) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByLabel("Party code").fill(code.toLowerCase());
  await page.getByRole("button", { name: "Join", exact: true }).click();
  await page.getByLabel("Your name").fill(name);
  await page.getByRole("button", { name: /^Join / }).click();
  await expect(page).toHaveURL(/\/p\/[0-9a-f-]+$/);
  return page;
}

type ChallengeOptions = {
  title: string;
  type?: "photo" | "text";
  points?: number;
  validation?: "auto" | "manual";
  expectedAnswer?: string;
};

export async function addChallenge(
  page: Page,
  partyId: string,
  { title, type = "photo", points = 10, validation = "manual", expectedAnswer }: ChallengeOptions,
) {
  await page.goto(`/admin/${partyId}/challenges/new`);
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Type").selectOption(type);
  await page.getByLabel("Points").fill(String(points));
  await page.getByLabel("Validation").selectOption(validation);
  if (expectedAnswer) {
    await page.getByLabel("Expected answer").fill(expectedAnswer);
  }
  await page.getByRole("button", { name: "Create challenge" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/${partyId}/challenges$`));
}

// An admin with a live party: teams, the given challenges, opened and
// started. Returns the party id and join code.
export async function setUpLiveParty(
  page: Page,
  challenges: ChallengeOptions[],
  teams = ["Foxes", "Owls"],
) {
  await loginAsAdmin(page);
  const partyId = await createParty(page, { name: "Live party" });
  await addTeams(page, partyId, teams);
  for (const challenge of challenges) await addChallenge(page, partyId, challenge);
  await lifecycle(page, partyId, "Open the party");
  await lifecycle(page, partyId, "Start now");
  return { partyId, code: await joinCode(page, partyId) };
}

// A small valid PNG, for photo uploads.
export const TEST_PHOTO = {
  name: "photo.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC",
    "base64",
  ),
};

// When a challenge's start was announced, read from the local database.
export async function startNotifiedAt(partyId: string, title: string) {
  const sql = postgres(
    "postgresql://postgres:postgres@127.0.0.1:55322/postgres",
    { max: 1 },
  );
  try {
    const [row] = await sql<{ start_notified_at: Date | null }[]>`
      select start_notified_at from challenges
      where party_id = ${partyId} and title = ${title}`;
    return row?.start_notified_at?.toISOString() ?? null;
  } finally {
    await sql.end();
  }
}
