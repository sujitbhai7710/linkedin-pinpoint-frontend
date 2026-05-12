<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/today', label: "Today's Answer" },
		{ href: '/archive', label: 'Archive' },
		{ href: '/about', label: 'About' }
	];
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
	<meta name="theme-color" content="#0b0f1a" />
	<meta name="color-scheme" content="dark" />
</svelte:head>

<div style="display:flex; flex-direction:column; min-height:100vh;">
	<header class="site-header">
		<div class="container header-inner">
			<a href="/" class="site-logo" aria-label="Pinpoint Answer Today - Home">
				<span class="logo-icon" aria-hidden="true">P</span>
				<span class="logo-text">Pinpoint Answers</span>
			</a>
			<nav class="nav-links" aria-label="Main navigation">
				{#each navItems as item}
					<a
						href={item.href}
						class={page.url.pathname === item.href ? 'active' : ''}
						aria-current={page.url.pathname === item.href ? 'page' : undefined}
					>
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<main class="page-content" id="main-content">
		{@render children()}
	</main>

	<footer class="site-footer">
		<div class="container">
			<div class="footer-inner">
				<div class="footer-brand">
					<a href="/" class="site-logo" aria-label="Pinpoint Answer Today - Home">
						<span class="logo-icon" aria-hidden="true">P</span>
						<span class="logo-text">Pinpoint Answers</span>
					</a>
					<p>Daily answers and explanations for LinkedIn Pinpoint. No fluff, no clickbait — just the answer, the clues, and a clear explanation of how they connect.</p>
				</div>
				<div class="footer-section">
					<h4>Puzzles</h4>
					<a href="/today">Today's Answer</a>
					<a href="/archive">Puzzle Archive</a>
				</div>
				<div class="footer-section">
					<h4>Site</h4>
					<a href="/about">About</a>
					<a href="/contact">Contact</a>
					<a href="/privacy">Privacy Policy</a>
				</div>
				<div class="footer-section">
					<h4>Resources</h4>
					<a href="/sitemap.xml">Sitemap</a>
				</div>
			</div>
			<div class="footer-bottom">
				<p>&copy; {new Date().getFullYear()} Pinpoint Answer Today. Not affiliated with LinkedIn or Microsoft.</p>
			</div>
		</div>
	</footer>
</div>
