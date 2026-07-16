import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { Sidebar } from '../components/sidebar.component';
import { OrgSwitcher } from '../components/org-switcher.component';

// Base for any page rendered inside a sub-org shell (Sessions, Ask, Wiki, Review,
// Automations, Settings). These all share the left Sidebar and the breadcrumb OrgSwitcher,
// so they're composed here once and inherited by every sub-org page object.
export abstract class SubOrgPage extends BasePage {
  readonly sidebar: Sidebar;
  readonly orgSwitcher: OrgSwitcher;

  constructor(page: Page) {
    super(page);
    this.sidebar = new Sidebar(page);
    this.orgSwitcher = new OrgSwitcher(page);
  }
}
