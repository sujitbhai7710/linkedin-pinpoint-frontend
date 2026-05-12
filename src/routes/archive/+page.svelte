<script lang="ts">
	import { formatDate, formatDateShort, renderExplanation, searchByDate } from '$lib/api';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const today = new Date();
	let currentMonth = $state(today.getMonth());
	let currentYear = $state(today.getFullYear());
	let selectedDate = $state<string | null>(data.initialDate);
	let selectedPuzzle = $state(data.selectedPuzzle);
	let selectedError = $state(data.selectedError);
	let loadingPuzzle = $state(false);
	let showAllSolutions = $state(false);
	let answerRevealed = $state(false);

	const SOLUTIONS_PAGE_SIZE = 30;
	let displayedSolutions = $derived(
		selectedPuzzle
			? showAllSolutions
				? selectedPuzzle.solutions
				: selectedPuzzle.solutions.slice(0, SOLUTIONS_PAGE_SIZE)
			: []
	);
	let hasMoreSolutions = $derived(
		selectedPuzzle ? selectedPuzzle.solutions.length > SOLUTIONS_PAGE_SIZE : false
	);

	const MONTH_NAMES = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	let puzzleDates = $state<Set<string>>(new Set(Object.keys(data.puzzleDates)));

	let puzzleInfoByDate = $state<Record<string, { number: number; clues: string[] }>>(
		data.puzzleDates as Record<string, { number: number; clues: string[] }>
	);

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
		showAllSolutions = false;
		answerRevealed = false;

		const url = new URL(window.location.href);
		url.searchParams.set('date', dateStr);
		window.history.replaceState({}, '', url.toString());

		try {
			selectedPuzzle = await searchByDate(dateStr);
		} catch (e) {
			selectedPuzzle = null;
			selectedError = `No puzzle found for ${formatDate(dateStr)}`;
		} finally {
			loadingPuzzle = false;
		}
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
			<h1 id="archive-heading">Puzzle Archive</h1>
			<p class="text-secondary">Browse every past LinkedIn Pinpoint puzzle by date. Click a highlighted day to see the clues and answer.</p>
		</div>

		<div class="article-layout">
			<div class="article-main">
				<!-- Calendar -->
				<div class="card" style="padding: 1.5rem;">
					<div class="calendar" role="grid" aria-label="Puzzle calendar">
						<div class="calendar-header">
							<button
								class="calendar-nav-btn"
								onclick={prevMonth}
								aria-label="Previous month"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
							</button>
							<h3>{MONTH_NAMES[currentMonth]} {currentYear}</h3>
							<button
								class="calendar-nav-btn"
								onclick={nextMonth}
								disabled={isCurrentMonth}
								aria-label="Next month"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
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
					<div class="mt-3 text-center" style="padding: 3rem 0;">
						<div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
						<p class="text-secondary">Loading puzzle...</p>
					</div>
				{:else if selectedError}
					<div class="mt-3 error-state">
						<h3>{selectedError}</h3>
						<p class="text-secondary">Try picking a different date from the calendar.</p>
					</div>
				{:else if selectedPuzzle}
					<article class="card mt-3 fade-in" aria-labelledby="selected-puzzle-heading">
						<header class="mb-2">
							<div class="inline-flex items-center gap-2 mb-1">
								<span class="badge badge-primary">Puzzle #{selectedPuzzle.number}</span>
								<time datetime={selectedPuzzle.date} class="text-sm text-secondary">
									{formatDate(selectedPuzzle.date)}
								</time>
							</div>
							<h2 id="selected-puzzle-heading">LinkedIn Pinpoint #{selectedPuzzle.number}</h2>
						</header>

						<!-- Clues first -->
						<section class="mt-3" aria-labelledby="selected-clues-heading">
							<h3 id="selected-clues-heading">Clues</h3>
							<ul class="clues-list mt-2">
								{#each selectedPuzzle.clues as clue, i}
									<li class="clue-item">
										<span class="clue-number">{i + 1}</span>
										<span class="clue-text">{clue}</span>
									</li>
								{/each}
							</ul>
						</section>

						<!-- Answer hidden until click -->
						<div class="answer-reveal-wrapper">
							{#if !answerRevealed}
								<button class="answer-reveal-btn" onclick={() => answerRevealed = true}>
									<div class="reveal-icon">
										<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
									</div>
									<div class="reveal-text">Reveal Answer</div>
									<div class="reveal-hint">Click to see the solution for puzzle #{selectedPuzzle.number}</div>
								</button>
							{:else}
								<div class="answer-card">
									<p class="answer-label">Answer</p>
									<p class="answer-word">{selectedPuzzle.answer}</p>
									<p class="text-sm text-secondary mt-1">
										{selectedPuzzle.totalSolutions} valid solution{selectedPuzzle.totalSolutions !== 1 ? 's' : ''}
									</p>
								</div>
							{/if}
						</div>

						{#if answerRevealed && selectedPuzzle.explanation}
							<section class="mt-3" aria-labelledby="selected-explanation-heading">
								<h3 id="selected-explanation-heading">Explanation</h3>
								<div class="explanation-content mt-2">
									{@html renderExplanation(selectedPuzzle.explanation)}
								</div>
							</section>
						{/if}

						{#if answerRevealed}
							<section class="mt-3" aria-labelledby="selected-solutions-heading">
								<h3 id="selected-solutions-heading">
									Solutions
									<span class="text-sm font-semibold text-secondary">({selectedPuzzle.solutions.length})</span>
								</h3>
								<div class="solutions-grid mt-2">
									{#each displayedSolutions as solution}
										<span class="solution-tag">{solution}</span>
									{/each}
								</div>
								{#if hasMoreSolutions && !showAllSolutions}
									<div class="mt-2 text-center">
										<button class="btn btn-secondary btn-sm" onclick={() => showAllSolutions = true}>
											Show All {selectedPuzzle.solutions.length} Solutions
										</button>
									</div>
								{/if}
							</section>
						{/if}
					</article>
				{:else}
					<div class="mt-3 text-center" style="padding: 3rem 1rem;">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 1rem;" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
						<h3 class="text-secondary">Select a Date</h3>
						<p class="text-sm text-secondary mt-1">Click on a highlighted date in the calendar to view that day's puzzle.</p>
					</div>
				{/if}
			</div>

			<aside class="sidebar">
				<div class="sidebar-card">
					<h3>Recent Puzzles</h3>
					<div style="display:flex; flex-direction:column; gap:0.5rem;">
						{#each data.allPuzzles.slice(0, 10) as puzzle}
							<button
								class="btn btn-ghost btn-sm"
								style="justify-content: flex-start; text-align: left;"
								onclick={() => selectDate(puzzle.date)}
							>
								<span class="puzzle-number" style="margin-right: 0.5rem;">#{puzzle.number}</span>
								{formatDateShort(puzzle.date)}
							</button>
						{/each}
					</div>
				</div>

				<div class="sidebar-card mt-2">
					<h3>Quick Links</h3>
					<div style="display:flex; flex-direction:column; gap:0.625rem;">
						<a href="/" class="btn btn-secondary btn-sm">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
							Home
						</a>
						<a href="/today" class="btn btn-secondary btn-sm">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
							Today's Answer
						</a>
					</div>
				</div>
			</aside>
		</div>
	</div>
</section>
