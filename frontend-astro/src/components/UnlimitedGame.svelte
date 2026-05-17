<script lang="ts">
  import { onMount } from 'svelte';

  let { allPuzzles, puzzleDataMap }: {
    allPuzzles: { number: number; date: string; clues: string[] }[];
    puzzleDataMap: Record<number, { answer: string; clues: string[] }>;
  } = $props();

  type RoundState = 'playing' | 'won' | 'lost';

  interface GameRound {
    number: number;
    answer: string;
    clues: string[];
    revealedClues: number;
    wrongGuesses: string[];
    state: RoundState;
  }

  interface LocalStats {
    currentStreak: number;
    bestStreak: number;
    solvedRounds: number;
    failedRounds: number;
  }

  const STOP_WORDS = new Set(['a','an','the','that','which','most','likely','all','of','in','on','at','by','for','to','from','with','within','into']);
  const GENERIC_WORDS = new Set(['item','items','thing','things','object','objects','category','categories','type','types','kind','kinds','group','groups']);

  function stripParens(text: string): string { return text.replace(/\([^)]*\)/g, '').trim(); }

  function normalize(text: string): string {
    return stripParens(text).toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/).map(w => w.trim())
      .filter(w => w.length > 0)
      .filter(w => !STOP_WORDS.has(w))
      .join(' ');
  }

  function depluralize(word: string): string {
    if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
    if (word.endsWith('ses') && word.length > 4) return word.slice(0, -2);
    if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) return word.slice(0, -1);
    return word;
  }

  function filterGeneric(words: string[]): string[] {
    return words.map(depluralize).filter(w => !GENERIC_WORDS.has(w));
  }

  function checkAnswer(guess: string, answer: string): boolean {
    const guessNorm = normalize(guess);
    const answerNorm = normalize(answer);
    if (guessNorm === answerNorm) return true;
    const guessDepluralized = filterGeneric(guessNorm.split(' ')).join(' ');
    const answerDepluralized = filterGeneric(answerNorm.split(' ')).join(' ');
    if (guessDepluralized === answerDepluralized) return true;
    const guessWords = filterGeneric(guessNorm.split(' '));
    const answerWords = filterGeneric(answerNorm.split(' '));
    if (guessWords.length >= 2 && answerWords.length >= 2) {
      const answerSet = new Set(answerWords);
      const matchCount = guessWords.filter(w => answerSet.has(w)).length;
      if (matchCount === guessWords.length && Math.abs(answerWords.length - guessWords.length) <= 1) return true;
    }
    return false;
  }

  // Deck management
  let deck: { number: number; clues: string[] }[] = [];
  let deckIndex = 0;

  function shuffleDeck() {
    const playablePuzzles = allPuzzles.filter(p => puzzleDataMap[p.number]);
    if (playablePuzzles.length === 0) { deck = []; return; }
    deck = [...playablePuzzles];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    deckIndex = 0;
  }

  // Session stats
  let sessionSolved = $state(0);
  let sessionFailed = $state(0);
  let totalCluesUsed = $state(0);
  let bestSolve = $state(5);

  let localStats = $state<LocalStats>({
    currentStreak: 0, bestStreak: 0, solvedRounds: 0, failedRounds: 0
  });

  function loadLocalStats() {
    try {
      const stored = localStorage.getItem('pinpoint-unlimited-local-stats');
      if (stored) localStats = JSON.parse(stored);
    } catch (e) { /* ignore */ }
  }

  function saveLocalStats() {
    try { localStorage.setItem('pinpoint-unlimited-local-stats', JSON.stringify(localStats)); }
    catch (e) { /* ignore */ }
  }

  let currentRound = $state<GameRound | null>(null);
  let guessInput = $state('');
  let loading = $state(false);

  function getAvgClues(): string {
    const total = sessionSolved;
    if (total === 0) return '-';
    return (totalCluesUsed / total).toFixed(1);
  }

  function startRound() {
    if (deckIndex >= deck.length) shuffleDeck();
    if (deck.length === 0) { currentRound = null; return; }
    const puzzleSummary = deck[deckIndex++];
    loading = true;

    let answer = '';
    let clues = puzzleSummary.clues;
    const puzzleData = puzzleDataMap[puzzleSummary.number];
    if (puzzleData) {
      answer = puzzleData.answer;
      clues = puzzleData.clues;
    } else {
      loading = false;
      startRound();
      return;
    }

    currentRound = {
      number: puzzleSummary.number,
      answer,
      clues,
      revealedClues: 1,
      wrongGuesses: [],
      state: 'playing'
    };
    loading = false;
    guessInput = '';
  }

  function submitGuess() {
    if (!currentRound || currentRound.state !== 'playing') return;
    const guess = guessInput.trim();
    if (!guess) return;

    if (checkAnswer(guess, currentRound.answer)) {
      currentRound.state = 'won';
      sessionSolved++;
      totalCluesUsed += currentRound.revealedClues;
      if (currentRound.revealedClues < bestSolve) bestSolve = currentRound.revealedClues;
      localStats.currentStreak++;
      localStats.solvedRounds++;
      if (localStats.currentStreak > localStats.bestStreak) localStats.bestStreak = localStats.currentStreak;
      saveLocalStats();
    } else {
      currentRound.wrongGuesses = [...currentRound.wrongGuesses, guess];
      if (currentRound.revealedClues < 5) {
        currentRound.revealedClues++;
      } else {
        currentRound.state = 'lost';
        sessionFailed++;
        localStats.currentStreak = 0;
        localStats.failedRounds++;
        saveLocalStats();
      }
    }
    guessInput = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') submitGuess();
  }

  // BUG FIX: Only initialize in onMount, NOT at module level
  onMount(() => {
    shuffleDeck();
    loadLocalStats();
    startRound();
  });
</script>

<div class="game-container">
  <div style="text-align:center; margin-bottom:1rem;">
    <h1 style="font-family:var(--font-serif); font-weight:400; font-size:clamp(1.4rem,3.5vw,2rem); margin-bottom:0.3rem;">LinkedIn Pinpoint Unlimited Game</h1>
    <p style="color:var(--text-muted); font-size:0.88rem; max-width:520px; margin:0 auto;">Practice <strong>Pinpoint</strong> puzzles anytime with unlimited rounds. Get better at spotting categories with random past puzzles, track your streak, and improve your daily solve rate.</p>
  </div>

  <div class="game-header">
    <span class="game-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      Pinpoint Unlimited Practice
    </span>
    {#if currentRound}
      <h2 style="margin-top:0.3rem;">LinkedIn Pinpoint #{currentRound.number}</h2>
      <p class="game-round-info">Revealed clues: {currentRound.revealedClues} / 5</p>
    {/if}
  </div>

  {#if loading}
    <div class="text-center" style="padding: 3rem 0;">
      <div class="loading-spinner" style="margin: 0 auto 0.75rem;"></div>
      <p style="color:var(--text-secondary);">Loading puzzle...</p>
    </div>
  {:else if currentRound}
    <!-- Clues -->
    <div class="game-clues">
      {#each currentRound.clues as clue, i}
        {#if i < currentRound.revealedClues}
          <div class="game-clue-card clue-{i + 1} revealed">
            <span class="game-clue-number">{i + 1}</span>
            <span class="game-clue-text">{clue}</span>
          </div>
        {:else}
          <div class="game-clue-card hidden-clue">
            <span class="game-clue-number">{i + 1}</span>
            <span class="game-clue-text">Clue {i + 1} — guess to reveal</span>
          </div>
        {/if}
      {/each}
    </div>

    {#if currentRound.state === 'playing'}
      <div class="game-guess-form">
        <input
          type="text"
          class="game-guess-input"
          placeholder="Type your guess..."
          bind:value={guessInput}
          onkeydown={handleKeydown}
          autocomplete="off"
        />
        <button class="game-guess-btn" onclick={submitGuess} disabled={!guessInput.trim()}>
          Guess
        </button>
      </div>

      <div class="game-hint-bar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
        Wrong guesses reveal the next clue. Use fewer clues for a better score!
      </div>

      {#if currentRound.wrongGuesses.length > 0}
        <div class="game-wrong-guesses">
          {#each currentRound.wrongGuesses as wrongGuess}
            <span class="wrong-guess-pill">{wrongGuess}</span>
          {/each}
        </div>
      {/if}
    {:else}
      <!-- Result -->
      <div class="game-result {currentRound.state}">
        <div class="game-result-icon">{currentRound.state === 'won' ? '🎉' : '😔'}</div>
        <h3>{currentRound.state === 'won' ? 'Correct!' : 'Not quite...'}</h3>
        <p class="result-answer">{currentRound.answer}</p>
        {#if currentRound.state === 'won'}
          <p style="font-size:0.85rem; color:var(--text-secondary);">Solved with {currentRound.revealedClues} clue{currentRound.revealedClues !== 1 ? 's' : ''}</p>
        {:else}
          <p style="font-size:0.85rem; color:var(--text-secondary);">Better luck on the next one!</p>
        {/if}
        <div class="game-result-actions">
          <button class="btn btn-primary" onclick={startRound}>Next Puzzle</button>
          <button class="btn btn-secondary" onclick={() => { deckIndex--; startRound(); }}>Retry</button>
        </div>
      </div>

      <!-- Session stats -->
      <div class="game-stats">
        <div class="game-stat-card">
          <div class="game-stat-value">{sessionSolved}</div>
          <div class="game-stat-label">Solved</div>
        </div>
        <div class="game-stat-card">
          <div class="game-stat-value">{sessionFailed}</div>
          <div class="game-stat-label">Failed</div>
        </div>
        <div class="game-stat-card">
          <div class="game-stat-value">{getAvgClues()}</div>
          <div class="game-stat-label">Avg Clues</div>
        </div>
        <div class="game-stat-card">
          <div class="game-stat-value">{bestSolve}</div>
          <div class="game-stat-label">Best</div>
        </div>
      </div>
    {/if}

    <!-- Streak stats -->
    <div class="game-session-stats">
      <div class="session-stat">
        <div class="session-stat-value">{localStats.currentStreak}</div>
        <div class="session-stat-label">Current Streak</div>
      </div>
      <div class="session-stat">
        <div class="session-stat-value">{localStats.bestStreak}</div>
        <div class="session-stat-label">Best Streak</div>
      </div>
      <div class="session-stat">
        <div class="session-stat-value">{localStats.solvedRounds}</div>
        <div class="session-stat-label">Total Solved</div>
      </div>
    </div>

    <div class="mt-3 text-center">
      <a href="/today" class="btn btn-ghost btn-sm">Play today's Pinpoint →</a>
    </div>
  {:else}
    <div class="text-center" style="padding: 3rem 0;">
      <h3>No puzzles available</h3>
      <p style="color:var(--text-secondary);">Check back later for more puzzles.</p>
    </div>
  {/if}
</div>
