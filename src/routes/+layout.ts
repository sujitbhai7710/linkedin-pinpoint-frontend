import { websiteJsonLd, SITE_NAME, SITE_URL } from '$lib/seo';

export async function load({ fetch }) {
	return {
		siteName: SITE_NAME,
		siteUrl: SITE_URL
	};
}
