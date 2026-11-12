import { expect, type Browser, type Page } from "@playwright/test";

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

// Reads the join code from the party overview.
export async function joinCode(page: Page, partyId: string) {
  await page.goto(`/admin/${partyId}`);
  return (await page
    .locator("dt", { hasText: "Join code" })
    .locator("+ dd")
    .textContent())!;
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
