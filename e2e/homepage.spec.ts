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

  test("CRT monitor activates on scroll", async ({ page }) => {
    await page.goto("/");

    // Scroll into the lab section to trigger activation
    await page.evaluate(() => {
      const lab = document.getElementById("lab");
      if (lab) lab.scrollIntoView({ behavior: "instant" });
    });

    // Wait for scroll progress to trigger isPowered
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(500);

    // Neural network should appear after activation
    await expect(page.locator(".neural-network-container")).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe("Navigation", () => {
  test("navigation links are visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "lab", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "about" })).toBeVisible();
    await expect(page.getByRole("link", { name: "projects" })).toBeVisible();
    await expect(page.getByRole("link", { name: "contact" })).toBeVisible();
  });

  test("navigation to about section works", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "about" }).click();

    // URL should have #about
    await expect(page).toHaveURL("/#about");
  });
});
