const INDEXNOW_ENDPOINT =
  process.env.INDEXNOW_ENDPOINT || 'https://www.bing.com/indexnow';
const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || 'e8bc65df06b546c8a729fef670f046ce';
const DEFAULT_URLS = [
  'https://pinpointanswertoday.online/',
  'https://pinpointanswertoday.online/today/'
];

function puzzleUrl(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || '')) return null;
  const date = new Date(`${dateString}T00:00:00Z`);
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }).toLowerCase();
  return `https://pinpointanswertoday.online/linkedin-pinpoint-answer-for-${month}-${date.getUTCDate()}-${date.getUTCFullYear()}`;
}

function parseUrls() {
  const raw = process.env.INDEXNOW_URLS;

  if (!raw) {
    return DEFAULT_URLS;
  }

  const urls = raw
    .split(/[\r\n,]+/)
    .map(value => value.trim())
    .filter(Boolean);

  const datedPuzzleUrl = puzzleUrl(process.env.PUZZLE_DATE);
  if (datedPuzzleUrl) urls.push(datedPuzzleUrl);

  return [...new Set(urls.length > 0 ? urls : DEFAULT_URLS)];
}

function getHost(urls) {
  const host = new URL(urls[0]).host;

  for (const url of urls) {
    if (new URL(url).host !== host) {
      throw new Error('All IndexNow URLs must belong to the same host.');
    }
  }

  return host;
}

async function main() {
  const urls = parseUrls();
  const host = getHost(urls);

  console.log(`Submitting ${urls.length} URL(s) to IndexNow via ${INDEXNOW_ENDPOINT}...`);

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      urlList: urls
    })
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(
      `IndexNow submission failed with HTTP ${response.status}${bodyText ? `: ${bodyText}` : ''}`
    );
  }

  console.log(
    `IndexNow submission accepted with HTTP ${response.status}${bodyText ? `: ${bodyText}` : ''}`
  );
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
