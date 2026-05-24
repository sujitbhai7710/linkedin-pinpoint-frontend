<script lang="ts">
  import { formatDate, renderExplanation, loadSolutionsFromJson } from '../lib/api';

  let { puzzle }: { puzzle: any } = $props();

  let answerRevealed = $state(false);
  let allSolutions: string[] = $state(puzzle.solutions ?? []);
  let totalSolutions: number = $state(puzzle.totalSolutions ?? 0);
  let displayedCount: number = $state(10);
  let loadingSolutions = $state(false);
  let solutionsLoaded = $state(false);
  const SOLUTIONS_BATCH = 200;

  let displayedSolutions = $derived(allSolutions.slice(0, displayedCount));
  let hasMoreSolutions = $derived(displayedCount < allSolutions.length);
  let needsSolutionsLoad = $derived(totalSolutions > allSolutions.length && !solutionsLoaded);

  async function loadAllSolutions() {
    if (!puzzle || solutionsLoaded) return;
    loadingSolutions = true;
    try {
      const resp = await loadSolutionsFromJson(puzzle.number);
      allSolutions = resp.solutions;
      totalSolutions = resp.total;
      displayedCount = Math.min(allSolutions.length, 10 + SOLUTIONS_BATCH);
      solutionsLoaded = true;
    } catch (e) {
      console.error('Failed to load solutions:', e);
    }
    loadingSolutions = false;
  }

  function showMoreSolutions() {
    if (needsSolutionsLoad) { loadAllSolutions(); return; }
    displayedCount = Math.min(displayedCount + SOLUTIONS_BATCH, allSolutions.length);
  }

  function showAllSolutions() {
    if (needsSolutionsLoad) { loadAllSolutions(); return; }
    displayedCount = allSolutions.length;
  }
</script>

<article class="card mt-3" aria-labelledby="selected-puzzle-heading">
  <header class="mb-2">
    <div style="display:inline-flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
      <span class="badge badge-primary">Puzzle #{puzzle.number}</span>
      <time datetime={puzzle.date} style="font-size:0.85rem; color:var(--text-secondary);">
        {formatDate(puzzle.date)}
      </time>
    </div>
    <h2 id="selected-puzzle-heading">LinkedIn Pinpoint #{puzzle.number}</h2>
  </header>

  <!-- Clues -->
  <section class="mt-2" aria-labelledby="selected-clues-heading">
    <h3 id="selected-clues-heading" class="clues-heading">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
      Clues
    </h3>
    <ul class="clues-list mt-2">
      {#each puzzle.clues as clue, i}
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
        <p class="answer-label">Answer</p>
        <p class="answer-word">{puzzle.answer}</p>
      </div>
    {/if}
  </div>

  <!-- Explanation -->
  {#if puzzle.explanation}
    <section class="mt-2" aria-labelledby="selected-explanation-heading">
      <div class="explanation-section">
        <h3 id="selected-explanation-heading">
          <span class="icon-circle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </span>
          Explanation
        </h3>
        <div class="explanation-content">
          {@html renderExplanation(puzzle.explanation)}
        </div>
      </div>
    </section>
  {/if}

  <!-- Solutions -->
  {#if answerRevealed && totalSolutions > 0}
    <section class="mt-2" aria-labelledby="selected-solutions-heading">
      <h3 id="selected-solutions-heading">
        Solutions
        <span style="font-size:0.85rem; font-weight:600; color:var(--text-secondary);">
          ({displayedCount} of {totalSolutions}{#if needsSolutionsLoad || hasMoreSolutions} — click to load more{/if})
        </span>
      </h3>
      <div class="solutions-grid mt-2">
        {#each displayedSolutions as solution}
          <span class="solution-tag">{solution}</span>
        {/each}
      </div>
      {#if needsSolutionsLoad || hasMoreSolutions}
        <div class="mt-2" style="text-align:center;">
          {#if loadingSolutions}
            <span style="color:var(--text-secondary);">Loading solutions...</span>
          {:else if needsSolutionsLoad}
            <button class="btn btn-secondary btn-sm" onclick={loadAllSolutions}>
              Load All {totalSolutions} Solutions
            </button>
          {:else}
            <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick={showMoreSolutions}>
                Show More ({allSolutions.length - displayedCount} remaining)
              </button>
              <button class="btn btn-ghost btn-sm" onclick={showAllSolutions}>
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
        <p style="color: var(--accent-700); margin: 0;">Alternative solutions will be available soon.</p>
      </div>
    </section>
  {/if}
</article>
