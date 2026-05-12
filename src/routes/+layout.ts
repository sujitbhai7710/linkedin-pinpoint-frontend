// Disable SSR - Cloudflare Pages SSR cannot set Origin/X-API-Key headers on outbound fetch
// SEO is handled via meta tags in the HTML shell + client-side rendering
export const ssr = false;
