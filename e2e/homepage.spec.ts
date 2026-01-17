import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("page loads and shows CRT monitor", async ({ page }) => {
    await page.goto("/");

    // Check CRT monitor elements are present
    await expect(page.locator(".crt-monitor")).toBeVisible();
    await expect(page.locator(".crt-glass")).toBeVisible();
  });

  test("typing animation starts", async ({ page }) => {
    await page.goto("/");

    // Wait for typing to begin - first command should appear
    await expect(page.getByText("> initializing system...")).toBeVisible({
      timeout: 10000,
    });
  });

  test("typing animation completes and shows name", async ({ page }) => {
    await page.goto("/");

    // Wait for the title to appear (typed out)
    await expect(page.getByText("KIRIL KLEIN")).toBeVisible({
      timeout: 20000,
    });

    // Wait for subtitle
    await expect(page.getByText("ML Engineer & Data Scientist")).toBeVisible({
      timeout: 10000,
    });
  });

  test("loading bar appears after typing", async ({ page }) => {
    await page.goto("/");

    // Wait for loading phase
    await expect(page.getByText("visualizing neural network...")).toBeVisible({
      timeout: 25000,
    });

    // Check loading bar is present
    await expect(page.locator(".loading-bar-container")).toBeVisible();
  });

  test("neural network appears after loading", async ({ page }) => {
    await page.goto("/");

    // Wait for neural network to appear
    await expect(page.locator(".neural-network-container")).toBeVisible({
      timeout: 35000,
    });

    // Check the label appears
    await expect(
      page.getByText("neural_network.visualization active")
    ).toBeVisible();
  });

  test("full animation sequence completes", async ({ page }) => {
    await page.goto("/");

    // Phase 1: Typing
    await expect(page.getByText("> initializing system...")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("KIRIL KLEIN")).toBeVisible({
      timeout: 20000,
    });

    // Phase 2: Loading
    await expect(page.getByText("visualizing neural network...")).toBeVisible({
      timeout: 25000,
    });

    // Phase 3: Network
    await expect(page.locator(".neural-network-container")).toBeVisible({
      timeout: 35000,
    });
  });
});

test.describe("Navigation", () => {
  test("navigation links are visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "home" })).toBeVisible();
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
