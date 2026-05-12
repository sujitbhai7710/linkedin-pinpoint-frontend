import { buildMeta, breadcrumbJsonLd, SITE_URL } from '$lib/seo';

export async function load({ setHeaders }) {
	setHeaders({
		'Cache-Control': 'public, max-age=86400, s-maxage=604800'
	});

	const seo = buildMeta({
		title: 'Privacy Policy — Pinpoint Answer Today',
		description: 'Privacy policy for Pinpoint Answer Today. We collect minimal data, use no tracking cookies, and don\'t sell your information. Read our straightforward privacy practices.',
		keywords: 'privacy policy, Pinpoint Answer Today privacy, data collection, LinkedIn Pinpoint site privacy',
		canonical: `${SITE_URL}/privacy`,
		ogType: 'website',
		jsonLd: [
			breadcrumbJsonLd([
				{ name: 'Home', url: SITE_URL },
				{ name: 'Privacy Policy', url: `${SITE_URL}/privacy` }
			])
		]
	});

	return { seo };
}
