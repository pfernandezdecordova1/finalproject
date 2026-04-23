/**
 * Mr.Blackjack — main.js
 * ============================================================
 * Full blackjack game engine:
 *  - Deck creation and shuffling (Fisher-Yates)
 *  - Hand value calculation (soft/hard Ace logic)
 *  - Player actions: Hit, Stand, Double Down
 *  - Dealer AI (hit on ≤16, stand on ≥17)
 *  - Betting system with chip UI
 *  - Outcome detection (blackjack, bust, push)
 *  - Stats tracking with local storage persistence
 *  - History table with result filtering
 *  - Theme toggle (casino green / dark)
 * ============================================================
 */

// ──────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────
const SUITS  = ['♠', '♥', '♦', '♣'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const STARTING_BANKROLL = 1000;
const MAX_HISTORY_ROWS  = 50; // keep last 50 hands in localStorage

// ──────────────────────────────────────────────────────────────
// GAME STATE  (single source of truth)
// ──────────────────────────────────────────────────────────────
let state = {
  deck:        [],
  playerHand:  [],
  dealerHand:  [],
  currentBet:  0,
  bankroll:    STARTING_BANKROLL,
  phase:       'betting', // 'betting' | 'playing' | 'roundOver'
  stats: {
    hands:       0,
    wins:        0,
    losses:      0,
    pushes:      0,
    streak:      0,    // positive = win streak, negative = loss streak
    bestStreak:  0,
    peakBankroll: STARTING_BANKROLL,
    history:     []    // array of hand result objects
  }
};

// ──────────────────────────────────────────────────────────────
// LOCAL STORAGE — persist bankroll + stats
// ──────────────────────────────────────────────────────────────

/** Load saved data from localStorage and merge into state. */
function loadSavedData() {
  try {
    const saved = localStorage.getItem('mrBlackjackState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only restore bankroll and stats — deck/hands reset each visit
      state.bankroll = parsed.bankroll  ?? STARTING_BANKROLL;
      state.stats    = parsed.stats     ?? state.stats;
    }
    const savedTheme = localStorage.getItem('mrBlackjackTheme');
    if (savedTheme) applyTheme(savedTheme);
  } catch (e) {
    // If localStorage is unavailable or data is corrupt, start fresh
    console.warn('Could not load saved data:', e.message);
  }
}

/** Persist current bankroll and stats to localStorage. */
function saveData() {
  try {
    const toSave = {
      bankroll: state.bankroll,
      stats:    state.stats
    };
    localStorage.setItem('mrBlackjackState', JSON.stringify(toSave));
  } catch (e) {
    console.warn('Could not save data:', e.message);
  }
}

// ──────────────────────────────────────────────────────────────
// DECK MANAGEMENT
// ──────────────────────────────────────────────────────────────

/**
 * Build a fresh 52-card deck (4 suits × 13 ranks).
 * Each card is { rank, suit, value }
 */
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      // Ace is stored as 11; hand calculator handles soft/hard logic
      const value = rank === 'A'   ? 11
                  : ['J','Q','K'].includes(rank) ? 10
                  : parseInt(rank, 10);
      deck.push({ rank, suit, value });
    }
  }
  return deck;
}

/**
 * Shuffle an array in-place using the Fisher-Yates algorithm.
 * @param {Array} arr
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Return a new shuffled deck. */
function freshDeck() {
  return shuffle(createDeck());
}

/** Draw one card from the top of the deck. Reshuffles if needed. */
function drawCard() {
  if (state.deck.length < 10) {
    state.deck = freshDeck();
  }
  return state.deck.pop();
}

// ──────────────────────────────────────────────────────────────
// HAND VALUE CALCULATION
// ──────────────────────────────────────────────────────────────

/**
 * Calculate the best (highest non-busting) total for a hand.
 * Aces start as 11 and are reduced to 1 if needed.
 * @param {Array} hand  array of card objects
 * @returns {number}    best hand total
 */
function handValue(hand) {
  let total = 0;
  let aces  = 0;

  for (const card of hand) {
    total += card.value;
    if (card.rank === 'A') aces++;
  }

  // Reduce aces from 11 → 1 as long as we're busting
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

/**
 * Returns a display string for a hand's score,
 * e.g. "17" or "soft 17" when a flexible Ace is in play.
 * @param {Array} hand
 * @param {boolean} hideSecond  true when dealer's hole card is face-down
 * @returns {string}
 */
function scoreLabel(hand, hideSecond = false) {
  if (hideSecond) {
    // Show value of first card only
    const first = hand[0];
    const v = first.value; // Ace = 11
    return String(v === 11 ? 'A' : v);
  }
  const total = handValue(hand);
  // Detect "soft" total: hand has an Ace counted as 11
  const hardTotal = hand.reduce((s, c) => s + (c.rank === 'A' ? 1 : c.value), 0);
  if (hardTotal !== total && total <= 21) {
    return `soft ${total}`;
  }
  return String(total);
}

/** True if hand is a natural blackjack (21 on exactly 2 cards). */
function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

// ──────────────────────────────────────────────────────────────
// BETTING
// ──────────────────────────────────────────────────────────────

/**
 * Add a chip amount to the current bet.
 * Prevents betting more than the bankroll.
 * @param {number} amount  chip denomination
 */
function addToBet(amount) {
  if (state.phase !== 'betting') return;
  const remaining = state.bankroll - state.currentBet;
  if (remaining <= 0) {
    showBetHint("You can't bet more than your bankroll!");
    return;
  }
  state.currentBet += Math.min(amount, remaining);
  updateBetDisplay();
  clearBetHint();
}

/** Clear the current bet (set to 0). */
function clearBet() {
  if (state.phase !== 'betting') return;
  state.currentBet = 0;
  updateBetDisplay();
  clearBetHint();
}

/** Bet the entire remaining bankroll. */
function maxBet() {
  if (state.phase !== 'betting') return;
  state.currentBet = state.bankroll;
  updateBetDisplay();
  clearBetHint();
}

function showBetHint(msg) {
  document.getElementById('bet-hint').textContent = msg;
}
function clearBetHint() {
  document.getElementById('bet-hint').textContent = '';
}

// ──────────────────────────────────────────────────────────────
// DEAL — start a new round
// ──────────────────────────────────────────────────────────────

/** Deal initial 2 cards to each player and check for blackjacks. */
function dealHand() {
  if (state.phase !== 'betting') return;

  if (state.currentBet <= 0) {
    showBetHint('Place a bet before dealing!');
    return;
  }

  // Transition to playing phase
  state.phase = 'playing';
  state.deck   = freshDeck();

  // Deal: player, dealer, player, dealer (standard order)
  state.playerHand = [drawCard(), drawCard()];
  state.dealerHand = [drawCard(), drawCard()];

  renderHands(true); // dealer hole card face-down
  updateScores(true);
  setMessage('');
  showPanel('action-panel');

  // Check for immediate blackjacks
  const playerBJ = isBlackjack(state.playerHand);
  const dealerBJ = isBlackjack(state.dealerHand);

  if (playerBJ || dealerBJ) {
    // Reveal dealer immediately
    renderHands(false);
    updateScores(false);
    resolveRound(playerBJ, dealerBJ);
    return;
  }

  // Disable Double Down if player can't afford to double
  document.getElementById('btn-double').disabled = (state.currentBet > state.bankroll - state.currentBet);
}

// ──────────────────────────────────────────────────────────────
// PLAYER ACTIONS
// ──────────────────────────────────────────────────────────────

/** Player draws one more card. */
function playerHit() {
  if (state.phase !== 'playing') return;

  state.playerHand.push(drawCard());
  renderHands(true);
  updateScores(true);

  // Disable Double Down after first hit
  document.getElementById('btn-double').disabled = true;

  if (handValue(state.playerHand) > 21) {
    // BUST
    renderHands(false);
    updateScores(false);
    resolveRound(false, false, true); // bust flag
  }
}

/** Player keeps their hand; dealer plays. */
function playerStand() {
  if (state.phase !== 'playing') return;
  dealerPlay();
}

/**
 * Player doubles their bet and receives exactly one more card,
 * then the dealer plays.
 */
function playerDouble() {
  if (state.phase !== 'playing') return;

  const extraBet = Math.min(state.currentBet, state.bankroll - state.currentBet);
  state.currentBet += extraBet;
  updateBetDisplay();

  state.playerHand.push(drawCard());
  renderHands(true);
  updateScores(true);

  if (handValue(state.playerHand) > 21) {
    renderHands(false);
    updateScores(false);
    resolveRound(false, false, true);
    return;
  }

  dealerPlay();
}

// ──────────────────────────────────────────────────────────────
// DEALER AI
// ──────────────────────────────────────────────────────────────

/**
 * Simulate dealer play: hit on ≤16, stand on ≥17.
 * Reveal hole card first, then draw cards with a short delay each.
 */
function dealerPlay() {
  showPanel(''); // hide action buttons while dealer plays
  renderHands(false); // flip hole card
  updateScores(false);

  // Use a recursive timeout to animate each dealer draw
  function dealerStep() {
    const total = handValue(state.dealerHand);
    if (total < 17) {
      state.dealerHand.push(drawCard());
      renderHands(false);
      updateScores(false);
      setTimeout(dealerStep, 550); // 550ms between dealer draws
    } else {
      resolveRound(false, false, false);
    }
  }

  setTimeout(dealerStep, 700);
}

// ──────────────────────────────────────────────────────────────
// ROUND RESOLUTION
// ──────────────────────────────────────────────────────────────

/**
 * Determine the winner, pay out, and record results.
 * @param {boolean} playerBJ   player has natural blackjack
 * @param {boolean} dealerBJ   dealer has natural blackjack
 * @param {boolean} playerBust player went over 21
 */
function resolveRound(playerBJ, dealerBJ, playerBust = false) {
  state.phase = 'roundOver';

  const pScore = handValue(state.playerHand);
  const dScore = handValue(state.dealerHand);
  const dealerBust = !playerBust && dScore > 21;

  let result, profit, message, msgColor;

  if (playerBJ && dealerBJ) {
    // Both blackjack → push
    result  = 'push';
    profit  = 0;
    message = '🤝 Push — Both Blackjack!';
    msgColor = 'var(--push-color)';

  } else if (playerBJ) {
    // Natural blackjack pays 3:2
    profit  = Math.floor(state.currentBet * 1.5);
    result  = 'blackjack';
    message = '🃏 Blackjack! You win!';
    msgColor = 'var(--bj-color)';

  } else if (dealerBJ) {
    profit  = -state.currentBet;
    result  = 'loss';
    message = '😔 Dealer Blackjack — You lose!';
    msgColor = 'var(--loss-color)';

  } else if (playerBust) {
    profit  = -state.currentBet;
    result  = 'loss';
    message = `💥 Bust! (${pScore}) You lose!`;
    msgColor = 'var(--loss-color)';

  } else if (dealerBust) {
    profit  = state.currentBet;
    result  = 'win';
    message = `🎉 Dealer busts (${dScore})! You win!`;
    msgColor = 'var(--win-color)';

  } else if (pScore > dScore) {
    profit  = state.currentBet;
    result  = 'win';
    message = `🎉 You win! (${pScore} vs ${dScore})`;
    msgColor = 'var(--win-color)';

  } else if (dScore > pScore) {
    profit  = -state.currentBet;
    result  = 'loss';
    message = `😔 Dealer wins. (${dScore} vs ${pScore})`;
    msgColor = 'var(--loss-color)';

  } else {
    // Equal scores → push
    profit  = 0;
    result  = 'push';
    message = `🤝 Push! (${pScore} — tie)`;
    msgColor = 'var(--push-color)';
  }

  // Update bankroll
  state.bankroll += profit;

  // Update stats
  updateStats(result, profit);

  // Show outcome
  setMessage(message, msgColor);
  updateBankrollDisplay();

  // Show correct panel
  if (state.bankroll <= 0) {
    showPanel('broke-panel');
  } else {
    showPanel('round-over-panel');
  }

  // Persist
  saveData();
}

// ──────────────────────────────────────────────────────────────
// STATS
// ──────────────────────────────────────────────────────────────

/**
 * Record the result of a finished hand and update aggregate stats.
 * @param {string} result  'win' | 'blackjack' | 'loss' | 'push'
 * @param {number} profit  dollar change (positive = won, negative = lost)
 */
function updateStats(result, profit) {
  const s = state.stats;
  s.hands++;

  if (result === 'win' || result === 'blackjack') {
    s.wins++;
    s.streak = s.streak > 0 ? s.streak + 1 : 1;
  } else if (result === 'loss') {
    s.losses++;
    s.streak = s.streak < 0 ? s.streak - 1 : -1;
  } else {
    s.pushes++;
    // pushes break neither streak
    s.streak = 0;
  }

  if (s.streak > s.bestStreak) s.bestStreak = s.streak;
  if (state.bankroll > s.peakBankroll) s.peakBankroll = state.bankroll;

  // Record in history (most-recent first)
  s.history.unshift({
    hand:        s.hands,
    result,
    playerScore: handValue(state.playerHand),
    dealerScore: handValue(state.dealerHand),
    bet:         state.currentBet,
    profit
  });

  // Keep history under the cap
  if (s.history.length > MAX_HISTORY_ROWS) {
    s.history = s.history.slice(0, MAX_HISTORY_ROWS);
  }
}

// ──────────────────────────────────────────────────────────────
// NEXT ROUND / RESET
// ──────────────────────────────────────────────────────────────

/** Reset to betting phase for the next hand. */
function nextRound() {
  state.phase      = 'betting';
  state.currentBet = 0;
  state.playerHand = [];
  state.dealerHand = [];

  // Clear card areas
  document.getElementById('dealer-hand').innerHTML = '';
  document.getElementById('player-hand').innerHTML = '';
  document.getElementById('dealer-score-badge').textContent = '';
  document.getElementById('player-score-badge').textContent = '';

  setMessage('');
  updateBetDisplay();
  showPanel('betting-panel');

  // Re-enable Double Down button
  document.getElementById('btn-double').disabled = false;
}

/** Full game reset (player went broke). */
function resetGame() {
  state.bankroll       = STARTING_BANKROLL;
  state.stats.peakBankroll = STARTING_BANKROLL;
  saveData();
  updateBankrollDisplay();
  nextRound();
}

/**
 * Confirm and reset only stats (not bankroll).
 * Uses native confirm dialog for safety.
 */
function confirmResetStats() {
  if (confirm('Reset all statistics? Your current bankroll will be kept.')) {
    state.stats = {
      hands:        0,
      wins:         0,
      losses:       0,
      pushes:       0,
      streak:       0,
      bestStreak:   0,
      peakBankroll: state.bankroll,
      history:      []
    };
    saveData();
    renderStats();
    renderHistory('all');
  }
}

// ──────────────────────────────────────────────────────────────
// RENDERING — CARDS
// ──────────────────────────────────────────────────────────────

/**
 * Create a DOM element representing a playing card.
 * @param {Object}  card      { rank, suit, value }
 * @param {boolean} faceDown  show card back instead of face
 * @returns {HTMLElement}
 */
function createCardElement(card, faceDown = false) {
  const el = document.createElement('div');
  el.classList.add('card');
  el.setAttribute('role', 'listitem');

  if (faceDown) {
    el.classList.add('face-down');
    el.setAttribute('aria-label', 'Face-down card');
    el.innerHTML = `<span class="card-back-label" aria-hidden="true">🂠</span>`;
    return el;
  }

  const isRed = card.suit === '♥' || card.suit === '♦';
  el.classList.add(isRed ? 'red' : 'black');
  el.setAttribute('aria-label', `${card.rank} of ${card.suit}`);

  el.innerHTML = `
    <div class="card-corner top-left">
      <div class="card-rank">${card.rank}</div>
      <div class="card-suit-corner" aria-hidden="true">${card.suit}</div>
    </div>
    <div class="card-center-suit" aria-hidden="true">${card.suit}</div>
    <div class="card-corner bottom-right">
      <div class="card-rank">${card.rank}</div>
      <div class="card-suit-corner" aria-hidden="true">${card.suit}</div>
    </div>
  `;
  return el;
}

/**
 * Re-render both hands on the table.
 * @param {boolean} hideHole  when true, dealer's second card is face-down
 */
function renderHands(hideHole) {
  const dealerEl = document.getElementById('dealer-hand');
  const playerEl = document.getElementById('player-hand');

  dealerEl.innerHTML = '';
  playerEl.innerHTML = '';

  state.dealerHand.forEach((card, i) => {
    const faceDown = hideHole && i === 1;
    dealerEl.appendChild(createCardElement(card, faceDown));
  });

  state.playerHand.forEach(card => {
    playerEl.appendChild(createCardElement(card, false));
  });
}

/** Update the score badges above each hand. */
function updateScores(hideHole) {
  const dBadge = document.getElementById('dealer-score-badge');
  const pBadge = document.getElementById('player-score-badge');

  dBadge.textContent = scoreLabel(state.dealerHand, hideHole);
  pBadge.textContent = handValue(state.playerHand);
}

// ──────────────────────────────────────────────────────────────
// RENDERING — UI STATE
// ──────────────────────────────────────────────────────────────

/**
 * Show exactly one bottom panel at a time.
 * Pass '' or null to hide all panels.
 * @param {string} panelId
 */
function showPanel(panelId) {
  const panels = ['betting-panel', 'action-panel', 'round-over-panel', 'broke-panel'];
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== panelId);
  });
}

/**
 * Set the message banner text and optional colour.
 * @param {string} msg
 * @param {string} [color]  CSS colour value
 */
function setMessage(msg, color = 'var(--text)') {
  const el = document.getElementById('message-banner');
  el.textContent = msg;
  el.style.color = color;
}

/** Refresh bankroll and bet display in the game bar. */
function updateBetDisplay() {
  document.getElementById('bet-display').textContent = state.currentBet.toLocaleString();
}

function updateBankrollDisplay() {
  document.getElementById('bankroll-display').textContent = state.bankroll.toLocaleString();
}

// ──────────────────────────────────────────────────────────────
// RENDERING — STATS VIEW
// ──────────────────────────────────────────────────────────────

/** Populate all stat cards with current values. */
function renderStats() {
  const s = state.stats;
  const winRate = s.hands > 0
    ? ((s.wins / s.hands) * 100).toFixed(1) + '%'
    : '—';

  document.getElementById('stat-bankroll').textContent  = '$' + state.bankroll.toLocaleString();
  document.getElementById('stat-hands').textContent     = s.hands.toLocaleString();
  document.getElementById('stat-wins').textContent      = s.wins.toLocaleString();
  document.getElementById('stat-losses').textContent    = s.losses.toLocaleString();
  document.getElementById('stat-pushes').textContent    = s.pushes.toLocaleString();
  document.getElementById('stat-win-pct').textContent   = winRate;
  document.getElementById('stat-streak').textContent    = streakLabel(s.streak);
  document.getElementById('stat-best-streak').textContent = s.bestStreak.toLocaleString();
  document.getElementById('stat-peak').textContent      = '$' + s.peakBankroll.toLocaleString();
}

/** Format streak value: e.g. "+3 wins" / "-2 losses" / "0". */
function streakLabel(n) {
  if (n > 0) return `+${n} W`;
  if (n < 0) return `${n} L`;
  return '0';
}

// ──────────────────────────────────────────────────────────────
// RENDERING — HISTORY TABLE with filtering
// ──────────────────────────────────────────────────────────────

/**
 * Render the hand history table, optionally filtered by result.
 * @param {string} filter  'all' | 'win' | 'loss' | 'push'
 */
function renderHistory(filter = 'all') {
  const tbody = document.getElementById('history-body');
  const history = state.stats.history;

  // Apply filter
  const rows = filter === 'all'
    ? history
    : history.filter(h => {
        if (filter === 'win')  return h.result === 'win' || h.result === 'blackjack';
        if (filter === 'loss') return h.result === 'loss';
        if (filter === 'push') return h.result === 'push';
        return true;
      });

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No hands to show.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((h, i) => {
    const badgeClass = h.result === 'blackjack' ? 'badge-bj'
                     : h.result === 'win'       ? 'badge-win'
                     : h.result === 'push'      ? 'badge-push'
                     :                            'badge-loss';

    const label = h.result === 'blackjack' ? 'BJ!' : h.result.charAt(0).toUpperCase() + h.result.slice(1);

    const profitClass = h.profit > 0 ? 'profit-pos'
                      : h.profit < 0 ? 'profit-neg'
                      :                'profit-neu';

    const profitStr = h.profit > 0 ? `+$${h.profit}`
                    : h.profit < 0 ? `-$${Math.abs(h.profit)}`
                    :                '$0';

    return `
      <tr>
        <td>${h.hand}</td>
        <td><span class="badge ${badgeClass}">${label}</span></td>
        <td>${h.playerScore}</td>
        <td>${h.dealerScore}</td>
        <td>$${h.bet.toLocaleString()}</td>
        <td class="${profitClass}">${profitStr}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Called by filter buttons on the Stats page.
 * @param {string} filter
 */
function filterHistory(filter) {
  // Update active state on filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderHistory(filter);
}

// ──────────────────────────────────────────────────────────────
// VIEW SWITCHING
// ──────────────────────────────────────────────────────────────

/**
 * Show a named view and update nav highlight.
 * @param {string} viewName  'home' | 'game' | 'stats'
 */
function showView(viewName) {
  // Toggle view sections
  document.querySelectorAll('.view').forEach(sec => {
    sec.classList.toggle('active', sec.id === `view-${viewName}`);
  });

  // Toggle nav button active state
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `nav-${viewName}`);
    btn.setAttribute('aria-current', btn.id === `nav-${viewName}` ? 'page' : 'false');
  });

  // Refresh stats whenever the stats view is opened
  if (viewName === 'stats') {
    renderStats();
    renderHistory('all');
    // Reset filter buttons to 'all'
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
  }
}

// ──────────────────────────────────────────────────────────────
// THEME TOGGLE
// ──────────────────────────────────────────────────────────────

/** Switch between 'casino' and 'dark' themes. */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'casino' : 'dark';
  applyTheme(next);
  localStorage.setItem('mrBlackjackTheme', next);
}

/** Apply a theme name to the document root. */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  btn.textContent = theme === 'dark' ? '☀️ Casino Mode' : '🌙 Dark Mode';
}

// ──────────────────────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ──────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  // Only active during the playing phase
  if (state.phase === 'playing') {
    if (e.key === 'h' || e.key === 'H') playerHit();
    if (e.key === 's' || e.key === 'S') playerStand();
    if (e.key === 'd' || e.key === 'D') {
      const btn = document.getElementById('btn-double');
      if (!btn.disabled) playerDouble();
    }
  }
  // Deal with Enter/Space when in betting phase and a bet is set
  if (state.phase === 'betting' && (e.key === 'Enter' || e.key === ' ')) {
    if (state.currentBet > 0) dealHand();
  }
});

// ──────────────────────────────────────────────────────────────
// INITIALISATION
// ──────────────────────────────────────────────────────────────

/** Boot sequence — runs once when the page loads. */
function init() {
  loadSavedData();
  updateBankrollDisplay();
  updateBetDisplay();
  showPanel('betting-panel');
  showView('home');
}

// Kick everything off
init();
