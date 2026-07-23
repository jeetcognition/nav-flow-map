import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

// Enterprise → Environment (…/settings/enterprise-environment).
// Main tabs: Configuration | Blueprint | Outposts | Golden snapshot (legacy).
// The Golden snapshot tab hosts the version-history table plus an
// Organizations section with Snapshots / Steering knowledge sub-tabs.
export class EnvironmentPage extends BasePage {
  protected readonly path = routes.environment();

  readonly heading = this.page.getByRole("heading", { name: "Environment", exact: true });
  readonly subheading = this.page.getByText(
    "Configure how Devin's environment is set up across your enterprise.",
  );

  // Main tabs
  readonly configurationTab = this.page.getByRole("tab", { name: "Configuration" });
  readonly blueprintTab = this.page.getByRole("tab", { name: "Blueprint" });
  readonly outpostsTab = this.page.getByRole("tab", { name: "Outposts" });
  readonly goldenSnapshotTab = this.page.getByRole("tab", { name: "Golden snapshot (legacy)" });

  // Configuration tab
  readonly snapshotBuildsHeading = this.page.getByText("Snapshot builds", { exact: true });
  readonly maxBuildsInput = this.page.locator('input[type="number"]').first();
  readonly maxBuildsHelper = this.page.getByText(
    "Maximum snapshot builds that may run at once across all of your organizations.",
  );
  readonly orgOverrideHelper = this.page.getByText(
    "Let organizations set their own build schedule",
  );
  readonly saveScheduleButton = this.page.getByRole("button", { name: "Save schedule" });

  // Blueprint tab (Monaco editor)
  readonly blueprintHeading = this.page.getByText("Enterprise blueprint", { exact: true });
  readonly blueprintEditor = this.page.locator(".monaco-editor").first();
  readonly blueprintEditorContent = this.page.locator(".monaco-editor .view-lines").first();
  readonly saveBlueprintButton = this.page.getByRole("button", { name: "Save blueprint" });
  readonly discardButton = this.page.getByRole("button", { name: "Discard", exact: true });

  // Outposts tab
  readonly outpostsHeading = this.page.getByRole("heading", { name: "Outposts", exact: true });
  readonly outpostsDescription = this.page.getByText(
    "Manage outposts for running Devin sessions on your own machines.",
  );
  readonly createOutpostButton = this.page.getByRole("button", { name: "Create outpost" });
  readonly organizationAccessLabels = this.page.getByText("Organization access", { exact: true });

  // Golden snapshot (legacy) tab
  readonly machineSnapshotHeading = this.page.getByRole("heading", {
    name: "Machine snapshot",
    exact: true,
  });
  readonly operatingSystemText = this.page.getByText(/Operating system:/);
  readonly configureButton = this.page.getByRole("button", { name: "Configure", exact: true });
  readonly resetMachineButton = this.page.getByRole("button", { name: "Reset Devin's machine" });
  readonly versionHistorySearch = this.page.getByPlaceholder("Search version history...");
  readonly versionHistoryTable = this.page.locator("table").first();
  readonly versionHistoryRows = this.versionHistoryTable.locator("tbody tr");
  readonly currentVersionBadge = this.page.getByText("Current version", { exact: true });
  readonly noVersionHistory = this.page.getByText("No version history found", { exact: true });

  // Organizations section (inside Golden snapshot tab)
  readonly organizationsHeading = this.page.getByRole("heading", {
    name: "Organizations",
    exact: true,
  });
  readonly snapshotsSubTab = this.page.getByRole("tab", { name: "Snapshots", exact: true });
  readonly steeringKnowledgeSubTab = this.page.getByRole("tab", { name: "Steering knowledge" });
  readonly snapshotsSearch = this.page.getByPlaceholder("Search snapshots...");
  readonly snapshotsTable = this.page.locator("table").nth(1);
  readonly snapshotsRows = this.snapshotsTable.locator("tbody tr");
  readonly noSnapshotsFound = this.page.getByText("No snapshots found", { exact: true });
  readonly steeringKnowledgeHeading = this.page.getByText("Steering Knowledge", { exact: true });

  constructor(page: Page) {
    super(page);
  }

  async goto(tab?: string) {
    await this.page.goto(routes.environment(ENTERPRISE_SLUG, tab));
  }

  mainTabs(): Locator[] {
    return [this.configurationTab, this.blueprintTab, this.outpostsTab, this.goldenSnapshotTab];
  }

  /**
   * Normalized blueprint text as rendered by the Monaco editor. Monaco
   * soft-wraps and virtualizes lines, so rendered fragments can appear in a
   * different order between renders; sorting makes the content comparable.
   */
  async blueprintText(): Promise<string> {
    const raw = await this.blueprintEditorContent.innerText();
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .sort()
      .join("\n");
  }

  /** Replace the whole blueprint buffer without saving (Monaco select-all + insert). */
  async replaceBlueprintText(text: string) {
    await this.blueprintEditorContent.click();
    await this.page.keyboard.press("Control+a");
    await this.page.keyboard.insertText(text);
  }
}
