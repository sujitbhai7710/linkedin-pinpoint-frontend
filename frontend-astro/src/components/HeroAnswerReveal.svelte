<script lang="ts">
  let { answer }: { answer: string } = $props();
  let revealed = $state(false);
</script>

<div class="answer-card hero-spoiler" class:revealed aria-live="polite">
  <p class="answer-label">Today's Pinpoint Answer</p>
  <p class="answer-word">{answer}</p>
</div>
{#if !revealed}
  <button class="hero-reveal-btn" onclick={() => revealed = true} aria-label="Reveal today's Pinpoint answer">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    Click to reveal the answer
  </button>
{:else}
  <a href="/today/" class="hero-read-explanation">Read Full Explanation</a>
{/if}

<style>
  .hero-spoiler:not(.revealed) .answer-word { filter: blur(9px); user-select: none; }
</style>
