import { readFileSync } from 'fs';
import { join } from 'path';

const MONTH_NAMES_MAP: Record<string, string> = {
	january: '01',
	february: '02',
	march: '03',
	april: '04',
	may: '05',
	june: '06',
	july: '07',
	august: '08',
	september: '09',
	october: '10',
	november: '11',
	december: '12'
};

const MONTH_NAMES = [
	'january', 'february', 'march', 'april', 'may', 'june',
	'july', 'august', 'september', 'october', 'november', 'december'
];

export const entries = async () => {
	try {
		const data = JSON.parse(
			readFileSync(join(process.cwd(), 'static/data/archive.json'), 'utf-8')
		);
		return data.map((p: { date: string }) => {
			const date = new Date(p.date + 'T00:00:00');
			const monthName = MONTH_NAMES[date.getMonth()];
			const day = date.getDate();
			const year = date.getFullYear();
			return { slug: `${monthName}-${day}-${year}` };
		});
	} catch {
		return [];
	}
};

export const load = async ({ params }) => {
	const slug = params.slug;

	// Parse the slug: expected format is "month-day-year"
	const parts = slug.split('-');

	if (parts.length < 3) {
		return { targetUrl: '/archive' };
	}

	const year = parts[parts.length - 1];
	const day = parts[parts.length - 2];
	const monthName = parts.slice(0, parts.length - 2).join('-');

	const monthNum = MONTH_NAMES_MAP[monthName.toLowerCase()];
	if (!monthNum) {
		return { targetUrl: '/archive' };
	}

	const dayPadded = day.padStart(2, '0');
	const dateStr = `${year}-${monthNum}-${dayPadded}`;

	// Use hash fragment so the archive page can read it client-side
	// /archive#2026-05-17 (not ?date= which looks ugly)
	return { targetUrl: `/archive#${dateStr}` };
};
