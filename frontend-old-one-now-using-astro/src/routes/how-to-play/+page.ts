import { buildMeta, breadcrumbJsonLd, faqJsonLd, SITE_URL } from '$lib/seo';

export async function load() {
        const seo = buildMeta({
                title: 'How to Play LinkedIn Pinpoint — Rules, Tips & Strategies',
                description: 'Learn how to play LinkedIn Pinpoint with our complete guide. Understand the rules, scoring system, and proven strategies to solve puzzles faster with fewer clues.',
                keywords: 'how to play LinkedIn Pinpoint, Pinpoint rules, Pinpoint tips, Pinpoint strategy, LinkedIn game guide, word association game tips, how to solve Pinpoint',
                canonical: `${SITE_URL}/how-to-play`,
                ogType: 'website',
                jsonLd: [
                        breadcrumbJsonLd([
                                { name: 'Home', url: SITE_URL },
                                { name: 'How to Play', url: `${SITE_URL}/how-to-play` }
                        ]),
                        faqJsonLd([
                                {
                                        question: 'How many clues do you get in LinkedIn Pinpoint?',
                                        answer: 'You get a maximum of 5 clues in LinkedIn Pinpoint. The first clue is shown immediately, and each wrong guess reveals the next clue. Your goal is to guess the answer using as few clues as possible.'
                                },
                                {
                                        question: 'What happens if I guess wrong in Pinpoint?',
                                        answer: 'Each wrong guess reveals the next clue. You can keep guessing until you get it right or use all 5 clues. There is no penalty for wrong guesses other than revealing more clues, which affects your score.'
                                },
                                {
                                        question: 'Can I play LinkedIn Pinpoint more than once a day?',
                                        answer: 'The daily puzzle can only be played once per day. However, you can practice with our Unlimited Game mode, which lets you play random historical puzzles as many times as you want.'
                                }
                        ])
                ]
        });

        return { seo };
}
