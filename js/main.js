
const DEALER_PHRASES = {
  idle:    ["Good luck, player.", "Place your bet.", "Ready when you are.", "The cards await.", "Feeling lucky?"],
  deal:    ["Cards are dealt.", "Here we go.", "Good hand? We'll see.", "Show me what you've got.", "The game begins."],
  hit:     ["Bold move.", "Another card, eh?", "Brave.", "Sure about that?", "Taking a risk, I see."],
  stand:   ["Standing. Wise.", "Let's see how that plays out.", "Standing pat.", "Playing it safe.", "Interesting choice."],
  double:  ["Doubling down! Bold.", "Big bet. Big courage.", "All in on this one?", "High risk, high reward.", "A gambler's move."],
  win:     ["Well played!", "Nicely done.", "Congratulations.", "You got me.", "Fair play."],
  lose:    ["House wins.", "Better luck next time.", "Not today, friend.", "The house appreciates it.", "Tough hand."],
  bust:    ["Bust! Over 21.", "Too many cards.", "Went too far.", "Busted. Happens to the best.", "Just a bit over."],
  push:    ["We're even.", "A tie. How rare.", "Nobody wins, nobody loses.", "Perfect match."],
  blackjack_player: ["Impressive! Blackjack!", "The hand of a champion.", "Blackjack! Well done!", "3 to 2 for you."],
  blackjack_dealer: ["Dealer Blackjack.", "Not your day.", "The house has it.", "21 — dealer wins."],
  broke:   ["You've run out of chips.", "The house thanks you.", "Come back stronger.", "Easy come, easy go."]
};

function dealerSay(category) {
  const lines = DEALER_PHRASES[category] || DEALER_PHRASES.idle;
  const text = lines[Math.floor(Math.random() * lines.length)];
  const el = document.getElementById('dealer-speech');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('pop');
  void el.offsetWidth; // trigger reflow
  el.classList.add('pop');
}

function setDealerMouth(type) {
  ['mouth-neutral','mouth-smile','mouth-frown','mouth-surprised'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('mouth-' + type);
  if (target) target.style.display = '';
  const browSurprise = document.getElementById('brow-surprise');
  if (browSurprise) browSurprise.style.display = (type === 'surprised') ? '' : 'none';
  const sweat = document.getElementById('dealer-sweat');
  if (sweat) sweat.style.display = (type === 'frown') ? '' : 'none';
}

function dealerAnimate(type) {
  const svg = document.querySelector('.dealer-svg');
  if (!svg) return;
  svg.classList.remove('shake','bounce');
  void svg.offsetWidth;
  if (type === 'shake')  svg.classList.add('shake');
  if (type === 'bounce') svg.classList.add('bounce');
  svg.addEventListener('animationend', () => {
    svg.classList.remove('shake','bounce');
  }, {once: true});
}

function setPortraitGlow(type) {
  const portrait = document.querySelector('.dealer-portrait');
  if (!portrait) return;
  portrait.classList.remove('glow-win','glow-loss','glow-bj');
  if (type) portrait.classList.add('glow-' + type);
}

const SUITS  = ['♠', '♥', '♦', '♣'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const STARTING_BANKROLL = 1000;
const MAX_HISTORY_ROWS  = 50;
const LEADERBOARD_LIMIT = 10;
const LEADERBOARD_COLLECTION = 'leaderboard';

const cloudState = {
  isEnabled: false,
  isInitialized: false,
  auth: null,
  db: null,
  user: null,
  bestSyncedPeak: 0
};

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

function hasFirebaseConfig() {
  const c = window.FIREBASE_CONFIG;
  if (!c) return false;
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  return required.every(key => {
    const value = String(c[key] || '').trim();
    return value && !value.startsWith('YOUR_');
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPlayerName(user) {
  if (!user) return 'Guest';
  return user.displayName || user.email || `Player ${user.uid.slice(0, 6)}`;
}

function setAuthStatus(message, type = '') {
  const el = document.getElementById('auth-status');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('error', 'success');
  if (type) el.classList.add(type);
}

function updateAuthUi() {
  const signInBtn = document.getElementById('google-signin-btn');
  const signOutBtn = document.getElementById('google-signout-btn');
  const signedInUserEl = document.getElementById('signed-in-user');
  if (!signInBtn || !signOutBtn || !signedInUserEl) return;

  if (!cloudState.isEnabled) {
    signInBtn.disabled = true;
    signOutBtn.classList.add('hidden');
    signedInUserEl.textContent = 'Firebase not configured';
    return;
  }

  if (cloudState.user) {
    signInBtn.classList.add('hidden');
    signOutBtn.classList.remove('hidden');
    signInBtn.disabled = false;
    signedInUserEl.textContent = `Signed in as ${getPlayerName(cloudState.user)}`;
  } else {
    signInBtn.classList.remove('hidden');
    signOutBtn.classList.add('hidden');
    signInBtn.disabled = false;
    signedInUserEl.textContent = 'Sign in to submit your peak bankroll';
  }
}

async function signInWithGoogle() {
  if (!cloudState.auth) return;
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await cloudState.auth.signInWithPopup(provider);
    setAuthStatus('Signed in successfully.', 'success');
  } catch (error) {
    setAuthStatus(`Sign-in failed: ${error.message}`, 'error');
  }
}

async function signOutFromGoogle() {
  if (!cloudState.auth) return;
  try {
    await cloudState.auth.signOut();
    setAuthStatus('Signed out.', '');
  } catch (error) {
    setAuthStatus(`Sign-out failed: ${error.message}`, 'error');
  }
}

function setLeaderboardMessage(message) {
  const tbody = document.getElementById('leaderboard-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" class="empty-row">${escapeHtml(message)}</td></tr>`;
}

function formatCloudDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return 'Just now';
  return timestamp.toDate().toLocaleString();
}

async function fetchLeaderboard() {
  if (!cloudState.db) {
    setLeaderboardMessage('Enable Firebase to view global rankings.');
    return;
  }
  try {
    const snapshot = await cloudState.db
      .collection(LEADERBOARD_COLLECTION)
      .orderBy('peakBankroll', 'desc')
      .limit(LEADERBOARD_LIMIT)
      .get();
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

    if (snapshot.empty) {
      setLeaderboardMessage('No leaderboard entries yet. Be the first to set a peak bankroll.');
      return;
    }

    const rows = [];
    snapshot.forEach((doc, index) => {
      const data = doc.data() || {};
      const name = escapeHtml(data.displayName || data.email || `Player ${doc.id.slice(0, 6)}`);
      const peak = Number(data.peakBankroll || 0).toLocaleString();
      const isCurrent = cloudState.user && cloudState.user.uid === doc.id;
      rows.push(`
        <tr class="${isCurrent ? 'current-player' : ''}">
          <td>#${index + 1}</td>
          <td>${name}</td>
          <td>$${peak}</td>
          <td>${escapeHtml(formatCloudDate(data.updatedAt))}</td>
        </tr>
      `);
    });
    tbody.innerHTML = rows.join('');
  } catch (error) {
    setLeaderboardMessage(`Could not load leaderboard: ${error.message}`);
  }
}

async function syncSignedInUserRecord() {
  if (!cloudState.user || !cloudState.db) return;
  const docRef = cloudState.db.collection(LEADERBOARD_COLLECTION).doc(cloudState.user.uid);
  const docSnap = await docRef.get();
  const cloudPeak = docSnap.exists ? Number(docSnap.data().peakBankroll || 0) : 0;
  cloudState.bestSyncedPeak = cloudPeak;

  if (cloudPeak > state.stats.peakBankroll) {
    state.stats.peakBankroll = cloudPeak;
    saveData();
    renderStats();
  }

  await syncPeakBankrollToCloud();
}

async function syncPeakBankrollToCloud() {
  if (!cloudState.user || !cloudState.db) return;
  const localPeak = Number(state.stats.peakBankroll || 0);
  if (localPeak <= cloudState.bestSyncedPeak) return;

  try {
    await cloudState.db.collection(LEADERBOARD_COLLECTION).doc(cloudState.user.uid).set({
      uid: cloudState.user.uid,
      displayName: cloudState.user.displayName || 'Blackjack Player',
      email: cloudState.user.email || '',
      peakBankroll: localPeak,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    cloudState.bestSyncedPeak = localPeak;
  } catch (error) {
    console.warn('Could not sync peak bankroll:', error.message);
  }
}

function initCloudFeatures() {
  if (cloudState.isInitialized) return;
  cloudState.isInitialized = true;

  const signInBtn = document.getElementById('google-signin-btn');
  const signOutBtn = document.getElementById('google-signout-btn');
  const refreshBtn = document.getElementById('leaderboard-refresh-btn');
  if (signInBtn) signInBtn.addEventListener('click', signInWithGoogle);
  if (signOutBtn) signOutBtn.addEventListener('click', signOutFromGoogle);
  if (refreshBtn) refreshBtn.addEventListener('click', () => { void fetchLeaderboard(); });

  if (!window.firebase || !hasFirebaseConfig()) {
    setAuthStatus('Set your Firebase config to enable sign-in and global rankings.');
    updateAuthUi();
    setLeaderboardMessage('Enable Firebase to view global rankings.');
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
    }
    cloudState.auth = firebase.auth();
    cloudState.db = firebase.firestore();
    cloudState.isEnabled = true;
    setAuthStatus('Firebase ready. Sign in to publish your record.', 'success');
    updateAuthUi();

    cloudState.auth.onAuthStateChanged(async user => {
      cloudState.user = user;
      if (!user) cloudState.bestSyncedPeak = 0;
      updateAuthUi();
      if (user) {
        await syncSignedInUserRecord();
      }
      await fetchLeaderboard();
    });
  } catch (error) {
    cloudState.isEnabled = false;
    setAuthStatus(`Firebase setup error: ${error.message}`, 'error');
    updateAuthUi();
    setLeaderboardMessage('Firebase failed to initialize. Check your config values.');
  }
}

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

function addToBet(amount, chipEl) {
  if (state.phase !== 'betting') return;
  const remaining = state.bankroll - state.currentBet;
  if (remaining <= 0) {
    showBetHint("You can't bet more than your bankroll!");
    return;
  }
  state.currentBet += Math.min(amount, remaining);
  updateBetDisplay();
  clearBetHint();
  if (chipEl) {
    chipEl.classList.remove('toss');
    void chipEl.offsetWidth;
    chipEl.classList.add('toss');
    chipEl.addEventListener('animationend', () => chipEl.classList.remove('toss'), {once: true});
  }
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
  setDealerMouth('neutral');
  setPortraitGlow(null);
  dealerSay('deal');
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
  dealerSay('hit');
  state.playerHand.push(drawCard());
  renderHands(true);
  updateScores(true);
  document.getElementById('btn-double').disabled = true;
  if (handValue(state.playerHand) > 21) {
    renderHands(false);
    updateScores(false);
    setDealerMouth('smile');
    dealerAnimate('bounce');
    dealerSay('bust');
    resolveRound(false, false, true);
  }
}

function playerStand() {
  if (state.phase !== 'playing') return;
  dealerSay('stand');
  dealerPlay();
}

function playerDouble() {
  if (state.phase !== 'playing') return;
  dealerSay('double');
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

  const brEl = document.getElementById('bankroll-display');
  if (brEl) {
    brEl.classList.remove('bankroll-win','bankroll-loss');
    void brEl.offsetWidth;
    if (profit > 0) brEl.classList.add('bankroll-win');
    else if (profit < 0) brEl.classList.add('bankroll-loss');
    brEl.addEventListener('animationend', () => brEl.classList.remove('bankroll-win','bankroll-loss'), {once:true});
  }

  updateBankrollDisplay();

  if (playerBJ && !dealerBJ) {
    setDealerMouth('surprised');
    dealerAnimate('shake');
    setPortraitGlow('bj');
    dealerSay('blackjack_player');
  } else if (dealerBJ && !playerBJ) {
    setDealerMouth('smile');
    dealerAnimate('bounce');
    setPortraitGlow('win');
    dealerSay('blackjack_dealer');
  } else if (playerBJ && dealerBJ) {
    setDealerMouth('neutral');
    dealerSay('push');
  } else if (playerBust) {
    setDealerMouth('smile');
    dealerAnimate('bounce');
    setPortraitGlow('win');
    dealerSay('bust');
  } else if (result === 'win') {
    setDealerMouth('frown');
    dealerAnimate('shake');
    setPortraitGlow('loss');
    dealerSay('win');
  } else if (result === 'loss') {
    setDealerMouth('smile');
    dealerAnimate('bounce');
    setPortraitGlow('win');
    dealerSay('lose');
  } else {
    setDealerMouth('neutral');
    setPortraitGlow(null);
    dealerSay('push');
  }

  showPanel(state.bankroll <= 0 ? 'broke-panel' : 'round-over-panel');
  if (state.bankroll <= 0) dealerSay('broke');
  saveData();
  void syncPeakBankrollToCloud().then(() => fetchLeaderboard());
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
  setDealerMouth('neutral');
  setPortraitGlow(null);
  dealerSay('idle');
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
  const db = document.getElementById('dealer-score-badge');
  const pb = document.getElementById('player-score-badge');

  db.textContent = scoreLabel(state.dealerHand, hideHole);
  db.className = 'csbadge';
  if (!hideHole && state.dealerHand.length > 0) {
    if (handValue(state.dealerHand) > 21) db.classList.add('bust');
    else if (isBlackjack(state.dealerHand)) db.classList.add('bj');
  }

  if (state.playerHand.length > 0) {
    const pv = handValue(state.playerHand);
    pb.textContent = pv;
    pb.className = 'csbadge csbadge-player';
    if (pv > 21) pb.classList.add('bust');
    else if (isBlackjack(state.playerHand)) pb.classList.add('bj');
  }
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
  const val = state.currentBet.toLocaleString();
  document.getElementById('bet-display').textContent = val;
  const tv = document.getElementById('bet-token-val');
  if (tv) tv.textContent = val;
}

function updateBankrollDisplay() {
  const val = state.bankroll.toLocaleString();
  document.getElementById('bankroll-display').textContent = val;
  const el2 = document.getElementById('bankroll-display-2');
  if (el2) el2.textContent = val;
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
  document.querySelectorAll('.history-section .filter-btn[data-filter]').forEach(btn => {
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
    try {
      initCloudFeatures();
    } catch (error) {
      console.warn('Cloud features unavailable:', error.message);
      setLeaderboardMessage('Cloud features are temporarily unavailable.');
    }
    renderStats();
    renderHistory('all');
    void fetchLeaderboard();
    document.querySelectorAll('.history-section .filter-btn[data-filter]').forEach(btn => {
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
  showPanel(state.bankroll <= 0 ? 'broke-panel' : 'betting-panel');
  showView('home');
  // Start auth setup immediately so the navbar sign-in works from any view.
  setTimeout(() => {
    try {
      initCloudFeatures();
    } catch (error) {
      console.warn('Cloud init failed:', error.message);
    }
  }, 0);
  setTimeout(() => dealerSay('idle'), 300);
}

init();
