<script lang="ts">
  let { puzzleNumber, initialSolutions = [], totalSolutions = 0 }: { puzzleNumber: number; initialSolutions?: string[]; totalSolutions?: number } = $props();

  const INITIAL_SHOW = 10;
  const BATCH_SIZE = 200;

  let allSolutions: string[] = $state(initialSolutions);
  let total: number = $state(totalSolutions);
  let displayedCount: number = $state(INITIAL_SHOW);
  let loadingMore = $state(false);
  let allLoaded = $state(initialSolutions.length >= totalSolutions);

  let displayedSolutions = $derived(allSolutions.slice(0, displayedCount));
  let hasMoreToShow = $derived(displayedCount < allSolutions.length);
  let needsLazyLoad = $derived(total > allSolutions.length && !allLoaded);

  async function loadAllSolutions() {
    if (allLoaded) return;
    loadingMore = true;
    try {
      const res = await fetch(`/data/solutions/${puzzleNumber}.json`);
      if (!res.ok) throw new Error(`Failed to load solutions for puzzle #${puzzleNumber}`);
      const data = await res.json();
      if (data.solutions.length > allSolutions.length) {
        allSolutions = data.solutions;
        total = data.totalSolutions;
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

{#if total > 0}
  <section class="mt-2" aria-labelledby="solutions-heading">
    <h2 id="solutions-heading">
      All Solutions
      <span style="font-size:0.85rem; font-weight:600; color:var(--text-secondary);">
        ({displayedCount} of {total} words{#if needsLazyLoad || hasMoreToShow} — click to load more{/if})
      </span>
    </h2>
    <div class="solutions-grid mt-2">
      {#each displayedSolutions as solution}
        <span class="solution-tag">{solution}</span>
      {/each}
    </div>

    {#if needsLazyLoad || hasMoreToShow}
      <div class="mt-3" style="text-align:center;">
        {#if loadingMore}
          <div style="display:flex; align-items:center; justify-content:center; gap:0.5rem; color:var(--text-secondary); font-size:0.9rem;">
            <div style="width:18px;height:18px;border:2px solid var(--accent-200);border-top-color:var(--accent-600);border-radius:50%;animation:spin 0.6s linear infinite;"></div>
            <span>Loading {total} solutions...</span>
          </div>
        {:else if needsLazyLoad}
          <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick={loadAllSolutions}>
              Load All {total} Solutions
            </button>
          </div>
        {:else}
          <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
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
{:else}
  <section class="mt-2">
    <div class="card" style="padding: 1rem; text-align: center; background: var(--accent-50); border: 1px dashed var(--accent-200);">
      <p style="color: var(--accent-700); margin: 0;">Alternative solutions will be available soon. Check back later for all valid answers!</p>
    </div>
  </section>
{/if}

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
