import { buildMeta, breadcrumbJsonLd, authorJsonLd, organizationJsonLd, SITE_URL } from '$lib/seo';

export async function load() {
        const seo = buildMeta({
                title: 'About Pinpoint Answer Today — Who We Are and Why We Built This',
                description: 'Learn about Pinpoint Answer Today: an independent team of word puzzle enthusiasts who verify every LinkedIn Pinpoint answer before publishing. We provide detailed explanations, all valid solutions, and a complete archive.',
                keywords: 'about Pinpoint Answer Today, LinkedIn Pinpoint answers site, who runs Pinpoint Answer Today, verified Pinpoint answers, Pinpoint answer accuracy',
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
                                description: 'An independent resource for LinkedIn Pinpoint daily puzzle answers with explanations. Every answer is verified against the official game before publication.',
                                url: `${SITE_URL}/about`,
                                author: authorJsonLd(),
                                publisher: organizationJsonLd(),
                                dateModified: new Date().toISOString().split('T')[0],
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
