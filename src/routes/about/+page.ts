import { buildMeta, breadcrumbJsonLd, SITE_URL } from '$lib/seo';

export async function load({ setHeaders }) {
	setHeaders({
		'Cache-Control': 'public, max-age=86400, s-maxage=604800'
	});

	const seo = buildMeta({
		title: 'About Pinpoint Answer Today — Who We Are and Why We Built This',
		description: 'Learn about Pinpoint Answer Today: an independent resource for LinkedIn Pinpoint daily puzzle answers. We provide verified answers, detailed explanations, and a complete puzzle archive.',
		keywords: 'about Pinpoint Answer Today, LinkedIn Pinpoint answers site, who runs Pinpoint Answer Today',
		canonical: `${SITE_URL}/about`,
		ogType: 'website',
		jsonLd: [
			breadcrumbJsonLd([
				{ name: 'Home', url: SITE_URL },
				{ name: 'About', url: `${SITE_URL}/about` }
			]),
			{
				'@context': 'https://schema.org',
				'@type': 'AboutPage',
				name: 'About Pinpoint Answer Today',
				description: 'An independent resource for LinkedIn Pinpoint daily puzzle answers with explanations.',
				url: `${SITE_URL}/about`,
				isPartOf: {
					'@type': 'WebSite',
					name: 'LinkedIn Pinpoint Answers',
					url: SITE_URL
				}
			}
		]
	});

	return { seo };
}
