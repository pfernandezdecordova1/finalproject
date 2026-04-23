# InboxDue

InboxDue is a responsive web application prototype that turns inbox-style messages into a clear action dashboard.
It is designed for students and professionals who need a fast way to spot replies, deadlines, and tasks.

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

