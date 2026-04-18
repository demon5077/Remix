/**
 * lib/theme.js — Theme management (Dark Demon / Light Angel)
 */

const THEME_KEY = "arise:theme";

export function getTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function setTheme(theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent("arise:theme:changed", { detail: theme }));
}

export function applyTheme(theme) {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
}

export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}
