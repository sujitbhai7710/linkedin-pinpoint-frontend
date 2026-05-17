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
const SITE_URL = 'https://linkedin-pinpoint-answers.pages.dev';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export function buildMeta(seo: SEOData) {
        const canonical = seo.canonical || SITE_URL;
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
                keywords: seo.keywords || 'LinkedIn Pinpoint, Pinpoint answers, word puzzle, daily puzzle, LinkedIn game answers, Pinpoint solution today',
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
                noindex: seo.noindex || false
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
                potentialAction: {
                        '@type': 'SearchAction',
                        target: {
                                '@type': 'EntryPoint',
                                urlTemplate: `${SITE_URL}/archive`
                        },
                        'query-input': 'required name=search_term_string'
                }
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
                sameAs: [],
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

/**
 * E-E-A-T Author schema — signals expertise in word puzzles
 */
export function authorJsonLd(): object {
        return {
                '@context': 'https://schema.org',
                '@type': 'Person',
                name: 'Pinpoint Answer Today Editorial Team',
                jobTitle: 'Word Puzzle Analyst',
                worksFor: {
                        '@type': 'Organization',
                        name: SITE_NAME,
                        url: SITE_URL
                },
                knowsAbout: [
                        'LinkedIn Pinpoint',
                        'word association puzzles',
                        'daily word games',
                        'category recognition',
                        'vocabulary building'
                ],
                description: 'We play LinkedIn Pinpoint every day, verify the answers ourselves, and write detailed clue-by-clue explanations.',
                url: `${SITE_URL}/about`
        };
}

/**
 * E-E-A-T Reviewer schema — signals trust through review process
 */
export function reviewerJsonLd(): object {
        return {
                '@context': 'https://schema.org',
                '@type': 'Person',
                name: 'Pinpoint Answer Today Review Board',
                jobTitle: 'Answer Verification Specialist',
                worksFor: {
                        '@type': 'Organization',
                        name: SITE_NAME,
                        url: SITE_URL
                },
                knowsAbout: [
                        'LinkedIn Pinpoint',
                        'puzzle verification',
                        'answer validation'
                ],
                description: 'Our verification team cross-checks every published answer against the official LinkedIn Pinpoint game before it goes live.',
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
                        '@type': 'Person',
                        name: 'Pinpoint Answer Today Editorial Team',
                        url: `${SITE_URL}/about`
                },
                reviewer: {
                        '@type': 'Person',
                        name: 'Pinpoint Answer Today Review Board',
                        description: 'Verified against the official LinkedIn Pinpoint game'
                },
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
                wordCount: 500,
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

export function newsArticleJsonLd(data: {
        title: string;
        description: string;
        url: string;
        datePublished: string;
        answer: string;
        number: number;
}): object {
        return {
                '@context': 'https://schema.org',
                '@type': 'NewsArticle',
                headline: data.title,
                description: data.description,
                url: data.url,
                datePublished: data.datePublished,
                dateModified: data.datePublished,
                author: {
                        '@type': 'Person',
                        name: 'Pinpoint Answer Today Editorial Team',
                        url: `${SITE_URL}/about`
                },
                publisher: {
                        '@type': 'Organization',
                        name: SITE_NAME,
                        url: SITE_URL,
                        logo: {
                                '@type': 'ImageObject',
                                url: `${SITE_URL}/favicon.png`
                        }
                },
                mainEntityOfPage: {
                        '@type': 'WebPage',
                        '@id': data.url
                },
                articleSection: 'Daily Puzzle Answer',
                wordCount: 600,
                inLanguage: 'en-US'
        };
}

export function howToJsonLd(): object {
        return {
                '@context': 'https://schema.org',
                '@type': 'HowTo',
                name: 'How to Solve LinkedIn Pinpoint Puzzles',
                description: 'Step-by-step guide to solving LinkedIn Pinpoint puzzles faster and more accurately.',
                totalTime: 'PT3M',
                author: {
                        '@type': 'Person',
                        name: 'Pinpoint Answer Today Editorial Team',
                        url: `${SITE_URL}/about`
                },
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

export { SITE_NAME, SITE_URL };
