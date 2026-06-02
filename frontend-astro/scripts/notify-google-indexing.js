import { createSign } from 'node:crypto';

const DEFAULT_URLS = [
  'https://pinpointanswertoday.online/',
  'https://pinpointanswertoday.online/today/'
];

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/indexing',
  'https://www.googleapis.com/auth/webmasters'
];
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const PUBLISH_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const DEFAULT_SITEMAP_URL = 'https://pinpointanswertoday.online/sitemap.xml';
const DEFAULT_SITE_URL = 'sc-domain:pinpointanswertoday.online';
const SEARCH_CONSOLE_API_BASE = 'https://www.googleapis.com/webmasters/v3/sites';
const MAX_RETRIES = 3;

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseCredentials() {
  const raw =
    process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error('Missing GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON secret.');
  }

  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Service account secret is not valid JSON: ${error.message}`);
  }

  const requiredFields = ['client_email', 'private_key', 'token_uri'];
  for (const field of requiredFields) {
    if (!credentials[field]) {
      throw new Error(`Service account JSON is missing "${field}".`);
    }
  }

  return credentials;
}

function parseUrls() {
  const raw = process.env.GOOGLE_INDEXING_URLS;

  if (!raw) {
    return DEFAULT_URLS;
  }

  const urls = raw
    .split(/[\r\n,]+/)
    .map(value => value.trim())
    .filter(Boolean);

  return urls.length > 0 ? urls : DEFAULT_URLS;
}

function parseSitemaps() {
  const raw = process.env.GOOGLE_SITEMAP_URLS;

  if (!raw) {
    return [DEFAULT_SITEMAP_URL];
  }

  const sitemaps = raw
    .split(/[\r\n,]+/)
    .map(value => value.trim())
    .filter(Boolean);

  return sitemaps.length > 0 ? sitemaps : [DEFAULT_SITEMAP_URL];
}

function parseSearchConsoleSiteUrl() {
  return process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() || DEFAULT_SITE_URL;
}

function formatApiError(status, bodyText) {
  if (!bodyText) {
    return `HTTP ${status}`;
  }

  try {
    const body = JSON.parse(bodyText);
    const message = body?.error?.message || body?.error_description;
    if (message) {
      return `HTTP ${status}: ${message}`;
    }
  } catch {
    // Ignore JSON parse errors and fall back to raw text.
  }

  return `HTTP ${status}: ${bodyText}`;
}

async function fetchWithRetries(url, init, label) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, init);
      const bodyText = await response.text();

      if (response.ok) {
        return bodyText ? JSON.parse(bodyText) : {};
      }

      const error = new Error(formatApiError(response.status, bodyText));
      const isRetryable = response.status === 429 || response.status >= 500;

      if (!isRetryable || attempt === MAX_RETRIES) {
        throw error;
      }

      lastError = error;
    } catch (error) {
      lastError = error;

      if (attempt === MAX_RETRIES) {
        break;
      }
    }

    const waitMs = 1000 * 2 ** (attempt - 1);
    console.log(`${label} attempt ${attempt} failed. Retrying in ${waitMs}ms...`);
    await sleep(waitMs);
  }

  throw new Error(`${label} failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
}

function createJwtAssertion(credentials) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  if (credentials.private_key_id) {
    header.kid = credentials.private_key_id;
  }

  const payload = {
    iss: credentials.client_email,
    scope: GOOGLE_SCOPES.join(' '),
    aud: credentials.token_uri || TOKEN_URL,
    exp: expiresAt,
    iat: issuedAt
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();

  const signature = signer
    .sign(credentials.private_key)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${unsignedToken}.${signature}`;
}

async function getAccessToken(credentials) {
  const assertion = createJwtAssertion(credentials);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });

  const tokenResponse = await fetchWithRetries(
    credentials.token_uri || TOKEN_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    },
    'OAuth token request'
  );

  if (!tokenResponse.access_token) {
    throw new Error('OAuth token response did not include an access token.');
  }

  return tokenResponse.access_token;
}

async function publishNotification(accessToken, url) {
  const response = await fetchWithRetries(
    PUBLISH_URL,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        type: 'URL_UPDATED'
      })
    },
    `Indexing request for ${url}`
  );

  return response?.urlNotificationMetadata?.latestUpdate?.notifyTime || null;
}

async function submitSitemap(accessToken, siteUrl, sitemapUrl) {
  const endpoint = `${SEARCH_CONSOLE_API_BASE}/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;

  await fetchWithRetries(
    endpoint,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    `Sitemap submission for ${sitemapUrl}`
  );
}

async function main() {
  const credentials = parseCredentials();
  const urls = parseUrls();
  const sitemaps = parseSitemaps();
  const searchConsoleSiteUrl = parseSearchConsoleSiteUrl();

  console.log(`Submitting Google indexing notifications for ${urls.length} URL(s)...`);

  const accessToken = await getAccessToken(credentials);
  const failures = [];

  for (const url of urls) {
    try {
      const notifyTime = await publishNotification(accessToken, url);
      const suffix = notifyTime ? ` (notifyTime: ${notifyTime})` : '';
      console.log(`Submitted indexing request for ${url}${suffix}`);
    } catch (error) {
      failures.push({ url, error });
      console.error(`Failed indexing request for ${url}: ${error.message}`);
    }
  }

  console.log(`Submitting ${sitemaps.length} sitemap(s) to Search Console for ${searchConsoleSiteUrl}...`);

  for (const sitemapUrl of sitemaps) {
    try {
      await submitSitemap(accessToken, searchConsoleSiteUrl, sitemapUrl);
      console.log(`Submitted sitemap ${sitemapUrl}`);
    } catch (error) {
      failures.push({ url: sitemapUrl, error });
      console.error(`Failed sitemap submission for ${sitemapUrl}: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Failed indexing request(s): ${failures.map(item => item.url).join(', ')}`);
  }

  console.log('Google indexing notifications and sitemap submission completed successfully.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
