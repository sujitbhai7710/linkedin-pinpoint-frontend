<script lang="ts">
  import { formatDate, formatDateShort } from '../lib/api';
  import ArchivePuzzleDetail from './ArchivePuzzleDetail.svelte';

  let { puzzleDates, archiveSummary, archiveFull }: {
    puzzleDates: Record<string, any>;
    archiveSummary: any[];
    archiveFull: any[];
  } = $props();

  const today = new Date();
  let currentMonth = $state(today.getMonth());
  let currentYear = $state(today.getFullYear());
  let selectedDate = $state<string | null>(null);
  let selectedPuzzle = $state<any>(null);
  let selectedError = $state<string | null>(null);
  let loadingPuzzle = $state(false);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let puzzleDatesSet = $state<Set<string>>(new Set(Object.keys(puzzleDates)));

  let calendarDays = $derived.by(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const days: { date: string; day: number; isCurrentMonth: boolean; hasPuzzle: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const month = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: dateStr, day, isCurrentMonth: false, hasPuzzle: puzzleDatesSet.has(dateStr) });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: dateStr, day, isCurrentMonth: true, hasPuzzle: puzzleDatesSet.has(dateStr) });
    }

    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const month = currentMonth === 11 ? 0 : currentMonth + 1;
      const year = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: dateStr, day, isCurrentMonth: false, hasPuzzle: puzzleDatesSet.has(dateStr) });
    }

    return days;
  });

  let isCurrentMonth = $derived(
    currentMonth === today.getMonth() && currentYear === today.getFullYear()
  );

  function prevMonth() {
    if (currentMonth === 0) { currentMonth = 11; currentYear--; }
    else { currentMonth--; }
  }

  function nextMonth() {
    if (currentMonth === 11) { currentMonth = 0; currentYear++; }
    else { currentMonth++; }
  }

  function selectDate(dateStr: string) {
    selectedDate = dateStr;
    selectedError = null;
    loadingPuzzle = true;

    // Keep URL clean — just /archive (no hash, no query params)
    // This avoids duplicate content SEO issues
    if (typeof window !== 'undefined') {
      if (window.location.hash || window.location.search) {
        window.history.replaceState(null, '', '/archive');
      }
    }

    try {
      const puzzle = archiveFull.find((p: any) => p.date === dateStr);
      if (puzzle) {
        selectedPuzzle = puzzle;
      } else {
        selectedPuzzle = null;
        selectedError = `No puzzle found for ${formatDate(dateStr)}`;
      }
    } catch (e) {
      selectedPuzzle = null;
      selectedError = `No puzzle found for ${formatDate(dateStr)}`;
    } finally {
      loadingPuzzle = false;
      setTimeout(() => {
        const heading = document.getElementById('selected-puzzle-heading');
        if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }

  function isToday(dateStr: string): boolean {
    return dateStr === today.toISOString().split('T')[0];
  }

  import { onMount } from 'svelte';
  onMount(() => {
    // Priority: 1) sessionStorage (from permalink redirect), 2) Hash fragment, 3) Query param
    let dateToOpen: string | null = null;

    // Check sessionStorage first (set by permalink redirect pages)
    try {
      const stored = sessionStorage.getItem('pinpoint-open-date');
      if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) {
        dateToOpen = stored;
        sessionStorage.removeItem('pinpoint-open-date'); // Clean up
      }
    } catch (e) { /* sessionStorage not available */ }

    // Check hash fragment
    if (!dateToOpen) {
      const hash = window.location.hash.slice(1);
      if (hash && /^\d{4}-\d{2}-\d{2}$/.test(hash)) {
        dateToOpen = hash;
      }
    }

    // Check query params (legacy support)
    if (!dateToOpen) {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('date') || params.get('d');
      if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        dateToOpen = dateParam;
      }
    }

    // Open the date if found, and clean up the URL
    if (dateToOpen) {
      // Clean URL: remove any hash or query params, show just /archive
      if (window.location.hash || window.location.search) {
        window.history.replaceState(null, '', '/archive');
      }
      selectDate(dateToOpen);
    }

    // Listen for hash changes (back/forward navigation)
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.slice(1);
      if (newHash && /^\d{4}-\d{2}-\d{2}$/.test(newHash) && newHash !== selectedDate) {
        selectDate(newHash);
      }
    });
  });
</script>

<div class="article-layout">
  <div class="article-main">
    <!-- Calendar -->
    <div class="card" style="padding: 1rem;">
      <div class="calendar" role="grid" aria-label="Puzzle calendar">
        <div class="calendar-header">
          <button class="calendar-nav-btn" onclick={prevMonth} aria-label="Previous month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
          <button class="calendar-nav-btn" onclick={nextMonth} disabled={isCurrentMonth} aria-label="Next month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="calendar-grid" role="rowgroup">
          {#each DAY_LABELS as label}
            <div class="calendar-day-label" role="columnheader">{label}</div>
          {/each}
          {#each calendarDays as day}
            <button
              class="calendar-day {!day.isCurrentMonth ? 'other-month' : ''} {day.hasPuzzle ? 'has-puzzle' : ''} {selectedDate === day.date ? 'selected' : ''} {isToday(day.date) ? 'today' : ''}"
              role="gridcell"
              aria-label="{formatDate(day.date)}{day.hasPuzzle ? ' - Puzzle available' : ''}"
              disabled={!day.hasPuzzle}
              onclick={() => day.hasPuzzle && selectDate(day.date)}
            >
              {day.day}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Selected Date Puzzle -->
    {#if loadingPuzzle}
      <div class="mt-3 text-center" style="padding: 2rem 0;">
        <div class="loading-spinner" style="margin: 0 auto 0.75rem;"></div>
        <p style="color:var(--text-secondary);">Loading puzzle...</p>
      </div>
    {:else if selectedError}
      <div class="mt-3 error-state">
        <h3>{selectedError}</h3>
        <p style="color:var(--text-secondary);">Try picking a different date from the calendar.</p>
      </div>
    {:else if selectedPuzzle}
      <ArchivePuzzleDetail puzzle={selectedPuzzle} />
    {:else}
      <!-- Show recent puzzles as cards -->
      <div class="mt-3">
        <h2 style="margin-bottom: 0.75rem;">Recent Puzzles</h2>
        <div class="archive-cards">
          {#each archiveSummary.slice(0, 10) as puzzle}
            <button
              class="archive-card"
              onclick={() => selectDate(puzzle.date)}
              style="cursor: pointer; border: 1px solid var(--border-light); text-align: left; width: 100%; background: white;"
            >
              <div class="archive-card-header">
                <span class="archive-card-number">#{puzzle.number}</span>
                <span class="archive-card-date">{formatDateShort(puzzle.date)}</span>
              </div>
              <div class="archive-card-clues">
                {#each puzzle.clues.slice(0, 3) as clue}
                  <span class="archive-clue-pill">{clue.length > 25 ? clue.slice(0, 25) + '...' : clue}</span>
                {/each}
              </div>
              <div class="archive-card-link">
                View Answer →
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <aside class="sidebar">
    <div class="sidebar-card">
      <h2>Recent Puzzles</h2>
      <div style="display:flex; flex-direction:column; gap:0.3rem;">
        {#each archiveSummary.slice(0, 10) as puzzle}
          <button
            class="btn btn-ghost btn-sm"
            style="justify-content: flex-start; text-align: left;"
            onclick={() => selectDate(puzzle.date)}
          >
            <span class="puzzle-number" style="margin-right: 0.4rem;">#{puzzle.number}</span>
            {formatDateShort(puzzle.date)}
          </button>
        {/each}
      </div>
    </div>

    <div class="sidebar-card mt-2">
      <h2>Quick Links</h2>
      <div style="display:flex; flex-direction:column; gap:0.4rem;">
        <a href="/" class="btn btn-secondary btn-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </a>
        <a href="/today" class="btn btn-secondary btn-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Today's Answer
        </a>
        <a href="/unlimited" class="btn btn-secondary btn-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Unlimited Game
        </a>
      </div>
    </div>
  </aside>
</div>
