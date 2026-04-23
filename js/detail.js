function getEmailIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "m1";
}

function renderDetailCard() {
  const container = document.getElementById("detailCard");
  const emailId = getEmailIdFromUrl();
  const item = MOCK_EMAILS.find((entry) => entry.id === emailId);

  if (!item) {
    container.innerHTML = `
      <h2>Email not found</h2>
      <p>The selected message could not be loaded.</p>
      <a class="button" href="index.html">Return to Dashboard</a>
    `;
    return;
  }

  const categoryLabel = item.category === "reply" ? "Needs Reply" : item.category === "deadline" ? "Has Deadline" : "Action Item";

  container.innerHTML = `
    <h2>${item.subject}</h2>
    <div class="detail-grid">
      <p><strong>Sender:</strong> ${item.sender}</p>
      <p><strong>Category:</strong> ${categoryLabel}</p>
      <p><strong>Deadline:</strong> ${item.deadline}</p>
      <p><strong>Urgency:</strong> ${item.urgency}/5</p>
      <p><strong>AI Summary:</strong> ${item.aiSummary}</p>
      <p><strong>Message:</strong> ${item.body}</p>
    </div>
    <div class="email-actions">
      <a class="button" href="index.html">Back to Dashboard</a>
    </div>
  `;
}

renderDetailCard();
