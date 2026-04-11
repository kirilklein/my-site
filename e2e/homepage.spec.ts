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

    // The lab section is 260vh tall. isPowered triggers at progress > 0.33.
    // We need to scroll well past the top of the section.
    await page.evaluate(() => {
      const lab = document.getElementById("lab");
      if (!lab) return;
      const labTop = lab.getBoundingClientRect().top + window.scrollY;
      // Scroll to ~40% through the section to ensure isPowered triggers
      const scrollTarget = labTop + window.innerHeight * 1.2;
      window.scrollTo({ top: scrollTarget, behavior: "instant" });
    });

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
