import { expect, test } from "@playwright/test";
import {
  fillDateTime,
  joinAsPlayer,
  setUpLiveParty,
  startNotifiedAt,
} from "./helpers";

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
  await fillDateTime(page, "Start", "2030-07-01T20:00");
  await page.getByRole("button", { name: "10 min", exact: true }).click();
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
  await fillDateTime(page, "Start", nowLocal);
  await page.getByRole("button", { name: "15 min", exact: true }).click();
  await page.getByRole("button", { name: "Create challenge" }).click();
  await expect(challenges.getByText("Scheduled flash")).toBeVisible();

  await request.post(JOB_URL, { headers: AUTH });
  const scheduledAt = await startNotifiedAt(partyId, "Scheduled flash");
  expect(scheduledAt).not.toBeNull();
  await request.post(JOB_URL, { headers: AUTH });
  expect(await startNotifiedAt(partyId, "Scheduled flash")).toBe(scheduledAt);

  await expect(todo.getByText("Scheduled flash")).toBeVisible();
});

test("flash challenges are launched from the dashboard after a timer, at a time or now", async ({
  browser,
  page,
}) => {
  const { partyId, code } = await setUpLiveParty(page, []);
  await page.goto(`/admin/${partyId}/challenges/new`);
  // No start: it waits to be launched by hand.
  await page.getByLabel("Title").fill("Dashboard flash");
  await page.getByLabel("Availability").selectOption("flash");
  await page.getByRole("button", { name: "10 min", exact: true }).click();
  await page.getByRole("button", { name: "Create challenge" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/${partyId}/challenges$`));
  await expect(
    page.getByRole("list", { name: "Challenges" }).getByText("Flash: not scheduled"),
  ).toBeVisible();

  const player = await joinAsPlayer(browser, code, "Ana");
  await expect(player.getByText("Nothing to do right now.")).toBeVisible();
  await page.goto(`/admin/${partyId}`);
  const flashes = page.getByRole("list", { name: "Flash challenges" });
  const dialog = page.getByRole("dialog");
  await expect(flashes.getByText("not scheduled")).toBeVisible();

  // After a timer.
  await flashes.getByRole("button", { name: "Launch" }).click();
  await dialog.getByLabel("Start", { exact: true }).selectOption("in");
  await dialog.getByLabel("Minutes from now").fill("5");
  await dialog.getByRole("button", { name: "Start timer" }).click();
  await expect(page.getByText("Flash challenge scheduled")).toBeVisible();
  await expect(flashes.getByText(/starts in (04:5\d|05:00)/)).toBeVisible();

  // At a set time, which can't be in the past.
  const localIn = (minutes: number) =>
    page.evaluate((m) => {
      const d = new Date(Date.now() + m * 60_000);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }, minutes);
  await flashes.getByRole("button", { name: "Launch" }).click();
  await dialog.getByLabel("Start", { exact: true }).selectOption("at");
  await fillDateTime(dialog, "Start time", await localIn(-10));
  await dialog.getByRole("button", { name: "Schedule" }).click();
  await expect(dialog.getByText("This time has already passed.")).toBeVisible();
  await fillDateTime(dialog, "Start time", await localIn(120));
  await dialog.getByRole("button", { name: "Schedule" }).click();
  await expect(page.getByText("Flash challenge scheduled")).toBeVisible();
  await expect(flashes.getByText(/starts in 1:(59|58):\d\d/)).toBeVisible();
  await expect(player.getByText("Nothing to do right now.")).toBeVisible();

  // Now: the player is told right away.
  await flashes.getByRole("button", { name: "Launch" }).click();
  await dialog.getByRole("button", { name: "Launch now" }).click();
  await expect(flashes.getByText(/ends in (09:5\d|10:00)/)).toBeVisible();
  await expect(flashes.getByRole("button", { name: "Launch" })).toHaveCount(0);
  await expect(player.getByText("A flash challenge just started!")).toBeVisible();
  await expect(
    player.getByRole("list", { name: "To do" }).getByText("Dashboard flash"),
  ).toBeVisible();
});
