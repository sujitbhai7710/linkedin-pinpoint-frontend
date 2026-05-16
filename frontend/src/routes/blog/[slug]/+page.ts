import { buildMeta, breadcrumbJsonLd, faqJsonLd, SITE_URL } from '$lib/seo';
import { getBlogPost, getRelatedPosts, blogPosts } from '$lib/blog-data';
import { error } from '@sveltejs/kit';

export const entries = async () => {
	return blogPosts.map((post) => ({ slug: post.slug }));
};

export async function load({ params }) {
	const post = getBlogPost(params.slug);

	if (!post) {
		throw error(404, 'Blog post not found');
	}

	const relatedPosts = getRelatedPosts(params.slug, 3);

	const seo = buildMeta({
		title: post.title,
		description: post.description,
		keywords: post.tags.join(', '),
		canonical: `${SITE_URL}/blog/${post.slug}`,
		ogType: 'article',
		jsonLd: [
			breadcrumbJsonLd([
				{ name: 'Home', url: SITE_URL },
				{ name: 'Blog', url: `${SITE_URL}/blog` },
				{ name: post.title, url: `${SITE_URL}/blog/${post.slug}` }
			]),
			faqJsonLd(post.faqs),
			{
				'@context': 'https://schema.org',
				'@type': 'Article',
				headline: post.title,
				description: post.description,
				url: `${SITE_URL}/blog/${post.slug}`,
				datePublished: post.date,
				dateModified: post.date,
				author: {
					'@type': 'Person',
					name: post.author,
					url: `${SITE_URL}/about`
				},
				publisher: {
					'@type': 'Organization',
					name: 'Pinpoint Answer Today',
					url: SITE_URL,
					logo: {
						'@type': 'ImageObject',
						url: `${SITE_URL}/favicon.png`
					}
				},
				articleSection: post.category,
				keywords: post.tags.join(', '),
				inLanguage: 'en-US'
			}
		]
	});

	return { post, relatedPosts, seo };
}
