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
const { supabaseUpsert, supabaseQuery } = require('./supabase-client');
const mailerEmailConfig = require('../config.email');
const oauthConfig = require('../config/config.oauth');
const sheetsConfig = require('../config.sheets');

const APPROVED_DIR = path.join(__dirname, '..', 'outreach', 'approved');
const SENT_DIR = path.join(__dirname, '..', 'outreach', 'sent');
const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');

const DAILY_SEND_LIMIT = 20;
const STALE_DRAFT_DAYS = 14;

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

  const allFiles = fs.readdirSync(APPROVED_DIR).filter(f => f.endsWith('.json'));
  if (allFiles.length === 0) {
    console.log('[send] No approved drafts — nothing to send');
    return;
  }

  // Dedup + daily limit from Supabase
  const today = new Date().toISOString().split('T')[0];
  const todaySends = await supabaseQuery(
    'sdr_sends',
    'sent_at=gte.' + today + 'T00:00:00Z&select=prospect_id,id',
    '[send]'
  );
  const alreadySentProspects = new Set(todaySends.map(r => r.prospect_id));
  const alreadySentDraftIds = new Set(todaySends.map(r => r.id));
  const todaySentCount = todaySends.length;

  if (todaySentCount >= DAILY_SEND_LIMIT) {
    console.log(`[send] Daily limit reached (${todaySentCount}/${DAILY_SEND_LIMIT}) — skipping all sends`);
    return;
  }

  // Parse drafts, filter stale and already-sent
  const now = Date.now();
  const files = allFiles.filter(file => {
    let draft;
    try { draft = JSON.parse(fs.readFileSync(path.join(APPROVED_DIR, file), 'utf8')); } catch (_) { return false; }
    if (alreadySentProspects.has(draft.prospect_id) || alreadySentDraftIds.has(draft.draft_id)) {
      console.log(`[send] Skip ${draft.em} — already sent today`);
      return false;
    }
    if (draft.batch_date) {
      const ageDays = (now - new Date(draft.batch_date).getTime()) / 86400000;
      if (ageDays > STALE_DRAFT_DAYS) {
        console.warn(`[send] Skip ${draft.em} — draft is ${Math.floor(ageDays)} days old (stale)`);
        fs.renameSync(path.join(APPROVED_DIR, file), path.join(SENT_DIR, 'stale-' + file));
        return false;
      }
    }
    return true;
  });

  const remaining = DAILY_SEND_LIMIT - todaySentCount;
  const filesToSend = files.slice(0, remaining);

  if (filesToSend.length === 0) {
    console.log('[send] No sendable drafts after dedup/staleness filter — done');
    return;
  }

  console.log(`[send] ${filesToSend.length} draft(s) to send (${todaySentCount} already sent today, limit ${DAILY_SEND_LIMIT})`);

  const mailer = new Mailer(mailerEmailConfig, oauthConfig);

  // Load prospects for state updates
  const raw = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
  const prospects = raw.prospects || [];

  if (!fs.existsSync(SENT_DIR)) fs.mkdirSync(SENT_DIR, { recursive: true });

  const sentProspects = [];
  const sentDrafts = [];
  let sentCount = 0;
  let failCount = 0;

  for (const file of filesToSend) {
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

  // Always write prospects.json if anything was attempted — prevents re-send on daily limit
  if (sentProspects.length > 0 || failCount > 0) {
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
  }

  if (sentDrafts.length > 0) {
    await supabaseUpsert('sdr_sends', sentDrafts.map(d => ({
      id: d.draft_id,
      prospect_id: d.prospect_id,
      draft_id: d.draft_id,
      em: d.em, fn: d.fn, nm: d.nm || d.fn, ti: d.ti, co: d.co,
      subject: d.subject,
      sent_at: new Date().toISOString(),
      status: 'sent',
      fuc: d.fuc || 1,
    })), '[send]');
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
