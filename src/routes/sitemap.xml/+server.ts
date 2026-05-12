import { getLast } from '$lib/api';
import { SITE_URL } from '$lib/seo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	setHeaders({
		'Content-Type': 'application/xml',
		'Cache-Control': 'public, max-age=3600, s-maxage=7200'
	});

	let allPuzzles: { number: number; date: string }[] = [];
	let page = 1;
	let hasMore = true;

	try {
		while (hasMore && page <= 10) {
			const batch = await getLast(20, page, fetch);
			if (batch.length === 0) {
				hasMore = false;
			} else {
				allPuzzles = [...allPuzzles, ...batch.map(p => ({ number: p.number, date: p.date }))];
				if (batch.length < 20) hasMore = false;
				page++;
			}
		}
	} catch (e) {
		// Continue with whatever we have
	}

	const today = new Date().toISOString().split('T')[0];

	const urls = [
		{
			loc: SITE_URL,
			lastmod: today,
			changefreq: 'daily',
			priority: '1.0'
		},
		{
			loc: `${SITE_URL}/today`,
			lastmod: today,
			changefreq: 'daily',
			priority: '0.9'
		},
		{
			loc: `${SITE_URL}/archive`,
			lastmod: today,
			changefreq: 'daily',
			priority: '0.8'
		},
		{
			loc: `${SITE_URL}/about`,
			lastmod: today,
			changefreq: 'monthly',
			priority: '0.5'
		},
		{
			loc: `${SITE_URL}/contact`,
			lastmod: today,
			changefreq: 'monthly',
			priority: '0.4'
		},
		{
			loc: `${SITE_URL}/privacy`,
			lastmod: today,
			changefreq: 'yearly',
			priority: '0.3'
		},
		...allPuzzles.map((puzzle) => ({
			loc: `${SITE_URL}/archive?date=${puzzle.date}`,
			lastmod: puzzle.date,
			changefreq: 'monthly' as const,
			priority: '0.6'
		}))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

	return new Response(xml);
};
