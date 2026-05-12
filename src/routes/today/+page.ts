import { getToday, getYesterday } from '$lib/api';
import { buildMeta, articleJsonLd, breadcrumbJsonLd, SITE_URL } from '$lib/seo';
import type { PinpointPuzzle } from '$lib/types';

export async function load({ fetch, setHeaders }) {
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=600'
	});

	let today: PinpointPuzzle | null = null;
	let yesterday: PinpointPuzzle | null = null;
	let error: string | null = null;

	try {
		today = await getToday(fetch);
	} catch (e) {
		error = 'Failed to load today\'s puzzle. Try refreshing the page.';
	}

	try {
		yesterday = await getYesterday(fetch);
	} catch (e) {
		// Not critical
	}

	const dateStr = today ? new Date(today.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Today';
	const title = today
		? `LinkedIn Pinpoint #${today.number} Answer - ${today.answer.toUpperCase()} (${dateStr})`
		: "Today's LinkedIn Pinpoint Answer";
	const descriptionText = today
		? `The answer to LinkedIn Pinpoint #${today.number} is ${today.answer}. See all 5 clues, read the full explanation of how they connect, and browse ${today.totalSolutions} valid solutions.`
		: "Get today's LinkedIn Pinpoint answer with all clues and a detailed explanation.";

	const seo = buildMeta({
		title,
		description: descriptionText,
		keywords: today
			? `LinkedIn Pinpoint #${today.number}, ${today.answer}, today's pinpoint answer, pinpoint solution ${today.date}, LinkedIn puzzle answer`
			: "LinkedIn Pinpoint, today's answer, daily puzzle",
		canonical: `${SITE_URL}/today`,
		ogType: 'article',
		jsonLd: [
			articleJsonLd({
				title,
				description: today
					? `The answer to LinkedIn Pinpoint #${today.number} is ${today.answer}. Full explanation and all valid solutions.`
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
