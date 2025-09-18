const axios = require('axios');
const limiter = require('./limiter');

const DC_BASE  = process.env.ZOHO_DC_BASE  || 'https://accounts.zoho.com';
const API_BASE = process.env.ZOHO_API_BASE || 'https://www.zohoapis.com';
let accessToken = null;
let issuedAt = 0;

async function refreshAccessToken() {
  try {
    const { data } = await axios.post(`${DC_BASE}/oauth/v2/token`, null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET
      }
    });
    accessToken = data.access_token;
    issuedAt = Date.now();
    console.log('Access token refreshed successfully');
    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    throw error;
  }
}

const api = axios.create({ baseURL: `${API_BASE}/inventory/v1` });

// helper: parse Retry-After header -> ms
function parseRetryAfterMs(res) {
  const ra = res?.headers?.['retry-after'];
  if (!ra) return null;
  if (/^\d+$/.test(ra)) return Number(ra) * 1000; // seconds
  const when = Date.parse(ra);
  if (!isNaN(when)) return Math.max(0, when - Date.now());
  return null;
}

// helper: detect Zoho rate-limit error
function isZohoRateLimit(err) {
  const s = err?.response?.status;
  const body = err?.response?.data;
  const text = typeof body === 'string' ? body : JSON.stringify(body || {});
  return s === 429
      || (s === 400 && /too many requests/i.test(text))
      || (s === 400 && /made too many requests/i.test(text));
}

api.interceptors.request.use(async (config) => {
  // throttle globally
  await limiter.wait();

  // proactive refresh ~50 min
  const FIFTY_MIN = 50 * 60 * 1000;
  if (!accessToken || (Date.now() - issuedAt) > FIFTY_MIN) {
    await refreshAccessToken();
  }
  config.headers.Authorization = `Zoho-oauthtoken ${accessToken}`;
  config.headers.Accept = 'application/json';
  return config;
});

api.interceptors.response.use(
  (res) => {
    // successful request -> slide the window
    limiter.notifyDone();
    return res;
  },
  async (err) => {
    // 401 -> refresh once and retry
    if (err.response && err.response.status === 401) {
      console.log('401 error detected, refreshing token and retrying...');
      await refreshAccessToken();
      err.config.headers.Authorization = `Zoho-oauthtoken ${accessToken}`;
      return api.request(err.config);
    }

    // Zoho rate limit -> pause then retry once
    if (isZohoRateLimit(err)) {
      const retryAfter = parseRetryAfterMs(err.response);
      // default pause: 15–45s randomized to avoid thundering herd
      const fallback = 15000 + Math.floor(Math.random() * 30000);
      const waitMs = retryAfter ?? fallback;
      console.warn(`[Zoho] Rate limited. Pausing ${waitMs} ms then retrying ${err.config.url}`);
      await limiter.pause(waitMs);
      await limiter.wait();
      try {
        return await api.request(err.config);
      } catch (e2) {
        // if it still fails, bubble up with useful context
        e2._rateLimitedRetryFailed = true;
        throw e2;
      }
    }

    throw err;
  }
);

module.exports = { api, refreshAccessToken };
