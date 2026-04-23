# InboxDue

InboxDue is a responsive web application that connects to your real Gmail inbox via Google OAuth and surfaces what actually needs your attention — replies, deadlines, and action items — in one organized dashboard.

No more scanning every message. InboxDue does the work for you.

## Live Demo URL

Pending deployment (Netlify or Vercel) — link will be added before 5/1 submission.

## Who It's For

Students and professionals who live in Gmail but have no structured way to track what actually needs action. Emails pile up, deadlines get buried, important replies get forgotten. InboxDue solves this by doing what Canvas does for assignments — but for your inbox.

## Features

- **Sign in with Google** — OAuth 2.0 login using Google Identity Services (read-only access)
- **Demo mode** — try it instantly without signing in using realistic mock data
- **Needs Reply** — surfaces unread emails where a response is likely expected
- **Has Deadline** — detects time-sensitive language ("due Friday", "RSVP before…")
- **Action Items** — flags messages asking you to do something
- **One-line summary** — each email shows a clear statement of what's needed
- **Mark as done** — dismiss completed items (persisted in local storage)
- **Filter by category** — view only replies, deadlines, or action items
- **Sort by urgency, deadline, or sender**
- **Search** — filter by subject or sender with form validation
- **Theme toggle** — light and dark mode, saved in local storage
- **Sign out** — revokes OAuth token and returns to login screen

## Technologies Used

- HTML5 (semantic layout, accessibility attributes)
- CSS3 (Flexbox/Grid, responsive layout, media queries, CSS custom properties)
- Vanilla JavaScript (DOM manipulation, events, fetch, local storage, session storage)
- Google Identity Services (OAuth 2.0 implicit flow — no backend required)
- Gmail REST API (inbox read, user profile)
- Google Fonts (Space Grotesk, Source Sans 3)

## Setup (Gmail API)

To connect your real Gmail inbox:
1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project, and enable the **Gmail API**.
2. Under **Credentials**, create an **OAuth 2.0 Client ID** (Web Application type).
3. Add your deployed Netlify/Vercel URL as an **Authorized JavaScript Origin**.
4. Paste the Client ID into `js/auth.js` at the top of the file.

Until a Client ID is set, the Sign In button is automatically disabled and the app runs in demo mode.

## Deployment

GitHub Pages does not support the OAuth origin requirements reliably.
This project will be deployed to **Netlify** or **Vercel**.

## AI Tools Used

- **GitHub Copilot** — scaffolding, code structure, and implementation support throughout
- All generated code was reviewed, tested, and adjusted to match course requirements

## Challenges and Solutions

- **Original concept was a Chrome Extension** — incompatible with course deployment requirements. Pivoted to a web app with the same product idea, which is actually more accessible (no install needed).
- **Gmail OAuth in a static app** — solved using Google Identity Services implicit flow, which works entirely in the browser without a backend server.
- **Deadline detection without an AI API** — implemented keyword-based regex classifier in `js/gmail.js` that runs in the browser for free and covers the most common patterns.
- **Persisting done state across pages** — used local storage with a Set of completed IDs.

## Future Improvements

- Integrate Claude or OpenAI API for smarter summaries and deadline extraction
- Add pagination for large inboxes
- Group emails by thread instead of individual messages
- Email count badge on the browser tab
- Push notifications for approaching deadlines

## Project Structure

```
finalproject/
├── index.html         # Dashboard (login screen + main app)
├── detail.html        # Single email detail view
├── settings.html      # Account, preferences, setup guide
├── css/
│   └── style.css
├── js/
│   ├── auth.js        # Google OAuth (Identity Services)
│   ├── gmail.js       # Gmail API fetch + classification
│   ├── data.js        # Mock email data for demo mode
│   ├── main.js        # Dashboard controller
│   ├── detail.js      # Detail page controller
│   └── settings.js    # Settings page controller
├── assets/
├── proposal.md
└── README.md
```

## Live Demo URL

Pending deployment (GitHub Pages) for final submission.

## Current Milestone Status (Day 1-2)

- Project scaffold completed (`index.html`, `css/`, `js/`, `assets/`).
- Three distinct views/pages completed:
	- `index.html` (Dashboard)
	- `detail.html` (Email Detail)
	- `settings.html` (Settings)
- Core JavaScript interactivity completed.
- Local storage persistence completed.
- Responsive layout and mobile support completed.

## Features Implemented

- Inbox dashboard with categorized items:
	- Needs Reply
	- Has Deadline
	- Action Items
- Dynamic rendering from mock inbox data.
- Filtering by category.
- Sorting by urgency, deadline, or sender.
- Search form with validation and feedback.
- Mark done / undo actions per email.
- Email detail page with full message context.
- Theme toggle saved in local storage.
- Reset/clear saved state controls.

## Technologies Used

- HTML5 (semantic layout)
- CSS3 (responsive layout, Flexbox/Grid, media queries)
- Vanilla JavaScript (DOM updates, events, local storage)
- Mock JSON-style data in `js/data.js`
- Google Fonts (`Space Grotesk`, `Source Sans 3`)

## AI Tools Used

- GitHub Copilot (planning, scaffolding, and implementation support)
- ChatGPT-style prompting workflow for feature breakdown and requirement mapping

AI helped speed up structuring the pages and JavaScript logic, while all code was reviewed and adjusted to match course requirements.

## Challenges and Solutions (So Far)

- Challenge: Original concept started as a Chrome Extension, but class requirements are for a deployed web app URL.
	- Solution: Pivoted to a static web app prototype with the same product idea.
- Challenge: Need realistic behavior before API integration.
	- Solution: Built a mock-data architecture first, so UI and interactions are fully testable now.
- Challenge: Persisting task state across page visits.
	- Solution: Implemented local storage for completed items and theme preferences.

## Future Improvements

- Connect to real Gmail data via OAuth/API.
- Replace keyword/mock classification with real AI endpoint integration.
- Add advanced filters (date range, sender groups, urgency presets).
- Add analytics widgets (tasks completed, average response lag).
- Improve accessibility testing and Lighthouse optimization to 90+.

## Project Structure

```
finalproject/
├── index.html
├── detail.html
├── settings.html
├── css/
│   └── style.css
├── js/
│   ├── data.js
│   ├── main.js
│   ├── detail.js
│   └── settings.js
├── assets/
├── proposal.md
└── README.md
```

## Notes

This build currently uses mock data for reliable front-end demonstration.
It is ready for Day 2 progress checks and can be deployed once you create the GitHub Pages link.

