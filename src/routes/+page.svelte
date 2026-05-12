<script lang="ts">
	import { formatDate, formatDateShort } from '$lib/api';
	import { SITE_URL } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Answer reveal state
	let answerRevealed = $state(false);

	// FAQ accordion state
	let openFaq = $state<number | null>(null);

	function toggleFaq(index: number) {
		openFaq = openFaq === index ? null : index;
	}

	const faqs = [
		{
			question: 'What is LinkedIn Pinpoint?',
			answer: 'LinkedIn Pinpoint is a daily word puzzle that lives inside LinkedIn\'s games section. You get five clues, revealed one at a time, and the goal is to guess the connecting word or category before all five clues are shown. Fewer clues needed means a better score. Think of it like a reverse trivia game — the answer ties everything together, and the clues just point the way.'
		},
		{
			question: 'How do I play LinkedIn Pinpoint?',
			answer: 'Head to the LinkedIn games section (look for the grid icon on the LinkedIn homepage or mobile app). Tap Pinpoint, and you\'ll see the first clue. Type your guess. If you\'re wrong, the next clue appears. Keep going until you get it. Most players try to solve it by clue two or three — getting it on the first clue is rare and usually lucky.'
		},
		{
			question: 'When do new puzzles come out?',
			answer: 'New Pinpoint puzzles drop daily at midnight. Our site updates by early afternoon each day with the answer, all five clues, and a full breakdown of how the clues connect to the solution. Bookmark this page and check back daily.'
		},
		{
			question: 'Are these answers accurate?',
			answer: 'Yes. We verify every answer before posting. The explanations break down each clue so you can see exactly why the answer fits. If we ever get something wrong (it happens — we\'re human), we correct it fast. Our track record is solid.'
		},
		{
			question: 'Can I check if my guess is a valid solution?',
			answer: 'Every Pinpoint puzzle has a list of valid alternative answers. On our Today\'s Answer page, you\'ll see all accepted solutions — not just the main one. If you typed something and the game rejected it, check our solutions list. You might have had a legit answer that the game just didn\'t accept.'
		},
		{
			question: 'Is this site affiliated with LinkedIn?',
			answer: 'No. We\'re an independent resource for people who play LinkedIn Pinpoint. We\'re not connected to, endorsed by, or affiliated with LinkedIn or Microsoft. We just like word puzzles and share answers daily.'
		}
	];
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

<section class="hero">
	<div class="container">
		<h1><span>LinkedIn Pinpoint</span> Answers</h1>
		<p class="hero-subtitle">
			Get today's answer instantly. Daily solutions, all five clues, full explanations, and every valid alternative word — updated every single day.
		</p>
		<div class="inline-flex gap-2 flex-wrap justify-center">
			<a href="/today" class="btn btn-primary btn-lg">
				<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
				Today's Answer
			</a>
			<a href="/archive" class="btn btn-secondary btn-lg">
				<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
				Browse Archive
			</a>
		</div>
	</div>
</section>

{#if data.today}
	<section class="section" aria-labelledby="today-heading">
		<div class="container">
			<div class="section-header">
				<h2 id="today-heading" class="section-title">Today's Puzzle — #{data.today.number}</h2>
				<span class="badge badge-primary">{formatDate(data.today.date)}</span>
			</div>

			<!-- Clues shown first, always visible -->
			<h3 class="mb-2">5 Clues</h3>
			<ul class="clues-list" aria-label="Today's puzzle clues">
				{#each data.today.clues as clue, i}
					<li class="clue-item">
						<span class="clue-number" aria-label="Clue {i + 1}">{i + 1}</span>
						<span class="clue-text">{clue}</span>
					</li>
				{/each}
			</ul>

			<!-- Answer hidden until click -->
			<div class="answer-reveal-wrapper">
				{#if !answerRevealed}
					<button class="answer-reveal-btn" onclick={() => answerRevealed = true}>
						<div class="reveal-icon">
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
						</div>
						<div class="reveal-text">Reveal Today's Answer</div>
						<div class="reveal-hint">Click to see the solution for puzzle #{data.today.number}</div>
					</button>
				{:else}
					<div class="answer-card">
						<p class="answer-label">Today's Answer</p>
						<p class="answer-word">{data.today.answer}</p>
						<p class="text-sm text-secondary mt-1">{data.today.totalSolutions} valid solution{data.today.totalSolutions !== 1 ? 's' : ''} found</p>
					</div>
				{/if}
			</div>

			<!-- Solutions only shown after answer reveal -->
			{#if answerRevealed}
				<section class="mt-3">
					<h3 class="mb-2">All Solutions</h3>
					<div class="solutions-grid">
						{#each data.today.solutions.slice(0, 24) as solution}
							<span class="solution-tag">{solution}</span>
						{/each}
						{#if data.today.solutions.length > 24}
							<a href="/today" class="solution-tag" style="border-color: var(--border-hover); color: var(--accent-400);">
								+{data.today.solutions.length - 24} more
							</a>
						{/if}
					</div>
				</section>
			{/if}

			<div class="mt-4 text-center">
				<a href="/today" class="btn btn-primary">
					Read Full Explanation
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
				</a>
			</div>
		</div>
	</section>
{:else if data.error}
	<section class="section">
		<div class="container">
			<div class="error-state">
				<h3>Couldn't load today's puzzle</h3>
				<p>{data.error}</p>
				<button class="btn btn-primary" onclick={() => window.location.reload()}>Try Again</button>
			</div>
		</div>
	</section>
{/if}

<hr class="section-divider" />

{#if data.recent.length > 0}
	<section class="section" aria-labelledby="recent-heading">
		<div class="container">
			<div class="section-header">
				<h2 id="recent-heading" class="section-title">Recent Puzzles</h2>
				<a href="/archive" class="btn btn-ghost btn-sm">View All →</a>
			</div>
			<div class="grid-3">
				{#each data.recent as puzzle}
					<a href="/archive?date={puzzle.date}" class="card card-interactive">
						<div class="inline-flex items-center gap-2 mb-1">
							<span class="puzzle-number">#{puzzle.number}</span>
							<span class="text-xs text-secondary">{formatDateShort(puzzle.date)}</span>
						</div>
						<p class="text-sm text-secondary mt-1">
							{puzzle.clues[0]?.slice(0, 70)}{puzzle.clues[0]?.length > 70 ? '...' : ''}
						</p>
						<p class="text-xs text-secondary mt-1">{puzzle.clues.length} clues</p>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<hr class="section-divider" />
{/if}

<section class="section" aria-labelledby="features-heading">
	<div class="container">
		<div class="section-header">
			<h2 id="features-heading" class="section-title">Why Pinpoint Answer Today?</h2>
		</div>
		<div class="feature-grid">
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
				</div>
				<h3>Daily Updates</h3>
				<p>New answer posted every day by early afternoon. No delays, no missing days.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
				</div>
				<h3>Full Explanations</h3>
				<p>Not just the answer — we break down how each clue connects to the solution.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
				</div>
				<h3>All Valid Solutions</h3>
				<p>Every accepted answer, not just one. See all the words the game recognizes as correct.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
				</div>
				<h3>Complete Archive</h3>
				<p>Browse every past puzzle by date. Calendar view makes it easy to find what you need.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
				</div>
				<h3>Spoiler-Safe</h3>
				<p>Answers are hidden behind a click. Browse clues without accidentally seeing the solution.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
				</div>
				<h3>Lightning Fast</h3>
				<p>Built for speed. Pages load in under a second on any connection, any device.</p>
			</div>
		</div>
	</div>
</section>

<hr class="section-divider" />

<section class="faq-section" aria-labelledby="faq-heading">
	<div class="container">
		<h2 id="faq-heading" class="section-title text-center mb-3">Frequently Asked Questions</h2>
		<div class="faq-list">
			{#each faqs as faq, i}
				<div class="faq-item {openFaq === i ? 'open' : ''}">
					<button class="faq-question" onclick={() => toggleFaq(i)} aria-expanded={openFaq === i}>
						<span>{faq.question}</span>
						<svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
					</button>
					<div class="faq-answer">
						<p>{faq.answer}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
