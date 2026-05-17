import { buildMeta, breadcrumbJsonLd, websiteJsonLd, SITE_URL } from '$lib/seo';
import type { PinpointPuzzle } from '$lib/types';

export async function load({ fetch }) {
	// Fetch all puzzle summaries for the game deck from static JSON
	let allPuzzles: { number: number; date: string; clues: string[] }[] = [];
	try {
		const res = await fetch('/data/archive.json');
		if (res.ok) {
			allPuzzles = await res.json();
		}
	} catch (e) {
		// Continue with empty array
	}

	// Fetch full archive data (with answers) for gameplay from static JSON
	// The svelte component uses this for puzzle answers instead of API calls
	let fullArchive: PinpointPuzzle[] = [];
	try {
		const res = await fetch('/data/archive-full.json');
		if (res.ok) {
			fullArchive = await res.json();
		}
	} catch (e) {
		// Continue without full archive
	}

	// Build a map of puzzle number → { answer, clues } for the component
	const puzzleDataMap: Record<number, { answer: string; clues: string[] }> = {};
	for (const puzzle of fullArchive) {
		if (puzzle.answer) {
			puzzleDataMap[puzzle.number] = {
				answer: puzzle.answer,
				clues: puzzle.clues
			};
		}
	}

	const seo = buildMeta({
		title: 'Pinpoint Unlimited — Practice Game',
		description: 'Play LinkedIn Pinpoint Unlimited for free! Practice with random historical puzzles, sharpen your word association and category recognition skills, and track your streak. No sign-up required — play as many rounds as you want.',
		keywords: 'LinkedIn Pinpoint unlimited, Pinpoint practice game, unlimited Pinpoint puzzles, play Pinpoint free, Pinpoint game online, word association game practice, Pinpoint unlimited practice, free word puzzle game, LinkedIn game practice',
		canonical: `${SITE_URL}/unlimited`,
		ogType: 'website',
		jsonLd: [
			breadcrumbJsonLd([
				{ name: 'Home', url: SITE_URL },
				{ name: 'Unlimited Game', url: `${SITE_URL}/unlimited` }
			]),
			{
				'@context': 'https://schema.org',
				'@type': 'VideoGame',
				name: 'LinkedIn Pinpoint Unlimited',
				description: 'Practice LinkedIn Pinpoint word puzzle game with unlimited random rounds. Free, no sign-up required.',
				genre: 'Puzzle',
				gamePlatform: 'Web Browser',
				applicationCategory: 'Game',
				operatingSystem: 'Any',
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'USD'
				},
				url: `${SITE_URL}/unlimited`
			}
		]
	});

	return {
		allPuzzles,
		puzzleDataMap,
		seo
	};
}
