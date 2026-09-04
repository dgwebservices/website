import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const coreRoutes = ["/", "/diensten", "/diensten/websites", "/diensten/webapplicaties", "/diensten/portalen", "/diensten/backoffice", "/diensten/koppelingen", "/diensten/slimme-flows", "/diensten/schermcommunicatie", "/diensten/beheer-en-groei", "/mogelijkheden", "/werkwijze", "/over", "/contact", "/brand", "/bedankt", "/bestaat-niet"];

test("core routes render without horizontal overflow or browser errors", async ({ browser }) => {
  const browserErrors: string[] = [];
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: width < 850 ? 844 : 1000 } });
    const routes = [390, 1440].includes(width) ? coreRoutes : ["/", "/diensten", "/diensten/webapplicaties", "/contact"];
    for (const route of routes) {
      const page = await context.newPage();
      page.on("pageerror", (error) => browserErrors.push(`${width} ${route}: ${error.message}`));
      const response = await page.goto(route, { waitUntil: "load" });
      expect(response?.status(), route).toBe(route === "/bestaat-niet" ? 404 : 200);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
      await expect(page.locator("h1")).toHaveCount(1);
      await page.close();
    }
    await context.close();
  }
  expect(browserErrors).toEqual([]);
});

test("mobile navigation traps focus, closes with Escape and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Menu openen" });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(page.getByRole("dialog", { name: "Mobiele navigatie" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sluiten", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Mobiele navigatie" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("project starter carries only allowed choices into editable contact fields", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Webapplicatie", exact: true }).click();
  await expect(page.getByRole("button", { name: "Webapplicatie", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Minder handmatig werk" }).click();
  await expect(page.getByRole("button", { name: "Minder handmatig werk" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: /Vertel wat je wilt verbeteren/ }).click();
  await expect(page).toHaveURL(/\/contact\?project=webapplicatie&goal=minder-handwerk$/);
  await expect(page.locator("#projectType")).toHaveValue("webapplicatie");
  await expect(page.locator("#primaryGoal")).toHaveValue("minder-handwerk");
});

test("contact validation preserves input and focuses the error summary", async ({ page }) => {
  await page.goto("/contact");
  await page.locator("#name").fill("Test Persoon");
  await page.locator("#email").fill("test@example.com");
  await page.locator("#message").fill("te kort");
  await page.getByRole("checkbox").check();
  await page.waitForTimeout(2100);
  await page.getByRole("button", { name: "Verstuur je aanvraag" }).click();
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(page.getByRole("alert")).toContainText("Controleer de gemarkeerde velden");
  await expect(page.locator("#name")).toHaveValue("Test Persoon");
});

test("representative templates have no serious automated accessibility violations", async ({ page }) => {
  for (const route of ["/", "/diensten", "/diensten/webapplicaties", "/mogelijkheden", "/werkwijze", "/over", "/contact", "/brand", "/bestaat-niet"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? "")), route).toEqual([]);
  }
});

test("core content and navigation remain available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Digitaal gemaakt");
  await expect(page.getByRole("link", { name: /Bekijk de diensten/ }).first()).toBeVisible();
  await page.getByRole("link", { name: /Websites die richting geven/ }).click();
  await expect(page).toHaveURL(/\/diensten\/websites$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Een website die helder werkt");
  await context.close();
});

test("visual regression evidence for representative templates", async ({ browser }) => {
  test.setTimeout(180_000);
  const routes = [
    ["home", "/"], ["diensten", "/diensten"], ["dienst-licht", "/diensten/websites"], ["dienst-rijk", "/diensten/schermcommunicatie"],
    ["mogelijkheden", "/mogelijkheden"], ["werkwijze", "/werkwijze"], ["contact", "/contact"], ["brand", "/brand"], ["404", "/bestaat-niet"],
  ] as const;
  for (const width of [390, 768, 1024, 1440, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: width < 900 ? 844 : 1000 } });
    for (const [name, route] of routes) {
      const page = await context.newPage();
      await page.goto(route, { waitUntil: "networkidle" });
      await page.screenshot({ path: `outputs/visual/${name}-${width}.png`, fullPage: width === 1440 });
      await page.close();
    }
    await context.close();
  }
});
