import { expect, test } from "@playwright/test";
import { joinAsPlayer, setUpLiveParty, TEST_PHOTO } from "./helpers";

test("a player answers text challenges and sends a photo", async ({
  browser,
  page,
}) => {
  const { code } = await setUpLiveParty(page, [
    {
      title: "Capital of France",
      type: "text",
      points: 5,
      validation: "auto",
      expectedAnswer: "Paris",
    },
    { title: "Team selfie", type: "photo", points: 20, validation: "manual" },
  ]);

  const player = await joinAsPlayer(browser, code, "Ana");
  await expect(player.getByTestId("player-score")).toHaveText("0");
  const todo = player.getByRole("list", { name: "To do" });
  await expect(todo.getByRole("listitem")).toHaveCount(2);

  // Wrong answer: rejected right away, the player can retry.
  await todo.getByText("Capital of France").click();
  await player.getByLabel("Your answer").fill("Lyon");
  await player.getByRole("button", { name: "Send" }).click();
  await expect(player.getByText("Wrong answer. Try again!")).toBeVisible();
  await expect(player.getByText("Rejected")).toBeVisible();
  await expect(player.getByText("You can try again.")).toBeVisible();

  await player.getByLabel("Your answer").fill("  paris ");
  await player.getByRole("button", { name: "Send" }).click();
  await expect(player.getByText("+5 pts")).toBeVisible();
  await expect(player.getByLabel("Your answer")).toHaveCount(0);

  // Photo: uploaded to storage, waiting for review.
  await player.getByRole("link", { name: "All challenges" }).click();
  await expect(player.getByTestId("player-score")).toHaveText("5");
  await expect(player.getByTestId("team-score")).toHaveText("5");
  await todo.getByText("Team selfie").click();
  await player.getByLabel("Your photo").setInputFiles(TEST_PHOTO);
  await expect(player.getByRole("img", { name: "Preview of your photo" })).toBeVisible();
  await player.getByLabel("Caption").fill("All of us");
  await player.getByRole("button", { name: "Send" }).click();
  await expect(player.getByText("Under review")).toBeVisible();
  const photo = player.getByRole("img", { name: "All of us" });
  await expect(photo).toBeVisible();
  await expect
    .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);

  await player.getByRole("link", { name: "All challenges" }).click();
  await expect(player.getByText("Nothing to do right now.")).toBeVisible();
  await player.getByRole("tab", { name: /Done/ }).click();
  const done = player.getByRole("list", { name: "Done" });
  await expect(done.getByRole("listitem")).toHaveCount(2);
  await expect(done.getByText("Under review")).toBeVisible();
  // Pending submissions don't count yet.
  await expect(player.getByTestId("player-score")).toHaveText("5");
});

test("hidden challenges are not shown to players", async ({
  browser,
  page,
}) => {
  const { partyId, code } = await setUpLiveParty(page, [
    { title: "Visible one" },
    { title: "Secret one" },
  ]);
  await page.goto(`/admin/${partyId}/challenges`);
  await page
    .getByRole("list", { name: "Challenges" })
    .getByRole("listitem")
    .filter({ hasText: "Secret one" })
    .getByRole("switch")
    .click();

  const player = await joinAsPlayer(browser, code, "Bob");
  const todo = player.getByRole("list", { name: "To do" });
  await expect(todo.getByText("Visible one")).toBeVisible();
  await expect(todo.getByText("Secret one")).toHaveCount(0);
});
