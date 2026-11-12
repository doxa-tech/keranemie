import { expect, test } from "@playwright/test";
import { joinAsPlayer, setUpLiveParty, TEST_PHOTO } from "./helpers";

test("admins review submissions, give bonuses and move players", async ({
  browser,
  page,
}) => {
  const { partyId, code } = await setUpLiveParty(
    page,
    [
      { title: "Team selfie", type: "photo", points: 20 },
      { title: "Best joke", type: "text", points: 10 },
    ],
    ["Foxes"],
  );

  const ana = await joinAsPlayer(browser, code, "Ana");
  await ana.getByText("Team selfie").click();
  await ana.getByLabel("Your photo").setInputFiles(TEST_PHOTO);
  await ana.getByRole("button", { name: "Send" }).click();
  await expect(ana.getByText("Under review")).toBeVisible();
  await ana.getByRole("link", { name: "All challenges" }).click();
  await ana.getByText("Best joke").click();
  await ana.getByLabel("Your answer").fill("Why did the chicken…");
  await ana.getByRole("button", { name: "Send" }).click();
  await expect(ana.getByText("Under review")).toBeVisible();

  // Dashboard
  await page.goto(`/admin/${partyId}`);
  await expect(page.getByTestId("pending-count")).toHaveText("2");
  const activity = page.getByRole("list", { name: "Latest activity" });
  await expect(activity.getByRole("listitem")).toHaveCount(2);

  // Approve the photo with a bonus, reject the joke.
  await page.getByRole("link", { name: "Review", exact: true }).click();
  const queue = page.getByRole("list", { name: "Submissions to review" });
  const selfie = queue.getByRole("listitem").filter({ hasText: "Team selfie" });
  await expect(selfie.getByRole("img")).toBeVisible();
  await selfie.getByLabel("Points").fill("25");
  await selfie.getByRole("button", { name: "Approve" }).click();
  await expect(selfie).toHaveCount(0);

  const joke = queue.getByRole("listitem").filter({ hasText: "Best joke" });
  await joke.getByRole("button", { name: "Reject" }).click();
  await joke.getByLabel("Message to the player").fill("Not funny enough");
  await joke.getByRole("button", { name: "Reject" }).click();
  await expect(page.getByText("All caught up.")).toBeVisible();

  const recent = page.getByRole("list", { name: "Recently reviewed" });
  await expect(recent.getByText("+25 pts")).toBeVisible();
  await expect(recent.getByText("Rejected")).toBeVisible();

  // The player sees the result and can try the rejected one again.
  await ana.goto(`/p/${partyId}`);
  await expect(ana.getByTestId("player-score")).toHaveText("25");
  await expect(ana.getByText("Not funny enough")).toBeVisible();
  await ana.getByText("Best joke").click();
  await ana.getByLabel("Your answer").fill("A better one");
  await ana.getByRole("button", { name: "Send" }).click();
  await expect(ana.getByText("Under review")).toBeVisible();

  // Edit the points of an approved submission.
  await page.reload();
  await recent.getByLabel("Points").fill("30");
  await recent.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Points updated")).toBeVisible();

  // Bonus points to the team.
  await page.goto(`/admin/${partyId}`);
  await page.getByRole("button", { name: "Bonus points" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("For").selectOption({ label: "Foxes" });
  await dialog.getByLabel("Points").fill("5");
  await dialog.getByLabel("Reason").fill("Best costumes");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();

  const teams = page.getByRole("list", { name: "Teams" });
  await expect(teams.getByRole("listitem").first()).toContainText("35");
  await ana.goto(`/p/${partyId}`);
  await expect(ana.getByTestId("player-score")).toHaveText("30");
  await expect(ana.getByTestId("team-score")).toHaveText("35");

  // Gallery
  await page.getByRole("link", { name: "Gallery" }).click();
  await expect(
    page.getByRole("list", { name: "Photos" }).getByRole("listitem"),
  ).toHaveCount(1);
});

test("a moved player keeps their points", async ({ browser, page }) => {
  const { partyId, code } = await setUpLiveParty(
    page,
    [{ title: "Quick one", type: "text", points: 7, validation: "auto" }],
    ["Foxes", "Owls"],
  );
  const ana = await joinAsPlayer(browser, code, "Ana");
  await ana.getByText("Quick one").click();
  await ana.getByLabel("Your answer").fill("Done");
  await ana.getByRole("button", { name: "Send" }).click();
  await expect(ana.getByText("+7 pts")).toBeVisible();

  await page.goto(`/admin/${partyId}`);
  const select = page.getByLabel("Team of Ana");
  const current = await select.inputValue();
  const other = await select
    .locator("option")
    .evaluateAll(
      (options, value) =>
        options.map((o) => (o as HTMLOptionElement).value).find((v) => v !== value)!,
      current,
    );
  await select.selectOption(other);

  const teams = page.getByRole("list", { name: "Teams" });
  await expect(teams.getByRole("listitem").first()).toContainText("7");
  await expect(teams.getByRole("listitem").nth(1)).toContainText("0");
  await expect(select).toHaveValue(other);

  await ana.goto(`/p/${partyId}`);
  await expect(ana.getByTestId("player-score")).toHaveText("7");
});
