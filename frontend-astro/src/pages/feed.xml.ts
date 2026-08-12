import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://pinpointanswertoday.online';
const SITE_NAME = 'Pinpoint Answer Today';

export const GET: APIRoute = async () => {
	let today: any = null;
	let recent: any[] = [];

	try {
		const todayPath = path.join(process.cwd(), 'public/data/today.json');
		today = JSON.parse(fs.readFileSync(todayPath, 'utf-8'));
	} catch {}

	try {
		const recentPath = path.join(process.cwd(), 'public/data/recent.json');
		recent = JSON.parse(fs.readFileSync(recentPath, 'utf-8'));
	} catch {}

	const items: { title: string; link: string; description: string; pubDate: string; guid: string }[] = [];

	if (today) {
		const dateObj = new Date(today.date + 'T00:00:00');
		const month = dateObj.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }).toLowerCase();
		const permalink = `/linkedin-pinpoint-answer-for-${month}-${dateObj.getUTCDate()}-${dateObj.getUTCFullYear()}`;
		items.push({
			title: `LinkedIn Pinpoint #${today.number} Answer — ${today.date}`,
			link: `${SITE_URL}${permalink}`,
			description: `Pinpoint puzzle #${today.number} answer: ${today.answer}. Clues: ${today.clues.join(', ')}. Full explanation and all valid solutions included.`,
			pubDate: new Date(today.date + 'T12:00:00Z').toUTCString(),
			guid: `${SITE_URL}${permalink}`
		});
	}

	for (const puzzle of recent.slice(0, 19)) {
		const dateObj = new Date(puzzle.date + 'T00:00:00');
		const month = dateObj.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }).toLowerCase();
		const permalink = `/linkedin-pinpoint-answer-for-${month}-${dateObj.getUTCDate()}-${dateObj.getUTCFullYear()}`;
		items.push({
			title: `LinkedIn Pinpoint #${puzzle.number} Answer — ${puzzle.date}`,
			link: `${SITE_URL}${permalink}`,
			description: `Pinpoint puzzle #${puzzle.number} clues: ${puzzle.clues.join(', ')}. See the full answer and explanation.`,
			pubDate: new Date(puzzle.date + 'T12:00:00Z').toUTCString(),
			guid: `${SITE_URL}${permalink}`
		});
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>Daily LinkedIn Pinpoint answers with clue-by-clue explanations, valid solutions, and a complete puzzle archive.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/favicon.png</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
${items.map(item => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="true">${item.guid}</guid>
    </item>`).join('\n')}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
