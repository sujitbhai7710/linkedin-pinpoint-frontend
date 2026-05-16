<script lang="ts">
	import { formatDate, formatDateShort } from '$lib/api';
	import { SITE_URL } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let answerRevealed = $state(false);
	let openFaq = $state<number | null>(null);

	function toggleFaq(index: number) {
		openFaq = openFaq === index ? null : index;
	}

	const faqs = [
		{
			question: 'What is LinkedIn Pinpoint?',
			answer: 'LinkedIn Pinpoint is a daily word puzzle that lives inside LinkedIn\'s games section. You get five clues, revealed one at a time, and the goal is to guess the connecting word or category before all five clues are shown. Fewer clues needed means a better score.'
		},
		{
			question: 'How do I play LinkedIn Pinpoint?',
			answer: 'Head to the LinkedIn games section. Tap Pinpoint, and you\'ll see the first clue. Type your guess. If you\'re wrong, the next clue appears. Keep going until you get it. Most players try to solve it by clue two or three.'
		},
		{
			question: 'When do new puzzles come out?',
			answer: 'New Pinpoint puzzles drop daily at midnight. Our site updates by early afternoon each day with the answer, all five clues, and a full breakdown of how the clues connect to the solution.'
		},
		{
			question: 'Are these answers accurate?',
			answer: 'Yes. We verify every answer before posting. The explanations break down each clue so you can see exactly why the answer fits. If we ever get something wrong, we correct it fast — usually within the hour.'
		},
		{
			question: 'Is this site affiliated with LinkedIn?',
			answer: 'No. We\'re an independent resource for people who play LinkedIn Pinpoint. We\'re not connected to, endorsed by, or affiliated with LinkedIn or Microsoft.'
		},
		{
			question: 'Can I practice Pinpoint more than once a day?',
			answer: 'The daily puzzle is once per day on LinkedIn, but our Pinpoint Unlimited Game lets you practice with random past puzzles as many times as you want. It tracks your streak and average clues used — perfect for sharpening your skills.'
		},
		{
			question: 'Why are there multiple valid answers for some puzzles?',
			answer: 'LinkedIn Pinpoint accepts a specific set of words for each puzzle. Sometimes a synonym or close variant also works. We list every accepted solution, not just the main one, so you can see the full range of answers the game recognizes.'
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
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:url" content={data.seo.ogUrl} />
	<meta property="og:type" content={data.seo.ogType} />
	<meta property="og:site_name" content={data.seo.ogSiteName} />
	<meta name="twitter:card" content={data.seo.twitterCard} />
	<meta name="twitter:title" content={data.seo.twitterTitle} />
	<meta name="twitter:description" content={data.seo.twitterDescription} />
	<meta name="twitter:image" content={data.seo.twitterImage} />
	{@html `<script type="application/ld+json">${data.seo.jsonLdString}</script>`}
</svelte:head>

<!-- Hero Section with Card -->
<section class="hero">
	<div class="container">
		<div class="hero-grid">
			<!-- Left Content -->
			<div>
				<div class="hero-badge">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
					Daily Puzzle Answer
				</div>
				<h1>Today's LinkedIn Pinpoint {#if data.today}#{data.today.number}{/if} Answer</h1>
				<div class="hero-accent"></div>
				<p class="hero-desc">
					Get today's Pinpoint answer with all clues and a detailed explanation. We break down how each clue connects to the solution so you can improve your game.
				</p>
				<div class="hero-buttons">
					<a href="/today" class="btn btn-primary btn-lg">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
						View Today's Answer
					</a>
					<a href="/archive" class="btn btn-secondary btn-lg">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
						Browse Archive
					</a>
				</div>
				<div class="hero-stats">
					<div class="hero-stat">
						<div class="hero-stat-value">Daily</div>
						<div class="hero-stat-label">Updates</div>
					</div>
					<div class="hero-stat">
						<div class="hero-stat-value">100%</div>
						<div class="hero-stat-label">Verified</div>
					</div>
					<div class="hero-stat">
						<div class="hero-stat-value">Free</div>
						<div class="hero-stat-label">Access</div>
					</div>
				</div>
			</div>

			<!-- Right Card -->
			{#if data.today}
				<div class="hero-card-wrapper">
					<div class="hero-card-outer">
						<div class="hero-card-inner">
							<div class="hero-card-header">
								<h3>Pinpoint #{data.today.number} Clues</h3>
								<div class="date">{data.today.date}</div>
							</div>
							<div class="hero-card-clues">
								{#each data.today.clues as clue}
									<div class="hero-clue-chip">{clue}</div>
								{/each}
							</div>
							<div class="hero-card-footer">
								{#if !answerRevealed}
									<button class="hero-reveal-btn" onclick={() => answerRevealed = true}>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
										Click to reveal the answer
									</button>
								{:else}
									<div class="answer-card">
										<p class="answer-label">Today's Answer</p>
										<p class="answer-word">{data.today.answer}</p>
									</div>
								{/if}
								{#if answerRevealed}
									<a href="/today" class="hero-read-explanation">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
										Read Full Explanation
									</a>
								{:else}
									<div class="hero-hint">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
										The answer relates to professional networking and connections...
									</div>
								{/if}
							</div>
						</div>
					</div>
					<div class="hero-deco-top">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
					</div>
					<div class="hero-deco-bottom">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>
					</div>
				</div>
			{:else if data.error}
				<div class="hero-card-wrapper">
					<div class="hero-card-outer">
						<div class="hero-card-inner" style="padding:1.5rem; text-align:center;">
							<h3>Couldn't load today's puzzle</h3>
							<p class="text-sm text-secondary mt-2">{data.error}</p>
							<button class="btn btn-primary mt-3" onclick={() => window.location.reload()}>Try Again</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Recent Puzzles -->
{#if data.recent.length > 0}
	<section class="section section-white" aria-labelledby="recent-heading">
		<div class="container">
			<div class="section-header">
				<h2 id="recent-heading" class="section-title">Recent Puzzles</h2>
				<a href="/archive" class="btn btn-ghost btn-sm">View All →</a>
			</div>
			<div class="archive-cards">
				{#each data.recent as puzzle}
					<a href="/archive" class="archive-card">
						<div class="archive-card-header">
							<span class="archive-card-number">#{puzzle.number}</span>
							<span class="archive-card-date">{formatDateShort(puzzle.date)}</span>
						</div>
						<div class="archive-card-clues">
							{#each puzzle.clues.slice(0, 3) as clue}
								<span class="archive-clue-pill">{clue.length > 28 ? clue.slice(0, 28) + '...' : clue}</span>
							{/each}
						</div>
						<div class="archive-card-link">
							View Answer →
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Features Section — What Makes Us Different -->
<section class="section section-gray" aria-labelledby="features-heading">
	<div class="container">
		<div style="text-align:center; margin-bottom:1.25rem;">
			<h2 id="features-heading">Why Pinpoint Answer Today?</h2>
			<p style="color:var(--text-muted); max-width:540px; margin:0.4rem auto 0; font-size:0.9rem;">We play this game every day, just like you. Here's what we built that other answer sites don't bother with.</p>
		</div>
		<div class="feature-grid">
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
				</div>
				<h3>Daily Updates</h3>
				<p>New answer posted every day by early afternoon. No delays, no missing days. We've published consistently since launch.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
				</div>
				<h3>Full Explanations</h3>
				<p>Not just the answer — we break down how each clue connects to the solution. Walk through the solving process the way a real person thinks through it.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
				</div>
				<h3>All Valid Solutions</h3>
				<p>Every accepted answer, not just one. Some puzzles have dozens of valid words. We list them all so you know exactly what the game accepts.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
				</div>
				<h3>Complete Archive</h3>
				<p>Browse every past puzzle by date with our calendar view. Click any date, see the clues, read the explanation, check every solution.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon" style="background:var(--teal-50); color:var(--teal-500);">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
				</div>
				<h3>Unlimited Practice Game</h3>
				<p>The daily puzzle is once per day, but our <a href="/unlimited" style="color:var(--teal-600); text-decoration:underline;">Unlimited Game</a> lets you play random past puzzles endlessly. Track your streak, average clues, and best solve — all in your browser, no sign-up needed.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
				</div>
				<h3>Spoiler-Safe</h3>
				<p>Answers are hidden behind a click. Browse clues without accidentally seeing the solution. You control when the answer appears.</p>
			</div>
		</div>
	</div>
</section>

<!-- Unlimited Game Spotlight -->
<section class="section section-white" aria-labelledby="game-heading">
	<div class="container">
		<div class="game-spotlight">
			<div class="game-spotlight-content">
				<span class="badge badge-teal" style="margin-bottom:0.5rem;">
					<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
					Practice Mode
				</span>
				<h2 id="game-heading">Pinpoint Unlimited — Play As Many Rounds As You Want</h2>
				<p>The daily LinkedIn Pinpoint puzzle is one round per day. That's it. If you want more — and most regular players do — our <strong>Pinpoint Unlimited Game</strong> is built for exactly that. It pulls from our complete archive of hundreds of past puzzles, shuffles them randomly, and lets you play round after round. Every wrong guess reveals the next clue, just like the real game. Your current streak, best streak, average clues used, and total solved are all tracked right in your browser.</p>
				<p>We built this because we got tired of waiting 24 hours between puzzles. If you're the kind of person who finishes the daily puzzle and immediately wants another one, this is for you. It's free, it works on any device, and there's no sign-up or account required.</p>
				<div style="margin-top:1rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
					<a href="/unlimited" class="btn btn-primary">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
						Play Unlimited Now
					</a>
					<a href="/how-to-play" class="btn btn-secondary">Learn Strategies</a>
				</div>
			</div>
			<div class="game-spotlight-aside">
				<div class="sidebar-card">
					<h3>How It Works</h3>
					<ul style="padding-left:1rem; margin:0.5rem 0 0;">
						<li style="margin:0.3rem 0; color:var(--text-secondary); font-size:0.85rem;">Random puzzles from our archive</li>
						<li style="margin:0.3rem 0; color:var(--text-secondary); font-size:0.85rem;">5 progressive clues per round</li>
						<li style="margin:0.3rem 0; color:var(--text-secondary); font-size:0.85rem;">Wrong guess reveals next clue</li>
						<li style="margin:0.3rem 0; color:var(--text-secondary); font-size:0.85rem;">Streak and stats tracked locally</li>
						<li style="margin:0.3rem 0; color:var(--text-secondary); font-size:0.85rem;">Free, no sign-up required</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- FAQ Section -->
<section class="faq-section section-gray" aria-labelledby="faq-heading">
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

<!-- SEO Content Section — Keyword-rich, E-E-A-T optimized static content -->
<section class="section section-white seo-content-section" aria-labelledby="seo-heading">
	<div class="container">
		<div class="seo-content-grid">
			<div class="seo-content-main">
				<h2 id="seo-heading">Your Daily Pinpoint Answer Today — All Clues, All Solutions, Full Explanations</h2>
				<p>Looking for today's LinkedIn Pinpoint answer? You are in the right place. We publish the complete <strong>Pinpoint answer today</strong> with every clue explained in plain language, every valid alternative solution listed, and a detailed breakdown of how each clue connects to the category. Whether you are stuck on clue one or just want to verify your guess after solving, our daily updates give you everything you need — typically posted by early afternoon every single day without fail.</p>
				<p>We built this site because we were tired of answer sites that give you the word and nothing else. No explanation, no context, no list of valid alternatives. Just "the answer is X" and a page full of ads. We do it differently: each puzzle gets a full <strong>Pinpoint clue</strong> analysis, a walkthrough of the solving process, and a lessons-learned section so you can spot similar patterns faster next time. That's what we wanted as players, so that's what we built.</p>

				<h3>What Makes a Great Pinpoint Clue?</h3>
				<p>Each <strong>Pinpoint clue</strong> is designed to point toward a single connecting word or category. The first clue is intentionally vague — it could fit dozens of answers. As more clues are revealed, the possibilities narrow. By clue four or five, the answer becomes obvious to most players. The skill lies in recognizing the pattern early, and that's something you can practice. Our explanations break down each clue so you can see exactly how the puzzle designer intended the connection, helping you spot similar patterns in future puzzles and improve your solve rate over time.</p>

				<h3>Browse Every Pinpoint Answer in Our Archive</h3>
				<p>Our <strong>Pinpoint archive</strong> contains every past puzzle, organized by date with a convenient calendar view. Want to revisit last week's puzzle? Curious about how a particular clue was structured? The archive lets you browse any date, view all five clues, read the full explanation, and see every accepted <strong>Pinpoint answer</strong> — not just the primary solution but every word the game recognizes as correct. This is especially useful if you typed a valid answer that was rejected and want to understand why, or if you want to study patterns across dozens of puzzles to sharpen your skills for the daily challenge.</p>

				<h3>All Valid Pinpoint Answers, Not Just One</h3>
				<p>One of the biggest frustrations players face is typing a perfectly reasonable answer that the game does not accept. That is because Pinpoint has a specific set of accepted <strong>Pinpoint answers</strong> for each puzzle, and sometimes your synonym or alternative phrasing is not in that list. We show you every single accepted word for each puzzle — sometimes there are dozens. This transparency helps you understand the game's vocabulary and makes future solves easier because you learn which types of words the game tends to accept. No more guessing whether your alternative answer would have worked.</p>

				<h3>Practice With Pinpoint Unlimited</h3>
				<p>One daily puzzle not enough? Our <a href="/unlimited" style="color:var(--accent-600); text-decoration:underline;">Pinpoint Unlimited Game</a> lets you play random historical puzzles as many times as you want. Each round gives you five progressive clues — wrong guesses reveal the next one, just like the real game. Your streak, average clues used, and best solve are tracked in your browser. It's the fastest way to get better at recognizing clue patterns and category associations, and it's completely free with no account needed.</p>

				<h3>Why Players Trust Our Answers</h3>
				<p>We verify every answer before publishing. Our team plays each puzzle on LinkedIn, confirms the official answer, and cross-checks the full list of accepted solutions. The explanations are generated using AI but reviewed for accuracy and readability — we've refined our process over hundreds of puzzles to produce consistently useful, specific content. If we ever make a mistake, readers report it and we fix it fast, usually within the hour. That track record is why players come back daily rather than switching to sites that just dump the answer with no context.</p>
			</div>
			<aside class="seo-content-sidebar">
				<div class="sidebar-card">
					<h3>Quick Access</h3>
					<div style="display:flex; flex-direction:column; gap:0.4rem;">
						<a href="/today" class="btn btn-secondary btn-sm">Today's Pinpoint Answer</a>
						<a href="/archive" class="btn btn-secondary btn-sm">Pinpoint Archive</a>
						<a href="/unlimited" class="btn btn-secondary btn-sm">Unlimited Practice</a>
						<a href="/how-to-play" class="btn btn-secondary btn-sm">How to Play</a>
					</div>
				</div>
				<div class="sidebar-card mt-2">
					<h3>Why Players Trust Us</h3>
					<ul style="padding-left:1rem; margin:0;">
						<li>100% verified daily answers</li>
						<li>All valid solutions listed</li>
						<li>Detailed clue-by-clue explanations</li>
						<li>Updated every day by early afternoon</li>
						<li>Free access, no sign-up required</li>
						<li>Spoiler-safe reveal buttons</li>
						<li>Unlimited practice game</li>
						<li>Errors corrected within the hour</li>
					</ul>
				</div>
				<div class="sidebar-card mt-2">
					<h3>Last Updated</h3>
					<p style="font-size:0.82rem; color:var(--text-secondary); margin:0;">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
					<p style="font-size:0.75rem; color:var(--text-muted); margin:0.25rem 0 0;">Answers verified against the official LinkedIn Pinpoint game.</p>
				</div>
			</aside>
		</div>
	</div>
</section>
