import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const moduleName = process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
  : "playwright";
const { chromium } = await import(moduleName);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE }
    : {}),
});
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const results = [];
await mkdir("output/playwright", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1050 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Try compatible conditions" })
    .waitFor();
  await page.waitForFunction(
    () => !document.querySelector("button.primary").disabled,
  );
  assert.equal(await page.locator(".guide-choice").count(), 3);
  assert.ok((await page.locator(".findings li").count()) > 0);
  await page.screenshot({
    path: "output/playwright/desktop-initial.png",
    fullPage: true,
  });
  for (let i = 0; i < 3; i++) {
    await page.locator(".guide-choice").nth(i).click();
    await page
      .getByRole("button", { name: "Try compatible conditions" })
      .click();
    assert.equal(await page.locator(".findings li").count(), 0);
    assert.equal(await page.locator(".passed").count(), 3);
    await page.locator(".skip input").first().uncheck();
    assert.ok((await page.locator(".findings").count()) > 0);
    assert.ok(
      (await page.locator(".findings").allTextContents())
        .join(" ")
        .includes("skipped"),
    );
    await page.locator(".skip input").first().check();
    assert.equal(await page.locator(".findings li").count(), 0);
    await page.getByRole("button", { name: "Reset experiment" }).click();
    assert.ok((await page.locator(".findings li").count()) > 0);
  }
  results.push(
    "All three guides: repair to zero findings, skipped upstream dependency, re-enable and reset",
  );
  await page.locator(".guide-choice").first().click();
  await page.getByRole("button", { name: "Try compatible conditions" }).click();
  await page.locator(".skip input").nth(1).uncheck();
  const before = await page.locator(".findings li").count();
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(
    () => !document.querySelector("button.primary").disabled,
  );
  assert.equal(await page.locator(".findings li").count(), before);
  assert.equal(await page.locator(".skip input").nth(1).isChecked(), false);
  await page.locator(".guide-choice").nth(1).click();
  assert.ok((await page.locator(".findings li").count()) > 0);
  await page.locator(".guide-choice").first().click();
  assert.equal(await page.locator(".skip input").nth(1).isChecked(), false);
  results.push(
    "Interrupted/reloaded experiment restored; guide-local state stays isolated",
  );
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("runbook-repair:"))
        localStorage.setItem(key, "broken json");
    }
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(
    () => !document.querySelector("button.primary").disabled,
  );
  assert.ok((await page.locator(".findings li").count()) > 0);
  assert.equal(await page.locator(".skip input").nth(1).isChecked(), true);
  results.push("Corrupt browser storage resets safely");
  await page.getByRole("button", { name: "Try compatible conditions" }).click();
  await page.screenshot({
    path: "output/playwright/desktop-repaired.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Reset experiment" }).click();
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `No horizontal overflow at ${width}px`,
    );
    await page
      .getByRole("button", { name: "Try compatible conditions" })
      .click();
    assert.equal(await page.locator(".findings li").count(), 0);
    await page.getByRole("button", { name: "Reset experiment" }).click();
    if (width === 390)
      await page.screenshot({
        path: "output/playwright/mobile.png",
        fullPage: true,
      });
  }
  results.push(
    "Desktop 1400px, mobile 390/320px and tablet 768px: no overflow, repair and reset",
  );
  assert.deepEqual(errors, []);
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "getItem", {
      value() {
        throw new Error("blocked storage");
      },
    });
    Object.defineProperty(Storage.prototype, "setItem", {
      value() {
        throw new Error("blocked storage");
      },
    });
  });
  const blockedPage = await blocked.newPage();
  await blockedPage.goto(base, { waitUntil: "networkidle" });
  await blockedPage
    .getByRole("button", { name: "Try compatible conditions" })
    .click();
  assert.equal(await blockedPage.locator(".findings li").count(), 0);
  assert.ok(
    (await blockedPage.locator(".local-note").textContent()).includes(
      "unavailable",
    ),
  );
  await blocked.close();
  results.push(
    "Storage-denied flow remains usable and explains refresh limitation",
  );
  await context.close();
  if (process.env.TEST_FAILURE_URL) {
    const failurePage = await browser.newPage();
    await failurePage.goto(process.env.TEST_FAILURE_URL, {
      waitUntil: "networkidle",
    });
    assert.equal(
      await failurePage
        .getByRole("heading", { name: "The guide library is unavailable" })
        .count(),
      1,
    );
    assert.equal(await failurePage.locator(".guide-choice").count(), 0);
    await failurePage.screenshot({
      path: "output/playwright/service-error.png",
      fullPage: true,
    });
    await failurePage.close();
    results.push(
      "Backend failure shows truthful unavailable state, without synthetic fallback",
    );
  }
  const report = {
    mode: process.env.TEST_MODE ?? "live-public-backend",
    base,
    passed: results,
    consoleErrors: errors,
  };
  await writeFile(
    "output/playwright/results.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
