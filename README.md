# Mr.Blackjack

A fully-featured browser-based Blackjack game built with vanilla HTML, CSS, and JavaScript.

# Live Demo: 
- [https://pfernandezdecordova1.github.io/finalproject](https://pfernandezdecordova1.github.io/finalproject)

## Description

Mr.Blackjack is a polished, single-page Blackjack application where you start with $1,000 in virtual chips and try to grow your bankroll through smart betting and strategy. The game follows standard casino rules and saves your progress between sessions using localStorage.

**Target users:** Anyone who wants to practice blackjack strategy, learn the rules, or just have fun without real money on the line.

## Features

This project is a fully-featured Blackjack web app playable in the browser. The game implements complete Blackjack rules including Hit, Stand, and Double Down, with the dealer following standard casino logic (hits on 16 or below, stands on 17 or above) and natural Blackjacks paying 3:2. Players bet using chip denominations ranging from $5 to $100, with their bankroll persisting across sessions via localStorage. The app includes a stats dashboard tracking wins, losses, pushes, win rate, streaks, and peak bankroll, as well as a hand history log of the last 50 hands with result filtering. Additional features include a theme toggle between casino green and dark mode, keyboard shortcuts for fast gameplay, and a fully responsive layout that works on mobile and desktop.

## Views / Pages

1. Home — Welcome screen with rules, payouts, and a Play Now button
2. Play— The blackjack table with card rendering, chip betting, and game controls
3. Stats — Statistics dashboard with aggregate stats and a filterable hand history table

## Technologies Used

- HTML — Semantic markup, ARIA labels, (role) attributes for accessibility
- CSS — Custom properties (theming), Flexbox/Grid layout, media queries, keyframes card animations
- JavaScript — Class-free modular design, Fisher-Yates shuffle, recursive dealer timing via setting the timeouts, localStorage API

No external libraries or frameworks were used.

## AI Tools Used

- GitHub Copilot
- AI suggestions were reviewed, tested, and adapted to ensure correctness and to meet the specific game rules required.
- Claude for the games rules and also help with the planning of the project. 

## Challenges & Solutions

One of the trickier parts of building Blackjack was handling Ace values correctly. The solution was a handValue() function that initially counts every Ace as 11, then reduces the total by 10 for each Ace as long as the hand exceeds 21 — mimicking exactly how a real dealer would think through it. Animating the dealer's card draws required a recursive setTimeout approach, so each card appears sequentially with natural timing rather than all at once. Persisting the player's bankroll and stats across page refreshes was solved by serializing the full game state to localStorage after every hand, so nothing is ever lost on reload. Finally, keeping the card layout clean on mobile meant using Flexbox with flex-wrap on the hand containers, combined with media queries to scale card dimensions down on smaller screens. 

## Vercel Link 
- https://finalproject-silk-six.vercel.app/

