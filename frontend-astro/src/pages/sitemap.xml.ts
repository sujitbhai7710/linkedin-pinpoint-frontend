import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/seo';
import fs from 'fs';
import path from 'path';

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().split('T')[0];

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: SITE_URL, lastmod: today + 'T12:00:00+00:00', changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/today`, lastmod: today + 'T12:00:00+00:00', changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/archive`, lastmod: today + 'T12:00:00+00:00', changefreq: 'daily', priority: '0.8' },
    { loc: `${SITE_URL}/unlimited`, lastmod: today + 'T12:00:00+00:00', changefreq: 'weekly', priority: '0.7' },
    { loc: `${SITE_URL}/how-to-play`, lastmod: '2026-05-13T12:00:00+00:00', changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/blog`, lastmod: today + 'T12:00:00+00:00', changefreq: 'weekly', priority: '0.6' },
    { loc: `${SITE_URL}/about`, lastmod: '2026-05-01T12:00:00+00:00', changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_URL}/contact`, lastmod: '2026-05-01T12:00:00+00:00', changefreq: 'monthly', priority: '0.4' },
    { loc: `${SITE_URL}/privacy`, lastmod: '2026-05-01T12:00:00+00:00', changefreq: 'yearly', priority: '0.3' }
  ];

  // Fetch all puzzles from static JSON to generate permalink URLs
  try {
    const archivePath = path.join(process.cwd(), 'public/data/archive.json');
    const raw = fs.readFileSync(archivePath, 'utf-8');
    const allPuzzles = JSON.parse(raw);

    for (const puzzle of allPuzzles) {
      const date = new Date(puzzle.date + 'T00:00:00');
      const monthName = MONTH_NAMES[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();

      const permalink = `${SITE_URL}/linkedin-pinpoint-answer-for-${monthName}-${day}-${year}`;

      urls.push({
        loc: permalink,
        lastmod: puzzle.date + 'T12:00:00+00:00',
        changefreq: 'monthly',
        priority: '0.7'
      });
    }
  } catch (e) {
    // If JSON fetch fails, continue with static URLs only
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
