# ♠ Mr.Blackjack

A fully-featured browser-based Blackjack game built with vanilla HTML, CSS, and JavaScript.

**Live Demo:** [https://yourusername.github.io/blackjack-royale](https://yourusername.github.io/blackjack-royale) *(update after deploying)*

---

## 📋 Description

Mr.Blackjack is a polished, single-page Blackjack application where you start with $1,000 in virtual chips and try to grow your bankroll through smart betting and strategy. The game follows standard casino rules and saves your progress between sessions using localStorage.

**Target users:** Anyone who wants to practice blackjack strategy, learn the rules, or just have fun without real money on the line.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🃏 Full Blackjack rules | Hit, Stand, Double Down; dealer hits on ≤16, stands on ≥17 |
| 💰 Betting system | $5 / $10 / $25 / $50 / $100 chips + Clear Bet / Max Bet |
| 🎯 Natural Blackjack | Detected on first two cards; pays 3:2 |
| 🤖 Dealer AI | Animated card-by-card dealer play with delays |
| 📊 Stats page | Wins, losses, pushes, win rate, streak tracker, peak bankroll |
| 🗂️ Hand history | Last 50 hands with result filtering (All / Wins / Losses / Pushes) |
| 💾 Persistence | Bankroll and all stats survive page refreshes via localStorage |
| 🌙 Theme toggle | Casino green ↔ Dark mode, remembered across sessions |
| ⌨️ Keyboard shortcuts | `H` = Hit, `S` = Stand, `D` = Double Down, `Enter` = Deal |
| 📱 Responsive design | Fully playable on mobile and desktop |

---

## 🖥️ Views / Pages

1. **Home** — Welcome screen with rules, payouts, and a Play Now button
2. **Play** — The blackjack table with card rendering, chip betting, and game controls
3. **Stats** — Statistics dashboard with aggregate stats and a filterable hand history table

---

## 🛠️ Technologies Used

- **HTML5** — Semantic markup, ARIA labels, `role` attributes for accessibility
- **CSS3** — Custom properties (theming), Flexbox/Grid layout, media queries, `@keyframes` card animations
- **JavaScript (ES6+)** — Class-free modular design, Fisher-Yates shuffle, recursive dealer timing via `setTimeout`, localStorage API

No external libraries or frameworks were used.

---

## 🤖 AI Tools Used

- **GitHub Copilot** — Used to scaffold the initial project structure, generate card rendering logic, and assist with CSS variable theming
- AI suggestions were reviewed, tested, and adapted to ensure correctness and to meet the specific game rules required

---

## ⚡ JavaScript Interactivity Checklist

- [x] **DOM manipulation** — Cards, scores, and messages are dynamically created and updated each round
- [x] **Event handling** — Chip buttons, action buttons, nav buttons, keyboard shortcuts
- [x] **Local storage** — Bankroll, all statistics, and theme preference persist across sessions
- [x] **Theme toggle** — Casino green / Dark mode switch saved to localStorage
- [x] **Dynamic filtering** — Hand history table filtered live by result type

---

## 🏗️ Project Structure

```
blackjack-royale/
├── index.html       # Single-page app — all three views
├── css/
│   └── style.css    # Full stylesheet with CSS custom properties
├── js/
│   └── main.js      # Game engine + UI logic
└── README.md
```

---

## 🧩 Challenges & Solutions

| Challenge | Solution |
|---|---|
| Ace value (1 or 11) | `handValue()` sums with all Aces as 11 then reduces by 10 for each Ace while total > 21 |
| Animated dealer drawing | Recursive `setTimeout` callback creates sequential card-draw timing |
| Preserving stats across sessions | Serialise `state.bankroll` + `state.stats` to `localStorage` after every hand |
| Responsive card layout | Flexbox `flex-wrap` on `.hand` containers; smaller card dimensions via media queries |

---

## 🚀 Future Improvements

- **Split** — allow splitting pairs into two separate hands
- **Insurance** — offer insurance bet when dealer shows an Ace
- **Multiple decks** — configurable 1–6 deck shoe with shuffle indicator
- **Sound effects** — card dealing, win/lose audio cues
- **Leaderboard** — save top bankrolls to a backend (e.g., Firebase Firestore)
- **Basic strategy coach** — highlight recommended action based on player hand vs dealer upcard

---

## 📄 Lighthouse Scores (target)

| Category | Target |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| SEO | ≥ 85 |
