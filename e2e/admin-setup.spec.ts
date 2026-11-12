import { expect, test } from "@playwright/test";
import { createParty, loginAsAdmin, uniqueEmail } from "./helpers";

test("an admin sets up teams, challenges and opens the party", async ({
  page,
}) => {
  await loginAsAdmin(page);
  const partyId = await createParty(page, { name: "Setup party" });

  // Teams
  await page.goto(`/admin/${partyId}/teams`);
  await expect(page.getByText("No teams yet")).toBeVisible();
  for (const name of ["Foxes", "Owls"]) {
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Add a team" }).click();
    await expect(
      page.getByRole("list", { name: "Teams" }).getByText(name),
    ).toBeVisible();
  }
  // Each new team gets the next color of the palette.
  const badges = page.getByRole("list", { name: "Teams" }).locator("span[style]");
  const colors = await badges.evaluateAll((els) =>
    els.map((el) => (el as HTMLElement).style.backgroundColor),
  );
  expect(new Set(colors).size).toBe(2);

  await page.getByLabel("Name").fill("Foxes");
  await page.getByRole("button", { name: "Add a team" }).click();
  await expect(
    page.getByText("Another team already has this name."),
  ).toBeVisible();

  const teams = page.getByRole("list", { name: "Teams" }).getByRole("listitem");
  await teams.nth(1).getByRole("button", { name: "Move up" }).click();
  await expect(teams.first()).toContainText("Owls");

  await teams.first().getByRole("button", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("Night owls");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  await expect(teams.first()).toContainText("Night owls");

  // Challenges
  await page.goto(`/admin/${partyId}/challenges`);
  await page.getByRole("link", { name: "New challenge" }).click();
  await page.getByLabel("Title").fill("Capital of France");
  await page.getByLabel("Type").selectOption("text");
  await page.getByLabel("Points").fill("5");
  await page.getByLabel("Validation").selectOption("auto");
  await page.getByLabel("Expected answer").fill("Paris");
  await page.getByRole("button", { name: "Create challenge" }).click();
  await expect(page.getByText("Capital of France")).toBeVisible();
  await expect(page.getByText("5 points")).toBeVisible();

  await page.getByRole("link", { name: "New challenge" }).click();
  await page.getByLabel("Title").fill("Flash selfie");
  await page.getByLabel("Availability").selectOption("flash");
  await page.getByLabel("Start").fill("2030-07-01T20:00");
  await page.getByLabel("Duration (minutes)").fill("10");
  await page.getByRole("button", { name: "Create challenge" }).click();

  const flash = page
    .getByRole("list", { name: "Challenges" })
    .getByRole("listitem")
    .filter({ hasText: "Flash selfie" });
  await expect(flash.getByText("Flash: upcoming")).toBeVisible();
  await flash.getByRole("switch").click();
  await expect(flash.getByText("Hidden")).toBeVisible();
  await page.reload();
  await expect(flash.getByText("Hidden")).toBeVisible();

  await flash.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Points").fill("20");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(flash.getByText("20 points")).toBeVisible();

  // Lifecycle
  await page.goto(`/admin/${partyId}/settings`);
  await expect(page.getByText(/^Draft:/)).toBeVisible();
  await page.getByRole("button", { name: "Open the party" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Open the party" }).click();
  await expect(page.getByText(/^Open:/)).toBeVisible();
  await page.getByRole("button", { name: "Start now" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Start now" }).click();
  await expect(page.getByText(/^Live:/)).toBeVisible();
  await page.getByRole("button", { name: "End now" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "End now" }).click();
  await expect(page.getByText(/^Ended:/)).toBeVisible();
});

test("the owner invites a second admin by link", async ({ browser }) => {
  const owner = await browser.newPage();
  await loginAsAdmin(owner);
  const partyId = await createParty(owner, { name: "Shared party" });
  const inviteeEmail = uniqueEmail("invitee");

  await owner.goto(`/admin/${partyId}/settings`);
  await owner.getByLabel("Invite an admin by email").fill(inviteeEmail);
  await owner.getByRole("button", { name: "Invite", exact: true }).click();
  const pending = owner.getByRole("list", { name: "Pending invitations" });
  await expect(pending.getByText(inviteeEmail)).toBeVisible();

  // The link is shown through the copy button; read it from the clipboard.
  await owner.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await pending.getByRole("button", { name: "Copy link" }).click();
  const link = await owner.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("/invite/");

  // Someone signed in with another email can't accept it.
  const stranger = await browser.newPage();
  await loginAsAdmin(stranger);
  await stranger.goto(link);
  await expect(stranger.getByText(/sent to another email/)).toBeVisible();

  // The invitee signs in from the link and lands on the party.
  const invitee = await browser.newPage();
  await invitee.goto(link);
  await expect(invitee).toHaveURL(/\/admin\/login\?next=/);
  await loginAsAdmin(invitee, inviteeEmail, `/admin/${partyId}`);
  await expect(
    invitee.getByRole("heading", { name: "Shared party" }),
  ).toBeVisible();

  // An admin (not owner) can't invite or delete.
  await invitee.goto(`/admin/${partyId}/settings`);
  await expect(invitee.getByLabel("Invite an admin by email")).toHaveCount(0);
  await expect(
    invitee.getByRole("button", { name: "Delete party" }),
  ).toHaveCount(0);

  await owner.reload();
  await expect(
    owner.getByRole("list", { name: "Admins" }).getByText(inviteeEmail),
  ).toBeVisible();
  await expect(owner.getByText("Pending invitations")).toHaveCount(0);
});
