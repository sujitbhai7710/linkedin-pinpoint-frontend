<script lang="ts">
  let { faqs }: { faqs: { question: string; answer: string }[] } = $props();
  let openIndex = $state<number | null>(null);

  function toggle(i: number) {
    openIndex = openIndex === i ? null : i;
  }
</script>

<div class="faq-list">
  {#each faqs as faq, i}
    <div class="faq-item {openIndex === i ? 'open' : ''}">
      <button class="faq-question" onclick={() => toggle(i)} aria-expanded={openIndex === i}>
        <span>{faq.question}</span>
        <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="faq-answer">
        <p>{faq.answer}</p>
      </div>
    </div>
  {/each}
</div>
