import { getToday, getYesterday, formatDate } from '$lib/api';
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
		error = 'Failed to load today\'s puzzle. Please try again later.';
	}

	try {
		yesterday = await getYesterday(fetch);
	} catch (e) {
		// Not critical
	}

	const dateStr = today ? formatDate(today.date) : 'Today';
	const title = today
		? `LinkedIn Pinpoint #${today.number} Answer - ${today.answer.toUpperCase()} (${dateStr})`
		: "Today's LinkedIn Pinpoint Answer";
	const descriptionText = today
		? `The answer to LinkedIn Pinpoint #${today.number} is ${today.answer}. See all 5 clues, full explanation, and ${today.totalSolutions} valid solutions for ${dateStr}.`
		: "Get today's LinkedIn Pinpoint answer with clues and explanations.";

	const seo = buildMeta({
		title,
		description: descriptionText,
		keywords: today
			? `LinkedIn Pinpoint #${today.number}, ${today.answer}, today's pinpoint answer, pinpoint solution ${today.date}`
			: "LinkedIn Pinpoint, today's answer, daily puzzle",
		canonical: `${SITE_URL}/today`,
		ogType: 'article',
		jsonLd: [
			articleJsonLd({
				title,
				description: today
					? `The answer to LinkedIn Pinpoint #${today.number} is ${today.answer}.`
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
