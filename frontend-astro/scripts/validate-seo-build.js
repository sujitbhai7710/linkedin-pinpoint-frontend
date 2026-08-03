import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const failures = [];

function read(relativePath) {
  const file = join(dist, relativePath);
  if (!existsSync(file)) {
    failures.push(`Missing build output: ${relativePath}`);
    return '';
  }
  return readFileSync(file, 'utf-8');
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const archivePath = join(dist, 'archive', 'index.html');
if (existsSync(archivePath)) {
  const size = statSync(archivePath).size;
  assert(size < 500 * 1024, `Archive HTML is ${(size / 1024).toFixed(1)} KB; expected less than 500 KB`);
  const archive = readFileSync(archivePath, 'utf-8');
  assert(!archive.includes('archive-full.json'), 'Archive HTML references the monolithic full archive payload');
} else {
  failures.push('Missing build output: archive/index.html');
}

const robots = read('robots.txt');
assert(!/Crawl-delay/i.test(robots), 'robots.txt still contains Crawl-delay');
assert(!/Disallow:\s*\/(privacy|contact)/i.test(robots), 'robots.txt blocks a policy/contact page');

for (const route of ['privacy', 'contact', 'editorial-policy', 'terms', 'disclaimer']) {
  const html = read(join(route, 'index.html'));
  assert(!html.includes('noindex'), `${route} is unexpectedly noindex`);
  assert(!html.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'), `${route} loads AdSense`);
  assert(!html.includes('scripts.scriptwrapper.com'), `${route} loads grow.me ad script`);
}

// Blog pages are now indexed for AdSense approval
// No longer enforcing noindex, no-ads, or sitemap exclusion on blog

const today = read(join('today', 'index.html'));
assert(today.includes('/pinpoint-answer-today.webp'), 'Today page does not use the normalized featured-image filename');
assert(!today.includes('linkedin pinpoint ANSWER TODAY.webp'), 'Today page still references the old featured-image filename');
// Meta keywords are now intentionally added for SEO on the today page
assert(!today.includes('Pinpoint Answer Today Review Board'), 'Fake reviewer attribution is present');
assert(!today.includes('Pinpoint Answer Today Editorial Team'), 'Fake person attribution is present');

const sitemap = read('sitemap.xml');
assert(sitemap.includes('/linkedin-pinpoint-answer-for-'), 'Sitemap has no dated puzzle pages');

if (existsSync(dist)) {
  const puzzlePage = readdirSync(dist).find(name => name.startsWith('linkedin-pinpoint-answer-for-'));
  assert(Boolean(puzzlePage), 'No dated puzzle article was generated');
  if (puzzlePage) {
    const html = read(join(puzzlePage, 'index.html'));
    assert(!html.includes('window.location.replace'), 'Dated puzzle page still redirects to the archive');
    assert(/class="[^"]*\banswer-word\b[^"]*"[^>]*>[^<]+</.test(html), 'Dated puzzle answer is absent from server-rendered HTML');
  }
}

if (failures.length) {
  console.error('SEO build validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('SEO build validation passed.');