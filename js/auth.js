// auth.js — Google OAuth using Google Identity Services (no backend required)
// Docs: https://developers.google.com/identity/oauth2/web/guides/use-token-model
//
// SETUP: Replace the value below with your own Google OAuth Client ID.
// Get one at: https://console.cloud.google.com/apis/credentials
// Also enable the "Gmail API" for your project in Google Cloud Console.
//
// AI TOOL NOTE: This OAuth flow scaffold was structured with help from GitHub Copilot.
// All logic was reviewed and adjusted to match course and security requirements.

const GOOGLE_CLIENT_ID = "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE";

// Gmail read-only scope — we never send or delete emails
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

let tokenClient = null;
let accessToken = null;
let isDemoMode = false;

// Expose auth state to other scripts
function getAccessToken() {
  return accessToken;
}

function isSignedIn() {
  return accessToken !== null || isDemoMode;
}

function isDemo() {
  return isDemoMode;
}

// Called by main.js after the page loads
function initAuth({ onSignedIn, onDemo }) {

  // Wire up the demo button immediately — no OAuth needed
  document.getElementById("demoBtn").addEventListener("click", () => {
    isDemoMode = true;
    showApp();
    onDemo();
  });

  // Google Identity Services loads asynchronously. Poll until it is ready
  // rather than using an event listener that may fire before we attach it.
  function trySetupTokenClient(attempts) {
    if (typeof google !== "undefined" && google.accounts) {
      setupTokenClient(onSignedIn);
    } else if (attempts > 0) {
      setTimeout(() => trySetupTokenClient(attempts - 1), 300);
    } else {
      // GIS never loaded (offline or blocked) — leave Sign In button disabled
      const signInBtn = document.getElementById("signInBtn");
      signInBtn.textContent = "Sign in unavailable — use demo";
      signInBtn.disabled = true;
    }
  }

  trySetupTokenClient(20); // try for up to ~6 seconds
}

function setupTokenClient(onSignedIn) {
  // Guard: if Client ID placeholder has not been filled in, disable real sign-in
  if (GOOGLE_CLIENT_ID === "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE") {
    const signInBtn = document.getElementById("signInBtn");
    signInBtn.textContent = "Sign in (Client ID not set — use demo)";
    signInBtn.disabled = true;
    return;
  }

  // Initialize the token client for implicit OAuth flow
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GMAIL_SCOPE,
    callback: (response) => {
      if (response.error) {
        console.error("OAuth error:", response.error);
        return;
      }
      accessToken = response.access_token;
      showApp();
      onSignedIn(response.access_token);
    }
  });

  document.getElementById("signInBtn").addEventListener("click", () => {
    tokenClient.requestAccessToken();
  });
}

function showApp() {
  document.getElementById("loginScreen").setAttribute("hidden", "");
  document.getElementById("appShell").removeAttribute("hidden");
}

function signOut() {
  if (accessToken) {
    // Revoke the token so it is invalidated on Google's side
    google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
    });
  }
  isDemoMode = false;
  // Return to login screen
  document.getElementById("appShell").setAttribute("hidden", "");
  document.getElementById("loginScreen").removeAttribute("hidden");
}
