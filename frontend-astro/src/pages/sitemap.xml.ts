import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/seo';
import { blogPosts } from '../lib/blog-data';
import fs from 'fs';
import path from 'path';

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().split('T')[0];

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: SITE_URL, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/today`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/archive`, lastmod: today, changefreq: 'daily', priority: '0.8' },
    { loc: `${SITE_URL}/unlimited`, lastmod: today, changefreq: 'weekly', priority: '0.7' },
    { loc: `${SITE_URL}/how-to-play`, lastmod: '2025-05-13', changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/blog`, lastmod: today, changefreq: 'weekly', priority: '0.6' },
    { loc: `${SITE_URL}/about`, lastmod: '2025-05-01', changefreq: 'monthly', priority: '0.5' }
  ];

  // Add blog post URLs
  for (const post of blogPosts) {
    urls.push({
      loc: `${SITE_URL}/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.6'
    });
  }

  // Note: Permalink URLs (/linkedin-pinpoint-answer-for-*) are NOT included in the sitemap
  // because they have noindex meta tags and redirect to /archive via JS.
  // Including noindex pages in sitemaps is a SEO contradiction.
  // Google will still discover these URLs through internal/external links.

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
