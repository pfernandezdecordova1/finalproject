const SETTINGS_THEME_KEY = "inboxdue_theme";

function applySavedTheme() {
  const savedTheme = localStorage.getItem(SETTINGS_THEME_KEY);
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "";
  const next = current === "dusk" ? "" : "dusk";

  if (next) {
    document.documentElement.setAttribute("data-theme", next);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  localStorage.setItem(SETTINGS_THEME_KEY, next);
}

function clearStorage() {
  localStorage.removeItem("inboxdue_done_ids");
  localStorage.removeItem("inboxdue_theme");
  const feedback = document.getElementById("settingsFeedback");
  feedback.textContent = "Saved data cleared.";
  document.documentElement.removeAttribute("data-theme");
}

function initSettings() {
  applySavedTheme();
  const themeToggle = document.getElementById("themeToggle");
  const clearButton = document.getElementById("clearStorage");
  themeToggle.addEventListener("click", toggleTheme);
  clearButton.addEventListener("click", clearStorage);
}

initSettings();
