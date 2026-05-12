<script lang="ts">
	import { formatDate, renderExplanation } from '$lib/api';
	import { SITE_URL } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showAllSolutions = $state(false);
	const SOLUTIONS_PAGE_SIZE = 30;

	let displayedSolutions = $derived(
		data.today
			? showAllSolutions
				? data.today.solutions
				: data.today.solutions.slice(0, SOLUTIONS_PAGE_SIZE)
			: []
	);

	let hasMoreSolutions = $derived(
		data.today ? data.today.solutions.length > SOLUTIONS_PAGE_SIZE : false
	);
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
	<meta property="article:published_time" content={data.today?.date} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content={data.seo.twitterCard} />
	<meta name="twitter:title" content={data.seo.twitterTitle} />
	<meta name="twitter:description" content={data.seo.twitterDescription} />
	<meta name="twitter:image" content={data.seo.twitterImage} />

	<!-- JSON-LD -->
	{@html `<script type="application/ld+json">${data.seo.jsonLdString}</script>`}
</svelte:head>

{#if data.error && !data.today}
	<section class="section">
		<div class="container">
			<div class="error-state">
				<h3>Unable to load today's puzzle</h3>
				<p>{data.error}</p>
				<button class="btn btn-primary" onclick={() => window.location.reload()}>Try Again</button>
			</div>
		</div>
	</section>
{:else if data.today}
	<div class="container">
		<nav class="breadcrumbs" aria-label="Breadcrumb">
			<a href="/">Home</a>
			<span class="separator" aria-hidden="true">/</span>
			<span class="current">Today's Answer</span>
		</nav>
	</div>

	<article class="section" itemscope itemtype="https://schema.org/Article">
		<div class="container">
			<div class="article-layout">
				<div class="article-main fade-in">
					<header class="mb-3">
						<div class="inline-flex items-center gap-2 mb-2">
							<span class="badge badge-primary">Puzzle #{data.today.number}</span>
							<time datetime={data.today.date} class="text-sm text-secondary" itemprop="datePublished">
								{formatDate(data.today.date)}
							</time>
						</div>
						<h1 itemprop="headline">
							LinkedIn Pinpoint #{data.today.number} — Answer &amp; Explanation
						</h1>
					</header>

					<div class="answer-card" itemprop="mainEntity">
						<p class="answer-label">Today's Answer</p>
						<p class="answer-word" itemprop="name">{data.today.answer}</p>
						<p class="text-sm text-secondary mt-1">
							{data.today.totalSolutions} valid solution{data.today.totalSolutions !== 1 ? 's' : ''} found
						</p>
					</div>

					<section class="mt-4" aria-labelledby="clues-heading">
						<h2 id="clues-heading">5 Clues</h2>
						<ul class="clues-list mt-2" aria-label="Today's puzzle clues">
							{#each data.today.clues as clue, i}
								<li class="clue-item">
									<span class="clue-number" aria-label="Clue {i + 1}">{i + 1}</span>
									<span class="clue-text">{clue}</span>
								</li>
							{/each}
						</ul>
					</section>

					{#if data.today.explanation}
						<section class="mt-4" aria-labelledby="explanation-heading">
							<h2 id="explanation-heading">Explanation</h2>
							<div class="explanation-content mt-2" itemprop="articleBody">
								{@html renderExplanation(data.today.explanation)}
							</div>
						</section>
					{/if}

					<section class="mt-4" aria-labelledby="solutions-heading">
						<h2 id="solutions-heading">
							All Solutions
							<span class="text-sm font-semibold text-secondary">({data.today.solutions.length} words)</span>
						</h2>
						<div class="solutions-grid mt-2">
							{#each displayedSolutions as solution}
								<span class="solution-tag">{solution}</span>
							{/each}
						</div>
						{#if hasMoreSolutions && !showAllSolutions}
							<div class="mt-3 text-center">
								<button class="btn btn-secondary btn-sm" onclick={() => showAllSolutions = true}>
									Show All {data.today.solutions.length} Solutions
								</button>
							</div>
						{/if}
					</section>

					{#if data.yesterday}
						<div class="mt-4 card" style="border-left: 4px solid var(--color-primary-500);">
							<div class="inline-flex items-center gap-2 mb-1">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
								<h3 class="text-sm font-bold" style="margin:0;">Previous Puzzle</h3>
							</div>
							<p class="text-sm">
								<a href="/archive?date={data.yesterday.date}">
									Pinpoint #{data.yesterday.number} ({formatDate(data.yesterday.date)}) — Answer: <strong>{data.yesterday.answer}</strong>
								</a>
							</p>
						</div>
					{/if}
				</div>

				<aside class="sidebar">
					<div class="sidebar-card">
						<h3>Quick Links</h3>
						<div style="display:flex; flex-direction:column; gap:0.75rem;">
							<a href="/" class="btn btn-secondary btn-sm">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
								Home
							</a>
							<a href="/archive" class="btn btn-secondary btn-sm">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
								Browse Archive
							</a>
						</div>
					</div>

					<div class="sidebar-card mt-2">
						<h3>About Pinpoint</h3>
						<p class="text-sm text-secondary">
							LinkedIn Pinpoint is a daily word puzzle where you guess a word from 5 progressive clues. The fewer clues you need, the better you score!
						</p>
					</div>

					{#if data.today.solutions.length > 0}
						<div class="sidebar-card mt-2">
							<h3>Top Solutions</h3>
							<div class="solutions-grid">
								{#each data.today.solutions.slice(0, 10) as sol}
									<span class="solution-tag">{sol}</span>
								{/each}
							</div>
						</div>
					{/if}
				</aside>
			</div>
		</div>
	</article>
{/if}
