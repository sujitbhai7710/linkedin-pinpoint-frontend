import { buildMeta, breadcrumbJsonLd, SITE_URL } from '$lib/seo';
import type { PinpointSummary, PinpointPuzzle } from '$lib/types';

export async function load({ fetch }) {
        // Load archive data from static JSON
        let archiveSummary: PinpointSummary[] = [];
        try {
                const res = await fetch('/data/archive.json');
                if (res.ok) archiveSummary = await res.json();
        } catch (e) {
                // Continue with whatever we have
        }

        // Build a map of dates that have puzzles
        const puzzleDates = new Map<string, PinpointSummary>();
        for (const p of archiveSummary) {
                puzzleDates.set(p.date, p);
        }

        // Load full archive data for detail views
        let archiveFull: PinpointPuzzle[] = [];
        try {
                const res = await fetch('/data/archive-full.json');
                if (res.ok) archiveFull = await res.json();
        } catch (e) {
                // Continue
        }

        // NOTE: The ?date= query param is handled client-side in the Svelte component
        // since static prerendering cannot access url.searchParams at build time.
        // The component reads window.location.search on mount.

        const seo = buildMeta({
                title: 'LinkedIn Pinpoint Archive — All Past Answers',
                description: 'Browse the complete archive of LinkedIn Pinpoint daily puzzle answers. Search by date, find past solutions, read explanations, and explore all valid answers for every puzzle ever published. Updated daily.',
                keywords: 'LinkedIn Pinpoint archive, past puzzles, previous answers, puzzle history, old pinpoint solutions, all pinpoint answers, pinpoint clue archive, past pinpoint puzzles, daily puzzle archive',
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
                                description: 'Complete archive of LinkedIn Pinpoint daily puzzle answers with clues, explanations, and all valid solutions.',
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
                archiveSummary,
                archiveFull,
                puzzleDates: Object.fromEntries(puzzleDates),
                seo
        };
}
