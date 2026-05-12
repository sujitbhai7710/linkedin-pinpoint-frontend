export interface SEOData {
	title: string;
	description: string;
	keywords?: string;
	canonical?: string;
	ogImage?: string;
	ogType?: string;
	jsonLd?: object | object[];
}

const SITE_NAME = 'LinkedIn Pinpoint Answers';
const SITE_URL = 'https://linkedin-pinpoint-answers.pages.dev';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export function buildMeta(seo: SEOData): {
	title: string;
	description: string;
	keywords: string;
	canonical: string;
	ogTitle: string;
	ogDescription: string;
	ogImage: string;
	ogUrl: string;
	ogType: string;
	ogSiteName: string;
	twitterCard: string;
	twitterTitle: string;
	twitterDescription: string;
	twitterImage: string;
	jsonLdString: string;
} {
	const canonical = seo.canonical || SITE_URL;
	const ogImage = seo.ogImage || DEFAULT_OG_IMAGE;
	const jsonLd = seo.jsonLd
		? Array.isArray(seo.jsonLd)
			? seo.jsonLd
			: [seo.jsonLd]
		: [];

	return {
		title: `${seo.title} | ${SITE_NAME}`,
		description: seo.description,
		keywords: seo.keywords || 'LinkedIn Pinpoint, Pinpoint answers, word puzzle, daily puzzle',
		canonical,
		ogTitle: seo.title,
		ogDescription: seo.description,
		ogImage,
		ogUrl: canonical,
		ogType: seo.ogType || 'website',
		ogSiteName: SITE_NAME,
		twitterCard: 'summary_large_image',
		twitterTitle: seo.title,
		twitterDescription: seo.description,
		twitterImage: ogImage,
		jsonLdString: JSON.stringify(jsonLd)
	};
}

export function websiteJsonLd(): object {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: SITE_URL,
		description: 'Daily answers and solutions for LinkedIn Pinpoint word puzzle game',
		potentialAction: {
			'@type': 'SearchAction',
			target: `${SITE_URL}/archive?q={search_term_string}`,
			'query-input': 'required name=search_term_string'
		}
	};
}

export function articleJsonLd(data: {
	title: string;
	description: string;
	url: string;
	datePublished: string;
	answer: string;
	number: number;
}): object {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: data.title,
		description: data.description,
		url: data.url,
		datePublished: data.datePublished,
		dateModified: data.datePublished,
		author: {
			'@type': 'Organization',
			name: SITE_NAME,
			url: SITE_URL
		},
		publisher: {
			'@type': 'Organization',
			name: SITE_NAME,
			url: SITE_URL
		},
		mainEntity: {
			'@type': 'Thing',
			name: `LinkedIn Pinpoint #${data.number}`,
			description: `The answer is: ${data.answer}`
		}
	};
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): object {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url
		}))
	};
}

export function faqJsonLd(faqs: { question: string; answer: string }[]): object {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.answer
			}
		}))
	};
}

export { SITE_NAME, SITE_URL };
