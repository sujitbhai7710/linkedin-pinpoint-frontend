/**
 * Build-time data fetcher for LinkedIn Pinpoint static site
 *
 * This script runs BEFORE `astro build` during GitHub Actions.
 * Strategy:
 *   1. Use /last/{limit}/{page} (now includes answer) for archive summary
 *   2. Only fetch /full/ for today, yesterday, and the 5 most recent puzzles
 *   3. Generate archive.json with answers from /last/ endpoint (no per-puzzle /full/ calls)
 *   4. Generate archive-full.json from /full/ data for recent puzzles only
 *   5. Generate article (explanation) for today's puzzle using NVIDIA API
 *      with a 5-model fallback chain. If explanation already exists in D1,
 *      use it; otherwise generate fresh.
 *
 * Required environment variables:
 *   API_BASE       - Worker URL (e.g. https://linkedin-pinpoint-worker.xxx.workers.dev)
 *   API_SECRET_KEY - The worker's SECRET_KEY for /full/ endpoint auth
 *   NVIDIA_API_KEY - NVIDIA API key for article generation
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

const API_BASE = process.env.API_BASE || 'https://linkedin-pinpoint-worker.gdgdughdshf.workers.dev';
const API_SECRET = process.env.API_SECRET_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

if (!API_SECRET) {
  console.error('ERROR: API_SECRET_KEY environment variable is required');
  console.error('Set it to the same value as the Worker\'s SECRET_KEY secret');
  process.exit(1);
}

// NVIDIA model fallback chain — tried in this exact order.
// If one model fails (EOL, rate limit, 500, etc.), the next is tried.
// If ALL fail, the puzzle is still deployed but without an article.
const NVIDIA_MODELS = [
  'minimaxai/minimax-m3',
  'nvidia/nemotron-3-ultra-550b-a55b',
  'deepseek-ai/deepseek-v4-pro',
  'nvidia/nemotron-3-super-120b-a12b',
  'meta/llama-3.3-70b-instruct'  // fallback (qwen3-next-80b-a3b-instruct not available on NVIDIA)
];

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MIN_EXPLANATION_WORDS = 700;

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

/**
 * Generate explanation for pinpoint answer using NVIDIA API.
 * Tries each model in the NVIDIA_MODELS array in order until one succeeds.
 * Returns the generated explanation string, or null if ALL models fail.
 */
async function generateExplanation(clues, answer) {
  if (!NVIDIA_API_KEY) {
    console.error('  ⚠ NVIDIA_API_KEY not set — skipping article generation');
    return null;
  }

  const prompt = `You are writing the main explanation article for today's LinkedIn Pinpoint puzzle.

LENGTH AND VALUE RULES:
- Absolute minimum: 700 words.
- Ideal target: 900 to 1400 words.
- Add only context that helps explain this specific clue set or teaches a reusable solving method.
- Do not pad, repeat the answer, or create generic sections merely to reach a length target.

WRITING STYLE AND INTEGRITY:
- Use natural everyday English, varied sentence lengths, and clean transitions.
- Be warm, specific, careful, and easy to read.
- Do not claim first-person experience, personal testing, human review, credentials, interviews, or sources that were not supplied.
- Do not invent a solving history, reader statistics, publication process, or certainty about facts not established by the clues.
- Do not discuss the production process, prompts, tokens, or word counts.
- Do not use horizontal rules (*** or ---).

SEO AND READABILITY RULES:
- Naturally mention LinkedIn Pinpoint, today's puzzle, clue meanings, answer explanation, and solving strategy when it fits.
- Keep keyword usage light and natural. Do not stuff repeated phrases.
- Make every paragraph genuinely helpful to a human reader.

Clues:
${clues.map((clue, i) => `${i + 1}. ${clue}`).join('\n')}

Answer: ${answer}

## Deep Clue Analysis
For each clue, explain its plain meaning and exactly how it connects to the final answer. Add background only when it is well established and directly useful. Each clue analysis should usually be 90 to 140 words.
${clues.map((clue, i) => `### ${clue}
**The Meaning of the Clue**: [Explain what "${clue}" means in plain English, add helpful context, mention why readers would know it, and tie it clearly back to the answer. Do not stop at a dictionary definition. Tell the story behind it in a conversational way.]`).join('\n\n')}

## A reasoning path through the clues
Walk through the clues in order and explain how a player could narrow the possibilities. Discuss plausible interpretations as possibilities, not as personal experiences. Identify which clue most strongly resolves ambiguity and why. Use multiple short paragraphs.

## Why the answer fits all the clues together
Write 150 to 220 words that clearly explain the shared thread and any limits or ambiguity visible in the clue set.

## Tips and strategies you can reuse
Provide 3 to 5 practical tips that a reader can apply in future puzzles. Each tip should include a concrete example from this clue set.
**Tip [N]: [Short Title]** - [Detailed explanation with example]

## Frequently Asked Questions
Provide 3 to 5 useful FAQs based on this puzzle topic or gameplay. Answer directly and avoid repeating earlier sections.
**Q: [In-depth Question related to the puzzle topic or gameplay]**
**A: [Comprehensive, detailed answer that provides real value]**

Final quality check before finishing:
- Is the full article above 700 words?
- Does every clue have a specific explanation grounded in the supplied puzzle?
- Are all claims supportable without invented personal experience or credentials?
- Are the tips practical and reusable?
- Do the FAQs add information rather than repeat it?
If any answer is no, continue writing until everything is complete.`;

  const systemContent = 'Write a careful, evidence-bound educational explanation of the supplied word puzzle. Use simple language and keep the analysis specific to the clues. Do not invent first-person experience, credentials, human review, sources, statistics, or facts that cannot be supported by the supplied puzzle. Avoid repeated patterns and keyword stuffing. Prefer accuracy, clear reasoning, and useful context over length.';

  function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  // Try each model in order
  for (let i = 0; i < NVIDIA_MODELS.length; i++) {
    const model = NVIDIA_MODELS[i];
    console.log(`  🤖 [Model ${i + 1}/${NVIDIA_MODELS.length}] Trying: ${model}`);

    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt }
      ],
      temperature: 0.68,
      top_p: 0.92,
      max_tokens: 4096,
      stream: false
    };

    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`    ✗ Model ${model} returned HTTP ${response.status}: ${errorText.substring(0, 200)}`);
        // 410 = EOL, 404 = not found, 401 = bad key, 429 = rate limit — try next model
        // 500/502/503 = server error — try next model
        continue;
      }

      const result = await response.json();

      if (result.choices && result.choices[0] && result.choices[0].message) {
        let content = result.choices[0].message.content || '';

        // Strip any thinking blocks (some models output <think>...</think>)
        content = content.replace(/<think[\s\S]*?<\/think\s*>/g, '').trim();
        content = content.replace(/^\s+|\s+$/g, '');

        if (content.length > 0) {
          const wordCount = countWords(content);

          if (wordCount >= MIN_EXPLANATION_WORDS) {
            console.log(`    ✅ SUCCESS: ${model} generated ${wordCount} words (${content.length} chars)`);
            return content;
          }

          console.warn(`    ⚠ ${model} generated only ${wordCount} words (min ${MIN_EXPLANATION_WORDS}) — trying next model`);
          // Try next model
          continue;
        }
      }

      console.warn(`    ⚠ ${model} returned unexpected response format — trying next model`);
    } catch (error) {
      console.error(`    ✗ ${model} network error: ${error.message} — trying next model`);
    }
  }

  // ALL models failed
  console.error(`  ❌ ALL ${NVIDIA_MODELS.length} models failed to generate an explanation`);
  console.error(`  ⚠ Puzzle will be deployed WITHOUT an article`);
  return null;
}

async function main() {
  console.log('\n🔄 Fetching data from Worker API for static build...\n');
  console.log(`  API Base: ${API_BASE}`);
  console.log(`  Data dir: ${DATA_DIR}`);
  console.log(`  NVIDIA API Key: ${NVIDIA_API_KEY ? '✓ set' : '✗ NOT SET'}`);
  console.log(`  Model fallback chain: ${NVIDIA_MODELS.join(' → ')}\n`);

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

  // ─── 4. TODAY'S PUZZLE (full data + generate article) ─────────────
  console.log('\n📅 Fetching today\'s puzzle (full data)...');
  let todayFull = null;
  try {
    todayFull = await fetchApi(`/full/${API_SECRET}`);

    // If no explanation from D1, generate one using NVIDIA
    if (!todayFull.explanation && todayFull.clues && todayFull.answer) {
      console.log(`\n✍️  No explanation in D1 — generating article via NVIDIA (model fallback chain)...`);
      console.log(`    Puzzle #${todayFull.number}: ${todayFull.answer}`);
      console.log(`    Clues: ${todayFull.clues.join(', ')}`);
      const generated = await generateExplanation(todayFull.clues, todayFull.answer);
      if (generated) {
        todayFull.explanation = generated;
        console.log(`  ✅ Article generated successfully (${generated.length} chars)`);

        // Save the generated explanation back to D1 so future builds don't regenerate it.
        // This is critical: without this, every build (push, schedule, manual) would
        // call NVIDIA again, wasting API quota and slowing down builds.
        try {
          console.log(`  💾 Saving explanation back to D1 for puzzle #${todayFull.number}...`);
          const saveRes = await fetch(`${API_BASE}/save-explanation/${API_SECRET}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: todayFull.number, explanation: generated })
          });
          const saveJson = await saveRes.json();
          if (saveJson.success) {
            console.log(`  ✅ Explanation saved to D1 — future builds will skip NVIDIA`);
          } else {
            console.warn(`  ⚠ Failed to save explanation to D1: ${saveJson.error}`);
          }
        } catch (saveErr) {
          console.warn(`  ⚠ Error saving explanation to D1: ${saveErr.message}`);
          console.warn(`     (Build will continue — explanation is in today.json for this build)`);
        }
      } else {
        console.log(`  ⚠ Article generation failed — puzzle will be deployed without article`);
      }
    } else if (todayFull.explanation) {
      console.log(`  ℹ️  Explanation already exists in D1 (${todayFull.explanation.length} chars) — using it, skipping NVIDIA`);
    }

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
      // Use existing explanation from D1 for yesterday (don't regenerate)
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
  const puzzlesWithExplanations = archiveFull.filter(p => p.explanation).length;
  console.log(`\n✅ Data fetch complete!`);
  console.log(`   Total puzzles: ${archiveSummary.length}`);
  console.log(`   Puzzles with answers: ${puzzlesWithAnswers}`);
  console.log(`   Puzzles with explanations: ${puzzlesWithExplanations}`);
  console.log(`   Full data fetched: ${archiveFull.length} recent puzzles`);
  console.log(`   API calls made: ~${2 + recentForFull.length}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
