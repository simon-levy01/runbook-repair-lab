import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
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
const artifactDirectory = join(
  "output/playwright",
  ["localhost", "127.0.0.1"].includes(new URL(base).hostname)
    ? "local"
    : "hosted",
);
const results = [];
const negativeControls = [];
await mkdir(artifactDirectory, { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1050 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) =>
    errors.push({ context: "main", message: error.message }),
  );
  await page.goto(base, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Try compatible conditions" })
    .waitFor();
  await page.waitForFunction(
    () => !document.querySelector("button.primary").disabled,
  );
  assert.equal(await page.locator(".guide-choice").count(), 3);
  const approvedAction = page.getByRole("button", {
    name: "Try owner-approved repair",
    exact: true,
  });
  async function assertApprovedAction(title, expectedCount) {
    await page.locator(".guide-choice").filter({ hasText: title }).click();
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    const count = await approvedAction.count();
    assert.equal(count, expectedCount, `${title}: owner-approved action count`);
    return count;
  }
  await assertApprovedAction("Build a paper town", 1);
  await approvedAction.click();
  assert.equal(await page.locator(".passed").count(), 3);
  assert.equal(await page.locator(".findings li").count(), 0);
  await page
    .getByRole("button", { name: "Reset experiment", exact: true })
    .click();
  assert.ok((await page.locator(".findings li").count()) > 0);
  results.push(
    "Required paper-town owner-approved action: three passing steps, zero findings, reset restores findings",
  );

  // Read the public audit state; absence of an action alone does not prove rejection.
  const auditQuery =
    '*[_type == "repairProposal" && !(_id in path("drafts.**"))]{status,"guideId":guide._ref}';
  const auditResponse = await fetch(
    `https://ipp6nys2.api.sanity.io/v2026-09-01/data/query/production?query=${encodeURIComponent(auditQuery)}`,
    { signal: AbortSignal.timeout(8000) },
  );
  assert.equal(auditResponse.status, 200);
  const publishedProposals = (await auditResponse.json()).result;
  assert.ok(Array.isArray(publishedProposals));
  const guideStates = [
    {
      title: "Build a paper town",
      id: "cpzPQInBrCoN3lSGL6JQrG",
      states: ["approved"],
      actions: 1,
    },
    {
      title: "Light a lantern garden",
      id: "gu4Ycht4w1LZ0sMorlizai",
      states: ["rejected"],
      actions: 0,
    },
    {
      title: "Stitch a pocket atlas",
      id: "cpzPQInBrCoN3lSGL6JRAg",
      states: [],
      actions: 0,
    },
  ];
  const observedGuideStates = [];
  for (const guide of guideStates) {
    const states = publishedProposals
      .filter((proposal) => proposal.guideId === guide.id)
      .map((proposal) => proposal.status)
      .sort();
    assert.deepEqual(
      states,
      guide.states,
      `${guide.title}: actual public proposal states`,
    );
    const actions = await assertApprovedAction(guide.title, guide.actions);
    observedGuideStates.push({
      title: guide.title,
      id: guide.id,
      states,
      actions,
    });
    if (guide.actions === 0) {
      assert.equal(
        await page
          .getByText("No current owner-approved repair in this snapshot.", {
            exact: true,
          })
          .count(),
        1,
      );
    }
  }
  results.push(
    "Public audit confirms rejected lantern and no atlas proposal; neither guide exposes an approved action",
  );

  // Exercise the same live-page assertion with deliberately wrong expectations.
  // Only the expected strict count mismatch qualifies; timeouts/other errors fail this suite.
  for (const guide of guideStates) {
    const wrongCount = guide.actions === 1 ? 0 : 1;
    await assert.rejects(
      () => assertApprovedAction(guide.title, wrongCount),
      (error) =>
        error instanceof assert.AssertionError &&
        error.operator === "strictEqual" &&
        error.actual === guide.actions &&
        error.expected === wrongCount,
      `${guide.title}: wrong approval expectation must fail`,
    );
    negativeControls.push({
      guide: guide.title,
      wrongExpectedActionCount: wrongCount,
      actualActionCount: guide.actions,
      result: "strict assertion rejected",
    });
  }
  await assertApprovedAction("Build a paper town", 1);
  assert.ok((await page.locator(".findings li").count()) > 0);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "No horizontal overflow at 1400px",
  );
  await page.screenshot({
    path: join(artifactDirectory, "desktop-initial.png"),
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
    path: join(artifactDirectory, "desktop-repaired.png"),
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
        path: join(artifactDirectory, "mobile.png"),
        fullPage: true,
      });
  }
  results.push(
    "Desktop 1400px, mobile 390/320px and tablet 768px: no overflow, repair and reset",
  );
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
  blockedPage.on("pageerror", (error) =>
    errors.push({ context: "storage-denied", message: error.message }),
  );
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
  const sanityDocumentIds = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith("runbook-repair:v1:"))
      .map((key) => key.slice("runbook-repair:v1:".length)),
  );
  assert.equal(sanityDocumentIds.length, 3);
  assert.ok(
    sanityDocumentIds.every((id) => /^[A-Za-z0-9]{20,}$/.test(id)),
    "Expected actual Sanity document IDs, not fixture aliases",
  );
  await context.close();
  assert.deepEqual(errors, [], "No page errors in either browser context");
  const report = {
    mode: process.env.TEST_MODE ?? "live-public-backend",
    base,
    sanityDocumentIds,
    passed: results,
    pageErrors: errors,
    publishedProposalStates: observedGuideStates,
    negativeControls,
  };
  await writeFile(
    join(artifactDirectory, "results.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
