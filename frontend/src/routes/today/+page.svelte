<script lang="ts">
        import { formatDate, renderExplanation, loadSolutionsFromJson } from '$lib/api';
        import { SITE_URL } from '$lib/seo';
        import type { PageData } from './$types';

        let { data }: { data: PageData } = $props();

        let answerRevealed = $state(false);

        // Solutions state: initial batch from JSON (first 10), rest lazy-loaded from static JSON
        const INITIAL_SHOW = 10;
        const BATCH_SIZE = 200;

        let allSolutions: string[] = $state(data.today?.solutions ?? []);
        let totalSolutions: number = $state(data.today?.totalSolutions ?? 0);
        let displayedCount: number = $state(INITIAL_SHOW);
        let loadingMore = $state(false);
        let allLoaded = $state(false);

        let displayedSolutions = $derived(
                allSolutions.slice(0, displayedCount)
        );

        let hasMoreToShow = $derived(
                displayedCount < allSolutions.length
        );

        let needsLazyLoad = $derived(
                totalSolutions > allSolutions.length && !allLoaded
        );

        let dateStr = $derived(
                data.today ? formatDate(data.today.date) : ''
        );

        async function loadAllSolutions() {
                if (!data.today || allLoaded) return;
                loadingMore = true;

                try {
                        // Load ALL solutions from the static JSON file — NO API call
                        const resp = await loadSolutionsFromJson(data.today.number);
                        if (resp.solutions.length > allSolutions.length) {
                                allSolutions = resp.solutions;
                                totalSolutions = resp.total;
                                displayedCount = Math.min(allSolutions.length, INITIAL_SHOW + BATCH_SIZE);
                        }
                        allLoaded = true;
                } catch (e) {
                        console.error('Failed to load solutions:', e);
                }

                loadingMore = false;
        }

        function showMore() {
                if (needsLazyLoad) {
                        loadAllSolutions();
                        return;
                }
                displayedCount = Math.min(displayedCount + BATCH_SIZE, allSolutions.length);
        }

        function showAll() {
                if (needsLazyLoad) {
                        loadAllSolutions();
                        return;
                }
                displayedCount = allSolutions.length;
        }
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
        <meta property="article:published_time" content={data.today?.date} />
        <meta name="twitter:card" content={data.seo.twitterCard} />
        <meta name="twitter:title" content={data.seo.twitterTitle} />
        <meta name="twitter:description" content={data.seo.twitterDescription} />
        <meta name="twitter:image" content={data.seo.twitterImage} />
        {@html `<script type="application/ld+json">${data.seo.jsonLdString}</script>`}
</svelte:head>

{#if data.error && !data.today}
        <section class="section">
                <div class="container">
                        <div class="error-state">
                                <h3>Couldn't load today's puzzle</h3>
                                <p>{data.error}</p>
                                <p style="color:var(--text-muted); font-size:0.85rem; margin-top:0.5rem;">The site updates daily after 1:30 PM IST. If it's before that time, check back soon!</p>
                        </div>
                </div>
        </section>
{:else if data.today}
        <div class="puzzle-page">
                <div class="container">
                        <div style="max-width:720px; margin:0 auto;">
                                <!-- Breadcrumbs -->
                                <nav class="breadcrumbs" aria-label="Breadcrumb">
                                        <a href="/">Home</a>
                                        <span class="separator" aria-hidden="true">/</span>
                                        <span class="current">Today's Answer</span>
                                </nav>

                                <!-- Puzzle Header -->
                                <div class="puzzle-header">
                                        <span class="badge badge-primary">Daily Puzzle</span>
                                        <h1>LinkedIn Pinpoint #{data.today.number} — {dateStr} Answer</h1>
                                </div>

                                <!-- Clues Section -->
                                <section aria-labelledby="clues-heading">
                                        <h2 id="clues-heading" class="clues-heading">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                                Pinpoint #{data.today.number} Clues
                                        </h2>
                                        <ul class="clues-list">
                                                {#each data.today.clues as clue, i}
                                                        <li class="clue-item">
                                                                <span class="clue-number">{i + 1}</span>
                                                                <span class="clue-text">{clue}</span>
                                                        </li>
                                                {/each}
                                        </ul>
                                </section>

                                <!-- REVEAL ANSWER BUTTON -->
                                <div class="answer-reveal-wrapper">
                                        {#if !answerRevealed}
                                                <button class="answer-reveal-btn" onclick={() => answerRevealed = true}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                        <div>Reveal Answer</div>
                                                </button>
                                        {:else}
                                                <div class="answer-card">
                                                        <p class="answer-label">Today's Answer</p>
                                                        <p class="answer-word">{data.today.answer}</p>
                                                </div>
                                        {/if}
                                </div>

                                <!-- Explanation -->
                                {#if data.today.explanation}
                                        <section class="explanation-section" aria-labelledby="explanation-heading">
                                                <h2 id="explanation-heading">
                                                        <span class="icon-circle">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                                        </span>
                                                        Explanation
                                                </h2>
                                                <div class="explanation-content" itemprop="articleBody">
                                                        {@html renderExplanation(data.today.explanation)}
                                                </div>
                                        </section>
                                {/if}

                                <!-- Solutions — shown after reveal, loaded from static JSON -->
                                {#if answerRevealed && totalSolutions > 0}
                                        <section class="mt-2" aria-labelledby="solutions-heading">
                                                <h2 id="solutions-heading">
                                                        All Solutions
                                                        <span class="text-sm font-semibold text-secondary">
                                                                ({displayedCount} of {totalSolutions} words{#if needsLazyLoad || hasMoreToShow} — click to load more{/if})
                                                        </span>
                                                </h2>
                                                <div class="solutions-grid mt-2">
                                                        {#each displayedSolutions as solution}
                                                                <span class="solution-tag">{solution}</span>
                                                        {/each}
                                                </div>

                                                <!-- Load More Section -->
                                                {#if needsLazyLoad || hasMoreToShow}
                                                        <div class="solutions-actions mt-3">
                                                                {#if loadingMore}
                                                                        <div class="solutions-loading">
                                                                                <div class="spinner"></div>
                                                                                <span>Loading {totalSolutions} solutions...</span>
                                                                        </div>
                                                                {:else if needsLazyLoad}
                                                                        <div class="solutions-load-buttons">
                                                                                <button class="btn btn-secondary btn-sm" onclick={showMore}>
                                                                                        Load All {totalSolutions} Solutions
                                                                                </button>
                                                                        </div>
                                                                {:else if hasMoreToShow}
                                                                        <div class="solutions-load-buttons">
                                                                                <button class="btn btn-secondary btn-sm" onclick={showMore}>
                                                                                        Show More ({allSolutions.length - displayedCount} remaining)
                                                                                </button>
                                                                                <button class="btn btn-ghost btn-sm" onclick={showAll}>
                                                                                        Show All {allSolutions.length}
                                                                                </button>
                                                                        </div>
                                                                {/if}
                                                        </div>
                                                {/if}
                                        </section>
                                {:else if answerRevealed}
                                        <section class="mt-2">
                                                <div class="card" style="padding: 1rem; text-align: center; background: var(--accent-50); border: 1px dashed var(--accent-200);">
                                                        <p style="color: var(--accent-700); margin: 0;">Alternative solutions will be available soon. Check back later for all valid answers!</p>
                                                </div>
                                        </section>
                                {/if}

                                <!-- Previous puzzle link -->
                                {#if data.yesterday}
                                        <div class="card mt-3" style="border-left: 3px solid var(--accent-500);">
                                                <div class="inline-flex items-center gap-2 mb-1">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                                                        <h3 class="text-sm font-bold" style="margin:0;">Previous Puzzle</h3>
                                                </div>
                                                <p class="text-sm">
                                                        <a href="/archive">
                                                                Pinpoint #{data.yesterday.number} ({formatDate(data.yesterday.date)}) — Answer: <strong>{data.yesterday.answer}</strong>
                                                        </a>
                                                </p>
                                        </div>
                                {/if}
                        </div>
                </div>
        </div>
{/if}

<style>
        .solutions-actions {
                text-align: center;
        }

        .solutions-load-buttons {
                display: flex;
                gap: 0.5rem;
                justify-content: center;
                flex-wrap: wrap;
        }

        .solutions-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                color: var(--text-secondary, #666);
                font-size: 0.9rem;
        }

        .spinner {
                width: 18px;
                height: 18px;
                border: 2px solid var(--accent-200, #ddd);
                border-top-color: var(--accent-600, #4f46e5);
                border-radius: 50%;
                animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
                to { transform: rotate(360deg); }
        }
</style>
