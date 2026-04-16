'use strict';

/**
 * scripts/enrichment-web.js
 * Web-based enrichment: Serper search + company website fetch.
 * Required by enrichment-engine.js — do not import directly elsewhere.
 */

const https = require('https');

/**
 * Google search via Serper API.
 * @param {string} query
 * @returns {Promise<Array>} organic results [{title, snippet, link}]
 */
async function searchSerper(query) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 5 }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.organic || [];
  } catch (error) {
    console.warn(`[enrichment-web] Serper search failed for "${query}": ${error.message}`);
    return [];
  }
}

/**
 * Enrich prospect with web search signals via Serper API.
 * @param {Object} prospect - {co, ti}
 * @param {Object} cache - per-run cache
 * @returns {Promise<{searches: Array, found: boolean, signals: Array, error?: string}>}
 */
async function enrichProspectWebSearch(prospect, cache = null) {
  if (!prospect || !prospect.co || !prospect.ti) {
    return { searches: [], found: false, signals: [] };
  }

  const cacheKey = `${prospect.co}|${prospect.ti}`;
  if (cache && cache.webSearchResults.has(cacheKey)) {
    return cache.webSearchResults.get(cacheKey);
  }

  try {
    const queries = [
      `${prospect.co} ${prospect.ti} hiring`,
      `${prospect.co} funding rounds`,
      `${prospect.co} company news`,
    ];
    let found = false;
    const searches = [];
    for (const query of queries) {
      const results = await searchSerper(query);
      searches.push({ query, found: results.length > 0 });
      if (results.length > 0) found = true;
    }
    const result = { searches, found, signals: found ? ['webSearchFound'] : [] };
    if (cache) cache.webSearchResults.set(cacheKey, result);
    return result;
  } catch (error) {
    const result = { searches: [], found: false, signals: [], error: error.message };
    if (cache) cache.webSearchResults.set(cacheKey, result);
    return result;
  }
}

/**
 * Enrich prospect by fetching its company homepage.
 * @param {Object} prospect - {co, dm?, em?}
 * @param {Object} cache - per-run cache
 * @returns {Promise<{fetched: boolean, context: Object, error?: string}>}
 */
async function enrichProspectWebFetch(prospect, cache = null) {
  if (!prospect || !prospect.co) return { fetched: false, context: {} };

  const cacheKey = prospect.co.toLowerCase();
  if (cache && cache.webFetchResults.has(cacheKey)) {
    return cache.webFetchResults.get(cacheKey);
  }

  try {
    let domain = null;
    if (prospect.dm) {
      domain = prospect.dm.toLowerCase().replace(/^https?:\/\//i, '').replace(/\/.*/g, '');
    } else if (prospect.em) {
      domain = prospect.em.split('@')[1];
    } else if (prospect.co) {
      domain = prospect.co.toLowerCase().replace(/\s+/g, '').replace(/[^\w.-]/g, '') + '.com';
    }

    if (!domain) {
      const empty = { fetched: false, context: {} };
      if (cache) cache.webFetchResults.set(cacheKey, empty);
      return empty;
    }

    const html = await new Promise(resolve => {
      let body = '';
      const req = https.request(
        { hostname: domain, path: '/', method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } },
        res => {
          res.setEncoding('utf8');
          res.on('data', chunk => { if (body.length < 40000) body += chunk; });
          res.on('end', () => resolve(body));
        }
      );
      req.on('error', () => resolve(''));
      req.setTimeout(5000, () => { req.destroy(); resolve(''); });
      req.end();
    });

    const titleM = html.match(/<title[^>]*>([^<]{1,120})<\/title>/i);
    const descM = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})["']/i)
      || html.match(/<meta[^>]+content=["']([^"']{1,300})["'][^>]+name=["']description["']/i)
      || html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,300})["']/i);

    const snippet = [
      titleM ? titleM[1].trim() : '',
      descM ? descM[1].trim() : '',
    ].filter(Boolean).join(' — ').slice(0, 300);

    const result = {
      fetched: snippet.length > 0,
      context: { industry: null, location: null, employees: null, founded: null, description: snippet || null },
    };
    if (cache) cache.webFetchResults.set(cacheKey, result);
    return result;
  } catch (error) {
    const result = { fetched: false, context: {}, error: error.message };
    if (cache) cache.webFetchResults.set(cacheKey, result);
    return result;
  }
}

module.exports = { searchSerper, enrichProspectWebSearch, enrichProspectWebFetch };
