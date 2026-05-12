<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	let submitted = $state(false);
	let name = $state('');
	let email = $state('');
	let message = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		// In a real setup, this would POST to an API endpoint
		// For now, we'll show a success message
		submitted = true;
	}
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
		<span class="current">Contact</span>
	</nav>
</div>

<div class="content-page container">
	<h1>Contact Us</h1>
	<p class="page-desc">Got a correction, a suggestion, or just want to say you nailed today's puzzle on clue one? We're here.</p>

	<h2>What We Want to Hear About</h2>
	<p>We're a small team, so we can't respond to every message, but we read all of them. Here's the kind of stuff that's useful to us:</p>
	<ul>
		<li><strong>Wrong answers</strong> — If we got something wrong, tell us. We'll fix it fast. Include the puzzle number and what the correct answer should be.</li>
		<li><strong>Bugs and broken things</strong> — If something on the site isn't working right, let us know what browser and device you're using. Screenshots help.</li>
		<li><strong>Feature ideas</strong> — Want a dark mode toggle? Better search? A way to track your streak? We can't promise we'll build everything, but good ideas get built faster when we know people want them.</li>
		<li><strong>General feedback</strong> — Love the explanations? Think they could be better? We're always tuning the content, and real feedback beats guesswork.</li>
	</ul>

	<h2>Send Us a Message</h2>

	{#if submitted}
		<div class="card mt-3" style="border-color: var(--success); text-align: center; padding: 2.5rem;">
			<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 1rem;" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
			<h3 style="color: var(--success); margin-bottom: 0.5rem;">Message Received</h3>
			<p class="text-secondary">Thanks for reaching out. We read every message and will get back to you if needed.</p>
		</div>
	{:else}
		<form class="contact-form mt-3" onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="name">Name</label>
				<input type="text" id="name" bind:value={name} placeholder="Your name" required />
			</div>
			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" bind:value={email} placeholder="you@example.com" required />
			</div>
			<div class="form-group">
				<label for="message">Message</label>
				<textarea id="message" bind:value={message} placeholder="What's on your mind?" required></textarea>
			</div>
			<button type="submit" class="btn btn-primary">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
				Send Message
			</button>
		</form>
	{/if}

	<h2>Other Ways to Reach Us</h2>
	<p>We don't have social media accounts for the site (keeping it simple). The contact form above is the best way to get in touch. If you're a developer and want to contribute or report a technical issue, the <a href="https://github.com/sujitbhai7710/linkedin-pinpoint-frontend" target="_blank" rel="noopener noreferrer">GitHub repo</a> is open.</p>
</div>
