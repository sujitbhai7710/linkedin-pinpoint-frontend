import { buildMeta, websiteJsonLd, organizationJsonLd, authorJsonLd, reviewerJsonLd, faqJsonLd, howToJsonLd, itemListJsonLd, SITE_URL } from '$lib/seo';
import type { PinpointPuzzle, PinpointSummary } from '$lib/types';

export async function load({ fetch }) {
        let today: PinpointPuzzle | null = null;
        let recent: PinpointSummary[] = [];
        let error: string | null = null;

        // Load today's data from static JSON
        try {
                const res = await fetch('/data/today.json');
                if (res.ok) {
                        today = await res.json();
                }
        } catch (e) {
                error = 'Failed to load today\'s puzzle. Try again in a moment.';
        }

        // Load recent puzzles from static JSON
        try {
                const res = await fetch('/data/recent.json');
                if (res.ok) {
                        const data = await res.json();
                        recent = data;
                }
        } catch (e) {
                // Not critical
        }

        const clueWords = today ? today.clues.slice(0, 3).join(', ') : '';
        const shortDateStr = today ? new Date(today.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Today';

        const seo = buildMeta({
                title: today
                        ? `LinkedIn Pinpoint Answer Today — #${today.number} (${shortDateStr})`
                        : 'LinkedIn Pinpoint Answer Today — Daily Puzzle Solutions',
                description: today
                        ? `Get today's LinkedIn Pinpoint #${today.number} answer for ${shortDateStr}. Clues: ${clueWords}. Detailed explanations and all valid alternative solutions. Updated daily.`
                        : `Get today's LinkedIn Pinpoint answer with all 5 clues, detailed explanations, and every valid alternative solution. Browse our complete Pinpoint archive and practice with unlimited games. Updated daily.`,
                keywords: `LinkedIn Pinpoint answers, pinpoint answer today, daily puzzle solution, LinkedIn word game, Pinpoint clues, Pinpoint hints, pinpoint answer today, LinkedIn Pinpoint solution, pinpoint archive, pinpoint answers, pinpoint clue, LinkedIn Pinpoint game${today ? `, Pinpoint #${today.number}, ${today.answer}` : ''}`,
                canonical: SITE_URL,
                ogType: 'website',
                jsonLd: [
                        organizationJsonLd(),
                        websiteJsonLd(),
                        authorJsonLd(),
                        reviewerJsonLd(),
                        howToJsonLd(),
                        faqJsonLd([
                                {
                                        question: 'What is LinkedIn Pinpoint?',
                                        answer: 'LinkedIn Pinpoint is a daily word puzzle on LinkedIn where players guess a connecting word or category from five progressive clues. The fewer clues needed, the better the score.'
                                },
                                {
                                        question: 'How often are new Pinpoint puzzles released?',
                                        answer: 'New LinkedIn Pinpoint puzzles are released daily at midnight. Our site updates by early afternoon with the latest answer and full explanation.'
                                },
                                {
                                        question: 'Are the answers on this site accurate?',
                                        answer: 'Yes. Every answer is verified against the official LinkedIn Pinpoint game before posting. We include full explanations showing how each clue connects to the solution.'
                                },
                                {
                                        question: 'Is this site affiliated with LinkedIn?',
                                        answer: 'No. We are an independent resource. Not affiliated with, endorsed by, or connected to LinkedIn or Microsoft.'
                                },
                                {
                                        question: 'Can I play Pinpoint unlimited times?',
                                        answer: 'The daily puzzle is once per day, but our Unlimited Game mode lets you practice with random historical puzzles as many times as you want.'
                                },
                                {
                                        question: 'What time does the new Pinpoint puzzle come out?',
                                        answer: 'New LinkedIn Pinpoint puzzles are released at midnight Eastern Time. Our answers are typically posted by early afternoon each day.'
                                },
                                {
                                        question: 'Why are there multiple valid answers for some puzzles?',
                                        answer: 'LinkedIn Pinpoint accepts a specific set of words for each puzzle. Sometimes a synonym or close variant also works. We list every accepted solution, not just the main one.'
                                }
                        ]),
                        itemListJsonLd(
                                recent.slice(0, 10).map(p => ({
                                        name: `LinkedIn Pinpoint #${p.number} — ${new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                                        url: `${SITE_URL}/archive`,
                                        date: p.date
                                }))
                        )
                ]
        });

        return {
                today,
                recent,
                error,
                seo
        };
}
