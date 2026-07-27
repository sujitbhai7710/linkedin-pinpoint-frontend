<script lang="ts">
  let { answer }: { answer: string } = $props();
  let revealed = $state(false);
</script>

<div class="answer-reveal-wrapper">
  <div class="answer-card spoiler-answer" class:revealed aria-live="polite">
    <p class="answer-label">Today's Pinpoint Answer</p>
    <p class="answer-word">{answer}</p>
  </div>
  {#if !revealed}
    <button class="answer-reveal-btn" onclick={() => revealed = true} aria-label="Reveal today's Pinpoint answer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      <span>Reveal Answer</span>
    </button>
  {/if}
</div>

<style>
  .spoiler-answer:not(.revealed) .answer-word { filter: blur(9px); user-select: none; }
</style>
