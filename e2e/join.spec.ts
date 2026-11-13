import { expect, test } from "@playwright/test";
import {
  addTeams,
  createParty,
  joinAsPlayer,
  joinCode,
  lifecycle,
  loginAsAdmin,
} from "./helpers";

test("players join an open party and are spread over the teams", async ({
  browser,
  page,
}) => {
  await loginAsAdmin(page);
  const partyId = await createParty(page, {
    name: "Join party",
    startsAt: "2030-07-01T18:00",
  });
  await addTeams(page, partyId, ["Foxes", "Owls"]);
  const code = await joinCode(page, partyId);

  // A draft party can't be joined yet.
  const early = await browser.newPage();
  await early.goto(`/join/${code}`);
  await expect(early.getByText("This party isn't open yet.")).toBeVisible();

  await lifecycle(page, partyId, "Open the party");

  const ana = await joinAsPlayer(browser, code, "Ana");
  await expect(ana.getByText("Your team")).toBeVisible();
  await expect(ana.getByText("The party starts in")).toBeVisible();
  const anaTeam = (await ana.getByText(/^(Foxes|Owls)$/).first().textContent())!;

  // The second player goes to the other team.
  const bob = await joinAsPlayer(browser, code, "Bob");
  await expect(
    bob.getByText(anaTeam === "Foxes" ? "Owls" : "Foxes").first(),
  ).toBeVisible();

  // Players see who is in their team, kept up to date when players move.
  await expect(ana.getByText("No one else in this team yet.")).toBeVisible();
  await page.goto(`/admin/${partyId}`);
  await page.getByLabel("Team of Bob").selectOption({ label: anaTeam });
  const anaTeammates = ana.getByRole("list", { name: "Teammates" });
  await expect(anaTeammates.getByText("Ana (you)")).toBeVisible();
  await expect(anaTeammates.getByText("Bob")).toBeVisible();

  // Names are unique within the party, ignoring case.
  const other = await browser.newPage();
  await other.goto(`/join/${code}`);
  await other.getByLabel("Your name").fill("ana");
  await other.getByRole("button", { name: /^Join / }).click();
  await expect(other.getByText("Someone already has this name.")).toBeVisible();
  await expect(other.getByLabel("Your name")).toHaveValue("ana");

  // Coming back on the same device goes straight to the party.
  await ana.goto("/");
  await expect(ana).toHaveURL(new RegExp(`/p/${partyId}$`));

  // Starting the party updates the waiting screen without a reload.
  await lifecycle(page, partyId, "Start now");
  await expect(ana.getByText("My score")).toBeVisible();
  await expect(
    ana.getByRole("list", { name: "Teammates" }).getByText("Bob"),
  ).toBeVisible();

  // Players can't open the admin pages.
  await ana.goto(`/admin/${partyId}`);
  await expect(ana).toHaveURL(/\/admin\/login$/);
});

test("an unknown code shows an error", async ({ page }) => {
  await page.goto("/join/ZZZZZZ");
  await expect(page.getByText("No party has this code.")).toBeVisible();
});
