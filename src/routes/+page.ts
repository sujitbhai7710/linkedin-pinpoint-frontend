import { getToday, getLast } from '$lib/api';
import { buildMeta, websiteJsonLd, faqJsonLd, SITE_URL } from '$lib/seo';
import type { PinpointPuzzle, PinpointSummary } from '$lib/types';

export async function load({ fetch, setHeaders }) {
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=600'
	});

	let today: PinpointPuzzle | null = null;
	let recent: PinpointSummary[] = [];
	let error: string | null = null;

	try {
		today = await getToday(fetch);
	} catch (e) {
		error = 'Failed to load today\'s puzzle. Try again in a moment.';
	}

	try {
		recent = await getLast(5, 1, fetch);
	} catch (e) {
		// Not critical
	}

	const seo = buildMeta({
		title: 'LinkedIn Pinpoint Answers Today — Daily Puzzle Solutions & Clues',
		description: `Get today's LinkedIn Pinpoint answer with all 5 clues, detailed explanations, and every valid alternative solution. Updated daily. Bookmark us — new answers every day.`,
		keywords: 'LinkedIn Pinpoint answers, today\'s pinpoint answer, daily puzzle solution, LinkedIn word game, Pinpoint clues, Pinpoint hints',
		canonical: SITE_URL,
		ogType: 'website',
		jsonLd: [
			websiteJsonLd(),
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
					answer: 'Yes. Every answer is verified before posting. We include full explanations showing how each clue connects to the solution.'
				},
				{
					question: 'Is this site affiliated with LinkedIn?',
					answer: 'No. We are an independent resource. Not affiliated with, endorsed by, or connected to LinkedIn or Microsoft.'
				}
			])
		]
	});

	return {
		today,
		recent,
		error,
		seo
	};
}
