'use strict';

/**
 * scripts/inbox.js — Inbox check and reply routing
 *
 * Thin wrapper around inbox-monitor.js. Calls checkInbox(), then routes
 * each classified reply to the correct state update:
 *
 *   positive  → closed_positive   (stop sequence)
 *   negative  → closed_negative   (stop sequence)
 *   opt_out   → closed_negative   (stop sequence)
 *   auto_reply → ooo_pending      (parse return date → nfu)
 *   bounce    → bounce-handler.js (verify email, mark closed_negative if invalid)
 *   unknown   → logged only, no status change
 *
 * All state changes written to prospects.json and Google Sheet.
 */

const fs = require('fs');
const path = require('path');
const { checkInbox, buildConfig } = require('./inbox-monitor');
const { handleBounce } = require('./bounce-handler');
const { GoogleSheetsConnector } = require('../sheets-connector');
const { OAuthClient } = require('./oauth-client');
const sheetsConfig = require('../config.sheets');
const oauthConfig = require('../config/config.oauth');
const { OOO_BUFFER_DAYS } = require('../config/sequences');

const ALERT_RECIPIENT = 'kiana.micari@vtwo.co';

const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');

// ─── OOO date parser ──────────────────────────────────────────────────────────

/**
 * Attempt to extract a return date from an OOO reply body.
 * Looks for common patterns: "until X", "back on X", "return on X", "returning X".
 * Returns a YYYY-MM-DD string, or null if no date found / date is in the past.
 */
function parseOooReturnDate(text) {
  if (!text) return null;

  // Match keyword + date-like string
  const pattern = /(?:until|back\s+on|return(?:ing)?\s+on?|returning)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
  const m = text.match(pattern);
  if (!m) return null;

  const parsed = new Date(m[1].replace(/(\d+)(st|nd|rd|th)/i, '$1'));
  if (isNaN(parsed.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) return null; // already past, ignore

  return parsed.toISOString().split('T')[0];
}

/**
 * Calculate nfu (next follow-up date): return date + OOO_BUFFER_DAYS, or
 * tomorrow if no return date found.
 */
function calcNfu(bodyText) {
  const returnDate = parseOooReturnDate(bodyText);

  if (returnDate) {
    const d = new Date(returnDate);
    d.setDate(d.getDate() + OOO_BUFFER_DAYS);
    return d.toISOString().split('T')[0];
  }

  // Fallback: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// ─── Hot lead alert ───────────────────────────────────────────────────────────

/**
 * Send an immediate alert email to kiana.micari@vtwo.co when a prospect replies positively.
 * Logs a warning on failure — never throws.
 */
async function sendHotLeadAlert(prospect, replySnippet) {
  if (!process.env.OUTLOOK_TENANT_ID || !process.env.OUTLOOK_CLIENT_ID || !process.env.OUTLOOK_CLIENT_SECRET) {
    console.warn('[inbox] Hot lead alert skipped — Outlook OAuth env vars not set');
    return;
  }

  var name = prospect.nm || prospect.fn || prospect.em || 'Unknown';
  var subject = '[HOT LEAD] ' + name + ' replied positively';

  var bodyStyle = 'font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222';
  var labelStyle = 'font-size:13px;color:#555;margin:4px 0';
  var snippetStyle = 'background:#f0f7f0;border-left:3px solid #27ae60;padding:10px 14px;margin:16px 0;' +
    'font-size:13px;white-space:pre-wrap;font-family:monospace';

  var snippet = replySnippet ? replySnippet.slice(0, 500) : '(no snippet)';
  var snipEscaped = snippet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  var body = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    '<body style="' + bodyStyle + '">' +
    '<h2 style="color:#27ae60;margin:0 0 16px;font-size:20px">Hot Lead Reply</h2>' +
    '<p style="' + labelStyle + '"><strong>Name:</strong> ' + (prospect.nm || prospect.fn || '') + '</p>' +
    '<p style="' + labelStyle + '"><strong>Title:</strong> ' + (prospect.ti || '') + '</p>' +
    '<p style="' + labelStyle + '"><strong>Company:</strong> ' + (prospect.co || '') + '</p>' +
    '<p style="' + labelStyle + '"><strong>Email:</strong> ' + (prospect.em || '') + '</p>' +
    '<p style="font-size:13px;color:#555;margin:12px 0 4px"><strong>Reply snippet:</strong></p>' +
    '<pre style="' + snippetStyle + '">' + snipEscaped + '</pre>' +
    '<p style="font-size:12px;color:#aaa;margin-top:20px">SDR System — saturdaythings/v-two-sdr</p>' +
    '</body></html>';

  try {
    var oauthClient = new OAuthClient(oauthConfig);
    var result = await oauthClient.sendMailWithRetry({
      to: ALERT_RECIPIENT,
      subject: subject,
      body: body,
      from: 'Oliver SDR Bot',
      isHtml: true
    });
    if (result.ok) {
      console.log('[inbox] Hot lead alert sent for ' + prospect.em);
    } else {
      console.warn('[inbox] Hot lead alert failed: ' + result.error);
    }
  } catch (e) {
    console.warn('[inbox] Hot lead alert error: ' + e.message);
  }
}

// ─── Sheet write-back ─────────────────────────────────────────────────────────

async function updateSheet(updates) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return;
  if (updates.length === 0) return;
  try {
    const connector = new GoogleSheetsConnector({
      google_sheets: { ...sheetsConfig.google_sheets, field_mapping: sheetsConfig.field_mapping }
    }, 'write');
    await connector.authenticate();
    for (const { em, st } of updates) {
      await connector.updateProspectStatus(em, st);
    }
  } catch (e) {
    console.warn(`[inbox] Sheet write-back failed: ${e.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[inbox] Starting inbox check...');

  const config = buildConfig();

  let result;
  try {
    result = await checkInbox({
      ...config,
      paths: {
        sendsLog: 'outreach/sends.json',
        repliesLog: 'outreach/replies.json'
      }
    });
  } catch (e) {
    console.error(`[inbox] IMAP check failed: ${e.message}`);
    process.exit(1);
  }

  console.log(`[inbox] Checked ${result.checked} message(s), ${result.newReplies} new reply/replies`);

  if (result.newReplies === 0) {
    console.log('[inbox] No new replies — done');
    return;
  }

  // Load prospects
  const raw = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
  const prospects = raw.prospects || [];
  const byEmail = new Map(
    prospects.filter(p => p.em).map(p => [p.em.toLowerCase(), p])
  );

  const sheetUpdates = [];
  let changed = 0;

  for (const reply of result.classified) {
    const prospect = byEmail.get((reply.em || '').toLowerCase());
    if (!prospect) {
      console.warn(`[inbox] No prospect found for ${reply.em} — skipping`);
      continue;
    }

    const { classification } = reply;

    if (classification === 'positive') {
      prospect.st = 'closed_positive';
      sheetUpdates.push({ em: prospect.em, st: 'closed_positive' });
      changed++;
      console.log(`[inbox] ${prospect.em} → closed_positive`);
      await sendHotLeadAlert(prospect, reply.snippet || '');

    } else if (classification === 'negative' || classification === 'opt_out') {
      prospect.st = 'closed_negative';
      sheetUpdates.push({ em: prospect.em, st: 'closed_negative' });
      changed++;
      console.log(`[inbox] ${prospect.em} → closed_negative (${classification})`);

    } else if (classification === 'auto_reply') {
      const nfu = calcNfu(reply.snippet || '');
      prospect.st = 'ooo_pending';
      prospect.nfu = nfu;
      sheetUpdates.push({ em: prospect.em, st: 'ooo_pending' });
      changed++;
      console.log(`[inbox] ${prospect.em} → ooo_pending (nfu: ${nfu})`);

    } else if (classification === 'bounce') {
      const updated = await handleBounce(prospect);
      if (updated.st !== prospect.st) {
        sheetUpdates.push({ em: prospect.em, st: updated.st });
        changed++;
      }

    } else {
      // unknown — log only
      console.log(`[inbox] ${prospect.em} — unknown classification, no state change`);
    }
  }

  if (changed > 0) {
    const byState = prospects.reduce((acc, p) => {
      const k = p.st || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    fs.writeFileSync(PROSPECTS_FILE, JSON.stringify({
      prospects,
      metadata: { ...raw.metadata, lu: new Date().toISOString(), by_st: byState }
    }, null, 2));

    await updateSheet(sheetUpdates);
  }

  console.log(`[inbox] Done — ${changed} status change(s)`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[inbox] Fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main, parseOooReturnDate, calcNfu, sendHotLeadAlert };
