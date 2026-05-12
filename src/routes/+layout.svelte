<script lang="ts">
        import { page } from '$app/state';
        import '../app.css';

        let { children, data } = $props();

        const navItems = [
                { href: '/', label: 'Home' },
                { href: '/today', label: "Today's Answer" },
                { href: '/archive', label: 'Archive' }
        ];
</script>

<svelte:head>
        <link rel="icon" href="/favicon.png" />
</svelte:head>

<div style="display:flex; flex-direction:column; min-height:100vh;">
        <header class="site-header">
                <div class="container header-inner">
                        <a href="/" class="site-logo" aria-label="LinkedIn Pinpoint Answers - Home">
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
                                        <a href="/" class="site-logo" aria-label="LinkedIn Pinpoint Answers - Home">
                                                <span class="logo-icon" aria-hidden="true">P</span>
                                                <span class="logo-text">Pinpoint Answers</span>
                                        </a>
                                        <p>Your daily source for LinkedIn Pinpoint word puzzle answers, clues, and solutions. Stay ahead with today's answer and explore our complete archive.</p>
                                </div>
                                <div class="footer-section">
                                        <h4>Quick Links</h4>
                                        <a href="/">Home</a>
                                        <a href="/today">Today's Answer</a>
                                        <a href="/archive">Puzzle Archive</a>
                                </div>
                                <div class="footer-section">
                                        <h4>About</h4>
                                        <a href="/">About Us</a>
                                        <a href="/sitemap.xml">Sitemap</a>
                                </div>
                        </div>
                        <div class="footer-bottom">
                                <p>&copy; {new Date().getFullYear()} LinkedIn Pinpoint Answers. All rights reserved. Not affiliated with LinkedIn.</p>
                        </div>
                </div>
        </footer>
</div>
