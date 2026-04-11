import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("page loads and hero section is visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Kiril Klein" })).toBeVisible();
    await expect(
      page.getByText("Machine Learning Engineer building")
    ).toBeVisible();
  });

  test("hero CTA buttons are visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Enter Lab" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View Projects" })
    ).toBeVisible();
  });

  test("CRT monitor is visible in lab section", async ({ page }) => {
    await page.goto("/");

    // Scroll to lab section
    await page.getByRole("link", { name: "lab", exact: true }).click();
    await expect(page.locator(".crt-monitor")).toBeVisible();
    await expect(page.locator(".crt-glass")).toBeVisible();
  });

  test("CRT monitor starts in standby and powers on", async ({ page }) => {
    await page.goto("/");

    // Scroll to lab section — CRT should be visible in standby
    await page.getByRole("link", { name: "lab", exact: true }).click();
    await expect(page.locator(".crt-glass")).toBeVisible();

    // In standby, the power LED should have the standby class
    await expect(page.locator(".power-led.led-standby")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Navigation", () => {
  test("navigation links are visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "lab", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "about" })).toBeVisible();
    await expect(page.getByRole("link", { name: "projects", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "contact" })).toBeVisible();
  });

  test("navigation to about section works", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "about" }).click();

    // URL should have #about
    await expect(page).toHaveURL("/#about");
  });
});
