/**
 * Build-time data fetcher for LinkedIn Pinpoint static site
 *
 * This script runs BEFORE `astro build` during GitHub Actions.
 * Strategy:
 *   1. Use /last/{limit}/{page} (now includes answer) for archive summary
 *   2. Only fetch /full/ for today, yesterday, and the 5 most recent puzzles
 *   3. Generate archive.json with answers from /last/ endpoint (no per-puzzle /full/ calls)
 *   4. Generate archive-full.json from /full/ data for recent puzzles only
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

  // ─── 1. FETCH ALL PUZZLES FROM /last/ ENDPOINT (includes answer now) ─
  console.log('📅 Fetching all puzzles from /last/ endpoint...');
  let allPuzzles = [];
  try {
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 15) {
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

  // ─── 2. GENERATE ARCHIVE SUMMARY (with answers from /last/) ───────
  console.log('\n📦 Generating archive.json from /last/ data (no per-puzzle /full/ calls)...');
  const archiveSummary = allPuzzles.map(p => ({
    number: p.number,
    date: p.date,
    clues: p.clues,
    answer: p.answer || null
  }));
  writeJson('archive.json', archiveSummary);

  // ─── 3. DATE MAP ──────────────────────────────────────────────────
  const dateMap = {};
  for (const p of allPuzzles) {
    dateMap[p.date] = p.number;
  }
  writeJson('date-map.json', dateMap);

  // ─── 4. TODAY'S PUZZLE (full data) ────────────────────────────────
  console.log('\n📅 Fetching today\'s puzzle (full data)...');
  let todayFull = null;
  try {
    todayFull = await fetchApi(`/full/${API_SECRET}`);
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
    writeJson('today.json', null);
  }

  // ─── 5. YESTERDAY'S PUZZLE (full data) ────────────────────────────
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

      writeJson(`solutions/${yesterdayFull.number}.json`, {
        number: yesterdayFull.number,
        solutions: yesterdayFull.solutions,
        totalSolutions: yesterdayFull.totalSolutions
      });
    } catch (e) {
      console.error(`  ✗ Failed to fetch yesterday's puzzle: ${e.message}`);
      writeJson('yesterday.json', null);
    }
  } else {
    writeJson('yesterday.json', null);
  }

  // ─── 6. FULL DATA FOR ALL PUZZLES (for unlimited game + detail views) ──
  console.log(`\n📦 Fetching full data for all ${allPuzzles.length} puzzles...`);
  const archiveFull = [];
  const recentForFull = allPuzzles;

  // Add today first if we have it
  if (todayFull) {
    archiveFull.push({
      number: todayFull.number,
      date: todayFull.date,
      clues: todayFull.clues,
      answer: todayFull.answer,
      explanation: todayFull.explanation,
      solutions: todayFull.solutions.slice(0, 10),
      totalSolutions: todayFull.totalSolutions,
      created_at: todayFull.created_at
    });
  }

  for (const puzzle of recentForFull) {
    // Skip today and yesterday (already fetched)
    if (todayFull && puzzle.number === todayFull.number) continue;
    if (yesterdayFull && puzzle.number === yesterdayFull.number) continue;

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
      writeJson(`solutions/${full.number}.json`, {
        number: full.number,
        solutions: full.solutions,
        totalSolutions: full.totalSolutions
      });
    } catch (e) {
      console.error(`  ✗ Failed to fetch puzzle #${puzzle.number}: ${e.message}`);
      // Use /last/ data as fallback (no explanation/solutions)
      archiveFull.push({
        number: puzzle.number,
        date: puzzle.date,
        clues: puzzle.clues,
        answer: puzzle.answer || null,
        explanation: null,
        solutions: [],
        totalSolutions: 0
      });
    }
  }

  // Add yesterday if we have it and it wasn't added yet
  if (yesterdayFull && !archiveFull.find(a => a.number === yesterdayFull.number)) {
    archiveFull.push({
      number: yesterdayFull.number,
      date: yesterdayFull.date,
      clues: yesterdayFull.clues,
      answer: yesterdayFull.answer,
      explanation: yesterdayFull.explanation,
      solutions: yesterdayFull.solutions.slice(0, 10),
      totalSolutions: yesterdayFull.totalSolutions,
      created_at: yesterdayFull.created_at
    });
  }

  // Sort by number descending
  archiveFull.sort((a, b) => b.number - a.number);

  // ─── 7. WRITE ARCHIVE-FULL (for detail views of recent puzzles) ───
  writeJson('archive-full.json', archiveFull);

  // ─── 8. RECENT PUZZLES (for homepage) ─────────────────────────────
  const recentPuzzles = archiveFull.slice(0, 5);
  writeJson('recent.json', recentPuzzles);

  // ─── 9. GENERATE CLOUDFLARE _redirects FILE ──────────────────────
  console.log('\n📝 Writing _redirects file...');
  const redirectsPath = join(__dirname, '..', 'public', '_redirects');
  writeFileSync(redirectsPath, '# Permalinks handled by src/pages/[...permalink].astro\n');
  console.log('  ✓ _redirects');

  // ─── SUMMARY ─────────────────────────────────────────────────────
  const puzzlesWithAnswers = archiveSummary.filter(p => p.answer).length;
  console.log(`\n✅ Data fetch complete!`);
  console.log(`   Total puzzles: ${archiveSummary.length}`);
  console.log(`   Puzzles with answers: ${puzzlesWithAnswers}`);
  console.log(`   Full data fetched: ${archiveFull.length} recent puzzles`);
  console.log(`   API calls made: ~${2 + recentForFull.length}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
