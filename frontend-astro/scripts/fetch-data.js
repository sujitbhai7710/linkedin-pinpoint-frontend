/**
 * Build-time data fetcher for LinkedIn Pinpoint static site
 *
 * This script runs BEFORE `vite build` during GitHub Actions.
 * It calls the Worker's /full/{secretkey} endpoint to get ALL data
 * (answer, explanation, all 3000+ solutions) and writes JSON files
 * to static/data/ that the SvelteKit app reads during prerendering.
 *
 * Required environment variables:
 *   API_BASE       - Worker URL (e.g. https://linkedin-pinpoint-worker.xxx.workers.dev)
 *   API_SECRET_KEY - The worker's SECRET_KEY for /full/ endpoint auth
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

const API_BASE = process.env.API_BASE || 'https://linkedin-pinpoint-worker.gdgdughdshf.workers.dev';
const API_SECRET = process.env.API_SECRET_KEY;

if (!API_SECRET) {
  console.error('ERROR: API_SECRET_KEY environment variable is required');
  console.error('Set it to the same value as the Worker\'s SECRET_KEY secret');
  process.exit(1);
}

function writeJson(filename, data) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(dirname(filepath))) {
    mkdirSync(dirname(filepath), { recursive: true });
  }
  writeFileSync(filepath, JSON.stringify(data, null, 0)); // minified for smaller file size
  console.log(`  ✓ ${filename} (${(JSON.stringify(data).length / 1024).toFixed(1)} KB)`);
}

async function fetchApi(endpoint) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`  Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText} for ${endpoint}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(`API returned failure: ${json.error || 'Unknown error'}`);
  }
  return json.data;
}

async function main() {
  console.log('\n🔄 Fetching data from Worker API for static build...\n');
  console.log(`  API Base: ${API_BASE}`);
  console.log(`  Data dir: ${DATA_DIR}\n`);

  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  // Ensure solutions subdirectory exists
  if (!existsSync(join(DATA_DIR, 'solutions'))) {
    mkdirSync(join(DATA_DIR, 'solutions'), { recursive: true });
  }

  // ─── 1. TODAY'S PUZZLE (full data) ───────────────────────────
  console.log('📅 Fetching today\'s puzzle...');
  let todayFull = null;
  try {
    todayFull = await fetchApi(`/full/${API_SECRET}`);
    // For the main page data, include first 10 solutions
    const todayMeta = {
      number: todayFull.number,
      date: todayFull.date,
      clues: todayFull.clues,
      answer: todayFull.answer,
      explanation: todayFull.explanation,
      solutions: todayFull.solutions.slice(0, 10),
      totalSolutions: todayFull.totalSolutions,
      created_at: todayFull.created_at
    };
    writeJson('today.json', todayMeta);

    // Full solutions in separate file for lazy loading
    writeJson(`solutions/${todayFull.number}.json`, {
      number: todayFull.number,
      solutions: todayFull.solutions,
      totalSolutions: todayFull.totalSolutions
    });
  } catch (e) {
    console.error(`  ✗ Failed to fetch today's puzzle: ${e.message}`);
    // Write empty placeholder so build doesn't fail
    writeJson('today.json', null);
  }

  // ─── 2. YESTERDAY'S PUZZLE ───────────────────────────────────
  console.log('\n📅 Fetching recent puzzles for yesterday & archive...');
  let allPuzzles = [];
  try {
    // Fetch multiple pages to get all puzzles for the archive
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 10) {
      const url = `${API_BASE}/last/20/${page}`;
      const res = await fetch(url, {
        headers: { 'X-API-Key': 'BloggingIo@7' }
      });
      if (!res.ok) break;
      const json = await res.json();
      if (!json.data || json.data.length === 0) {
        hasMore = false;
      } else {
        allPuzzles = [...allPuzzles, ...json.data];
        if (json.data.length < 20) hasMore = false;
        page++;
      }
    }
    console.log(`  Found ${allPuzzles.length} puzzles in archive`);
  } catch (e) {
    console.error(`  ✗ Failed to fetch puzzle list: ${e.message}`);
  }

  // ─── 3. YESTERDAY'S FULL DATA ────────────────────────────────
  let yesterdayFull = null;
  if (allPuzzles.length >= 2) {
    const yesterdayPuzzle = allPuzzles[1]; // 2nd most recent
    try {
      yesterdayFull = await fetchApi(`/full/${yesterdayPuzzle.number}/${API_SECRET}`);
      const yesterdayMeta = {
        number: yesterdayFull.number,
        date: yesterdayFull.date,
        clues: yesterdayFull.clues,
        answer: yesterdayFull.answer,
        explanation: yesterdayFull.explanation,
        solutions: yesterdayFull.solutions.slice(0, 10),
        totalSolutions: yesterdayFull.totalSolutions,
        created_at: yesterdayFull.created_at
      };
      writeJson('yesterday.json', yesterdayMeta);
    } catch (e) {
      console.error(`  ✗ Failed to fetch yesterday's puzzle: ${e.message}`);
      writeJson('yesterday.json', null);
    }
  } else {
    writeJson('yesterday.json', null);
  }

  // ─── 4. FULL DATA FOR ALL ARCHIVE PUZZLES ────────────────────
  console.log('\n📦 Fetching full data for all archive puzzles...');
  const archiveFull = [];
  for (const puzzle of allPuzzles) {
    try {
      const full = await fetchApi(`/full/${puzzle.number}/${API_SECRET}`);
      archiveFull.push({
        number: full.number,
        date: full.date,
        clues: full.clues,
        answer: full.answer,
        explanation: full.explanation,
        solutions: full.solutions.slice(0, 10),
        totalSolutions: full.totalSolutions,
        created_at: full.created_at
      });
      // Write individual solutions file for each puzzle (for lazy loading)
      writeJson(`solutions/${full.number}.json`, {
        number: full.number,
        solutions: full.solutions,
        totalSolutions: full.totalSolutions
      });
    } catch (e) {
      console.error(`  ✗ Failed to fetch puzzle #${puzzle.number}: ${e.message}`);
      // Still include summary in archive
      archiveFull.push({
        number: puzzle.number,
        date: puzzle.date,
        clues: puzzle.clues,
        answer: null,
        explanation: null,
        solutions: [],
        totalSolutions: 0
      });
    }
  }

  // ─── 5. ARCHIVE SUMMARY (for calendar view) ─────────────────
  const archiveSummary = allPuzzles.map(p => ({
    number: p.number,
    date: p.date,
    clues: p.clues,
    answer: archiveFull.find(a => a.number === p.number)?.answer || null
  }));
  writeJson('archive.json', archiveSummary);

  // ─── 6. FULL ARCHIVE (for detail views) ──────────────────────
  writeJson('archive-full.json', archiveFull);

  // ─── 7. RECENT PUZZLES (for homepage) ────────────────────────
  const recentPuzzles = archiveFull.slice(0, 5);
  writeJson('recent.json', recentPuzzles);

  // ─── 8. GENERATE DATE-BASED PUZZLE MAP ───────────────────────
  // Map of date → puzzle number for archive lookups
  const dateMap = {};
  for (const p of archiveFull) {
    dateMap[p.date] = p.number;
  }
  writeJson('date-map.json', dateMap);

  // ─── 9. GENERATE CLOUDFLARE _redirects FILE ─────────────────
  // Permalink URLs are now handled by Astro's [...permalink].astro page
  // which uses sessionStorage + JS redirect to /archive (no hash, no query params)
  // This avoids duplicate content SEO issues.
  console.log('\n📝 Writing empty _redirects (permalinks handled by Astro pages)...');
  const redirectsPath = join(__dirname, '..', 'public', '_redirects');
  writeFileSync(redirectsPath, '# Permalinks handled by src/pages/[...permalink].astro\n');
  console.log('  ✓ _redirects (minimal — permalinks handled by Astro pages)');

  console.log('\n✅ Data fetch complete! Static JSON files ready for build.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
