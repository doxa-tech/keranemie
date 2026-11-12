import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

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
  await expect(page.getByText("Draft")).toBeVisible();
  const code = await page
    .locator("dt", { hasText: "Join code" })
    .locator("+ dd")
    .textContent();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);

  await page.getByRole("link", { name: "Share" }).click();
  await expect(page.getByTestId("join-code")).toHaveText(code!);
  await expect(page.getByText(`/join/${code}`)).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR code to join the party" }).locator("svg"),
  ).toBeVisible();

  await page.getByRole("link", { name: "Keranemie" }).click();
  await expect(page.getByRole("link", { name: /Summer party/ })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
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
