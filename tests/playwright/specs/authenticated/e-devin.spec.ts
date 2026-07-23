import { test, expect } from "@playwright/test";
import { DevinSettingsPage } from "../../pages";

const MODEL_MODE_SWITCHES = ["ultra", "fast-mode", "swe-1-7", "fusion"] as const;
const TOOL_SWITCHES = ["enterprise-secure-mode", "enterprise-web-search"] as const;
const PR_OPEN_AS_OPTIONS = [
  { label: /^Devin/, display: "Devin" },
  { label: /^User$/, display: "User" },
  { label: /^User only/, display: "User only" },
  { label: /^Per-organization/, display: "Per-organization" },
] as const;

async function reloadAndWait(page, devin: DevinSettingsPage) {
  await page.reload();
  await devin.heading.waitFor({ state: "visible" });
  await page.waitForLoadState("networkidle");
}

test.describe("Devin settings", () => {
  test("DEVIN-REG01 — Toggle model/mode settings one at a time, reload, and restore", async ({
    page,
  }) => {
    const devin = new DevinSettingsPage(page);
    await devin.goto();
    await devin.heading.waitFor({ state: "visible" });

    const original: Record<string, string> = {};

    try {
      for (const id of MODEL_MODE_SWITCHES) {
        const switchEl = devin.switchFor(id);
        original[id] = await switchEl.getAttribute("aria-checked");

        const changed = await devin.toggleSwitch(switchEl);
        await reloadAndWait(page, devin);
        await expect(devin.switchFor(id)).toHaveAttribute("aria-checked", changed);

        await devin.toggleSwitch(devin.switchFor(id));
        await reloadAndWait(page, devin);
        await expect(devin.switchFor(id)).toHaveAttribute("aria-checked", original[id]);
      }
    } finally {
      for (const id of MODEL_MODE_SWITCHES) {
        if (original[id] !== undefined) {
          await devin.setSwitch(devin.switchFor(id), original[id] as "true" | "false");
        }
      }
    }
  });

  test("DEVIN-REG02 — Toggle native deployments and web search, reload, and restore", async ({
    page,
  }) => {
    const devin = new DevinSettingsPage(page);
    await devin.goto();
    await devin.heading.waitFor({ state: "visible" });

    const original: Record<string, string> = {};

    try {
      for (const id of TOOL_SWITCHES) {
        const switchEl = devin.switchFor(id);
        original[id] = await switchEl.getAttribute("aria-checked");

        const changed = await devin.toggleSwitch(switchEl);
        await reloadAndWait(page, devin);
        await expect(devin.switchFor(id)).toHaveAttribute("aria-checked", changed);

        await devin.toggleSwitch(devin.switchFor(id));
        await reloadAndWait(page, devin);
        await expect(devin.switchFor(id)).toHaveAttribute("aria-checked", original[id]);
      }
    } finally {
      for (const id of TOOL_SWITCHES) {
        if (original[id] !== undefined) {
          await devin.setSwitch(devin.switchFor(id), original[id] as "true" | "false");
        }
      }
    }
  });

  test("DEVIN-REG03 — Select each commit-author option and verify persistence", async ({
    page,
  }) => {
    const devin = new DevinSettingsPage(page);
    await devin.goto();
    await devin.heading.waitFor({ state: "visible" });

    const options = [
      "Devin only",
      "Co-authored (Devin + you)",
      "Co-authored (you + Devin)",
      "You only",
      "You as author, Devin as committer",
      "Devin as author, you as committer",
    ];
    const originalLabel = "Per-user (Default)";

    try {
      for (const option of options) {
        await devin.selectCommitAuthorOption(option);
        await reloadAndWait(page, devin);
        await expect(devin.commitAuthorTrigger).toHaveText(option);
      }

      await devin.selectCommitAuthorOption(originalLabel);
      await reloadAndWait(page, devin);
      await expect(devin.commitAuthorTrigger).toHaveText(originalLabel);
    } finally {
      await devin.selectCommitAuthorOption(originalLabel);
    }
  });

  test("DEVIN-REG04 — Commit email valid, malformed, and inert injection-like values", async ({
    page,
  }) => {
    test.slow();
    const devin = new DevinSettingsPage(page);
    await devin.goto();

    const originalLabel = "Default";
    const validEmail = "devin-automation@cognition.ai";

    // Ensure a known neutral pre-state before varying the email.
    await devin.selectCommitEmailOption(originalLabel);
    await reloadAndWait(page, devin);
    await expect(devin.commitEmailTrigger).toHaveText(originalLabel);

    try {
      // Valid custom email persists across reload.
      await devin.selectCommitEmailOption("Custom email…");
      const validResponse = await devin.setCustomCommitEmail(validEmail);
      expect(validResponse!.status()).toBe(200);
      await reloadAndWait(page, devin);
      await devin.selectCommitEmailOption("Custom email…");
      await expect(devin.commitEmailCustomInput).toHaveValue(validEmail);

      // Restore default before testing invalid values.
      await devin.selectCommitEmailOption(originalLabel);
      await reloadAndWait(page, devin);
      await expect(devin.commitEmailTrigger).toHaveText(originalLabel);

      const invalidValues = [
        "",
        "not-an-email",
        "a@b",
        "a".repeat(210) + "@example.com",
        "<script>alert(1)</script>@example.com",
        "tëst@exámple.com",
      ];

      for (const value of invalidValues) {
        await devin.selectCommitEmailOption("Custom email…");
        await devin.setCustomCommitEmail(value);
        await reloadAndWait(page, devin);

        if (value === "tëst@exámple.com") {
          // Unicode email is valid and persists.
          await devin.selectCommitEmailOption("Custom email…");
          await expect(devin.commitEmailCustomInput).toHaveValue(value);
        } else {
          // Blank, malformed, long, and injection-like strings are not persisted.
          await expect(devin.commitEmailTrigger).toHaveText(originalLabel);
        }

        // Reset to Default between each invalid case so the next cycle starts clean.
        await devin.selectCommitEmailOption(originalLabel);
      }
    } finally {
      await devin.selectCommitEmailOption(originalLabel);
      await reloadAndWait(page, devin);
      await expect(devin.commitEmailTrigger).toHaveText(originalLabel);
    }
  });

  test("DEVIN-REG05 — Change Open PRs as option, reload, and restore", async ({ page }) => {
    const devin = new DevinSettingsPage(page);
    await devin.goto();
    await devin.heading.waitFor({ state: "visible" });

    const originalLabel = "Per-organization";
    const newOption = PR_OPEN_AS_OPTIONS[0];

    try {
      await devin.selectOpenPrsAsOption(newOption.label);
      await expect(devin.openPrsAsTrigger).toHaveText(newOption.display);

      await reloadAndWait(page, devin);
      await expect(devin.openPrsAsTrigger).toHaveText(newOption.display);

      await devin.selectOpenPrsAsOption(/^Per-organization/);
      await expect(devin.openPrsAsTrigger).toHaveText(originalLabel);

      await reloadAndWait(page, devin);
      await expect(devin.openPrsAsTrigger).toHaveText(originalLabel);
    } finally {
      await devin.selectOpenPrsAsOption(/^Per-organization/);
    }
  });

  test("DEVIN-REG06 — Tampered enterprise ID cannot update Devin settings", async ({ page }) => {
    const devin = new DevinSettingsPage(page);
    await devin.goto();
    await devin.heading.waitFor({ state: "visible" });

    const webSearchOriginal = await devin.webSearchSwitch.getAttribute("aria-checked");

    // Capture a genuine, authorized settings PUT (and confirm it succeeds) while restoring state.
    const capture = await devin.captureAuthorizedSettingsPut();
    expect(capture.entId).toMatch(/^enterprise-[a-f0-9]+$/);

    // The same request, aimed at an enterprise the admin does not own, must be rejected server-side.
    const tampered = await devin.attemptTamperedSettingsPut(capture);
    expect(tampered.status()).toBe(403);
    expect(await tampered.text()).toContain("Unauthorized");

    // The forged request changed nothing: the real enterprise setting is back to its original value.
    await reloadAndWait(page, devin);
    await expect(devin.webSearchSwitch).toHaveAttribute("aria-checked", webSearchOriginal);
  });
});
