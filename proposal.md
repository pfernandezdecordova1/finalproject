## Final Project Proposal

# What I'm building

A Chrome Extension called InboxDue that turns Gmail into a structured task dashboard — automatically detecting which emails need a reply, have a deadline, or contain action items, and surfacing them in a clean side panel.

# Who it's for / Who is my target. 

For students and professionals who live in their Gmail inbox but have no structured way to track what actually needs action. Emails pile up, deadlines get buried, and important replies get forgotten. InboxDue solves this by doing what Canvas does for assignments — but for your email. I chose this because it's a problem I personally experience every day and a tool I would genuinely use.

# Which API / Technologies I will try to use. I need to research more options still. 

Gmail API (Google) — to read and scan the user's inbox: https://developers.google.com/gmail/api
Claude API (Anthropic) — to detect deadlines, action items, and urgency in email content: https://www.anthropic.com
Chrome Extensions API — manifest.json, content scripts, side panel: https://developer.chrome.com/docs/extensions

# Core features ( initial idea) 

- Needs Reply — surfaces emails where the user was directly addressed and hasn't responded

- Has a Deadline — detects time-sensitive language ("by Friday", "due March 5th", "RSVP before...") and lists them with the date

- Action Items — flags emails where someone asked the user to do something ("please review", "can you send", "don't forget to")

- One-line AI summary — each flagged email shows a short summary of what's needed so the user doesn't have to open it

- Mark as done — user can dismiss items from the dashboard once handled

- Jump to email — clicking any item opens that email directly in Gmail

# What I don't know yet

How to authenticate with the Gmail API using OAuth inside a Chrome Extension
How to inject a side panel into Gmail without breaking the existing UI
How to handle API rate limits if the user has hundreds of emails
How to store the "done" state across sessions using Chrome's storage API
How to keep the extension fast while making multiple API calls in the background