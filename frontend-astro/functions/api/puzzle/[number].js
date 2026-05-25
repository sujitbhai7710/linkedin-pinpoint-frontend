/**
 * Cloudflare Pages Function: /api/puzzle/[number]
 * Proxies puzzle data from the worker API, XOR+base64 encodes the response.
 */

const XOR_KEY = 'P1np0int@2026Sec';
const ALLOWED_ORIGINS = [
  'https://pinpointanswertoday.online',
  'https://www.pinpointanswertoday.online',
  'http://localhost:3000',
  'http://localhost:3001'
];

const rateLimiter = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 30;
  const entry = rateLimiter.get(ip);
  if (!entry || now - entry.start > windowMs) {
    rateLimiter.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > maxRequests) return false;
  return true;
}

function xorEncode(str, key) {
  // Encode each character as UTF-8 bytes, XOR each byte with key byte
  const encoder = new TextEncoder();
  const strBytes = encoder.encode(str);
  const keyBytes = encoder.encode(key);
  const result = new Uint8Array(strBytes.length);
  for (let i = 0; i < strBytes.length; i++) {
    result[i] = strBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  // Convert to base64
  let binary = '';
  for (let i = 0; i < result.length; i++) {
    binary += String.fromCharCode(result[i]);
  }
  return btoa(binary);
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const number = params.number;

  if (!number || !/^\d+$/.test(number)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid puzzle number' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ success: false, error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ success: false, error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'Access-Control-Allow-Origin': origin,
        'Vary': 'Origin'
      }
    });
  }

  const workerUrl = env.WORKER_API_URL;
  const secretKey = env.SECRET_KEY;

  if (!workerUrl || !secretKey) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Server configuration error',
      debug: { hasWorkerUrl: !!workerUrl, hasSecretKey: !!secretKey }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const fetchUrl = `${workerUrl}/full/${number}/${secretKey}`;
    const res = await fetch(fetchUrl);

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Puzzle not found' }), {
        status: res.status === 404 ? 404 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Vary': 'Origin'
        }
      });
    }

    const json = await res.json();

    if (!json.success || !json.data) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid API response' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Vary': 'Origin'
        }
      });
    }

    const puzzleJson = JSON.stringify({
      number: json.data.number,
      date: json.data.date,
      clues: json.data.clues,
      answer: json.data.answer,
      explanation: json.data.explanation,
      solutions: (json.data.solutions || []).slice(0, 10),
      totalSolutions: json.data.totalSolutions || 0
    });

    const encoded = xorEncode(puzzleJson, XOR_KEY);

    return new Response(JSON.stringify({ success: true, encoded }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Vary': 'Origin',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Internal error', message: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': origin,
        'Vary': 'Origin',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  return new Response(null, { status: 204 });
}
