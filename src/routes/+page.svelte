<script lang="ts">
	import { formatDate, formatDateShort, renderExplanation } from '$lib/api';
	import { SITE_URL } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="keywords" content={data.seo.keywords} />
	<link rel="canonical" href={data.seo.canonical} />

	<!-- Open Graph -->
	<meta property="og:title" content={data.seo.ogTitle} />
	<meta property="og:description" content={data.seo.ogDescription} />
	<meta property="og:image" content={data.seo.ogImage} />
	<meta property="og:url" content={data.seo.ogUrl} />
	<meta property="og:type" content={data.seo.ogType} />
	<meta property="og:site_name" content={data.seo.ogSiteName} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content={data.seo.twitterCard} />
	<meta name="twitter:title" content={data.seo.twitterTitle} />
	<meta name="twitter:description" content={data.seo.twitterDescription} />
	<meta name="twitter:image" content={data.seo.twitterImage} />

	<!-- JSON-LD -->
	{@html `<script type="application/ld+json">${data.seo.jsonLdString}</script>`}
</svelte:head>

<section class="hero">
	<div class="container">
		<h1><span>LinkedIn Pinpoint</span> Answers</h1>
		<p class="hero-subtitle">
			Get today's LinkedIn Pinpoint answer instantly. Daily solutions with clues, explanations, and full word lists — updated every day.
		</p>
		<div class="inline-flex gap-2 flex-wrap justify-center">
			<a href="/today" class="btn btn-primary">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
				Today's Answer
			</a>
			<a href="/archive" class="btn btn-secondary">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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

			<div class="answer-card fade-in">
				<p class="answer-label">Today's Answer</p>
				<p class="answer-word">{data.today.answer}</p>
				<p class="text-sm text-secondary mt-1">{data.today.totalSolutions} valid solution{data.today.totalSolutions !== 1 ? 's' : ''} found</p>
			</div>

			<div class="grid-2 mt-4">
				<div>
					<h3 class="mb-2">Clues</h3>
					<ul class="clues-list" aria-label="Puzzle clues">
						{#each data.today.clues as clue, i}
							<li class="clue-item">
								<span class="clue-number" aria-label="Clue {i + 1}">{i + 1}</span>
								<span class="clue-text">{clue}</span>
							</li>
						{/each}
					</ul>
				</div>
				<div>
					<h3 class="mb-2">All Solutions</h3>
					<div class="solutions-grid">
						{#each data.today.solutions.slice(0, 20) as solution}
							<span class="solution-tag">{solution}</span>
						{/each}
						{#if data.today.solutions.length > 20}
							<a href="/today" class="solution-tag" style="border-color: var(--color-primary-300); color: var(--color-primary-500);">
								+{data.today.solutions.length - 20} more
							</a>
						{/if}
					</div>
				</div>
			</div>

			<div class="mt-4 text-center">
				<a href="/today" class="btn btn-primary">
					Read Full Explanation
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
				</a>
			</div>
		</div>
	</section>
{:else if data.error}
	<section class="section">
		<div class="container">
			<div class="error-state">
				<h3>Unable to load today's puzzle</h3>
				<p>{data.error}</p>
				<button class="btn btn-primary" onclick={() => window.location.reload()}>Try Again</button>
			</div>
		</div>
	</section>
{/if}

{#if data.recent.length > 0}
	<section class="section" style="background: var(--color-bg-secondary);" aria-labelledby="recent-heading">
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
							{puzzle.clues[0]?.slice(0, 80)}{puzzle.clues[0]?.length > 80 ? '...' : ''}
						</p>
						<p class="text-xs text-secondary mt-1">{puzzle.clues.length} clues</p>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<section class="section" aria-labelledby="faq-heading">
	<div class="container" style="max-width: 800px;">
		<h2 id="faq-heading" class="section-title text-center mb-3">Frequently Asked Questions</h2>
		<div class="card mt-2">
			<h3>What is LinkedIn Pinpoint?</h3>
			<p class="mt-1">LinkedIn Pinpoint is a daily word puzzle game available on LinkedIn. Players are given five progressive clues and must guess the target word. The fewer clues you need, the better your score.</p>
		</div>
		<div class="card mt-2">
			<h3>How do I play LinkedIn Pinpoint?</h3>
			<p class="mt-1">Visit the LinkedIn games section and find Pinpoint. You'll see five clues revealed one at a time. Type your guess after each clue. The goal is to identify the word using as few clues as possible.</p>
		</div>
		<div class="card mt-2">
			<h3>When are new puzzles released?</h3>
			<p class="mt-1">New LinkedIn Pinpoint puzzles are released daily at midnight. Check our site each day for the latest answers and full explanations.</p>
		</div>
		<div class="card mt-2">
			<h3>Are these answers official?</h3>
			<p class="mt-1">Our answers are community-verified and updated daily. We provide the correct answer along with detailed explanations of how each clue relates to the solution.</p>
		</div>
	</div>
</section>
