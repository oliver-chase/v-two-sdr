'use strict';

/**
 * scripts/sync.js — Daily sync step
 *
 * 1. Pull all rows from Google Sheet ("Leads" tab)
 * 2. Merge with existing prospects.json
 *      Sheet wins: nm, ti, co, em (protected — Kiana owns these)
 *      Local wins: st, lc, fc, fuc, nfu when Sheet cell is blank
 * 3. Enrich new prospects without email (enrichment-engine)
 * 4. Flag follow-ups and closes (followup-scheduler)
 * 5. Write status changes back to Sheet
 * 6. Commit prospects.json
 */

const path = require('path');
const fs = require('fs');
const { GoogleSheetsConnector } = require('../sheets-connector');
const { scheduleFollowups } = require('./followup-scheduler');
const sheetsConfig = require('../config.sheets');

const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');

// Fields Kiana owns — sheet always wins when non-blank
const PROTECTED_FIELDS = ['nm', 'ti', 'co', 'em'];
// State tracking fields — keep local value when sheet cell is blank
const STATE_FIELDS = ['st', 'lc', 'fc', 'fuc', 'nfu', 'city', 'state', 'country', 'sz', 'rev', 'ind', 'sc', 'tc', 'fourthc', 'fifthc', 'tried_patterns'];

// ─── Config ──────────────────────────────────────────────────────────────────

/**
 * Build GoogleSheetsConnector config with explicit field_mapping so
 * the connector skips auto-detect (which has known edge cases).
 */
function connectorConfig() {
  return {
    google_sheets: {
      ...sheetsConfig.google_sheets,
      field_mapping: sheetsConfig.field_mapping,
    }
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadLocal() {
  try {
    if (fs.existsSync(PROSPECTS_FILE)) {
      const { prospects } = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
      return Array.isArray(prospects) ? prospects : [];
    }
  } catch (e) {
    console.warn(`[sync] Could not load prospects.json: ${e.message}`);
  }
  return [];
}

/**
 * Merge Sheet rows (authoritative list) with local state (tracking continuity).
 *
 * - Sheet drives which prospects exist
 * - Protected fields always taken from Sheet (if non-blank)
 * - State fields preserved from local when Sheet cell is blank
 * - All other Sheet fields (tz, loc, sig, etc.) taken if non-blank
 * - Prospects removed from Sheet are dropped
 */
function mergeProspects(sheetProspects, localProspects) {
  const byEmail = new Map(
    localProspects
      .filter(p => p.em)
      .map(p => [p.em.toLowerCase(), p])
  );

  return sheetProspects.map(sheetP => {
    const local = sheetP.em ? byEmail.get(sheetP.em.toLowerCase()) : null;

    if (!local) {
      // First time we've seen this prospect
      return { ...sheetP, st: sheetP.st || 'new' };
    }

    const merged = { ...local };

    // Protected fields: sheet always wins (if non-blank)
    for (const f of PROTECTED_FIELDS) {
      if (sheetP[f]) merged[f] = sheetP[f];
    }

    // State fields: sheet wins only if non-blank (don't erase local tracking)
    for (const f of STATE_FIELDS) {
      if (sheetP[f]) merged[f] = sheetP[f];
    }

    // Everything else from sheet: take if non-blank (enrichment data, etc.)
    for (const [k, v] of Object.entries(sheetP)) {
      if (!PROTECTED_FIELDS.includes(k) && !STATE_FIELDS.includes(k) && v) {
        merged[k] = v;
      }
    }

    return merged;
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[sync] Starting daily sync...');

  // 1. Pull from Google Sheet (service account handles both read and write)
  const connector = new GoogleSheetsConnector(connectorConfig(), 'write');
  await connector.authenticate();
  const sheetProspects = await connector.readProspects();
  console.log(`[sync] Read ${sheetProspects.length} prospect(s) from Sheet`);

  // 2. Merge with local state
  const local = loadLocal();
  const prospects = mergeProspects(sheetProspects, local);

  // Snapshot state after merge — used to diff what the scheduler changes
  const stateAfterMerge = new Map(
    prospects.filter(p => p.em).map(p => [p.em.toLowerCase(), p.st])
  );

  // 3. Enrich new prospects without email
  const toEnrich = prospects.filter(p => p.st === 'new' && !p.em);
  if (toEnrich.length > 0) {
    console.log(`[sync] Enriching ${toEnrich.length} prospect(s) without email...`);
    try {
      const { enrichProspects } = require('./enrichment-engine');
      const enriched = await enrichProspects(toEnrich);
      const enrichedById = new Map(enriched.map(e => [e.id, e]));
      for (let i = 0; i < prospects.length; i++) {
        const e = enrichedById.get(prospects[i].id);
        if (e) prospects[i] = e;
      }
    } catch (e) {
      console.warn(`[sync] Enrichment skipped: ${e.message}`);
    }
  }

  // 3b. Promote new prospects that have an email to email_discovered
  let promoted = 0;
  for (const p of prospects) {
    if ((p.st === 'new' || p.st === 'New') && p.em) {
      p.st = 'email_discovered';
      promoted++;
    }
  }
  if (promoted > 0) console.log(`[sync] Promoted ${promoted} prospect(s): new → email_discovered`);

  // 4. Follow-up scheduler
  const { flagged, closed } = scheduleFollowups(prospects);
  console.log(`[sync] Scheduler: ${flagged} follow-up(s) flagged, ${closed} closed`);

  // 5. Write status changes back to Sheet (scheduler-driven changes only)
  let writeCount = 0;
  for (const p of prospects) {
    if (!p.em) continue;
    const prev = stateAfterMerge.get(p.em.toLowerCase());
    if (prev !== undefined && prev !== p.st) {
      try {
        await connector.updateProspectStatus(p.em, p.st);
        writeCount++;
      } catch (e) {
        console.warn(`[sync] Sheet write failed for ${p.em}: ${e.message}`);
      }
    }
  }
  if (writeCount > 0) {
    console.log(`[sync] Wrote ${writeCount} status change(s) to Sheet`);
  }

  // 6. Write prospects.json
  const byState = prospects.reduce((acc, p) => {
    const key = p.st || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  fs.writeFileSync(PROSPECTS_FILE, JSON.stringify({
    prospects,
    metadata: {
      tot: prospects.length,
      lu: new Date().toISOString(),
      by_st: byState
    }
  }, null, 2));

  // 6b. Dual-write to Supabase sdr_prospects (best-effort)
  await writeProspectsToSupabase(prospects);

  // 7. Summary line (used by git-auto-commit message)
  const followupDue = prospects.filter(p => p.st === 'followup_due').length;
  console.log(`[sync] ${prospects.length} prospects, ${followupDue} follow-up(s) due`);
}

// ─── Supabase dual-write ──────────────────────────────────────────────────────

async function writeProspectsToSupabase(prospects) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.log('[sync] SUPABASE_URL/ANON_KEY not set — skipping Supabase write');
    return;
  }
  try {
    // Upsert all prospects (on conflict: update)
    const https = require('https');
    const payload = JSON.stringify(prospects.map(p => ({
      id: p.id, nm: p.nm, fn: p.fn, ti: p.ti, co: p.co, em: p.em,
      st: p.st, tr: p.tr, sig: p.sig, ind: p.ind, sz: p.sz, rev: p.rev,
      city: p.city, state: p.state, country: p.country,
      fuc: parseInt(p.fuc, 10) || 1,
      fc: p.fc, nfu: p.nfu, lc: p.lc,
      lu: new Date().toISOString(),
    })));
    await new Promise((resolve, reject) => {
      const urlObj = new URL(url + '/rest/v1/sdr_prospects');
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
          else reject(new Error('Supabase upsert returned ' + res.statusCode));
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
    console.log(`[sync] Wrote ${prospects.length} prospect(s) to Supabase`);
  } catch (e) {
    console.warn(`[sync] Supabase write failed: ${e.message}`);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[sync] Fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main, mergeProspects };
