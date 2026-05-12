import { getLast, searchByDate } from '$lib/api';
import { buildMeta, breadcrumbJsonLd, SITE_URL } from '$lib/seo';
import type { PinpointSummary, PinpointPuzzle } from '$lib/types';

export async function load({ fetch, url, setHeaders }) {
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=600'
	});

	// Fetch all available puzzles for calendar - get multiple pages
	let allPuzzles: PinpointSummary[] = [];
	let page = 1;
	let hasMore = true;

	try {
		// Fetch first few pages to populate calendar
		while (hasMore && page <= 5) {
			const batch = await getLast(20, page, fetch);
			if (batch.length === 0) {
				hasMore = false;
			} else {
				allPuzzles = [...allPuzzles, ...batch];
				if (batch.length < 20) hasMore = false;
				page++;
			}
		}
	} catch (e) {
		// Continue with whatever we have
	}

	// If URL has a date query param, load that puzzle
	const dateParam = url.searchParams.get('date');
	let selectedPuzzle: PinpointPuzzle | null = null;
	let selectedError: string | null = null;

	if (dateParam) {
		try {
			selectedPuzzle = await searchByDate(dateParam, fetch);
		} catch (e) {
			selectedError = `No puzzle found for ${dateParam}`;
		}
	}

	// Build a map of dates that have puzzles
	const puzzleDates = new Map<string, PinpointSummary>();
	for (const p of allPuzzles) {
		puzzleDates.set(p.date, p);
	}

	const seo = buildMeta({
		title: 'LinkedIn Pinpoint Archive - Browse All Past Puzzle Answers',
		description: 'Browse the complete archive of LinkedIn Pinpoint daily puzzle answers. Search by date, find past solutions, and explore all clues and explanations.',
		keywords: 'LinkedIn Pinpoint archive, past puzzles, previous answers, puzzle history, old pinpoint solutions',
		canonical: `${SITE_URL}/archive`,
		jsonLd: [
			breadcrumbJsonLd([
				{ name: 'Home', url: SITE_URL },
				{ name: 'Archive', url: `${SITE_URL}/archive` }
			]),
			{
				'@context': 'https://schema.org',
				'@type': 'CollectionPage',
				name: 'LinkedIn Pinpoint Archive',
				description: 'Complete archive of LinkedIn Pinpoint daily puzzle answers',
				url: `${SITE_URL}/archive`,
				isPartOf: {
					'@type': 'WebSite',
					name: 'LinkedIn Pinpoint Answers',
					url: SITE_URL
				}
			}
		]
	});

	return {
		allPuzzles,
		puzzleDates: Object.fromEntries(puzzleDates),
		selectedPuzzle,
		selectedError,
		initialDate: dateParam || null,
		seo
	};
}
