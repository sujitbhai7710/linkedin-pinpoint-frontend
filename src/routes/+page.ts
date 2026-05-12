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
		error = 'Failed to load today\'s puzzle';
	}

	try {
		recent = await getLast(5, 1, fetch);
	} catch (e) {
		// Recent puzzles failed, not critical
	}

	const seo = buildMeta({
		title: 'LinkedIn Pinpoint Answers - Today\'s Daily Puzzle Solution',
		description: `Get today's LinkedIn Pinpoint answer instantly! Daily solutions, clues, and explanations for LinkedIn's word puzzle game. Updated every day with accurate answers.`,
		keywords: 'LinkedIn Pinpoint answers, today\'s pinpoint answer, daily puzzle solution, LinkedIn word game, Pinpoint clues',
		canonical: SITE_URL,
		ogType: 'website',
		jsonLd: [
			websiteJsonLd(),
			faqJsonLd([
				{
					question: 'What is LinkedIn Pinpoint?',
					answer: 'LinkedIn Pinpoint is a daily word puzzle game on LinkedIn where players guess a word based on five progressive clues. Each clue reveals more about the target word.'
				},
				{
					question: 'How often are new Pinpoint puzzles released?',
					answer: 'New LinkedIn Pinpoint puzzles are released daily. Check back each day for the latest answer and explanation.'
				},
				{
					question: 'Are the answers accurate?',
					answer: 'Yes! Our answers are verified daily and include full explanations of how the clues relate to the solution word.'
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
