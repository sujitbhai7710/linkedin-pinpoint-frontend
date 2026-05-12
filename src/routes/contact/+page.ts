import { buildMeta, breadcrumbJsonLd, SITE_URL } from '$lib/seo';

export async function load({ setHeaders }) {
	setHeaders({
		'Cache-Control': 'public, max-age=86400, s-maxage=604800'
	});

	const seo = buildMeta({
		title: 'Contact Us — Pinpoint Answer Today',
		description: 'Get in touch with the Pinpoint Answer Today team. Report wrong answers, suggest features, or share feedback about our LinkedIn Pinpoint daily puzzle answers.',
		keywords: 'contact Pinpoint Answer Today, LinkedIn Pinpoint feedback, report wrong answer',
		canonical: `${SITE_URL}/contact`,
		ogType: 'website',
		jsonLd: [
			breadcrumbJsonLd([
				{ name: 'Home', url: SITE_URL },
				{ name: 'Contact', url: `${SITE_URL}/contact` }
			]),
			{
				'@context': 'https://schema.org',
				'@type': 'ContactPage',
				name: 'Contact Pinpoint Answer Today',
				description: 'Get in touch with us about LinkedIn Pinpoint answers, corrections, or feedback.',
				url: `${SITE_URL}/contact`,
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
