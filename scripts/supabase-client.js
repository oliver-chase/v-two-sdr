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

module.exports = { supabaseUpsert };
