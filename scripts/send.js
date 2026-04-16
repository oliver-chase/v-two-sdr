'use strict';

/**
 * scripts/send.js — Send all approved drafts
 *
 * Triggered by send-approved.yml (immediately on approval OR 10 AM ET cron).
 *
 * 1. Reads every .json file in outreach/approved/
 * 2. Sends via Mailer (Microsoft Graph / Outlook)
 * 3. On success: moves to outreach/sent/, updates prospects.json
 *    (st → email_sent, lc = now, fuc++), writes status to Google Sheet
 * 4. On failure: leaves in approved/ for next cron run
 */

const fs = require('fs');
const path = require('path');
const { Mailer } = require('./mailer');
const { GoogleSheetsConnector } = require('../sheets-connector');
const mailerEmailConfig = require('../config.email');
const oauthConfig = require('../config/config.oauth');
const sheetsConfig = require('../config.sheets');

const APPROVED_DIR = path.join(__dirname, '..', 'outreach', 'approved');
const SENT_DIR = path.join(__dirname, '..', 'outreach', 'sent');
const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');

// ─── Supabase write-back ──────────────────────────────────────────────────────

async function writeSendsToSupabase(sentDrafts) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    const https = require('https');
    const payload = JSON.stringify(sentDrafts.map(d => ({
      id: d.draft_id,
      prospect_id: d.prospect_id,
      draft_id: d.draft_id,
      em: d.em,
      fn: d.fn,
      nm: d.nm || d.fn,
      ti: d.ti,
      co: d.co,
      subject: d.subject,
      sent_at: new Date().toISOString(),
      status: 'sent',
      fuc: d.fuc || 1,
    })));
    await new Promise((resolve, reject) => {
      const urlObj = new URL(url + '/rest/v1/sdr_sends');
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
          else reject(new Error('Supabase sdr_sends returned ' + res.statusCode));
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
    console.log(`[send] Wrote ${sentDrafts.length} send(s) to Supabase`);
  } catch (e) {
    console.warn(`[send] Supabase write failed: ${e.message}`);
  }
}

// ─── Sheet write-back ─────────────────────────────────────────────────────────

async function updateSheet(sent) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return;
  try {
    const connector = new GoogleSheetsConnector({
      google_sheets: { ...sheetsConfig.google_sheets, field_mapping: sheetsConfig.field_mapping }
    }, 'write');
    await connector.authenticate();
    for (const p of sent) {
      await connector.updateProspectStatus(p.em, 'email_sent');
    }
  } catch (e) {
    console.warn(`[send] Sheet write-back failed: ${e.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(APPROVED_DIR)) {
    console.log('[send] No approved/ directory — nothing to send');
    return;
  }

  const files = fs.readdirSync(APPROVED_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('[send] No approved drafts — nothing to send');
    return;
  }

  console.log(`[send] ${files.length} approved draft(s) to process`);

  const mailer = new Mailer(mailerEmailConfig, oauthConfig);

  // Load prospects for state updates
  const raw = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
  const prospects = raw.prospects || [];

  if (!fs.existsSync(SENT_DIR)) fs.mkdirSync(SENT_DIR, { recursive: true });

  const sentProspects = [];
  const sentDrafts = [];
  let sentCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(APPROVED_DIR, file);
    let draft;
    try {
      draft = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.warn(`[send] Could not read ${file}: ${e.message}`);
      continue;
    }

    const prospect = {
      id: draft.prospect_id,
      em: draft.em,
      fn: draft.fn,
      co: draft.co,
      ti: draft.ti
    };

    console.log(`[send] Sending to ${draft.em} (${draft.draft_id})...`);

    const result = await mailer.send({
      prospect,
      subject: draft.subject,
      body: draft.body
    });

    if (result.ok) {
      sentCount++;
      sentDrafts.push(draft);
      console.log(`[send] Sent (${result.messageId})`);

      // Move to sent/
      fs.renameSync(filePath, path.join(SENT_DIR, file));

      // Update prospect in memory
      const pi = prospects.findIndex(p => p.id === draft.prospect_id);
      if (pi !== -1) {
        const today = new Date().toISOString().split('T')[0];
        prospects[pi].st = 'email_sent';
        prospects[pi].lc = today;
        prospects[pi].fuc = (parseInt(prospects[pi].fuc, 10) || 0) + 1;
        // Write explicit contact date for this touch
        const newFuc = prospects[pi].fuc;
        if (newFuc === 1) prospects[pi].fc = today;
        else if (newFuc === 2) prospects[pi].sc = today;
        else if (newFuc === 3) prospects[pi].tc = today;
        sentProspects.push(prospects[pi]);
      }
    } else {
      failCount++;
      console.warn(`[send] Failed for ${draft.em}: ${result.error}`);
      if (result.error && result.error.includes('Daily limit')) {
        console.log('[send] Daily limit hit — stopping');
        break;
      }
    }
  }

  // Write prospects.json
  if (sentProspects.length > 0) {
    const byState = prospects.reduce((acc, p) => {
      const k = p.st || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const sendPayload = JSON.stringify({
      prospects,
      metadata: { ...raw.metadata, lu: new Date().toISOString(), by_st: byState }
    }, null, 2);
    const sendTmpFile = PROSPECTS_FILE + '.tmp';
    fs.writeFileSync(sendTmpFile, sendPayload);
    fs.renameSync(sendTmpFile, PROSPECTS_FILE);

    await writeSendsToSupabase(sentDrafts);
    await updateSheet(sentProspects);
  }

  console.log(`[send] Done — ${sentCount} sent, ${failCount} failed`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[send] Fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
