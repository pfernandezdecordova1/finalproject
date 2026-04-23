## Final Project Proposal

# What I'm building

A web app called InboxDue that turns inbox-style messages into a structured task dashboard. It detects which emails need a reply, have a deadline, or contain action items, and surfaces them in a clean multi-page interface.

# Who it's for / Who is my target. 

For students and professionals who live in their Gmail inbox but have no structured way to track what actually needs action. Emails pile up, deadlines get buried, and important replies get forgotten. InboxDue solves this by doing what Canvas does for assignments — but for your email. I chose this because it's a problem I personally experience every day and a tool I would genuinely use.

# Which API / Technologies I will try to use. I need to research more options still. 

HTML, CSS, JavaScript (core stack for the required responsive web app)
Local Storage API — to save user preferences and completed items
Gmail API (Google, stretch) — for real inbox integration later: https://developers.google.com/gmail/api
Claude API (Anthropic, stretch) — for advanced detection and summaries: https://www.anthropic.com

# Core features ( initial idea) 

- Needs Reply — surfaces emails where the user was directly addressed and hasn't responded

- Has a Deadline — detects time-sensitive language ("by Friday", "due March 5th", "RSVP before...") and lists them with the date

- Action Items — flags emails where someone asked the user to do something ("please review", "can you send", "don't forget to")

- One-line AI summary — each flagged email shows a short summary of what's needed so the user doesn't have to open it

- Mark as done — user can dismiss items from the dashboard once handled

- Jump to email — clicking any item opens that email directly in Gmail

# What I don't know yet

How to authenticate with the Gmail API using OAuth in a browser-based app
How to handle API rate limits if the user has hundreds of emails
How to store the "done" state across sessions (currently using local storage)
How to keep the app fast while making multiple API calls in the background