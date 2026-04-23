const STORAGE_KEYS = {
  done: "inboxdue_done_ids",
  theme: "inboxdue_theme"
};

const elements = {
  list: document.getElementById("emailList"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortMode: document.getElementById("sortMode"),
  searchForm: document.getElementById("searchForm"),
  searchInput: document.getElementById("searchInput"),
  feedback: document.getElementById("searchFeedback"),
  resetDone: document.getElementById("resetDone"),
  themeToggle: document.getElementById("themeToggle"),
  countReply: document.getElementById("countReply"),
  countDeadline: document.getElementById("countDeadline"),
  countAction: document.getElementById("countAction")
};

let doneIds = new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.done) || "[]"));
let searchTerm = "";

function applySavedTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
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
  localStorage.setItem(STORAGE_KEYS.theme, next);
}

function persistDoneIds() {
  localStorage.setItem(STORAGE_KEYS.done, JSON.stringify([...doneIds]));
}

function getFilteredEmails() {
  const selectedCategory = elements.categoryFilter.value;
  const selectedSort = elements.sortMode.value;

  let filtered = MOCK_EMAILS.filter((item) => {
    const passesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const query = searchTerm.trim().toLowerCase();
    const passesSearch = !query || item.subject.toLowerCase().includes(query) || item.sender.toLowerCase().includes(query);
    return passesCategory && passesSearch;
  });

  filtered.sort((a, b) => {
    if (selectedSort === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (selectedSort === "sender") {
      return a.sender.localeCompare(b.sender);
    }
    return b.urgency - a.urgency;
  });

  return filtered;
}

function createCard(item) {
  const li = document.createElement("li");
  li.className = "email-item";
  li.dataset.category = item.category;

  if (doneIds.has(item.id)) {
    li.classList.add("done");
  }

  const categoryLabel = item.category === "reply" ? "Needs Reply" : item.category === "deadline" ? "Has Deadline" : "Action Item";

  li.innerHTML = `
    <div class="email-top">
      <strong>${item.subject}</strong>
      <span class="chip">${categoryLabel}</span>
    </div>
    <p><strong>From:</strong> ${item.sender}</p>
    <p><strong>AI Summary:</strong> ${item.aiSummary}</p>
    <p><strong>Deadline:</strong> ${item.deadline}</p>
    <div class="email-actions">
      <button type="button" class="button secondary" data-action="done" data-id="${item.id}">${doneIds.has(item.id) ? "Undo" : "Mark Done"}</button>
      <button type="button" class="button" data-action="detail" data-id="${item.id}">Open Detail</button>
    </div>
  `;

  return li;
}

function updateCounters(items) {
  const activeItems = items.filter((item) => !doneIds.has(item.id));
  elements.countReply.textContent = String(activeItems.filter((item) => item.category === "reply").length);
  elements.countDeadline.textContent = String(activeItems.filter((item) => item.category === "deadline").length);
  elements.countAction.textContent = String(activeItems.filter((item) => item.category === "action").length);
}

function renderEmails() {
  const filtered = getFilteredEmails();
  elements.list.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No emails match your filters.";
    empty.className = "email-item";
    elements.list.appendChild(empty);
    updateCounters([]);
    return;
  }

  filtered.forEach((item) => {
    elements.list.appendChild(createCard(item));
  });

  updateCounters(filtered);
}

function validateSearch(value) {
  if (value.length === 1) {
    return "Type at least 2 characters, or leave it empty to show all.";
  }
  return "";
}

function onFormSubmit(event) {
  event.preventDefault();
  const value = elements.searchInput.value.trim();
  const validationMessage = validateSearch(value);
  elements.feedback.textContent = validationMessage;

  if (validationMessage) {
    return;
  }

  searchTerm = value;
  renderEmails();
}

function onListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;
  if (!id) {
    return;
  }

  if (action === "done") {
    if (doneIds.has(id)) {
      doneIds.delete(id);
    } else {
      doneIds.add(id);
    }
    persistDoneIds();
    renderEmails();
  }

  if (action === "detail") {
    window.location.href = `detail.html?id=${encodeURIComponent(id)}`;
  }
}

function resetDoneState() {
  doneIds = new Set();
  persistDoneIds();
  renderEmails();
}

function init() {
  applySavedTheme();
  renderEmails();

  elements.searchForm.addEventListener("submit", onFormSubmit);
  elements.list.addEventListener("click", onListClick);
  elements.categoryFilter.addEventListener("change", renderEmails);
  elements.sortMode.addEventListener("change", renderEmails);
  elements.resetDone.addEventListener("click", resetDoneState);
  elements.themeToggle.addEventListener("click", toggleTheme);
}

init();
