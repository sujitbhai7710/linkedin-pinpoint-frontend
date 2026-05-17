import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
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
			return {
				month: MONTH_NAMES[date.getMonth()],
				day: String(date.getDate()),
				year: String(date.getFullYear())
			};
		});
	} catch {
		return [];
	}
};

export const load: PageLoad = async ({ params }) => {
	const { month, day, year } = params;

	const monthNum = MONTH_NAMES_MAP[month.toLowerCase()];
	if (!monthNum) {
		throw redirect(302, '/archive');
	}

	const dayPadded = day.padStart(2, '0');
	const dateStr = `${year}-${monthNum}-${dayPadded}`;

	throw redirect(302, `/archive?date=${dateStr}`);
};
