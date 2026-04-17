const STORAGE_KEY = "site-theme";

function getColorSchemeMedia() {
  return window.matchMedia("(prefers-color-scheme: dark)");
}

function getSavedTheme(): "dark" | "light" | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "dark" || saved === "light" ? saved : null;
}

function applyTheme(theme: "dark" | "light" | null): void {
  if (theme === null) {
    delete document.documentElement.dataset.bsTheme;
  } else {
    document.documentElement.dataset.bsTheme = theme;
  }
}

function getCurrentTheme(): "dark" | "light" {
  const saved = getSavedTheme();
  if (saved !== null) return saved;
  return getColorSchemeMedia().matches ? "dark" : "light";
}

export function toggleTheme(): void {
  const next = getCurrentTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
}

export function initTheme(): void {
  applyTheme(getCurrentTheme());

  getColorSchemeMedia().addEventListener("change", () => {
    if (getSavedTheme() === null) {
      applyTheme(null);
    }
  });
}
