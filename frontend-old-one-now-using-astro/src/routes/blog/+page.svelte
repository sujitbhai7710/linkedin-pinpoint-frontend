<script lang="ts">
	import type { PageData } from './$types';
	import type { BlogPost } from '$lib/blog-data';

	let { data }: { data: PageData } = $props();

	let activeCategory = $state('All');
	let searchQuery = $state('');
	let openQuizItems = $state<Set<number>>(new Set());

	function toggleQuiz(index: number) {
		const next = new Set(openQuizItems);
		if (next.has(index)) {
			next.delete(index);
		} else {
			next.add(index);
		}
		openQuizItems = next;
	}

	let filteredPosts = $derived.by(() => {
		let posts = data.posts;
		if (activeCategory !== 'All') {
			posts = posts.filter((p: BlogPost) => p.category === activeCategory);
		}
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			posts = posts.filter((p: BlogPost) =>
				p.title.toLowerCase().includes(q) ||
				p.description.toLowerCase().includes(q) ||
				p.tags.some((t: string) => t.toLowerCase().includes(q))
			);
		}
		return posts;
	});

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
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

<div class="blog-page">
	<!-- Hero -->
	<section class="blog-hero">
		<div class="container">
			<div class="blog-hero-inner">
				<div class="hero-badge">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
					Blog
				</div>
				<h1>LinkedIn Pinpoint Blog</h1>
				<p>Strategies, explanations, and tips from hundreds of played puzzles. We break down what works, what doesn't, and why — so you can solve faster and have more fun doing it.</p>
			</div>
		</div>
	</section>

	<!-- Content -->
	<section class="section">
		<div class="container">
			<!-- Search -->
			<div class="blog-search">
				<input
					type="text"
					class="blog-search-input"
					placeholder="Search articles..."
					bind:value={searchQuery}
					aria-label="Search blog posts"
				/>
			</div>

			<!-- Category Filters -->
			<div class="blog-filters" role="tablist" aria-label="Filter by category">
				{#each data.categories as category}
					<button
						class="blog-filter-btn"
						class:active={activeCategory === category}
						onclick={() => activeCategory = category}
						role="tab"
						aria-selected={activeCategory === category}
					>
						{category}
					</button>
				{/each}
			</div>

			<!-- Blog Grid -->
			{#if filteredPosts.length > 0}
				<div class="blog-grid">
					{#each filteredPosts as post (post.slug)}
						<a href="/blog/{post.slug}" class="blog-card">
							<span class="blog-card-badge {post.category}">{post.category}</span>
							<h3>{post.title}</h3>
							<p>{post.description}</p>
							<div class="blog-card-meta">
								<span>{formatDate(post.date)}</span>
								<span>·</span>
								<span>{post.readTime}</span>
							</div>
							<span class="blog-card-read-more">
								Read More
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
							</span>
						</a>
					{/each}
				</div>
			{:else}
				<div class="blog-no-results">
					<h3>No articles found</h3>
					<p>Try a different search term or category filter.</p>
				</div>
			{/if}
		</div>
	</section>
</div>
