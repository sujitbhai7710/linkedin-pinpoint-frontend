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
		<span class="current">Privacy Policy</span>
	</nav>
</div>

<div class="content-page container">
	<h1>Privacy Policy</h1>
	<p class="page-desc">Last updated: May 2026. We keep this short because privacy policies shouldn't need a law degree to understand.</p>

	<h2>What Data We Collect</h2>
	<p>Honestly, not much. We don't have user accounts. We don't ask you to sign up. We don't track you across the internet. Here's what we do collect:</p>
	<ul>
		<li><strong>Server logs</strong> — Like every website, our hosting provider (Cloudflare) logs basic request data: IP address, browser type, page URL, and timestamp. We use this for debugging and security, not for building a profile on you.</li>
		<li><strong>Contact form submissions</strong> — If you use our contact email, we store the name, email, and message you provide. We use it only to respond to your message and then delete it.</li>
	</ul>
	<p>That's it. No cookies for tracking. No analytics beyond basic server logs. No ad pixels.</p>

	<h2>What We Don't Do</h2>
	<p>Since this comes up a lot in privacy policies, here's an explicit list of things we don't do:</p>
	<ul>
		<li>Sell or share your personal data with anyone</li>
		<li>Use tracking cookies or third-party analytics (no Google Analytics, no Facebook Pixel)</li>
		<li>Build advertising profiles or audience segments</li>
		<li>Send you emails unless you explicitly contact us first</li>
		<li>Share data with data brokers, ad networks, or social media platforms</li>
	</ul>
	<p>If that changes — which it won't, but we're being thorough — we'll update this page and note the change date at the top.</p>

	<h2>Cookies</h2>
	<p>We use minimal cookies required for the site to function properly (session management, CSRF protection). We don't use tracking cookies, advertising cookies, or any third-party cookies. Your browser's "do not track" setting is respected by default since we don't track anything to begin with.</p>

	<h2>Third-Party Services</h2>
	<p>Our site is hosted on Cloudflare Pages. Cloudflare processes requests to serve the site and may log basic request data per their own privacy policy. We also load Google Fonts (Inter and Source Sans 3) from fonts.googleapis.com, which means Google's font CDN sees your IP address when your browser loads the font files. If you're concerned about this, you can block Google Fonts in your browser — the site still works with fallback fonts.</p>

	<h2>Data Retention</h2>
	<p>Server logs are rotated and deleted automatically by our hosting provider after a short period (typically 30 days or less). Contact form submissions are deleted after we've addressed the inquiry. We don't keep data longer than necessary.</p>

	<h2>Your Rights</h2>
	<p>Depending on where you live, you may have rights under data protection laws (GDPR, CCPA, etc.) to:</p>
	<ul>
		<li>Request access to any personal data we hold about you</li>
		<li>Request deletion of your personal data</li>
		<li>Object to processing of your personal data</li>
		<li>Request a copy of your data in a portable format</li>
	</ul>
	<p>Since we collect minimal data, most of these rights are straightforward. Contact us via our <a href="/contact">contact page</a> and we'll sort it out.</p>

	<h2>Children's Privacy</h2>
	<p>Our site is a general-audience resource about a word puzzle game. We don't knowingly collect personal information from children under 13. If you're a parent or guardian and believe your child has submitted data through our contact form, reach out and we'll delete it promptly.</p>

	<h2>Security</h2>
	<p>We use HTTPS everywhere, our infrastructure runs on Cloudflare (which includes DDoS protection and TLS encryption), and we don't store sensitive user data. Is anything perfectly secure on the internet? No. But we've taken reasonable measures for a site that doesn't collect much in the first place.</p>

	<h2>Changes to This Policy</h2>
	<p>If we ever change this privacy policy, we'll update the "Last updated" date at the top of this page. Substantive changes will be noted here. We won't silently rewrite it to give ourselves more rights to your data — that's a lousy thing to do.</p>

	<h2>Questions</h2>
	<p>Anything we didn't cover? <a href="/contact">Ask us</a>. We're happy to clarify.</p>
</div>
