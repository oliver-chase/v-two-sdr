'use strict';

/**
 * scripts/supabase-client.js — Shared Supabase HTTP helper
 *
 * Used by sync, draft, send, inbox, prospect.
 * All writes are best-effort: failures warn but never crash the pipeline.
 * Retries up to 3 times with exponential backoff (1s / 2s / 4s).
 */

const https = require('https');

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * POST (upsert) a payload to a Supabase REST table.
 * Uses Prefer: resolution=merge-duplicates so it's safe to re-run.
 *
 * @param {string} table     - Supabase table name (e.g. 'sdr_prospects')
 * @param {Array}  rows      - Array of row objects to upsert
 * @param {string} label     - Caller label for log messages (e.g. '[sync]')
 * @returns {Promise<void>}  - Resolves on success, never rejects (logs warn on failure)
 */
async function supabaseUpsert(table, rows, label) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  if (!rows || rows.length === 0) return;

  const payload = JSON.stringify(rows);
  const urlObj = new URL(url + '/rest/v1/' + table);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: urlObj.hostname,
          path: urlObj.pathname,
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + key,
            'apikey': key,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal',
            'Content-Length': Buffer.byteLength(payload),
          },
        }, res => {
          res.resume();
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) resolve();
            else reject(new Error('HTTP ' + res.statusCode));
          });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => req.destroy(new Error('timeout')));
        req.write(payload);
        req.end();
      });
      console.log(label + ' Wrote ' + rows.length + ' row(s) to Supabase ' + table);
      return;
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        const wait = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(label + ' Supabase ' + table + ' attempt ' + attempt + ' failed: ' + e.message + ' — retrying in ' + wait + 'ms');
        await delay(wait);
      } else {
        console.warn(label + ' Supabase ' + table + ' failed after ' + MAX_RETRIES + ' attempts: ' + e.message);
      }
    }
  }
}

/**
 * GET rows from a Supabase table with an optional query string.
 * Returns an array of rows, or [] on failure (never throws).
 *
 * @param {string} table       - Supabase table name
 * @param {string} queryString - PostgREST filter string e.g. 'sent_at=gte.2026-04-16&select=prospect_id'
 * @param {string} label       - Caller label for log messages
 * @returns {Promise<Array>}
 */
async function supabaseQuery(table, queryString, label) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const path = '/rest/v1/' + table + (queryString ? '?' + queryString : '');
  const urlObj = new URL(url);

  try {
    return await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: urlObj.hostname,
        path: path,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + key,
          'apikey': key,
          'Accept': 'application/json',
        },
      }, res => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try { resolve(JSON.parse(data)); } catch (_) { resolve([]); }
          } else {
            reject(new Error('HTTP ' + res.statusCode));
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy(new Error('timeout')));
      req.end();
    });
  } catch (e) {
    if (label) console.warn(label + ' Supabase query ' + table + ' failed: ' + e.message);
    return [];
  }
}

/**
 * PATCH rows in a Supabase table matching a filter.
 * Best-effort: logs on failure, never throws.
 *
 * @param {string} table       - Supabase table name
 * @param {string} filter      - PostgREST filter string e.g. 'prospect_id=eq.abc123'
 * @param {Object} patch       - Fields to update
 * @param {string} label       - Caller label for log messages
 * @returns {Promise<void>}
 */
async function supabasePatch(table, filter, patch, label) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;

  const payload = JSON.stringify(patch);
  const path = '/rest/v1/' + table + '?' + filter;
  const urlObj = new URL(url);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: urlObj.hostname,
          path: path,
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + key,
            'apikey': key,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
            'Content-Length': Buffer.byteLength(payload),
          },
        }, res => {
          res.resume();
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) resolve();
            else reject(new Error('HTTP ' + res.statusCode));
          });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => req.destroy(new Error('timeout')));
        req.write(payload);
        req.end();
      });
      return;
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      } else {
        if (label) console.warn(label + ' Supabase PATCH ' + table + ' failed: ' + e.message);
      }
    }
  }
}

module.exports = { supabaseUpsert, supabaseQuery, supabasePatch };
