import { buildMeta, breadcrumbJsonLd, itemListJsonLd, SITE_URL } from '$lib/seo';
import { blogPosts, getCategories } from '$lib/blog-data';

export async function load() {
        const categories = getCategories();

        const seo = buildMeta({
                title: 'LinkedIn Pinpoint Blog — Strategies, Tips & Explanations',
                description: 'Deep-dive articles on LinkedIn Pinpoint: solving strategies, clue pattern guides, game comparisons, and habit-building tips. Written by daily players for daily players.',
                keywords: 'LinkedIn Pinpoint blog, pinpoint strategy, word puzzle tips, pinpoint clue types, daily puzzle habit, LinkedIn games explained',
                canonical: `${SITE_URL}/blog`,
                ogType: 'website',
                jsonLd: [
                        breadcrumbJsonLd([
                                { name: 'Home', url: SITE_URL },
                                { name: 'Blog', url: `${SITE_URL}/blog` }
                        ]),
                        itemListJsonLd(
                                blogPosts.map(post => ({
                                        name: post.title,
                                        url: `${SITE_URL}/blog/${post.slug}`,
                                        date: post.date
                                }))
                        )
                ]
        });

        return { seo, posts: blogPosts, categories };
}
