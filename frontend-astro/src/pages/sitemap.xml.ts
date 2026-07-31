import type { APIRoute } from 'astro';
import { puzzlePermalink, ensureTrailingSlash, SITE_URL } from '../lib/seo';
import fs from 'fs';
import path from 'path';


export const GET: APIRoute = async () => {
  const today = new Date().toISOString().split('T')[0];

  // FIX: All URLs (except root domain) must end with trailing slash.
  // This aligns the sitemap with Cloudflare Pages' directory-based serving
  // (which 308-redirects /today → /today/) and the canonical tags (which
  // now also use trailing slashes via ensureTrailingSlash in seo.ts).
  // Without this alignment, Google sees a redirect chain + canonical
  // mismatch and refuses to index ANY pages (currently 0/311 indexed).
  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: SITE_URL, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/today/`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/archive/`, lastmod: today, changefreq: 'daily', priority: '0.8' },
    { loc: `${SITE_URL}/unlimited/`, lastmod: today, changefreq: 'weekly', priority: '0.7' },
    { loc: `${SITE_URL}/how-to-play/`, lastmod: today, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/blog/`, lastmod: today, changefreq: 'weekly', priority: '0.6' },
    { loc: `${SITE_URL}/about/`, lastmod: today, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_URL}/contact/`, lastmod: '2026-05-01', changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/privacy/`, lastmod: '2026-07-28', changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/editorial-policy/`, lastmod: '2026-07-28', changefreq: 'monthly', priority: '0.4' },
    { loc: `${SITE_URL}/terms/`, lastmod: '2026-07-28', changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/disclaimer/`, lastmod: '2026-07-28', changefreq: 'yearly', priority: '0.3' }
  ];

  try {
    const archivePath = path.join(process.cwd(), 'public/data/archive.json');
    const archive: { date: string; answer: string | null }[] = JSON.parse(fs.readFileSync(archivePath, 'utf-8'));
    for (const puzzle of archive) {
      if (!puzzle.answer) continue;
      urls.push({
        loc: `${SITE_URL}${puzzlePermalink(puzzle.date)}`,
        lastmod: puzzle.date,
        changefreq: 'yearly',
        priority: '0.7'
      });
    }
  } catch (error) {
    console.error('[sitemap] Unable to add puzzle URLs:', error);
  }

  // Add blog post URLs
  try {
    const blogModule = await import('../lib/blog-data');
    for (const post of blogModule.blogPosts) {
      urls.push({
        loc: `${SITE_URL}/blog/${post.slug}/`,
        lastmod: post.date,
        changefreq: 'monthly',
        priority: '0.5'
      });
    }
  } catch (error) {
    console.error('[sitemap] Unable to add blog URLs:', error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
