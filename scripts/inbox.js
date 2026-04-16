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
const https = require('https');
const { checkInbox, buildConfig } = require('./inbox-monitor');
const { handleBounce } = require('./bounce-handler');
const { GoogleSheetsConnector } = require('../sheets-connector');
const { OAuthClient } = require('./oauth-client');
const sheetsConfig = require('../config.sheets');
const oauthConfig = require('../config/config.oauth');
const { OOO_BUFFER_DAYS } = require('../config/sequences');

const ALERT_RECIPIENT = 'kiana.micari@vtwo.co';

const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');
const HAIKU_FAILURES_LOG = path.join(__dirname, '..', 'outreach', 'haiku-failures.jsonl');

function logHaikuFailure(em, type, detail) {
  try {
    const entry = JSON.stringify({ ts: new Date().toISOString(), em: em || null, type, detail }) + '\n';
    fs.appendFileSync(HAIKU_FAILURES_LOG, entry);
  } catch (_) { /* best-effort */ }
}

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
 * Return the next two upcoming weekday names (e.g. ["Tuesday, April 1", "Wednesday, April 2"]).
 * Used to suggest specific days in the drafted reply.
 */
function nextTwoWeekdays() {
  var days = [];
  var d = new Date();
  d.setDate(d.getDate() + 1);
  while (days.length < 2) {
    var dow = d.getDay();
    if (dow >= 1 && dow <= 5) {
      days.push(d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/**
 * Call Claude Haiku to draft a reply suggestion for a hot lead.
 * Returns the suggested reply text, or null if unavailable.
 * Never throws — callers always get null on any failure.
 */
function draftReplyViaHaiku(prospect, replySnippet) {
  return new Promise(function(resolve) {
    var apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('[inbox] ANTHROPIC_API_KEY not set — skipping reply suggestion');
      return resolve(null);
    }

    var name = prospect.nm || prospect.fn || '';
    var days = nextTwoWeekdays();
    var snippetCapped = (replySnippet || '').slice(0, 400);

    var systemPrompt = 'You are Oliver Chase at V.Two (vtwo.co), a software consultancy that builds custom digital products end-to-end — strategy, engineering, and delivery. You are direct, warm, and never use corporate buzzwords.';

    var userPrompt = [
      'A prospect just replied positively to your cold outreach. Write a brief reply from Oliver to continue the conversation and book a 20-minute call.',
      '',
      'Prospect: ' + name + (prospect.ti ? ', ' + prospect.ti : '') + (prospect.co ? ' at ' + prospect.co : ''),
      'Their reply: "' + snippetCapped + '"',
      '',
      'Rules:',
      '- 2-3 sentences only',
      '- Reference something specific from their reply if possible',
      '- End with a specific call to action — suggest ' + days[0] + ' or ' + days[1] + ' for a 20-minute call',
      '- Never use: reach out, touch base, circle back, synergy, leverage, excited, passionate',
      '- Sign off exactly: Oliver\\nV.Two | vtwo.co',
      '- Reply with the email body only. No subject line. No preamble.'
    ].join('\n');

    var payload = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    var req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload)
      }
    }, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        if (res.statusCode !== 200) {
          console.warn('[inbox] Haiku reply draft failed: HTTP ' + res.statusCode);
          logHaikuFailure(prospect.em, 'http_error', 'status=' + res.statusCode);
          return resolve(null);
        }
        try {
          var text = JSON.parse(data).content[0].text;
          resolve(text || null);
        } catch (e) {
          console.warn('[inbox] Haiku response parse error: ' + e.message);
          logHaikuFailure(prospect.em, 'parse_error', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', function(e) {
      console.warn('[inbox] Haiku request error: ' + e.message);
      logHaikuFailure(prospect.em, 'request_error', e.message);
      resolve(null);
    });

    req.setTimeout(15000, function() {
      req.destroy(new Error('timeout'));
      console.warn('[inbox] Haiku reply draft timed out (15s) — sending alert without suggestion');
      logHaikuFailure(prospect.em, 'timeout', '15s');
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

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

  // Attempt Haiku draft — alert always sends regardless of outcome
  var suggestedReply = await draftReplyViaHaiku(prospect, replySnippet);

  var bodyStyle = 'font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222';
  var labelStyle = 'font-size:13px;color:#555;margin:4px 0';
  var snippetStyle = 'background:#f0f7f0;border-left:3px solid #27ae60;padding:10px 14px;margin:16px 0;' +
    'font-size:13px;white-space:pre-wrap;font-family:monospace';
  var suggestionStyle = 'background:#f8f8f8;border-left:3px solid #2980b9;padding:12px 16px;margin:8px 0 16px;' +
    'font-size:13px;white-space:pre-wrap;font-family:monospace;line-height:1.5';

  var snippet = replySnippet ? replySnippet.slice(0, 500) : '(no snippet)';
  var snipEscaped = snippet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  var suggestionHtml = '';
  if (suggestedReply) {
    var replyEscaped = suggestedReply
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    suggestionHtml =
      '<p style="font-size:13px;font-weight:700;color:#2980b9;margin:20px 0 4px">' +
        'SUGGESTED REPLY &mdash; review and edit before sending:' +
      '</p>' +
      '<pre style="' + suggestionStyle + '">' + replyEscaped + '</pre>';
  }

  var body = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    '<body style="' + bodyStyle + '">' +
    '<h2 style="color:#27ae60;margin:0 0 16px;font-size:20px">Hot Lead Reply</h2>' +
    '<p style="' + labelStyle + '"><strong>Name:</strong> ' + (prospect.nm || prospect.fn || '') + '</p>' +
    '<p style="' + labelStyle + '"><strong>Title:</strong> ' + (prospect.ti || '') + '</p>' +
    '<p style="' + labelStyle + '"><strong>Company:</strong> ' + (prospect.co || '') + '</p>' +
    '<p style="' + labelStyle + '"><strong>Email:</strong> ' + (prospect.em || '') + '</p>' +
    '<p style="font-size:13px;color:#555;margin:12px 0 4px"><strong>Reply snippet:</strong></p>' +
    '<pre style="' + snippetStyle + '">' + snipEscaped + '</pre>' +
    suggestionHtml +
    '<p style="font-size:12px;color:#aaa;margin-top:20px">SDR System — oliver-chase/v-two-sdr</p>' +
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
      console.log('[inbox] Hot lead alert sent for ' + prospect.em + (suggestedReply ? ' (with reply suggestion)' : ''));
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

module.exports = { main, parseOooReturnDate, calcNfu, sendHotLeadAlert, draftReplyViaHaiku };
