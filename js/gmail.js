// gmail.js — Fetches and classifies real Gmail messages using the Gmail REST API
// Docs: https://developers.google.com/gmail/api/reference/rest
//
// AI TOOL NOTE: The classification logic pattern was discussed with GitHub Copilot.
// All keyword lists and fetch logic were reviewed and adjusted manually.

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

// Keywords used to classify emails into the three InboxDue categories.
// These run entirely in the browser — no AI API call needed for the MVP.
const REPLY_PATTERNS = [
  /\bcan you\b/i, /\bdo you\b/i, /\blet me know\b/i, /\bwhat do you think\b/i,
  /\byour thoughts\b/i, /\bplease respond\b/i, /\bget back to me\b/i,
  /\bwaiting for your\b/i, /\bhave you\b/i, /\bwill you\b/i
];

const DEADLINE_PATTERNS = [
  /\bby (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bdue (date|by|on)\b/i, /\bdeadline\b/i, /\bRSVP\b/i,
  /\bbefore (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bno later than\b/i, /\bends (on|at)\b/i,
  /\bsubmit by\b/i, /\bdue [A-Z][a-z]+ \d{1,2}/i
];

const ACTION_PATTERNS = [
  /\bplease (review|send|complete|fill|update|check|confirm|sign|approve|upload|submit)\b/i,
  /\bdon't forget\b/i, /\brendering\b/i, /\baction (needed|required|item)\b/i,
  /\btask for you\b/i, /\bcould you\b/i, /\bwould you\b/i,
  /\breminder\b/i, /\bfollow[ -]?up\b/i
];

// Extracts a likely deadline string from email snippet text
function extractDeadlineText(text) {
  const match = text.match(
    /\b(by|due|before|no later than|submit by|RSVP before)\s+([A-Z][a-z]+\s+\d{1,2}(?:st|nd|rd|th)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
  );
  return match ? match[0] : null;
}

// Determine category based on keyword matching
function classifyEmail(snippet, subject) {
  const text = `${subject} ${snippet}`;

  if (DEADLINE_PATTERNS.some((p) => p.test(text))) return "deadline";
  if (ACTION_PATTERNS.some((p) => p.test(text))) return "action";
  if (REPLY_PATTERNS.some((p) => p.test(text))) return "reply";

  // Default: treat as needing reply if no other match
  return "reply";
}

// Generate a one-sentence summary from the snippet (minimal, no AI API needed for MVP)
function buildSummary(category, subject, snippet) {
  const deadline = extractDeadlineText(snippet) || extractDeadlineText(subject);
  if (category === "deadline" && deadline) {
    return `Deadline detected: ${deadline}.`;
  }
  if (category === "action") {
    return `Action requested — ${subject.slice(0, 60)}.`;
  }
  return `Reply expected — ${subject.slice(0, 60)}.`;
}

// Assign a rough urgency score (1-5) based on category and how recent the email is
function scoreUrgency(category, internalDate) {
  const ageMs = Date.now() - Number(internalDate);
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const urgencyByCategory = { deadline: 4, action: 3, reply: 2 };
  const base = urgencyByCategory[category] || 2;
  // Emails older than 3 days get bumped up one level
  return ageDays > 3 ? Math.min(base + 1, 5) : base;
}

// Decode base64url-encoded Gmail message body
function decodeBody(data) {
  if (!data) return "";
  try {
    return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return "";
  }
}

// Fetch headers from a parsed message payload
function getHeader(headers, name) {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : "";
}

// Fetch the list of recent unread message IDs from Gmail
async function fetchMessageIds(token, maxResults = 20) {
  const url = `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults}&q=is:unread`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Gmail list error: ${response.status}`);
  const data = await response.json();
  return (data.messages || []).map((m) => m.id);
}

// Fetch a single message's metadata and snippet
async function fetchMessage(token, messageId) {
  const url = `${GMAIL_API_BASE}/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Gmail fetch error: ${response.status}`);
  return response.json();
}

// Fetch the signed-in user's profile to show their name/email
async function fetchUserProfile(token) {
  const url = `${GMAIL_API_BASE}/users/me/profile`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return response.json();
}

// Main entry: fetches up to maxResults unread emails, returns InboxDue-formatted array
async function loadGmailEmails(token, maxResults = 20) {
  const ids = await fetchMessageIds(token, maxResults);

  // Fetch all messages in parallel for speed
  const messages = await Promise.all(ids.map((id) => fetchMessage(token, id)));

  return messages.map((msg) => {
    const headers = msg.payload?.headers || [];
    const subject = getHeader(headers, "Subject") || "(no subject)";
    const from = getHeader(headers, "From") || "Unknown";
    // Strip angle-bracketed email address from "Name <email>" format
    const sender = from.replace(/<[^>]+>/, "").trim() || from;
    const snippet = msg.snippet || "";
    const category = classifyEmail(snippet, subject);

    // Extract deadline date string if present, otherwise use today + 7 days as placeholder
    const deadlineText = extractDeadlineText(snippet) || extractDeadlineText(subject);
    const deadline = deadlineText
      ? new Date(deadlineText + " 2026").toISOString().slice(0, 10)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
      id: msg.id,
      sender,
      subject,
      body: snippet,
      category,
      urgency: scoreUrgency(category, msg.internalDate),
      deadline,
      aiSummary: buildSummary(category, subject, snippet)
    };
  });
}
