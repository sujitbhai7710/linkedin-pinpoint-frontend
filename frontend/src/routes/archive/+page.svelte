<script lang="ts">
        import { formatDate, formatDateShort, renderExplanation, loadSolutionsFromJson } from '$lib/api';
        import { onMount } from 'svelte';
        import type { PageData } from './$types';

        let { data }: { data: PageData } = $props();

        const today = new Date();
        let currentMonth = $state(today.getMonth());
        let currentYear = $state(today.getFullYear());
        let selectedDate = $state<string | null>(null);
        let selectedPuzzle = $state(null);
        let selectedError = $state<string | null>(null);
        let loadingPuzzle = $state(false);
        let answerRevealed = $state(false);

        // Handle ?date= query param client-side on mount (can't use url.searchParams during prerendering)
        onMount(() => {
                const params = new URLSearchParams(window.location.search);
                const dateParam = params.get('date');
                if (dateParam) {
                        selectDate(dateParam);
                }
        });

        // Solutions lazy loading state (initialized when a puzzle is selected)
        let allSolutions: string[] = $state([]);
        let totalSolutions: number = $state(0);
        let displayedCount: number = $state(10);
        let loadingSolutions = $state(false);
        let solutionsLoaded = $state(false);

        const SOLUTIONS_BATCH = 200;

        let displayedSolutions = $derived(allSolutions.slice(0, displayedCount));
        let hasMoreSolutions = $derived(displayedCount < allSolutions.length);
        let needsSolutionsLoad = $derived(totalSolutions > allSolutions.length && !solutionsLoaded);

        const MONTH_NAMES = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        let puzzleDates = $state<Set<string>>(new Set(Object.keys(data.puzzleDates)));

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
                        days.push({ date: dateStr, day, isCurrentMonth: false, hasPuzzle: puzzleDates.has(dateStr) });
                }

                for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        days.push({ date: dateStr, day, isCurrentMonth: true, hasPuzzle: puzzleDates.has(dateStr) });
                }

                const remaining = 42 - days.length;
                for (let day = 1; day <= remaining; day++) {
                        const month = currentMonth === 11 ? 0 : currentMonth + 1;
                        const year = currentMonth === 11 ? currentYear + 1 : currentYear;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        days.push({ date: dateStr, day, isCurrentMonth: false, hasPuzzle: puzzleDates.has(dateStr) });
                }

                return days;
        });

        let isCurrentMonth = $derived(
                currentMonth === today.getMonth() && currentYear === today.getFullYear()
        );

        function prevMonth() {
                if (currentMonth === 0) {
                        currentMonth = 11;
                        currentYear--;
                } else {
                        currentMonth--;
                }
        }

        function nextMonth() {
                if (currentMonth === 11) {
                        currentMonth = 0;
                        currentYear++;
                } else {
                        currentMonth++;
                }
        }

        async function selectDate(dateStr: string) {
                selectedDate = dateStr;
                selectedError = null;
                loadingPuzzle = true;
                answerRevealed = false;
                solutionsLoaded = false;

                try {
                        // Look up puzzle from the pre-loaded archive data
                        const puzzle = data.archiveFull.find(p => p.date === dateStr);
                        if (puzzle) {
                                selectedPuzzle = puzzle;
                                allSolutions = puzzle.solutions ?? [];
                                totalSolutions = puzzle.totalSolutions ?? 0;
                                displayedCount = 10;
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
                                if (heading) {
                                        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                        }, 150);
                }
        }

        async function loadAllSolutions() {
                if (!selectedPuzzle || solutionsLoaded) return;
                loadingSolutions = true;
                try {
                        const resp = await loadSolutionsFromJson(selectedPuzzle.number);
                        allSolutions = resp.solutions;
                        totalSolutions = resp.total;
                        displayedCount = Math.min(allSolutions.length, 10 + SOLUTIONS_BATCH);
                        solutionsLoaded = true;
                } catch (e) {
                        console.error('Failed to load solutions:', e);
                }
                loadingSolutions = false;
        }

        function showMoreSolutions() {
                if (needsSolutionsLoad) {
                        loadAllSolutions();
                        return;
                }
                displayedCount = Math.min(displayedCount + SOLUTIONS_BATCH, allSolutions.length);
        }

        function showAllSolutions() {
                if (needsSolutionsLoad) {
                        loadAllSolutions();
                        return;
                }
                displayedCount = allSolutions.length;
        }

        function isToday(dateStr: string): boolean {
                return dateStr === today.toISOString().split('T')[0];
        }
</script>

<svelte:head>
        <title>{data.seo.title}</title>
        <meta name="description" content={data.seo.description} />
        <meta name="keywords" content={data.seo.keywords} />
        <link rel="canonical" href={data.seo.canonical} />
        <meta property="og:title" content={data.seo.ogTitle} />
        <meta property="og:description" content={data.seo.ogDescription} />
        <meta property="og:image" content={data.seo.ogImage} />
        <meta property="og:url" content={data.seo.ogUrl} />
        <meta property="og:type" content={data.seo.ogType} />
        <meta property="og:site_name" content={data.seo.ogSiteName} />
        <meta name="twitter:card" content={data.seo.twitterCard} />
        <meta name="twitter:title" content={data.seo.twitterTitle} />
        <meta name="twitter:description" content={data.seo.twitterDescription} />
        <meta name="twitter:image" content={data.seo.twitterImage} />
        {@html `<script type="application/ld+json">${data.seo.jsonLdString}</script>`}
</svelte:head>

<div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
                <a href="/">Home</a>
                <span class="separator" aria-hidden="true">/</span>
                <span class="current">Archive</span>
        </nav>
</div>

<section class="section" aria-labelledby="archive-heading">
        <div class="container">
                <div class="section-header">
                        <h1 id="archive-heading">LinkedIn Pinpoint Puzzle Archive</h1>
                        <p class="text-secondary">Browse every past LinkedIn Pinpoint puzzle by date. Find answers, clues, and explanations for any puzzle ever published.</p>
                </div>

                <div class="archive-seo-intro" style="max-width:720px; margin-bottom:1.5rem;">
                        <p style="line-height:1.75; color:var(--text-secondary); font-size:0.92rem;">Our complete <strong>Pinpoint archive</strong> lets you revisit any daily puzzle from the past. Select a date on the calendar to view all five <strong>Pinpoint clues</strong>, the category answer, a full explanation of how the clues connect, and every valid alternative <strong>Pinpoint answer</strong> the game accepts.</p>
                </div>

                <div class="article-layout">
                        <div class="article-main">
                                <!-- Calendar -->
                                <div class="card" style="padding: 1rem;">
                                        <div class="calendar" role="grid" aria-label="Puzzle calendar">
                                                <div class="calendar-header">
                                                        <button class="calendar-nav-btn" onclick={prevMonth} aria-label="Previous month">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                                                        </button>
                                                        <h3>{MONTH_NAMES[currentMonth]} {currentYear}</h3>
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
                                                <p class="text-secondary">Loading puzzle...</p>
                                        </div>
                                {:else if selectedError}
                                        <div class="mt-3 error-state">
                                                <h3>{selectedError}</h3>
                                                <p class="text-secondary">Try picking a different date from the calendar.</p>
                                        </div>
                                {:else if selectedPuzzle}
                                        <article class="card mt-3" aria-labelledby="selected-puzzle-heading">
                                                <header class="mb-2">
                                                        <div class="inline-flex items-center gap-2 mb-1">
                                                                <span class="badge badge-primary">Puzzle #{selectedPuzzle.number}</span>
                                                                <time datetime={selectedPuzzle.date} class="text-sm text-secondary">
                                                                        {formatDate(selectedPuzzle.date)}
                                                                </time>
                                                        </div>
                                                        <h2 id="selected-puzzle-heading">LinkedIn Pinpoint #{selectedPuzzle.number}</h2>
                                                </header>

                                                <!-- Clues -->
                                                <section class="mt-2" aria-labelledby="selected-clues-heading">
                                                        <h3 id="selected-clues-heading" class="clues-heading">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                                                Clues
                                                        </h3>
                                                        <ul class="clues-list mt-2">
                                                                {#each selectedPuzzle.clues as clue, i}
                                                                        <li class="clue-item">
                                                                                <span class="clue-number">{i + 1}</span>
                                                                                <span class="clue-text">{clue}</span>
                                                                        </li>
                                                                {/each}
                                                        </ul>
                                                </section>

                                                <!-- REVEAL ANSWER BUTTON -->
                                                <div class="answer-reveal-wrapper">
                                                        {#if !answerRevealed}
                                                                <button class="answer-reveal-btn" onclick={() => answerRevealed = true}>
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                                        <div>Reveal Answer</div>
                                                                </button>
                                                        {:else}
                                                                <div class="answer-card">
                                                                        <p class="answer-label">Answer</p>
                                                                        <p class="answer-word">{selectedPuzzle.answer}</p>
                                                                </div>
                                                        {/if}
                                                </div>

                                                <!-- Explanation -->
                                                {#if selectedPuzzle.explanation}
                                                        <section class="mt-2" aria-labelledby="selected-explanation-heading">
                                                                <div class="explanation-section">
                                                                        <h3 id="selected-explanation-heading">
                                                                                <span class="icon-circle">
                                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                                                                </span>
                                                                                Explanation
                                                                        </h3>
                                                                        <div class="explanation-content">
                                                                                {@html renderExplanation(selectedPuzzle.explanation)}
                                                                        </div>
                                                                </div>
                                                        </section>
                                                {/if}

                                                <!-- Solutions — lazy loaded from static JSON -->
                                                {#if answerRevealed && totalSolutions > 0}
                                                        <section class="mt-2" aria-labelledby="selected-solutions-heading">
                                                                <h3 id="selected-solutions-heading">
                                                                        Solutions
                                                                        <span class="text-sm font-semibold text-secondary">
                                                                                ({displayedCount} of {totalSolutions}{#if needsSolutionsLoad || hasMoreSolutions} — click to load more{/if})
                                                                        </span>
                                                                </h3>
                                                                <div class="solutions-grid mt-2">
                                                                        {#each displayedSolutions as solution}
                                                                                <span class="solution-tag">{solution}</span>
                                                                        {/each}
                                                                </div>
                                                                {#if needsSolutionsLoad || hasMoreSolutions}
                                                                        <div class="mt-2" style="text-align:center;">
                                                                                {#if loadingSolutions}
                                                                                        <span class="text-secondary">Loading solutions...</span>
                                                                                {:else if needsSolutionsLoad}
                                                                                        <button class="btn btn-secondary btn-sm" onclick={loadAllSolutions}>
                                                                                                Load All {totalSolutions} Solutions
                                                                                        </button>
                                                                                {:else}
                                                                                        <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
                                                                                                <button class="btn btn-secondary btn-sm" onclick={showMoreSolutions}>
                                                                                                        Show More ({allSolutions.length - displayedCount} remaining)
                                                                                                </button>
                                                                                                <button class="btn btn-ghost btn-sm" onclick={showAllSolutions}>
                                                                                                        Show All {allSolutions.length}
                                                                                                </button>
                                                                                        </div>
                                                                                {/if}
                                                                        </div>
                                                                {/if}
                                                        </section>
                                                {:else if answerRevealed}
                                                        <section class="mt-2">
                                                                <div class="card" style="padding: 1rem; text-align: center; background: var(--accent-50); border: 1px dashed var(--accent-200);">
                                                                        <p style="color: var(--accent-700); margin: 0;">Alternative solutions will be available soon.</p>
                                                                </div>
                                                        </section>
                                                {/if}
                                        </article>
                                {:else}
                                        <!-- Show recent puzzles as cards -->
                                        <div class="mt-3">
                                                <h3 style="margin-bottom: 0.75rem;">Recent Puzzles</h3>
                                                <div class="archive-cards">
                                                        {#each data.archiveSummary.slice(0, 10) as puzzle}
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
                                        <h3>Recent Puzzles</h3>
                                        <div style="display:flex; flex-direction:column; gap:0.3rem;">
                                                {#each data.archiveSummary.slice(0, 10) as puzzle}
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
                                        <h3>Quick Links</h3>
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
        </div>
</section>
