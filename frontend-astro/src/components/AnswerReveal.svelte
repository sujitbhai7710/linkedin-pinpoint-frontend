<script lang="ts">
  let { answer }: { answer: string } = $props();
  let revealed = $state(false);
</script>

{#if !revealed}
  <div class="answer-reveal-wrapper">
    <button class="answer-reveal-btn" onclick={() => revealed = true}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      <div>Reveal Answer</div>
    </button>
  </div>
{:else}
  <div class="answer-reveal-wrapper">
    <div class="answer-card">
      <p class="answer-label">Today's Answer</p>
      <p class="answer-word">{answer}</p>
    </div>
  </div>
{/if}
