import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  output: 'static',
  integrations: [svelte()],
  build: {
    assets: '_astro'
  },
  redirects: {
    '/guide': '/blog'
  }
});
