import { expect, test } from "@playwright/test";
import { joinAsPlayer, setUpLiveParty } from "./helpers";

test("players see reviews, rankings and the feed update live", async ({
  browser,
  page,
}) => {
  const { partyId, code } = await setUpLiveParty(
    page,
    [{ title: "Best joke", type: "text", points: 10 }],
    ["Foxes", "Owls"],
  );
  const ana = await joinAsPlayer(browser, code, "Ana");
  const bob = await joinAsPlayer(browser, code, "Bob");

  await ana.getByText("Best joke").click();
  await ana.getByLabel("Your answer").fill("Knock knock");
  await ana.getByRole("button", { name: "Send" }).click();
  await expect(ana.getByText("Under review")).toBeVisible();
  await ana.getByRole("link", { name: "All challenges" }).click();
  await expect(ana.getByTestId("player-score")).toHaveText("0");

  // Bob watches the ranking and the feed.
  await bob.getByRole("link", { name: "Feed" }).click();
  await expect(bob.getByText("Approved submissions will appear here.")).toBeVisible();

  // The admin's dashboard counts the new submission without a reload.
  await page.goto(`/admin/${partyId}`);
  await expect(page.getByTestId("pending-count")).toHaveText("1");

  await page.getByRole("link", { name: "Review", exact: true }).click();
  await page.getByRole("button", { name: "Approve" }).click();

  // Ana is told and her score updates without a reload.
  await expect(ana.getByText("Your submission was approved!")).toBeVisible();
  await expect(ana.getByTestId("player-score")).toHaveText("10");
  // Bob's feed shows the approved answer, also without a reload.
  await expect(bob.getByText("Knock knock")).toBeVisible();
  await bob.getByRole("link", { name: "Ranking" }).click();
  const players = bob.getByRole("list", { name: "Players" });
  await expect(players.getByRole("listitem").first()).toContainText("Ana");
  await expect(players.getByRole("listitem").first()).toContainText("10");
  await expect(
    players.getByRole("listitem").filter({ hasText: "Bob" }),
  ).toHaveAttribute("aria-current", "true");
});
