import { expect, test } from "@playwright/test";

test("follows the device language", async ({ browser }) => {
  const fr = await browser.newContext({ locale: "fr-FR" });
  const page = await fr.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(
    page.getByText("Des défis pour votre événement."),
  ).toBeVisible();
  await fr.close();
});

test("defaults to English", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Challenges for your event.")).toBeVisible();
});
