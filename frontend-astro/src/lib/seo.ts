export interface SEOData {
        title: string;
        description: string;
        keywords?: string;
        canonical?: string;
        ogImage?: string;
        ogType?: string;
        jsonLd?: object | object[];
        noindex?: boolean;
}

const SITE_NAME = 'Pinpoint Answer Today';
const SITE_URL = 'https://pinpointanswertoday.online';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
const TODAY_FEATURED_IMAGE = `${SITE_URL}/pinpoint-answer-today.webp`;

export function puzzlePermalink(dateString: string): string {
        const date = new Date(`${dateString}T00:00:00Z`);
        const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }).toLowerCase();
        return `/linkedin-pinpoint-answer-for-${month}-${date.getUTCDate()}-${date.getUTCFullYear()}/`;
}

/**
 * Ensure a URL ends with a trailing slash, EXCEPT for the root domain.
 * This fixes the HTTP 308 redirect issue: Cloudflare Pages serves pages
 * as directories (e.g., /today/index.html) and 308-redirects /today → /today/.
 * If our sitemap and canonical tags use /today (no slash), Google sees a
 * redirect chain + canonical mismatch and refuses to index. By using /today/
 * everywhere, we eliminate the redirect and the mismatch.
 */
export function ensureTrailingSlash(url: string): string {
        if (url.endsWith('/')) return url;
        // Don't add slash to root domain (https://pinpointanswertoday.online)
        if (url === SITE_URL || url === `${SITE_URL}/`) return url;
        // Don't add slash to root path
        if (url.endsWith('://') || url.endsWith('.online')) return url;
        return url + '/';
}

export function buildMeta(seo: SEOData) {
        const canonical = ensureTrailingSlash(seo.canonical || SITE_URL);
        const ogImage = seo.ogImage || DEFAULT_OG_IMAGE;
        const jsonLd = seo.jsonLd
                ? Array.isArray(seo.jsonLd)
                        ? seo.jsonLd
                        : [seo.jsonLd]
                : [];

        // Only append site name if title is short enough to stay under ~60 chars total
        const titleWithSite = seo.title.length + 3 + SITE_NAME.length <= 60
                ? `${seo.title} | ${SITE_NAME}`
                : seo.title;

        return {
                title: titleWithSite,
                description: seo.description,
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
        jsonLdString: JSON.stringify(jsonLd),
        noindex: seo.noindex || false,
        keywords: seo.keywords
    };
}

export function websiteJsonLd(): object {
        return {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: SITE_NAME,
                alternateName: ['LinkedIn Pinpoint Answers', 'Pinpoint Answer Today', 'LinkedIn Pinpoint Answers Today'],
                url: SITE_URL,
                description: 'Daily answers and explanations for LinkedIn Pinpoint. Updated every day with solutions, clue breakdowns, and a full puzzle archive.',
                inLanguage: 'en-US',

        };
}

export function organizationJsonLd(): object {
        return {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: SITE_NAME,
                url: SITE_URL,
                logo: {
                        '@type': 'ImageObject',
                        url: `${SITE_URL}/favicon.png`
                },
                description: 'Daily answers, explanations, and a full puzzle archive for the LinkedIn Pinpoint word game.',
                foundingDate: '2025',
                contactPoint: {
                        '@type': 'ContactPoint',
                        contactType: 'customer support',
                        email: 'contact@pinpointanswertoday.online',
                        availableLanguage: 'English'
                },
                knowsAbout: [
                        'LinkedIn Pinpoint',
                        'word puzzle games',
                        'daily puzzle solutions',
                        'vocabulary and word association'
                ]
        };
}

export function organizationAuthorJsonLd(): object {
        return {
                '@type': 'Organization',
                name: SITE_NAME,
                url: `${SITE_URL}/about`
        };
}


export function articleJsonLd(data: {
        title: string;
        description: string;
        url: string;
        datePublished: string;
        answer: string;
        number: number;
        wordCount?: number;
}): object {
        return {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: data.title,
                description: data.description,
                url: data.url,
                datePublished: data.datePublished,
                dateModified: data.datePublished,
                author: organizationAuthorJsonLd(),
                publisher: {
                        '@type': 'Organization',
                        name: SITE_NAME,
                        url: SITE_URL,
                        logo: {
                                '@type': 'ImageObject',
                                url: `${SITE_URL}/favicon.png`
                        }
                },
                mainEntity: {
                        '@type': 'Thing',
                        name: `LinkedIn Pinpoint #${data.number}`,
                        description: `The answer is: ${data.answer}`
                },
                wordCount: data.wordCount || 500,
                articleSection: 'Word Games',
                inLanguage: 'en-US'
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



export function howToJsonLd(): object {
        return {
                '@context': 'https://schema.org',
                '@type': 'HowTo',
                name: 'How to Solve LinkedIn Pinpoint Puzzles',
                description: 'Step-by-step guide to solving LinkedIn Pinpoint puzzles faster and more accurately.',
                totalTime: 'PT3M',
                author: organizationAuthorJsonLd(),
                step: [
                        {
                                '@type': 'HowToStep',
                                name: 'Read the first clue carefully',
                                text: 'Start by reading the first clue. It is intentionally vague and could point to many answers. Think of broad categories that fit.',
                                position: 1
                        },
                        {
                                '@type': 'HowToStep',
                                name: 'Generate 3-5 possible answers',
                                text: 'Before seeing the next clue, brainstorm a few possible connecting words or categories. This primes your brain to recognize the pattern faster.',
                                position: 2
                        },
                        {
                                '@type': 'HowToStep',
                                name: 'Use each new clue to narrow down',
                                text: 'Each additional clue eliminates wrong answers. Cross-check your brainstormed list against each new clue. The correct answer fits ALL clues.',
                                position: 3
                        },
                        {
                                '@type': 'HowToStep',
                                name: 'Submit your guess with confidence',
                                text: 'Once you have an answer that fits all revealed clues, submit it. Fewer clues used means a better score. Practice with our unlimited mode to improve.',
                                position: 4
                        }
                ]
        };
}

export function itemListJsonLd(items: { name: string; url: string; date: string }[]): object {
        return {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                numberOfItems: items.length,
                itemListElement: items.map((item, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        name: item.name,
                        url: item.url
                }))
        };
}

export { SITE_NAME, SITE_URL, TODAY_FEATURED_IMAGE };
