// settings.js — settings page logic: theme, sign-out, account status, clear storage
// AI TOOL NOTE: Scaffolded with GitHub Copilot and reviewed manually.

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
  document.getElementById("settingsFeedback").textContent = "Saved data cleared.";
  document.documentElement.removeAttribute("data-theme");
}

// Show current account or demo mode status
function showAccountStatus() {
  const statusEl = document.getElementById("accountStatus");
  const userInfoEl = document.getElementById("userInfo");
  // Read any cached email address from session storage (set by main.js on sign-in)
  const cachedEmail = sessionStorage.getItem("inboxdue_user_email");
  const isDemoSession = sessionStorage.getItem("inboxdue_demo") === "true";

  if (cachedEmail) {
    statusEl.textContent = `Signed in as ${cachedEmail}`;
    if (userInfoEl) userInfoEl.textContent = cachedEmail;
  } else if (isDemoSession) {
    statusEl.textContent = "Running in demo mode (mock data).";
    if (userInfoEl) userInfoEl.textContent = "Demo mode";
  } else {
    statusEl.textContent = "Not signed in.";
  }
}

function handleSignOut() {
  sessionStorage.removeItem("inboxdue_user_email");
  sessionStorage.removeItem("inboxdue_demo");
  // Redirect to home so auth flow restarts
  window.location.href = "index.html";
}

function initSettings() {
  applySavedTheme();
  showAccountStatus();

  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document.getElementById("clearStorage").addEventListener("click", clearStorage);

  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", handleSignOut);
  }
}

initSettings();

