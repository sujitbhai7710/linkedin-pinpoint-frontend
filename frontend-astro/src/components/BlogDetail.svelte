<script lang="ts">
  import { onMount } from 'svelte';

  let { post, relatedPosts }: { post: any; relatedPosts: any[] } = $props();

  let openFaqIndex = $state<number | null>(null);
  let copySuccess = $state(false);
  let activeHeading = $state('');
  let tocItems = $state<{ id: string; text: string; level: number }[]>([]);
  let processedContent = $state(post.content);

  function toggleFaq(index: number) {
    openFaqIndex = openFaqIndex === index ? null : index;
  }

  function shareTwitter() {
    const url = encodeURIComponent(`https://linkedin-pinpoint-answers.pages.dev/blog/${post.slug}`);
    const text = encodeURIComponent(post.title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  function shareLinkedIn() {
    const url = encodeURIComponent(`https://linkedin-pinpoint-answers.pages.dev/blog/${post.slug}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://linkedin-pinpoint-answers.pages.dev/blog/${post.slug}`);
      copySuccess = true;
      setTimeout(() => copySuccess = false, 2000);
    } catch { /* fallback */ }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  onMount(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.content;
    const headings = tempDiv.querySelectorAll('h2, h3, h4');
    const items: { id: string; text: string; level: number }[] = [];
    headings.forEach((h, i) => {
      const id = `heading-${i}`;
      h.id = id;
      items.push({ id, text: h.textContent || '', level: parseInt(h.tagName[1]) });
    });
    tocItems = items;
    processedContent = tempDiv.innerHTML;

    // Scroll spy
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) activeHeading = entry.target.id;
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    setTimeout(() => {
      const h2s = document.querySelectorAll('.blog-content h2, .blog-content h3, .blog-content h4');
      h2s.forEach(h => observer.observe(h));
    }, 100);

    return () => observer.disconnect();
  });
</script>

<div class="blog-post-page">
  <div class="container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="separator" aria-hidden="true">/</span>
      <a href="/blog">Blog</a>
      <span class="separator" aria-hidden="true">/</span>
      <span class="current">{post.title}</span>
    </nav>
  </div>

  <div class="blog-post-header">
    <span class="blog-card-badge {post.category}">{post.category}</span>
    <h1>{post.title}</h1>
    <div class="blog-post-meta">
      <span class="author">{post.author}</span>
      <span>·</span>
      <span>{formatDate(post.date)}</span>
      <span>·</span>
      <span>{post.readTime}</span>
    </div>
    <div class="blog-tags">
      {#each post.tags as tag}
        <span class="blog-tag">{tag}</span>
      {/each}
    </div>
  </div>

  <div class="blog-post-layout">
    <div class="blog-post-main">
      <div class="blog-content">
        {@html processedContent}
      </div>

      <div class="blog-share">
        <span class="blog-share-label">Share:</span>
        <button class="blog-share-btn" onclick={shareTwitter} aria-label="Share on Twitter">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
          Twitter
        </button>
        <button class="blog-share-btn" onclick={shareLinkedIn} aria-label="Share on LinkedIn">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          LinkedIn
        </button>
        <button class="blog-share-btn" onclick={copyLink} aria-label="Copy link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          {copySuccess ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <div class="blog-author">
        <div class="blog-author-avatar">P</div>
        <div class="blog-author-info">
          <h4>{post.author}</h4>
          <p>Daily players and analysts of LinkedIn Pinpoint who verify every answer and write detailed clue-by-clue explanations.</p>
        </div>
      </div>

      {#if post.faqs.length > 0}
        <div class="blog-faq">
          <h2>Frequently Asked Questions</h2>
          <div class="faq-list">
            {#each post.faqs as faq, i}
              <div class="faq-item" class:open={openFaqIndex === i}>
                <button class="faq-question" onclick={() => toggleFaq(i)}>
                  {faq.question}
                  <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div class="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    {#if tocItems.length > 0}
      <aside class="blog-toc" aria-label="Table of contents">
        <div class="blog-toc-inner">
          <div class="blog-toc-title">On This Page</div>
          <ul class="blog-toc-list">
            {#each tocItems as item}
              <li class="blog-toc-item" data-level={item.level}>
                <a
                  href={`#${item.id}`}
                  class:active={activeHeading === item.id}
                  onclick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(item.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {item.text}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </aside>
    {/if}
  </div>

  {#if relatedPosts.length > 0}
    <div class="container">
      <div class="blog-related">
        <h2>Related Articles</h2>
        <div class="blog-related-grid">
          {#each relatedPosts as rp}
            <a href={`/blog/${rp.slug}`} class="blog-card">
              <span class="blog-card-badge {rp.category}">{rp.category}</span>
              <h3>{rp.title}</h3>
              <p>{rp.description}</p>
              <div class="blog-card-meta">
                <span>{formatDate(rp.date)}</span>
                <span>·</span>
                <span>{rp.readTime}</span>
              </div>
            </a>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
