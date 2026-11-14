import { expect, test } from "@playwright/test";
import {
  ADMIN_PASSWORD,
  loginAsAdmin,
  magicLinkFor,
  uniqueEmail,
} from "./helpers";

test("an admin signs in, creates a party and shares it", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);

  await loginAsAdmin(page);
  await expect(page.getByText("No parties yet")).toBeVisible();

  await page.getByRole("link", { name: "New party" }).click();
  await page.getByLabel("Name").fill("Summer party");
  await page.getByLabel("Description").fill("Bring a phone.");
  await page.getByLabel("Start").fill("2030-07-01T18:00");
  await page.getByLabel("End").fill("2030-07-01T17:00");
  await page.getByRole("button", { name: "Create party" }).click();
  await expect(page.getByText("The end must be after the start.")).toBeVisible();

  await page.getByLabel("End").fill("2030-07-01T23:00");
  await page.getByRole("button", { name: "Create party" }).click();
  await expect(
    page.getByRole("heading", { name: "Summer party" }),
  ).toBeVisible();
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Share" }).click();
  const code = await page.getByTestId("join-code").textContent();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  await expect(page.getByText(`/join/${code}`)).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR code to join the party" }).locator("svg"),
  ).toBeVisible();

  await page.getByRole("link", { name: "Keranemie" }).click();
  await expect(page.getByRole("link", { name: /Summer party/ })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("a new admin account needs the admin password", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  const password = page.getByLabel("Admin password");
  await expect(password).toBeVisible();

  await password.fill("not the password");
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByText("Wrong password.")).toBeVisible();
  await expect(page.getByText("Check your email")).toHaveCount(0);

  await page.getByLabel("Admin password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();

  // Once created, the account signs in with the email only. (Retried:
  // Supabase sends at most one email per address per second.)
  await expect(async () => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send me a link" }).click();
    await expect(page.getByText("Check your email")).toBeVisible({
      timeout: 2000,
    });
  }).toPass();
  await expect(page.getByLabel("Admin password")).toHaveCount(0);
});

test("the sign-in link works in another browser", async ({ browser, page }) => {
  // Asked on one device (e.g. a laptop), opened on another (a phone).
  const email = await loginAsAdmin(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();

  const phone = await browser.newPage();
  await expect
    .poll(async () => {
      const link = await magicLinkFor(email);
      await phone.goto(link);
      return new URL(phone.url()).pathname;
    })
    .toBe("/admin");
});

test("an admin can't open another admin's party", async ({ browser }) => {
  const owner = await browser.newPage();
  await loginAsAdmin(owner);
  await owner.getByRole("link", { name: "New party" }).click();
  await owner.getByLabel("Name").fill("Private party");
  await owner.getByLabel("Start").fill("2030-07-01T18:00");
  await owner.getByLabel("End").fill("2030-07-01T23:00");
  await owner.getByRole("button", { name: "Create party" }).click();
  await expect(owner.getByRole("heading", { name: "Private party" })).toBeVisible();
  const partyUrl = owner.url();

  const other = await browser.newPage();
  await loginAsAdmin(other);
  await other.goto(partyUrl);
  await expect(other).toHaveURL(/\/admin$/);
});
