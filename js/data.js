const MOCK_EMAILS = [
  {
    id: "m1",
    sender: "Alex Romero",
    subject: "Need your feedback on launch timeline",
    body: "Can you review the timeline draft and send edits by Thursday 5PM?",
    category: "reply",
    urgency: 5,
    deadline: "2026-04-24",
    aiSummary: "Reply with timeline edits before Thursday 5PM."
  },
  {
    id: "m2",
    sender: "Admissions Office",
    subject: "Scholarship documents due Friday",
    body: "Please upload your signed form before Friday at noon.",
    category: "deadline",
    urgency: 4,
    deadline: "2026-04-24",
    aiSummary: "Submit signed scholarship form by Friday noon."
  },
  {
    id: "m3",
    sender: "Product Team",
    subject: "Action: update onboarding screenshots",
    body: "Please replace old screenshots in the onboarding guide.",
    category: "action",
    urgency: 3,
    deadline: "2026-04-27",
    aiSummary: "Update guide screenshots for onboarding documentation."
  },
  {
    id: "m4",
    sender: "Jordan Lee",
    subject: "Are you joining the capstone presentation?",
    body: "Let me know if you can attend and present your section.",
    category: "reply",
    urgency: 3,
    deadline: "2026-04-29",
    aiSummary: "Confirm attendance and presentation role."
  },
  {
    id: "m5",
    sender: "Campus Events",
    subject: "RSVP needed for networking night",
    body: "RSVP before April 30 to reserve your spot.",
    category: "deadline",
    urgency: 2,
    deadline: "2026-04-30",
    aiSummary: "RSVP before April 30 for networking event."
  }
];
