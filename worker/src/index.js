/**
 * LinkedIn Pinpoint Worker V4.0.0
 * Uses LinkedIn's official Voyager GraphQL API via Cloudflare Browser Rendering (Puppeteer)
 * to scrape real puzzle data including clues, answer, and 3000+ solutions
 *
 * Architecture:
 * 1. Cron triggers scrape at 1:30 PM IST (8:00 UTC)
 * 2. Worker scrapes LinkedIn, generates explanation, stores in D1
 * 3. Worker triggers GitHub Actions workflow_dispatch
 * 4. GitHub Actions calls /full/{secretkey} during build to get ALL data
 * 5. GitHub Actions builds static HTML + JSON, deploys to Cloudflare Pages
 */

import puppeteer from '@cloudflare/puppeteer';

// NVIDIA_API_KEY should be set via `npx wrangler secret put NVIDIA_API_KEY`
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL = 'qwen/qwen3.5-122b-a10b';
const MIN_EXPLANATION_WORDS = 900;

// Allowed Origins for Protected Endpoints
const ALLOWED_ORIGINS = [
  'https://pinpointanswertoday.online',
  'https://www.pinpointanswertoday.online',
  'https://pinpointanswers.vercel.app',
  'https://linkedin-pinpoint-answers.pages.dev',
  'http://localhost:3001',
  'http://localhost:3000'
];

// API Key for frontend access
const API_KEY = 'BloggingIo@7';

export default {

  // Scheduled Trigger Handler (cron at 8:00 UTC = 1:30 PM IST)
  async scheduled(event, env, ctx) {
    console.log('Scheduled event triggered at', new Date().toISOString());
    console.log('Cron schedule:', event.cron);
    try {
      const now = new Date();
      const adjustedDate = new Date(now.getTime() - 8 * 60 * 60 * 1000);
      const todayPinpointDate = adjustedDate.toISOString().split('T')[0];
      console.log(`Running scheduled task. Pinpoint Date: ${todayPinpointDate}`);

      const dbResult = await env.DB.prepare(
        'SELECT number, date, clues, answer, explanation, other_solutions FROM pinpoint_data WHERE date = ?'
      ).bind(todayPinpointDate).first();

      let dataToCommit = null;
      let scrapeNeeded = true;

      if (dbResult) {
        console.log(`Data for ${todayPinpointDate} already exists in DB (Pinpoint #${dbResult.number}).`);
        dataToCommit = {
          number: dbResult.number,
          date: dbResult.date,
          clues: JSON.parse(dbResult.clues),
          answer: dbResult.answer,
          explanation: dbResult.explanation,
          solutions: dbResult.other_solutions ? JSON.parse(dbResult.other_solutions) : []
        };
        scrapeNeeded = false;
      }

      if (scrapeNeeded) {
        const scrapeRes = await scrapePinpointData(env);
        if (!scrapeRes || !scrapeRes.success) {
          console.error('Failed to scrape data:', scrapeRes?.error || 'Unknown error');
          return;
        }
        const data = scrapeRes.data;

        console.log('Generating explanation via NVIDIA Qwen...');
        const explanation = await generateExplanation(data.clues, data.answer, env);
        data.explanation = explanation;

        console.log('Storing in DB...');
        await env.DB.prepare(
          `INSERT OR REPLACE INTO pinpoint_data (number, date, clues, answer, explanation, other_solutions) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          data.number,
          data.date,
          JSON.stringify(data.clues),
          data.answer,
          explanation,
          JSON.stringify(data.solutions)
        ).run();

        console.log('Successfully stored in DB');
        dataToCommit = {
          number: data.number,
          date: data.date,
          clues: data.clues,
          answer: data.answer,
          explanation,
          solutions: data.solutions
        };
      }

      // Trigger GitHub Actions build workflow if configured.
      // We use ctx.waitUntil so the cron response isn't blocked, but we still
      // log the result loudly. The trigger function now throws on persistent
      // failure (e.g. revoked GITHUB_TOKEN) instead of failing silently.
      if (dataToCommit && env.GITHUB_TOKEN) {
        console.log('Triggering GitHub Actions build workflow...');
        ctx.waitUntil(
          triggerBuildWorkflow(dataToCommit, env).catch(err => {
            console.error('!!! GitHub Actions trigger FAILED after retries:', err.message);
          })
        );
      } else if (!env.GITHUB_TOKEN) {
        console.warn('GITHUB_TOKEN secret is NOT set on the worker — frontend will NOT auto-rebuild.');
      }
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    const origin = request.headers.get('Origin');

    // Check for Secret Key Bypass (Browser Access)
    // NOTE: Skip for /full/ AND /trigger-build/ paths — these endpoints handle
    // their own auth internally by reading the key from the path. Stripping the
    // key from these paths breaks their route pattern match (the regex requires
    // the key to be present as the final path segment).
    let isAuthorizedBySecret = false;
    const secretKey = env.SECRET_KEY;

    const skipStrip = path.startsWith('/full') || path.startsWith('/trigger-build');
    if (secretKey && path.endsWith(`/${secretKey}`) && !skipStrip) {
      isAuthorizedBySecret = true;
      path = path.substring(0, path.length - (secretKey.length + 1));
      if (path === '') path = '/';
    }

    // Check for API Key Bypass — only for /today endpoint (public access)
    // Allows /today/BloggingIo@7 to be accessed by anyone without revealing SECRET_KEY
    let isAuthorizedByApiKey = false;
    if (path === `/today/${API_KEY}`) {
      isAuthorizedByApiKey = true;
      path = '/today';
    }

    // CORS headers
    let corsHeaders = {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      'Content-Type': 'application/json',
    };

    const requestApiKey = request.headers.get('X-API-Key');
    const isAllowedOrigin = (origin && ALLOWED_ORIGINS.includes(origin)) || isAuthorizedBySecret || isAuthorizedByApiKey || (requestApiKey === API_KEY);

    if (isAllowedOrigin) {
      corsHeaders['Access-Control-Allow-Origin'] = origin || '*';
      corsHeaders['Vary'] = 'Origin';
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      if (isAllowedOrigin) {
        return new Response(null, { headers: corsHeaders });
      }
      return new Response(null, { status: 204 });
    }

    // Protected Endpoints List
    const protectedPrefixes = ['/today', '/yesterday', '/last', '/search'];
    const isProtectedPath = protectedPrefixes.some(prefix => path.startsWith(prefix));

    if (isProtectedPath) {
      if (!isAllowedOrigin) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Forbidden',
          message: 'Protected: Access Denied. Requests allowed only from authorized domains.'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      if (!corsHeaders['Access-Control-Allow-Origin']) {
        corsHeaders['Access-Control-Allow-Origin'] = '*';
      }
    }

    try {
      // Root endpoint - API documentation
      if (path === '/') {
        return new Response(JSON.stringify({
          message: 'LinkedIn Pinpoint API',
          version: '3.0.0',
          source: 'LinkedIn Official Voyager GraphQL API',
          access: 'Protected Endpoints: /today, /yesterday, /last, /search',
          endpoints: {
            'GET /': 'API documentation',
            'GET /today': 'Get the latest pinpoint data (Protected)',
            'GET /yesterday': 'Get the 2nd latest pinpoint data (Protected)',
            'GET /last/{limit}/{page}': 'Get latest X pinpoints (Protected)',
            'GET /search/clue?q={query}': 'Search by clue text (Protected)',
            'GET /search/answer?q={query}': 'Search by answer text (Protected)',
            'GET /search/number/{number}': 'Get data by pinpoint number (Protected)',
            'GET /search/date/{date}': 'Get data by date (Protected)',
            'GET /full/{secretkey}': 'Get ALL data for latest puzzle — answer, explanation, ALL solutions (for build)',
            'GET /full/{number}/{secretkey}': 'Get ALL data for a specific puzzle number (for build)',
            'GET /solutions/{number}/{offset}/{limit}': 'Get solutions with pagination',
            'GET /check/{number}/{word}': 'Check if a word is a valid solution',
            'GET /add/{number}/{secretkey}': 'Scrape and add data (uses LinkedIn API)',
            'GET /scrape': 'Scrape today\'s data from LinkedIn API',
            'GET /delete/{number}/{secretkey}': 'Delete data'
          }
        }, null, 2), { headers: corsHeaders });
      }

      // GET /today - Get latest pinpoint data
      if (path === '/today') {
        const result = await env.DB.prepare(
          'SELECT * FROM pinpoint_data ORDER BY number DESC LIMIT 1'
        ).first();

        if (!result) {
          return new Response(JSON.stringify({
            success: false,
            error: 'No data found',
            message: 'No pinpoint data available yet'
          }), { status: 404, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
          success: true,
          data: formatPinpointResult(result)
        }), { headers: corsHeaders });
      }

      // GET /yesterday - Get 2nd latest pinpoint data
      if (path === '/yesterday') {
        const result = await env.DB.prepare(
          'SELECT * FROM pinpoint_data ORDER BY number DESC LIMIT 1 OFFSET 1'
        ).first();

        if (!result) {
          return new Response(JSON.stringify({
            success: false,
            error: 'No data found',
            message: 'No yesterday pinpoint data available yet'
          }), { status: 404, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
          success: true,
          data: formatPinpointResult(result)
        }), { headers: corsHeaders });
      }

      // GET /last/{limit}/{page} - Get latest N pinpoints with pagination
      const lastMatch = path.match(/^\/last\/(\d+)\/(\d+)$/);
      if (lastMatch) {
        let limit = parseInt(lastMatch[1]);
        const page = parseInt(lastMatch[2]);

        if (limit > 20) limit = 20;
        if (limit < 1) limit = 1;
        if (page < 1) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid parameter',
            message: 'Page number must be at least 1'
          }), { status: 400, headers: corsHeaders });
        }

        const offset = (page - 1) * limit;
        const results = await env.DB.prepare(
          'SELECT number, date, clues, answer FROM pinpoint_data ORDER BY number DESC LIMIT ? OFFSET ?'
        ).bind(limit, offset).all();

        return new Response(JSON.stringify({
          success: true,
          limit,
          page,
          count: results.results.length,
          data: results.results.map(r => ({
            number: r.number,
            date: r.date,
            clues: JSON.parse(r.clues),
            answer: r.answer || null
          }))
        }), { headers: corsHeaders });
      }

      // GET /solutions/:number/:offset/:limit - Returns batch of solutions
      const solutionsMatch = path.match(/^\/solutions\/(\d+)\/(\d+)\/(\d+)$/);
      if (solutionsMatch) {
        const number = parseInt(solutionsMatch[1]);
        const offset = parseInt(solutionsMatch[2]);
        const limit = parseInt(solutionsMatch[3]);

        try {
          const dbResult = await env.DB.prepare(
            'SELECT other_solutions FROM pinpoint_data WHERE number = ?'
          ).bind(number).first();

          if (!dbResult) {
            return new Response(JSON.stringify({ success: false, error: 'Puzzle not found' }), { headers: corsHeaders, status: 404 });
          }

          const allSolutions = dbResult.other_solutions ? JSON.parse(dbResult.other_solutions) : [];
          const slicedSolutions = allSolutions.slice(offset, offset + limit);

          return new Response(JSON.stringify({
            success: true,
            data: slicedSolutions,
            total: allSolutions.length,
            hasMore: (offset + limit) < allSolutions.length
          }), { headers: corsHeaders });
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { headers: corsHeaders, status: 500 });
        }
      }

      // GET /check/:number/:word - Check if a word is a valid solution
      const checkMatch = path.match(/^\/check\/(\d+)\/(.+)$/);
      if (checkMatch) {
        const number = parseInt(checkMatch[1]);
        const word = decodeURIComponent(checkMatch[2]).trim();

        try {
          const dbResult = await env.DB.prepare(
            'SELECT other_solutions FROM pinpoint_data WHERE number = ?'
          ).bind(number).first();

          if (!dbResult) {
            return new Response(JSON.stringify({ success: false, error: 'Puzzle not found' }), { headers: corsHeaders, status: 404 });
          }

          const allSolutions = dbResult.other_solutions ? JSON.parse(dbResult.other_solutions) : [];
          const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
          const exists = allSolutions.some(s => s.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanWord);

          return new Response(JSON.stringify({
            success: true,
            exists: exists,
            word: word
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { headers: corsHeaders });
        }
      }

      // GET /full/{secretkey} - Get ALL data for latest puzzle (for static build)
      // GET /full/{number}/{secretkey} - Get ALL data for specific puzzle number
      const fullMatch = path.match(/^\/full(?:\/(\d+))?\/(.+)$/);
      if (fullMatch) {
        const [, numberStr, providedKey] = fullMatch;
        const number = numberStr ? parseInt(numberStr) : null;

        if (providedKey !== env.SECRET_KEY) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid secret key'
          }), { status: 401, headers: corsHeaders });
        }

        try {
          let result;
          if (number) {
            result = await env.DB.prepare(
              'SELECT * FROM pinpoint_data WHERE number = ?'
            ).bind(number).first();
          } else {
            result = await env.DB.prepare(
              'SELECT * FROM pinpoint_data ORDER BY number DESC LIMIT 1'
            ).first();
          }

          if (!result) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Not found',
              message: number ? `No data for puzzle #${number}` : 'No puzzle data available'
            }), { status: 404, headers: corsHeaders });
          }

          // Return EVERYTHING — all solutions, full explanation, no truncation
          const allSolutions = result.other_solutions ? JSON.parse(result.other_solutions) : [];
          return new Response(JSON.stringify({
            success: true,
            data: {
              number: result.number,
              date: result.date,
              clues: JSON.parse(result.clues),
              answer: result.answer,
              explanation: result.explanation || null,
              solutions: allSolutions,
              totalSolutions: allSolutions.length,
              created_at: result.created_at
            }
          }), { headers: corsHeaders });
        } catch (e) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Database error',
            message: e.message
          }), { status: 500, headers: corsHeaders });
        }
      }

      // GET /add/{number}/{secretkey} - Scrape and add data using LinkedIn API
      const addMatch = path.match(/^\/add\/(\d+)(?:\/(.+))?$/);
      if (addMatch) {
        const [, number, providedKey] = addMatch;

        if (providedKey !== env.SECRET_KEY && !isAuthorizedBySecret) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or missing secret key'
          }), { status: 401, headers: corsHeaders });
        }

        try {
          const data = await scrapeAndStorePinpoint(env, parseInt(number));

          if (!data || !data.answer) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Processing failed',
              message: 'Could not extract required data from LinkedIn API',
              data: data
            }), { status: 500, headers: corsHeaders });
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'Data added/updated successfully via LinkedIn Official API',
            data: data
          }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to add',
            message: err.message
          }), { status: 500, headers: corsHeaders });
        }
      }

      // GET /scrape - Manually trigger scrape for today's data from LinkedIn API
      if (path === '/scrape') {
        if (!isAllowedOrigin && !isAuthorizedBySecret) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'Requires secret key or authorized origin'
          }), { status: 401, headers: corsHeaders });
        }

        try {
          const scrapeRes = await scrapePinpointData(env);
          if (!scrapeRes || !scrapeRes.success) {
            return new Response(JSON.stringify({
              success: false,
              error: scrapeRes?.error || 'Scraping failed'
            }), { status: 500, headers: corsHeaders });
          }

          const data = scrapeRes.data;

          // Generate explanation
          let explanation = null;
          try {
            explanation = await generateExplanation(data.clues, data.answer, env);
          } catch (err) {
            console.error('Explanation generation failed:', err.message);
          }
          data.explanation = explanation;

          // Store in DB
          await env.DB.prepare(
            `INSERT OR REPLACE INTO pinpoint_data (number, date, clues, answer, explanation, other_solutions) VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            data.number,
            data.date,
            JSON.stringify(data.clues),
            data.answer,
            explanation,
            JSON.stringify(data.solutions)
          ).run();

          return new Response(JSON.stringify({
            success: true,
            message: 'Scraped from LinkedIn Official Voyager API',
            data: data
          }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({
            success: false,
            error: err.message
          }), { status: 500, headers: corsHeaders });
        }
      }

      // GET /trigger-build/{secretkey} - Manually trigger the GitHub Actions
      // build workflow (uses the latest stored puzzle). Useful for testing that
      // the GITHUB_TOKEN secret works end-to-end without waiting for the cron.
      const triggerBuildMatch = path.match(/^\/trigger-build(?:\/(\d+))?\/(.+)$/);
      if (triggerBuildMatch) {
        const [, numberStr, providedKey] = triggerBuildMatch;
        const number = numberStr ? parseInt(numberStr) : null;

        if (providedKey !== env.SECRET_KEY && !isAuthorizedBySecret) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or missing secret key'
          }), { status: 401, headers: corsHeaders });
        }

        try {
          // Fetch the puzzle to trigger for
          let puzzleRow;
          if (number) {
            puzzleRow = await env.DB.prepare(
              'SELECT number, date FROM pinpoint_data WHERE number = ?'
            ).bind(number).first();
          } else {
            puzzleRow = await env.DB.prepare(
              'SELECT number, date FROM pinpoint_data ORDER BY number DESC LIMIT 1'
            ).first();
          }

          if (!puzzleRow) {
            return new Response(JSON.stringify({
              success: false,
              error: 'No puzzle data available to trigger a build for'
            }), { status: 404, headers: corsHeaders });
          }

          // Trigger the workflow. Because this is a manual HTTP request we
          // await it (no ctx.waitUntil) so the caller sees the real result.
          const result = await triggerBuildWorkflow(puzzleRow, env);
          return new Response(JSON.stringify({
            success: true,
            message: `Triggered GitHub Actions build for Pinpoint #${puzzleRow.number}`,
            puzzle: puzzleRow,
            github: result
          }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({
            success: false,
            error: 'GitHub trigger failed',
            message: err.message
          }), { status: 502, headers: corsHeaders });
        }
      }

      // GET /delete/{number}/{secretkey} - Delete data
      const deleteMatch = path.match(/^\/delete\/(\d+)(?:\/(.+))?$/);
      if (deleteMatch) {
        const [, number, providedKey] = deleteMatch;

        if (providedKey !== env.SECRET_KEY && !isAuthorizedBySecret) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or missing secret key'
          }), { status: 401, headers: corsHeaders });
        }

        const result = await env.DB.prepare(
          'DELETE FROM pinpoint_data WHERE number = ?'
        ).bind(parseInt(number)).run();

        if (result.meta.changes === 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Not found',
            message: `No data found for pinpoint number ${number}`
          }), { status: 404, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Pinpoint ${number} deleted successfully`
        }), { headers: corsHeaders });
      }

      // GET /search/clue?q={query}
      if (path === '/search/clue') {
        const query = url.searchParams.get('q');
        if (!query) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing parameter',
            message: 'Query parameter "q" is required'
          }), { status: 400, headers: corsHeaders });
        }

        const results = await env.DB.prepare(
          'SELECT * FROM pinpoint_data WHERE clues LIKE ? ORDER BY number DESC'
        ).bind(`%${query}%`).all();

        return new Response(JSON.stringify({
          success: true,
          count: results.results.length,
          data: results.results.map(r => ({
            number: r.number,
            date: r.date,
            clues: JSON.parse(r.clues),
            answer: r.answer,
            explanation: r.explanation || null,
          }))
        }), { headers: corsHeaders });
      }

      // GET /search/answer?q={query}
      if (path === '/search/answer') {
        const query = url.searchParams.get('q');
        if (!query) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing parameter',
            message: 'Query parameter "q" is required'
          }), { status: 400, headers: corsHeaders });
        }

        const results = await env.DB.prepare(
          'SELECT * FROM pinpoint_data WHERE answer LIKE ? ORDER BY number DESC'
        ).bind(`%${query}%`).all();

        return new Response(JSON.stringify({
          success: true,
          count: results.results.length,
          data: results.results.map(r => ({
            number: r.number,
            date: r.date,
            clues: JSON.parse(r.clues),
            answer: r.answer,
            explanation: r.explanation || null,
          }))
        }), { headers: corsHeaders });
      }

      // GET /search/number/{number}
      const numberMatch = path.match(/^\/search\/number\/(\d+)$/);
      if (numberMatch) {
        const number = parseInt(numberMatch[1]);
        const result = await env.DB.prepare(
          'SELECT * FROM pinpoint_data WHERE number = ?'
        ).bind(number).first();

        if (!result) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Not found',
            message: `No data found for pinpoint number ${number}`
          }), { status: 404, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
          success: true,
          data: formatPinpointResult(result)
        }), { headers: corsHeaders });
      }

      // GET /search/date/{date}
      const dateMatch = path.match(/^\/search\/date\/(.+)$/);
      if (dateMatch) {
        const date = dateMatch[1];
        const result = await env.DB.prepare(
          'SELECT * FROM pinpoint_data WHERE date = ?'
        ).bind(date).first();

        if (!result) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Not found',
            message: `No data found for date ${date}`
          }), { status: 404, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
          success: true,
          data: formatPinpointResult(result)
        }), { headers: corsHeaders });
      }

      // 404 - Not found
      return new Response(JSON.stringify({
        success: false,
        error: 'Not found',
        message: 'Endpoint not found',
        availableEndpoints: [
          'GET /',
          'GET /today',
          'GET /yesterday',
          'GET /last/{limit}/{page}',
          'GET /full/{secretkey}',
          'GET /full/{number}/{secretkey}',
          'GET /solutions/{number}/{offset}/{limit}',
          'GET /check/{number}/{word}',
          'GET /scrape',
          'GET /add/{number}/{secretkey}',
          'GET /delete/{number}/{secretkey}',
          'GET /trigger-build/{secretkey}',
          'GET /trigger-build/{number}/{secretkey}',
          'GET /search/clue?q={query}',
          'GET /search/answer?q={query}',
          'GET /search/number/{number}',
          'GET /search/date/{date}',
        ]
      }), { status: 404, headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }), { status: 500, headers: corsHeaders });
    }
  },
};

/**
 * Format a DB result for API response (with solution pagination)
 */
function formatPinpointResult(result) {
  const allSolutions = result.other_solutions ? JSON.parse(result.other_solutions) : [];
  return {
    number: result.number,
    date: result.date,
    clues: JSON.parse(result.clues),
    answer: result.answer,
    explanation: result.explanation || null,
    solutions: allSolutions.slice(0, 10),
    totalSolutions: allSolutions.length,
    created_at: result.created_at,
  };
}

/**
 * Scrape pinpoint data from LinkedIn's official Voyager GraphQL API
 * Uses Cloudflare Browser Rendering (Puppeteer) to:
 * 1. Launch a headless browser
 * 2. Navigate to LinkedIn's Pinpoint game page
 * 3. Extract CSRF token from browser cookies
 * 4. Call the Voyager GraphQL API with proper auth headers
 * 5. Parse the response to get real puzzle data with all solutions
 */
async function scrapePinpointData(env, forcedDate = null) {
  let browser = null;
  try {
    console.log('Launching browser via Cloudflare Browser Rendering...');
    browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to LinkedIn Pinpoint game page...');
    await page.goto('https://www.linkedin.com/games/view/pinpoint/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for the page to load and set cookies
    await new Promise(r => setTimeout(r, 5000));

    console.log('Executing in-page Voyager GraphQL API fetch...');
    const rawData = await page.evaluate(async () => {
      // Extract CSRF token from the browser's cookies
      const value = `; ${document.cookie}`;
      const parts = value.split('; JSESSIONID=');
      let csrfToken = null;
      if (parts.length === 2) {
        csrfToken = parts.pop().split(';').shift();
      }
      if (csrfToken) {
        csrfToken = csrfToken.replace(/"/g, '');
      }
      if (!csrfToken) {
        return { error: 'CSRF token not found - page may not have loaded correctly' };
      }

      try {
        // Call LinkedIn's official Voyager GraphQL API
        const response = await fetch(
          'https://www.linkedin.com/voyager/api/graphql?variables=(gameTypeId:1)&queryId=voyagerIdentityDashGames.3664a5cdcf3ab7108948e8c925f3374f',
          {
            method: 'GET',
            headers: {
              'accept': 'application/vnd.linkedin.normalized+json+2.1',
              'csrf-token': csrfToken,
              'x-restli-protocol-version': '2.0.0'
            }
          }
        );
        if (!response.ok) {
          throw new Error(`Voyager API fetch failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (e) {
        return { error: e.toString() };
      }
    });

    if (rawData.error) {
      throw new Error(rawData.error);
    }

    // Parse the Voyager GraphQL response
    const puzzleEntry = rawData.included?.find(item => item.puzzleId && item.gamePuzzle);
    const puzzle = puzzleEntry?.gamePuzzle?.blueprintGamePuzzle;

    if (!puzzleEntry || !puzzle) {
      throw new Error('Puzzle data missing in Voyager API response structure');
    }

    // Extract solutions
    const rawSolutions = puzzle.solutions || [];
    const primaryAnswer = rawSolutions[0] || 'Unknown';

    // Format solutions: handle quoted answer patterns like Words that come after "head"
    let formattedSolutions = rawSolutions;
    const quoteMatch = primaryAnswer.match(/^(.*")(.+)(".*)$/);
    if (quoteMatch) {
      const prefix = quoteMatch[1];
      const baseWord = quoteMatch[2];
      const suffix = quoteMatch[3];
      formattedSolutions = rawSolutions.map(s => {
        if (s.includes(prefix) && s.includes(suffix)) return s;
        return `${prefix}${s}${suffix}`;
      });
    }

    const uniqueSolutions = [...new Set(formattedSolutions)];

    // Determine the date
    let finalDate = forcedDate;
    if (!finalDate) {
      const now = new Date();
      const adjustedDate = new Date(now.getTime() - 8 * 60 * 60 * 1000);
      finalDate = adjustedDate.toISOString().split('T')[0];
    }

    console.log(`Successfully scraped Pinpoint #${puzzleEntry.puzzleId} with ${uniqueSolutions.length} solutions from LinkedIn API`);

    return {
      success: true,
      data: {
        number: puzzleEntry.puzzleId,
        date: finalDate,
        clues: puzzle.clues,
        answer: primaryAnswer,
        solutions: uniqueSolutions
      }
    };
  } catch (error) {
    console.error('LinkedIn API scraping error:', error);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape and store pinpoint data - called from /add endpoint
 * Uses LinkedIn's official Voyager GraphQL API
 */
async function scrapeAndStorePinpoint(env, number) {
  // Scrape from LinkedIn API
  const scrapeRes = await scrapePinpointData(env);

  if (!scrapeRes || !scrapeRes.success) {
    throw new Error(scrapeRes?.error || 'Failed to scrape from LinkedIn API');
  }

  const data = scrapeRes.data;

  if (!data.clues || !data.answer || data.clues.length === 0) {
    throw new Error('Incomplete data received from LinkedIn API');
  }

  // Generate explanation using NVIDIA Qwen API
  console.log('Generating explanation via NVIDIA Qwen API...');
  let explanation;
  try {
    explanation = await generateExplanation(data.clues, data.answer, env);
    if (!explanation) {
      throw new Error('Empty explanation generated');
    }
    data.explanation = explanation;
    console.log('Explanation generated successfully');
  } catch (err) {
    console.error('Explanation generation failed, aborting storage:', err.message);
    throw new Error(`NVIDIA Qwen API error: ${err.message}. Failed to add to database.`);
  }

  // Store in database (upsert)
  await env.DB.prepare(`
    INSERT INTO pinpoint_data (number, date, clues, answer, explanation, other_solutions, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(number) 
    DO UPDATE SET 
      date = excluded.date,
      clues = excluded.clues,
      answer = excluded.answer,
      explanation = excluded.explanation,
      other_solutions = excluded.other_solutions,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    parseInt(number),
    data.date,
    JSON.stringify(data.clues),
    data.answer,
    explanation,
    JSON.stringify(data.solutions)
  ).run();

  return data;
}

/**
 * Generate explanation for pinpoint answer using NVIDIA Qwen 3.5 122B API
 */
async function generateExplanation(clues, answer, env) {
  const apiKey = env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error('NVIDIA_API_KEY not set, skipping explanation generation');
    return null;
  }

  console.log('Starting generation with NVIDIA Qwen 3.5 122B');

  const prompt = `You are writing the main explanation article for today's LinkedIn Pinpoint puzzle.

LENGTH AND VALUE RULES:
- Absolute minimum: 900 words.
- Ideal target: 1100 to 1600 words.
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
- Is the full article above 900 words?
- Does every clue have a specific explanation grounded in the supplied puzzle?
- Are all claims supportable without invented personal experience or credentials?
- Are the tips practical and reusable?
- Do the FAQs add information rather than repeat it?
If any answer is no, continue writing until everything is complete.`;

  const requestBody = {
    model: NVIDIA_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Write a careful, evidence-bound educational explanation of the supplied word puzzle. Use simple language and keep the analysis specific to the clues. Do not invent first-person experience, credentials, human review, sources, statistics, or facts that cannot be supported by the supplied puzzle. Avoid repeated patterns and keyword stuffing. Prefer accuracy, clear reasoning, and useful context over length.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.68,
    top_p: 0.92,
    max_tokens: 16384,
    stream: false,
    chat_template_kwargs: { enable_thinking: true }
  };

  const maxRetries = 3;
  let lastError = null;

  function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Attempt ${attempt}/${maxRetries}] Calling NVIDIA Qwen API...`);

    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`NVIDIA API error: ${response.status} - ${errorText}`);
        lastError = new Error(`NVIDIA API error: ${response.status} - ${errorText}`);
        
        if (response.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        
        if (response.status >= 500 && response.status < 600) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Server error, waiting ${waitTime}ms before retry...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        
        throw lastError;
      }

      const result = await response.json();
      
      if (result.choices && result.choices[0] && result.choices[0].message) {
        let content = result.choices[0].message.content || '';
        
        // Check if thinking content is in a separate field (some API implementations)
        // If reasoning_content exists, the main content is already clean
        // Otherwise, strip thinking blocks from the content
        if (!result.choices[0].message.reasoning_content) {
          // Strip Qwen 3.5 thinking blocks (<think...</think)
          content = content.replace(/<think[\s\S]*?<\/think\s*>/g, '').trim();
        }
        content = content.replace(/^\s+|\s+$/g, '');
        
        if (content.length > 0) {
          const wordCount = countWords(content);

          if (wordCount >= MIN_EXPLANATION_WORDS) {
            console.log(`Successfully generated explanation via NVIDIA Qwen (${content.length} chars, ${wordCount} words)`);
            return content;
          }

          console.warn(`Generated explanation too short (${wordCount} words). Retrying...`);
          lastError = new Error(`Generated explanation below minimum word count (${wordCount}/${MIN_EXPLANATION_WORDS})`);
          continue;
        }
      }

      console.error('Unexpected NVIDIA API response format');
      lastError = new Error('Unexpected NVIDIA API response format');
    } catch (error) {
      console.error(`NVIDIA API fetch error (attempt ${attempt}):`, error.message);
      lastError = error;
      
      if (attempt < maxRetries && error.name !== 'AbortError') {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, waitTime));
      }
    }
  }

  console.error('All NVIDIA Qwen API attempts failed.');
  throw lastError || new Error('NVIDIA Qwen API failed to generate a response.');
}


/**
 * Trigger GitHub Actions build workflow after new puzzle data is available.
 * This tells the frontend repo to rebuild its static site with the latest data.
 *
 * HARDENED: retries up to 4 times with exponential backoff on transient errors
 * (5xx, 429, network). On non-retriable failures (e.g. 401/403 from a revoked
 * or expired GITHUB_TOKEN) it THROWS so the caller can surface the problem
 * instead of silently swallowing it (which was the original silent-failure bug).
 */
async function triggerBuildWorkflow(data, env) {
  const REPO_OWNER = env.GH_REPO_OWNER || 'sujitbhai7710';
  const REPO_NAME = env.GH_REPO_NAME || 'linkedin-pinpoint-frontend';
  const WORKFLOW_ID = env.GH_WORKFLOW_ID || 'build.yml';
  const token = env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN secret is NOT set on the worker — cannot trigger build.');
  }

  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`;
  const body = JSON.stringify({
    ref: 'main',
    inputs: {
      puzzle_number: String(data.number),
      puzzle_date: data.date
    }
  });

  const MAX_ATTEMPTS = 4;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[GitHub dispatch ${attempt}/${MAX_ATTEMPTS}] Pinpoint #${data.number} -> ${apiUrl}`);
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Cloudflare-Worker'
        },
        body
      });

      // 204 No Content is the documented success response for workflow_dispatch
      if (res.status === 204 || (res.ok && res.status >= 200 && res.status < 300)) {
        console.log(`✅ Successfully triggered GitHub Actions build for Pinpoint #${data.number} (HTTP ${res.status})`);
        return { success: true, status: res.status };
      }

      const errorText = await res.text().catch(() => '');
      console.error(`GitHub dispatch HTTP ${res.status}: ${errorText}`);

      // Non-retriable auth/permission errors — token is bad or lacks scope.
      if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 422) {
        lastError = new Error(`GitHub dispatch failed (HTTP ${res.status}). Most likely the GITHUB_TOKEN secret is revoked, expired, or missing 'repo'+'workflow' scopes. Body: ${errorText}`);
        break; // do not retry auth errors
      }

      // Retriable: rate limit & server errors
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`GitHub dispatch transient failure (HTTP ${res.status}). Body: ${errorText}`);
        if (attempt < MAX_ATTEMPTS) {
          const wait = Math.pow(2, attempt) * 1500;
          console.log(`Retrying in ${wait}ms...`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
      }

      // Any other unexpected status
      lastError = new Error(`GitHub dispatch unexpected status HTTP ${res.status}. Body: ${errorText}`);
      break;
    } catch (e) {
      console.error(`GitHub dispatch network error (attempt ${attempt}):`, e.message);
      lastError = e;
      if (attempt < MAX_ATTEMPTS) {
        const wait = Math.pow(2, attempt) * 1500;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
    }
  }

  // If we reach here the dispatch never succeeded.
  console.error('❌ GitHub Actions trigger FAILED after all retries:', lastError?.message);
  throw lastError || new Error('GitHub Actions trigger failed for unknown reasons.');
}
