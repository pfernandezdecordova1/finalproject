const SUITS  = ['♠', '♥', '♦', '♣'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const STARTING_BANKROLL = 1000;
const MAX_HISTORY_ROWS  = 50;

let state = {
  deck:        [],
  playerHand:  [],
  dealerHand:  [],
  currentBet:  0,
  bankroll:    STARTING_BANKROLL,
  phase:       'betting',
  stats: {
    hands:        0,
    wins:         0,
    losses:       0,
    pushes:       0,
    streak:       0,
    bestStreak:   0,
    peakBankroll: STARTING_BANKROLL,
    history:      []
  }
};

function loadSavedData() {
  try {
    const saved = localStorage.getItem('mrBlackjackState');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.bankroll = parsed.bankroll ?? STARTING_BANKROLL;
      state.stats    = parsed.stats    ?? state.stats;
    }
    const savedTheme = localStorage.getItem('mrBlackjackTheme');
    if (savedTheme) applyTheme(savedTheme);
  } catch (e) {
    console.warn('Could not load saved data:', e.message);
  }
}

function saveData() {
  try {
    const toSave = { bankroll: state.bankroll, stats: state.stats };
    localStorage.setItem('mrBlackjackState', JSON.stringify(toSave));
  } catch (e) {
    console.warn('Could not save data:', e.message);
  }
}

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const value = rank === 'A'
        ? 11
        : ['J','Q','K'].includes(rank) ? 10
        : parseInt(rank, 10);
      deck.push({ rank, suit, value });
    }
  }
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function freshDeck() {
  return shuffle(createDeck());
}

function drawCard() {
  if (state.deck.length < 10) state.deck = freshDeck();
  return state.deck.pop();
}

function handValue(hand) {
  let total = 0;
  let aces  = 0;
  for (const card of hand) {
    total += card.value;
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function scoreLabel(hand, hideSecond = false) {
  if (hideSecond) {
    const first = hand[0];
    const v = first.value;
    return String(v === 11 ? 'A' : v);
  }
  const total = handValue(hand);
  const hardTotal = hand.reduce((s, c) => s + (c.rank === 'A' ? 1 : c.value), 0);
  if (hardTotal !== total && total <= 21) return `soft ${total}`;
  return String(total);
}

function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

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

function clearBet() {
  if (state.phase !== 'betting') return;
  state.currentBet = 0;
  updateBetDisplay();
  clearBetHint();
}

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

function dealHand() {
  if (state.phase !== 'betting') return;
  if (state.currentBet <= 0) {
    showBetHint('Place a bet before dealing!');
    return;
  }
  state.phase      = 'playing';
  state.deck       = freshDeck();
  state.playerHand = [drawCard(), drawCard()];
  state.dealerHand = [drawCard(), drawCard()];
  renderHands(true);
  updateScores(true);
  setMessage('');
  showPanel('action-panel');
  const playerBJ = isBlackjack(state.playerHand);
  const dealerBJ = isBlackjack(state.dealerHand);
  if (playerBJ || dealerBJ) {
    renderHands(false);
    updateScores(false);
    resolveRound(playerBJ, dealerBJ);
    return;
  }
  document.getElementById('btn-double').disabled = (state.currentBet > state.bankroll - state.currentBet);
}

function playerHit() {
  if (state.phase !== 'playing') return;
  state.playerHand.push(drawCard());
  renderHands(true);
  updateScores(true);
  document.getElementById('btn-double').disabled = true;
  if (handValue(state.playerHand) > 21) {
    renderHands(false);
    updateScores(false);
    resolveRound(false, false, true);
  }
}

function playerStand() {
  if (state.phase !== 'playing') return;
  dealerPlay();
}

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

function dealerPlay() {
  showPanel('');
  renderHands(false);
  updateScores(false);
  function dealerStep() {
    const total = handValue(state.dealerHand);
    if (total < 17) {
      state.dealerHand.push(drawCard());
      renderHands(false);
      updateScores(false);
      setTimeout(dealerStep, 550);
    } else {
      resolveRound(false, false, false);
    }
  }
  setTimeout(dealerStep, 700);
}

function resolveRound(playerBJ, dealerBJ, playerBust = false) {
  state.phase = 'roundOver';
  const pScore = handValue(state.playerHand);
  const dScore = handValue(state.dealerHand);
  const dealerBust = !playerBust && dScore > 21;
  let result, profit, message, msgColor;

  if (playerBJ && dealerBJ) {
    result = 'push'; profit = 0;
    message = '🤝 Push — Both Blackjack!'; msgColor = 'var(--push-color)';
  } else if (playerBJ) {
    profit = Math.floor(state.currentBet * 1.5); result = 'blackjack';
    message = '🃏 Blackjack! You win!'; msgColor = 'var(--bj-color)';
  } else if (dealerBJ) {
    profit = -state.currentBet; result = 'loss';
    message = '😔 Dealer Blackjack — You lose!'; msgColor = 'var(--loss-color)';
  } else if (playerBust) {
    profit = -state.currentBet; result = 'loss';
    message = `💥 Bust! (${pScore}) You lose!`; msgColor = 'var(--loss-color)';
  } else if (dealerBust) {
    profit = state.currentBet; result = 'win';
    message = `🎉 Dealer busts (${dScore})! You win!`; msgColor = 'var(--win-color)';
  } else if (pScore > dScore) {
    profit = state.currentBet; result = 'win';
    message = `🎉 You win! (${pScore} vs ${dScore})`; msgColor = 'var(--win-color)';
  } else if (dScore > pScore) {
    profit = -state.currentBet; result = 'loss';
    message = `😔 Dealer wins. (${dScore} vs ${pScore})`; msgColor = 'var(--loss-color)';
  } else {
    profit = 0; result = 'push';
    message = `🤝 Push! (${pScore} — tie)`; msgColor = 'var(--push-color)';
  }

  state.bankroll += profit;
  updateStats(result, profit);
  setMessage(message, msgColor);
  updateBankrollDisplay();
  showPanel(state.bankroll <= 0 ? 'broke-panel' : 'round-over-panel');
  saveData();
}

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
    s.streak = 0;
  }
  if (s.streak > s.bestStreak) s.bestStreak = s.streak;
  if (state.bankroll > s.peakBankroll) s.peakBankroll = state.bankroll;
  s.history.unshift({
    hand:        s.hands,
    result,
    playerScore: handValue(state.playerHand),
    dealerScore: handValue(state.dealerHand),
    bet:         state.currentBet,
    profit
  });
  if (s.history.length > MAX_HISTORY_ROWS) s.history = s.history.slice(0, MAX_HISTORY_ROWS);
}

function nextRound() {
  state.phase      = 'betting';
  state.currentBet = 0;
  state.playerHand = [];
  state.dealerHand = [];
  document.getElementById('dealer-hand').innerHTML = '';
  document.getElementById('player-hand').innerHTML = '';
  document.getElementById('dealer-score-badge').textContent = '';
  document.getElementById('player-score-badge').textContent = '';
  setMessage('');
  updateBetDisplay();
  showPanel('betting-panel');
  document.getElementById('btn-double').disabled = false;
}

function resetGame() {
  state.bankroll           = STARTING_BANKROLL;
  state.stats.peakBankroll = STARTING_BANKROLL;
  saveData();
  updateBankrollDisplay();
  nextRound();
}

function confirmResetStats() {
  if (confirm('Reset all statistics? Your current bankroll will be kept.')) {
    state.stats = {
      hands: 0, wins: 0, losses: 0, pushes: 0,
      streak: 0, bestStreak: 0,
      peakBankroll: state.bankroll,
      history: []
    };
    saveData();
    renderStats();
    renderHistory('all');
  }
}

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

function renderHands(hideHole) {
  const dealerEl = document.getElementById('dealer-hand');
  const playerEl = document.getElementById('player-hand');
  dealerEl.innerHTML = '';
  playerEl.innerHTML = '';
  state.dealerHand.forEach((card, i) => {
    dealerEl.appendChild(createCardElement(card, hideHole && i === 1));
  });
  state.playerHand.forEach(card => {
    playerEl.appendChild(createCardElement(card, false));
  });
}

function updateScores(hideHole) {
  document.getElementById('dealer-score-badge').textContent = scoreLabel(state.dealerHand, hideHole);
  document.getElementById('player-score-badge').textContent = handValue(state.playerHand);
}

function showPanel(panelId) {
  ['betting-panel','action-panel','round-over-panel','broke-panel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== panelId);
  });
}

function setMessage(msg, color = 'var(--text)') {
  const el = document.getElementById('message-banner');
  el.textContent = msg;
  el.style.color = color;
}

function updateBetDisplay() {
  document.getElementById('bet-display').textContent = state.currentBet.toLocaleString();
}

function updateBankrollDisplay() {
  document.getElementById('bankroll-display').textContent = state.bankroll.toLocaleString();
}

function renderStats() {
  const s = state.stats;
  const winRate = s.hands > 0 ? ((s.wins / s.hands) * 100).toFixed(1) + '%' : '—';
  document.getElementById('stat-bankroll').textContent   = '$' + state.bankroll.toLocaleString();
  document.getElementById('stat-hands').textContent      = s.hands.toLocaleString();
  document.getElementById('stat-wins').textContent       = s.wins.toLocaleString();
  document.getElementById('stat-losses').textContent     = s.losses.toLocaleString();
  document.getElementById('stat-pushes').textContent     = s.pushes.toLocaleString();
  document.getElementById('stat-win-pct').textContent    = winRate;
  document.getElementById('stat-streak').textContent     = streakLabel(s.streak);
  document.getElementById('stat-best-streak').textContent = s.bestStreak.toLocaleString();
  document.getElementById('stat-peak').textContent       = '$' + s.peakBankroll.toLocaleString();
}

function streakLabel(n) {
  if (n > 0) return `+${n} W`;
  if (n < 0) return `${n} L`;
  return '0';
}

function renderHistory(filter = 'all') {
  const tbody   = document.getElementById('history-body');
  const history = state.stats.history;
  const rows    = filter === 'all' ? history : history.filter(h => {
    if (filter === 'win')  return h.result === 'win' || h.result === 'blackjack';
    if (filter === 'loss') return h.result === 'loss';
    if (filter === 'push') return h.result === 'push';
    return true;
  });
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No hands to show.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(h => {
    const badgeClass = h.result === 'blackjack' ? 'badge-bj'
                     : h.result === 'win'       ? 'badge-win'
                     : h.result === 'push'      ? 'badge-push'
                     :                            'badge-loss';
    const label      = h.result === 'blackjack' ? 'BJ!' : h.result.charAt(0).toUpperCase() + h.result.slice(1);
    const profitClass = h.profit > 0 ? 'profit-pos' : h.profit < 0 ? 'profit-neg' : 'profit-neu';
    const profitStr   = h.profit > 0 ? `+$${h.profit}` : h.profit < 0 ? `-$${Math.abs(h.profit)}` : '$0';
    return `
      <tr>
        <td>${h.hand}</td>
        <td><span class="badge ${badgeClass}">${label}</span></td>
        <td>${h.playerScore}</td>
        <td>${h.dealerScore}</td>
        <td>$${h.bet.toLocaleString()}</td>
        <td class="${profitClass}">${profitStr}</td>
      </tr>`;
  }).join('');
}

function filterHistory(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderHistory(filter);
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(sec => {
    sec.classList.toggle('active', sec.id === `view-${viewName}`);
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `nav-${viewName}`);
    btn.setAttribute('aria-current', btn.id === `nav-${viewName}` ? 'page' : 'false');
  });
  if (viewName === 'stats') {
    renderStats();
    renderHistory('all');
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'casino' : 'dark';
  applyTheme(next);
  localStorage.setItem('mrBlackjackTheme', next);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  btn.textContent = theme === 'dark' ? '☀️ Casino Mode' : '🌙 Dark Mode';
}

document.addEventListener('keydown', e => {
  if (state.phase === 'playing') {
    if (e.key === 'h' || e.key === 'H') playerHit();
    if (e.key === 's' || e.key === 'S') playerStand();
    if (e.key === 'd' || e.key === 'D') {
      const btn = document.getElementById('btn-double');
      if (!btn.disabled) playerDouble();
    }
  }
  if (state.phase === 'betting' && (e.key === 'Enter' || e.key === ' ')) {
    if (state.currentBet > 0) dealHand();
  }
});

function init() {
  loadSavedData();
  updateBankrollDisplay();
  updateBetDisplay();
  showPanel('betting-panel');
  showView('home');
}

init();
