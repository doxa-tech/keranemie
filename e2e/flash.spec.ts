import { expect, test } from "@playwright/test";
import { joinAsPlayer, setUpLiveParty, startNotifiedAt } from "./helpers";

const JOB_URL = "/api/jobs/flash-notifications";
const AUTH = { Authorization: "Bearer local-dev-cron-secret" };

test("the scheduled job endpoint requires the secret", async ({ request }) => {
  expect((await request.post(JOB_URL)).status()).toBe(401);
  expect(
    (await request.post(JOB_URL, { headers: { Authorization: "Bearer nope" } }))
      .status(),
  ).toBe(401);
  const ok = await request.post(JOB_URL, { headers: AUTH });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toHaveProperty("announced");
});

test("flash challenges are announced once, when launched or scheduled", async ({
  browser,
  page,
  request,
}) => {
  const { partyId, code } = await setUpLiveParty(page, []);

  // A flash challenge scheduled far later, then launched by hand.
  await page.goto(`/admin/${partyId}/challenges/new`);
  await page.getByLabel("Title").fill("Launched flash");
  await page.getByLabel("Availability").selectOption("flash");
  await page.getByLabel("Start").fill("2030-07-01T20:00");
  await page.getByLabel("Duration (minutes)").fill("10");
  await page.getByRole("button", { name: "Create challenge" }).click();

  const player = await joinAsPlayer(browser, code, "Ana");
  await expect(player.getByText("Nothing to do right now.")).toBeVisible();

  const challenges = page.getByRole("list", { name: "Challenges" });
  await challenges.getByRole("button", { name: "Launch now" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Launch now" }).click();
  await expect(challenges.getByText("Flash: running")).toBeVisible();

  await expect(player.getByText("A flash challenge just started!")).toBeVisible();
  const todo = player.getByRole("list", { name: "To do" });
  await expect(todo.getByText("Launched flash")).toBeVisible();
  await expect(todo.getByText(/Flash · ends in/)).toBeVisible();

  // Already announced: the job doesn't announce it again. (The job covers
  // every party, so check this challenge rather than the job's count.)
  const launchedAt = await startNotifiedAt(partyId, "Launched flash");
  expect(launchedAt).not.toBeNull();
  await request.post(JOB_URL, { headers: AUTH });
  expect(await startNotifiedAt(partyId, "Launched flash")).toBe(launchedAt);

  // A flash challenge scheduled to start now is picked up by the job
  // (or by the database scheduler, if it runs first).
  const nowLocal = await page.evaluate(() => {
    const d = new Date(Date.now() - 60_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  await page.getByRole("link", { name: "New challenge" }).click();
  await page.getByLabel("Title").fill("Scheduled flash");
  await page.getByLabel("Availability").selectOption("flash");
  await page.getByLabel("Start").fill(nowLocal);
  await page.getByLabel("Duration (minutes)").fill("15");
  await page.getByRole("button", { name: "Create challenge" }).click();
  await expect(challenges.getByText("Scheduled flash")).toBeVisible();

  await request.post(JOB_URL, { headers: AUTH });
  const scheduledAt = await startNotifiedAt(partyId, "Scheduled flash");
  expect(scheduledAt).not.toBeNull();
  await request.post(JOB_URL, { headers: AUTH });
  expect(await startNotifiedAt(partyId, "Scheduled flash")).toBe(scheduledAt);

  await expect(todo.getByText("Scheduled flash")).toBeVisible();
});
