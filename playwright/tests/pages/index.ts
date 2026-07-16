// Barrel export — import any page object or shared component from a single place:
//   import { OrgSelectorPage, WikiPage, Sidebar } from '../pages';

export { BasePage } from './base.page';
export { SubOrgPage } from './sub-org.page';

export { LoginPage } from './login.page';
export { OrgSelectorPage } from './org-selector.page';
export { SessionsPage } from './sessions.page';
export { AskPage } from './ask.page';
export { WikiPage } from './wiki.page';
export { AutomationsPage } from './automations.page';
export { ReviewPage } from './review.page';
export { SettingsPage } from './settings.page';

export { Sidebar } from '../components/sidebar.component';
export { OrgSwitcher } from '../components/org-switcher.component';

export { routes, ENTERPRISE_SLUG, SUB_ORG } from '../support/paths';
