import { expect, test } from "@playwright/test";
import {
  addChallenge,
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

test("a party is started and ended by hand", async ({ browser, page }) => {
  await loginAsAdmin(page);
  const partyId = await createParty(page, {
    name: "Manual party",
    startsAt: "",
    duration: "Until ended",
  });
  await addTeams(page, partyId, ["Foxes"]);
  await addChallenge(page, partyId, { title: "Group selfie" });
  await lifecycle(page, partyId, "Open the party");
  const code = await joinCode(page, partyId);

  const ana = await joinAsPlayer(browser, code, "Ana");
  await expect(ana.getByText("The party starts soon!")).toBeVisible();

  // Started from the dashboard; the player's screen follows live.
  await page.goto(`/admin/${partyId}`);
  await expect(page.getByText("Waiting for “Start now”")).toBeVisible();
  await page.getByRole("button", { name: "Start now" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Start now" }).click();
  await expect(page.getByText("Runs until you end it")).toBeVisible();
  const todo = ana.getByRole("list", { name: "To do" });
  await expect(todo.getByText("Group selfie")).toBeVisible();
  await expect(ana.getByText(/^Ends in/)).toHaveCount(0);

  await page.getByRole("button", { name: "End now" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "End now" }).click();
  await expect(ana.getByText("The party is over. Thanks for playing!")).toBeVisible();
});

test("an unknown code shows an error", async ({ page }) => {
  await page.goto("/join/ZZZZZZ");
  await expect(page.getByText("No party has this code.")).toBeVisible();
});
