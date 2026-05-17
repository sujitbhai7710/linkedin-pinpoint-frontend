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
		<span class="current">Contact</span>
	</nav>
</div>

<div class="content-page container">
	<h1>Contact Us</h1>
	<p class="page-desc">Got a correction, a suggestion, or just want to say you nailed today's puzzle on clue one? We're here.</p>

	<h2>Get in Touch</h2>
	<p>Drop us an email and we'll get back to you. We read every message — whether it's a wrong answer report, a bug, a feature idea, or just feedback about the explanations. We're a small team, so we can't reply to everything, but we read all of it.</p>

	<div class="contact-card">
		<div class="contact-icon">
			<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
		</div>
		<h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">Email Us</h3>
		<p class="text-sm text-secondary" style="margin-bottom: 1rem;">The best way to reach us. We typically respond within 24-48 hours.</p>
		<a href="mailto:contact@pinpointanswertoday.online" class="contact-email">
			contact@pinpointanswertoday.online
		</a>
	</div>

	<h2>What We Want to Hear About</h2>
	<ul>
		<li><strong>Wrong answers</strong> — If we got something wrong, tell us. We'll fix it fast. Include the puzzle number and what the correct answer should be.</li>
		<li><strong>Bugs and broken things</strong> — If something on the site isn't working right, let us know what browser and device you're using. Screenshots help.</li>
		<li><strong>Feature ideas</strong> — Want a dark mode toggle? Better search? A way to track your streak? We can't promise we'll build everything, but good ideas get built faster when we know people want them.</li>
		<li><strong>General feedback</strong> — Love the explanations? Think they could be better? We're always tuning the content, and real feedback beats guesswork.</li>
	</ul>

	<h2>Other Ways</h2>
	<p>We don't have social media accounts for the site (keeping it simple). Email is the best way to get in touch. If you're a developer and want to contribute or report a technical issue, the <a href="https://github.com/sujitbhai7710/linkedin-pinpoint-frontend" target="_blank" rel="noopener noreferrer">GitHub repo</a> is open.</p>
</div>
