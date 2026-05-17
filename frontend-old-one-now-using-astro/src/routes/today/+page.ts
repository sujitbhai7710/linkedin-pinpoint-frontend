import { buildMeta, articleJsonLd, breadcrumbJsonLd, newsArticleJsonLd, SITE_URL } from '$lib/seo';

export async function load({ fetch }) {
        let today = null;
        let yesterday = null;
        let error: string | null = null;

        // Load today's data from static JSON (generated at build time)
        try {
                const res = await fetch('/data/today.json');
                if (res.ok && res.status !== 404) {
                        today = await res.json();
                        if (!today || !today.number) today = null;
                }
        } catch (e) {
                error = 'Failed to load today\'s puzzle. Try refreshing the page.';
        }

        // Load yesterday's data from static JSON
        try {
                const res = await fetch('/data/yesterday.json');
                if (res.ok) {
                        yesterday = await res.json();
                        if (!yesterday || !yesterday.number) yesterday = null;
                }
        } catch (e) {
                // Not critical
        }

        const dateStr = today ? new Date(today.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Today';
        const shortDateStr = today ? new Date(today.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Today';

        const clueWords = today ? today.clues.slice(0, 3).join(', ') : '';
        const title = today
                ? `LinkedIn Pinpoint #${today.number} Answer — ${shortDateStr}`
                : "Today's LinkedIn Pinpoint Answer";
        const descriptionText = today
                ? `The answer to LinkedIn Pinpoint #${today.number} for ${shortDateStr}. Clues: ${clueWords}. See all 5 clues, read the full explanation of how they connect${today.totalSolutions ? `, and browse ${today.totalSolutions} valid solutions` : ''}.`
                : "Get today's LinkedIn Pinpoint answer with all clues and a detailed explanation.";

        const seo = buildMeta({
                title,
                description: descriptionText,
                keywords: today
                        ? `LinkedIn Pinpoint #${today.number}, ${today.answer}, today's pinpoint answer, pinpoint solution ${today.date}, LinkedIn puzzle answer ${shortDateStr}, pinpoint hints today, ${today.clues.join(', ')}`
                        : "LinkedIn Pinpoint, today's answer, daily puzzle",
                canonical: `${SITE_URL}/today`,
                ogType: 'article',
                jsonLd: [
                        articleJsonLd({
                                title,
                                description: today
                                        ? `The answer to LinkedIn Pinpoint #${today.number} for ${shortDateStr} is ${today.answer}. Full explanation and all valid solutions.`
                                        : "Today's LinkedIn Pinpoint answer",
                                url: `${SITE_URL}/today`,
                                datePublished: today?.date || new Date().toISOString().split('T')[0],
                                answer: today?.answer || '',
                                number: today?.number || 0
                        }),
                        newsArticleJsonLd({
                                title,
                                description: today
                                        ? `LinkedIn Pinpoint #${today.number} answer for ${shortDateStr}: ${today.answer}. ${today.clues.length} clues explained.`
                                        : "Today's LinkedIn Pinpoint answer",
                                url: `${SITE_URL}/today`,
                                datePublished: today?.date || new Date().toISOString().split('T')[0],
                                answer: today?.answer || '',
                                number: today?.number || 0
                        }),
                        breadcrumbJsonLd([
                                { name: 'Home', url: SITE_URL },
                                { name: "Today's Answer", url: `${SITE_URL}/today` }
                        ])
                ]
        });

        return {
                today,
                yesterday,
                error,
                seo
        };
}
