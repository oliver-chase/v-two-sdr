'use strict';

/**
 * scripts/digest.js — Weekly SDR digest
 *
 * Aggregates the past 7 days of activity from:
 *   prospects.json      — pipeline status counts, hot leads
 *   outreach/sends.json — emails sent and failed this week
 *   outreach/replies.json — replies classified this week
 *
 * Sends one HTML email to kiana.micari@vtwo.co every Friday.
 *
 * Env vars required:
 *   OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET — Microsoft Graph auth
 */

const fs   = require('fs');
const path = require('path');
const { OAuthClient } = require('./oauth-client');
const oauthConfig = require('../config/config.oauth');

const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');
const SENDS_FILE     = path.join(__dirname, '..', 'outreach', 'sends.json');
const REPLIES_FILE   = path.join(__dirname, '..', 'outreach', 'replies.json');
const RECIPIENT      = 'kiana.micari@vtwo.co';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.warn('[digest] Could not load ' + path.basename(filePath) + ': ' + e.message);
  }
  return fallback;
}

/**
 * Return a Date that is `days` days before now (midnight local).
 */
function daysAgo(days) {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

// ─── Stats computation ───────────────────────────────────────────────────────

function computeStats() {
  var cutoff = daysAgo(7);

  // --- Sends ---
  var sendsRaw = loadJson(SENDS_FILE, []);
  var sends = Array.isArray(sendsRaw) ? sendsRaw : (sendsRaw.sends || []);

  var sentThisWeek = sends.filter(function(s) {
    return s.ok && s.sd && new Date(s.sd) >= cutoff;
  });
  var failedThisWeek = sends.filter(function(s) {
    return !s.ok && s.sd && new Date(s.sd) >= cutoff;
  });

  // --- Replies ---
  var replies = loadJson(REPLIES_FILE, []);
  if (!Array.isArray(replies)) replies = [];

  var repliesThisWeek = replies.filter(function(r) {
    return r.at && new Date(r.at) >= cutoff;
  });

  var positiveReplies = repliesThisWeek.filter(function(r) { return r.classification === 'positive'; });
  var negativeReplies = repliesThisWeek.filter(function(r) {
    return r.classification === 'negative' || r.classification === 'opt_out';
  });
  var bounces         = repliesThisWeek.filter(function(r) { return r.classification === 'bounce'; });
  var oooReplies      = repliesThisWeek.filter(function(r) { return r.classification === 'auto_reply'; });

  // --- Prospects ---
  var prospectsRaw = loadJson(PROSPECTS_FILE, { prospects: [] });
  var prospects = Array.isArray(prospectsRaw.prospects) ? prospectsRaw.prospects : [];

  var bySt = prospects.reduce(function(acc, p) {
    var k = p.st || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  // Hot leads: closed_positive this week (by lc date)
  var hotLeadsThisWeek = prospects.filter(function(p) {
    return p.st === 'closed_positive' && p.lc && new Date(p.lc) >= cutoff;
  });

  return {
    sentCount:      sentThisWeek.length,
    failedCount:    failedThisWeek.length,
    positiveCount:  positiveReplies.length,
    negativeCount:  negativeReplies.length,
    bounceCount:    bounces.length,
    oooCount:       oooReplies.length,
    hotLeads:       hotLeadsThisWeek,
    bySt:           bySt,
    totalProspects: prospects.length,
    followupDue:    bySt['followup_due']   || 0,
    oooPending:     bySt['ooo_pending']    || 0,
    inPipeline:     (bySt['email_sent']    || 0) +
                    (bySt['followup_due']  || 0) +
                    (bySt['ooo_pending']   || 0)
  };
}

// ─── Email builder ───────────────────────────────────────────────────────────

function buildEmailBody(stats) {
  var now = new Date();
  var weekEnd = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  var weekStart = daysAgo(7).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  var bodyStyle   = 'font-family:system-ui,-apple-system,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#222';
  var cardStyle   = 'background:#f8f8f8;border-radius:6px;padding:16px 20px;margin:16px 0';
  var h3Style     = 'font-size:13px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px';
  var rowStyle    = 'display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;border-bottom:1px solid #eee';
  var labelStyle  = 'font-size:14px;color:#333';
  var numStyle    = 'font-size:18px;font-weight:700;color:#222';
  var divider     = '<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0">';

  // Reply rate
  var replyRate = stats.sentCount > 0
    ? Math.round((stats.positiveCount / stats.sentCount) * 100) + '%'
    : '—';

  // Hot leads section
  var hotLeadRows = '';
  if (stats.hotLeads.length > 0) {
    stats.hotLeads.forEach(function(p) {
      hotLeadRows += '<div style="padding:8px 0;border-bottom:1px solid #eee">' +
        '<div style="font-size:14px;font-weight:600">' + (p.nm || p.fn || p.em) + '</div>' +
        '<div style="font-size:12px;color:#555">' + (p.ti || '') + (p.ti && p.co ? ' @ ' : '') + (p.co || '') + '</div>' +
        '<div style="font-size:12px;color:#27ae60">' + (p.em || '') + '</div>' +
        '</div>';
    });
  } else {
    hotLeadRows = '<div style="font-size:13px;color:#999;padding:8px 0">None this week</div>';
  }

  // Pipeline table rows
  var pipelineStatuses = [
    ['email_sent',         'Sent, awaiting reply'],
    ['followup_due',       'Follow-up due'],
    ['ooo_pending',        'OOO pending'],
    ['awaiting_approval',  'Awaiting approval'],
    ['draft_generated',    'Draft generated'],
    ['email_discovered',   'Email discovered, not yet sent'],
    ['new',                'New (not enriched)'],
    ['closed_positive',    'Closed — positive'],
    ['closed_negative',    'Closed — negative'],
    ['closed_no_reply',    'Closed — no reply']
  ];

  var pipelineRows = pipelineStatuses
    .filter(function(row) { return stats.bySt[row[0]]; })
    .map(function(row) {
      return '<div style="' + rowStyle + '">' +
        '<span style="' + labelStyle + '">' + row[1] + '</span>' +
        '<span style="font-size:14px;font-weight:600">' + stats.bySt[row[0]] + '</span>' +
        '</div>';
    })
    .join('');

  if (!pipelineRows) {
    pipelineRows = '<div style="font-size:13px;color:#999;padding:8px 0">No pipeline data</div>';
  }

  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    '<body style="' + bodyStyle + '">' +

    '<h2 style="margin:0 0 4px;font-size:20px">[SDR] Weekly Digest</h2>' +
    '<p style="font-size:13px;color:#888;margin:0 0 20px">' + weekStart + ' &ndash; ' + weekEnd + '</p>' +

    divider +

    // This week's activity
    '<div style="' + cardStyle + '">' +
    '<div style="' + h3Style + '">This Week</div>' +
    '<div style="' + rowStyle + '"><span style="' + labelStyle + '">Emails sent</span><span style="' + numStyle + '">' + stats.sentCount + '</span></div>' +
    '<div style="' + rowStyle + '"><span style="' + labelStyle + '">Send failures</span><span style="font-size:18px;font-weight:700;color:' + (stats.failedCount > 0 ? '#c0392b' : '#999') + '">' + stats.failedCount + '</span></div>' +
    '<div style="' + rowStyle + '"><span style="' + labelStyle + '">Positive replies</span><span style="font-size:18px;font-weight:700;color:#27ae60">' + stats.positiveCount + '</span></div>' +
    '<div style="' + rowStyle + '"><span style="' + labelStyle + '">Negative / opt-out</span><span style="' + numStyle + '">' + stats.negativeCount + '</span></div>' +
    '<div style="' + rowStyle + '"><span style="' + labelStyle + '">Bounces</span><span style="' + numStyle + '">' + stats.bounceCount + '</span></div>' +
    '<div style="' + rowStyle + '"><span style="' + labelStyle + '">OOO replies</span><span style="' + numStyle + '">' + stats.oooCount + '</span></div>' +
    '<div style="padding:8px 0"><span style="' + labelStyle + '">Reply rate</span> <strong>' + replyRate + '</strong></div>' +
    '</div>' +

    divider +

    // Hot leads
    '<div style="' + cardStyle + '">' +
    '<div style="' + h3Style + '">Hot Leads This Week (' + stats.hotLeads.length + ')</div>' +
    hotLeadRows +
    '</div>' +

    divider +

    // Pipeline
    '<div style="' + cardStyle + '">' +
    '<div style="' + h3Style + '">Pipeline (' + stats.totalProspects + ' total)</div>' +
    pipelineRows +
    '</div>' +

    divider +

    '<p style="font-size:12px;color:#aaa;margin-top:8px">SDR System &mdash; oliver-chase/v-two-sdr</p>' +
    '</body></html>';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.OUTLOOK_TENANT_ID || !process.env.OUTLOOK_CLIENT_ID || !process.env.OUTLOOK_CLIENT_SECRET) {
    console.warn('[digest] Outlook OAuth env vars not set — skipping');
    return;
  }

  var stats = computeStats();

  var now = new Date();
  var dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  var subject = '[SDR] Weekly digest — ' + dateLabel +
    ' | ' + stats.sentCount + ' sent, ' + stats.positiveCount + ' positive';

  var body = buildEmailBody(stats);

  console.log('[digest] Sending weekly digest to ' + RECIPIENT + ' ...');
  console.log('[digest] Sent: ' + stats.sentCount + ' | Positive: ' + stats.positiveCount + ' | Pipeline: ' + stats.inPipeline);

  try {
    var oauthClient = new OAuthClient(oauthConfig);
    var result = await oauthClient.sendMailWithRetry({
      to: RECIPIENT,
      subject: subject,
      body: body,
      from: 'Oliver SDR Bot',
      isHtml: true
    });

    if (result.ok) {
      console.log('[digest] Sent (' + result.messageId + ')');
    } else {
      console.warn('[digest] Send failed: ' + result.error);
    }
  } catch (e) {
    console.warn('[digest] Fatal send error: ' + e.message);
  }
}

if (require.main === module) {
  main().catch(function(err) {
    console.warn('[digest] Fatal: ' + err.message);
    process.exit(0);
  });
}

module.exports = { main, computeStats, buildEmailBody };
