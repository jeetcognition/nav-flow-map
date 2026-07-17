const KEY = "qa-theme";
export type Theme = "dark" | "light";

/** localStorage can throw in private-browsing / blocked-storage contexts. */
export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // storage unavailable — theme simply won't persist
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function initTheme() {
  applyTheme(readStoredTheme());
}
