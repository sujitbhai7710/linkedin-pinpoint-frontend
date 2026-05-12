import { SITE_URL } from '$lib/seo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({
		'Content-Type': 'text/plain',
		'Cache-Control': 'public, max-age=86400'
	});

	const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml

Disallow: /api/
`;

	return new Response(robotsTxt);
};
