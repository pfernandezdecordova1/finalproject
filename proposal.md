# Project Proposal — Mr.Blackjack

## What are you building? Who is it for?

A browser-based Blackjack game where players start with $1,000 in virtual chips and try to grow their bankroll through strategy and luck. It is aimed at anyone who wants to learn Blackjack rules, practice basic strategy, or enjoy a casual card game without risking real money.

## Why?

Blackjack is one of the most skill-influenced casino games, yet many players sit down with no understanding of the rules or optimal strategy. A free, no-pressure web app lets people explore the game at their own pace and build confidence before ever stepping up to a real table. It also provides a natural sandbox for practicing concepts like event-driven JavaScript and persistent client-side state.

## MVP vs. Stretch Goals

### Minimum Viable Product (MVP)
- Full blackjack hand: Hit, Stand, Double Down
- Betting chip UI ($5 / $25 / $50 / $100)
- Dealer AI (hits ≤16, stands ≥17)
- Natural Blackjack detection (3:2 payout)
- Three distinct views: Home (rules), Play, Stats
- Stats page: wins / losses / pushes / win rate / streak
- localStorage persistence (bankroll + stats survive refresh)
- Responsive design (mobile + desktop)
- Theme toggle (casino green / dark mode)

### Stretch Goals
- Split pairs into two hands
- Insurance side bet when dealer shows an Ace
- Multi-deck shoe (configurable 1–6 decks)
- Sound effects (deal, win, lose, blackjack)
- Basic strategy hint system (highlight recommended play)
- Firebase Firestore leaderboard


## Languages used 
- HTML, CSS, JavaScript 
- No frameworks or libraries, just vanilla JS for maximum learning
- GitHub Pages for deployment
- CSS custom properties for theming
- localStorage API for persistence
- GitHub Copilot for code suggestions and scaffolding
- Fisher-Yates algorithm for shuffling the deck


