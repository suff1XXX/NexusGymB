var themePreference = "Світла";
try { themePreference = localStorage.getItem("nexus:theme") || "Світла"; } catch {}
var systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
function applyTheme(preference, save = true) {
  themePreference = ["Світла", "Темна", "Системна"].includes(preference) ? preference : "Світла";
  const dark = themePreference === "Темна" || themePreference === "Системна" && systemTheme.matches;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", dark ? "dark" : "light");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#141416" : "#f5f5f7");
  if (save) { try { localStorage.setItem("nexus:theme", themePreference); } catch {} }
}
systemTheme.addEventListener("change", () => applyTheme(themePreference, false));
applyTheme(themePreference, false);
