<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="keywords" content={data.seo.keywords} />
	<link rel="canonical" href={data.seo.canonical} />
	<meta property="og:title" content={data.seo.ogTitle} />
	<meta property="og:description" content={data.seo.ogDescription} />
	<meta property="og:url" content={data.seo.ogUrl} />
	<meta property="og:type" content={data.seo.ogType} />
	<meta property="og:site_name" content={data.seo.ogSiteName} />
	<meta name="twitter:card" content={data.seo.twitterCard} />
	<meta name="twitter:title" content={data.seo.twitterTitle} />
	<meta name="twitter:description" content={data.seo.twitterDescription} />
	{@html `<script type="application/ld+json">${data.seo.jsonLdString}</script>`}
</svelte:head>

<div class="container">
	<nav class="breadcrumbs" aria-label="Breadcrumb">
		<a href="/">Home</a>
		<span class="separator" aria-hidden="true">/</span>
		<span class="current">About</span>
	</nav>
</div>

<div class="content-page container">
	<h1>About Pinpoint Answer Today</h1>
	<p class="page-desc">We built this site because we kept Googling for LinkedIn Pinpoint answers and finding the same thing: clickbait titles, no explanations, and answers buried under twelve paragraphs of fluff. We figured we could do better.</p>

	<h2>What We Do</h2>
	<p>Every day, we publish the answer to that day's LinkedIn Pinpoint puzzle. That part is straightforward. What makes us different is the explanation — we don't just give you the word and call it done. We break down each clue, show how it connects to the answer, and walk through the solving process the way an actual person would think through it.</p>
	<p>If you've ever stared at clue three thinking "I know this, but I can't place it," then checked our site and had that satisfying click of recognition — that's exactly what we're going for. The explanation should feel like a friend sitting next to you saying "oh, come on, you know this one."</p>

	<h2>Who We Are</h2>
	<p>We're a small team of word puzzle enthusiasts who got hooked on LinkedIn Pinpoint shortly after it launched. Some of us are crossword people, some are Wordle diehards, and one person still does the newspaper jumble every morning (no judgment). The point is: we like word games, we like explaining things clearly, and we built the resource we wished existed.</p>
	<p>Pinpoint Answer Today is not affiliated with LinkedIn, Microsoft, or any of the game's creators. We're fans of the game, not employees of the company that makes it. Our answers come from playing the game ourselves and verifying everything before we publish.</p>

	<h2>How It Works</h2>
	<p>The daily pipeline goes like this: a new Pinpoint puzzle drops, we scrape the data, run it through an AI model that generates the explanation, and then our site rebuilds and deploys automatically. The whole thing takes a few minutes. You get the answer, all five clues, the full explanation, and a list of every valid alternative solution — not just the "official" one.</p>
	<p>We also keep a complete archive. Every past puzzle is accessible through our calendar view. Click any date, see the clues, reveal the answer. It's that simple.</p>

	<h2>Why Explanations Matter</h2>
	<p>Plenty of sites will tell you the answer. That's easy. The hard part — and the part worth doing — is explaining <em>why</em> it's the answer. Each clue in Pinpoint points to the same concept from a different angle. When you read through our explanations, you start seeing patterns: categories, associations, lateral connections. That makes you better at the game over time, not just better at checking answers.</p>
	<p>Think of it this way: giving someone the answer teaches them nothing. Showing them how the clues fit together teaches them something they can use tomorrow.</p>

	<h2>Accuracy</h2>
	<p>We verify every answer before it goes live. If we ever get something wrong, we fix it fast. The explanations are AI-generated but human-reviewed in the sense that we've tuned the prompts and structure over hundreds of puzzles to get consistently useful output. Are they perfect? No. Are they way better than "the answer is X, bye"? Absolutely.</p>

	<h2>Get in Touch</h2>
	<p>Found a mistake? Have a suggestion? Just want to say you solved it on clue one? <a href="/contact">Drop us a message</a>. We read everything.</p>
</div>
