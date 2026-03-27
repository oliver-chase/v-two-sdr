'use strict';

/**
 * scripts/approval-email.js — Daily approval digest
 *
 * Reads today's drafts from outreach/drafts/YYYY-MM-DD.json and sends ONE
 * HTML email to oliver@vtwo.co. Each draft includes clickable Approve / Reject
 * links that hit the Cloudflare Worker (sdr-approval.workers.dev), which then
 * triggers approval-handler.yml via GitHub workflow_dispatch.
 *
 * Uses OAuthClient directly (not Mailer) — internal digest, not prospect outreach.
 *
 * Env vars required:
 *   OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET — Microsoft Graph auth
 *   SDR_TOKEN   — shared secret embedded in approval URLs (validated by the Worker)
 *   WORKER_URL  — base URL of the Cloudflare Worker (default: https://sdr-approval.workers.dev)
 */

const fs = require('fs');
const path = require('path');
const { OAuthClient } = require('./oauth-client');
const oauthConfig = require('../config/config.oauth');

const DRAFTS_DIR = path.join(__dirname, '..', 'outreach', 'drafts');
const RECIPIENT = 'oliver@vtwo.co';
const DEFAULT_WORKER_URL = 'https://sdr-approval.workers.dev';

// ─── URL builder ──────────────────────────────────────────────────────────────

/**
 * Build a clickable approval/rejection URL pointing to the Cloudflare Worker.
 * SDR_TOKEN is the shared secret — the Worker validates it before triggering GitHub.
 */
function buildApprovalUrl(draftId, action, token, workerUrl) {
  return workerUrl +
    '?draft_id=' + encodeURIComponent(draftId) +
    '&action=' + encodeURIComponent(action) +
    '&token=' + encodeURIComponent(token);
}

// ─── HTML email body ──────────────────────────────────────────────────────────

function buildEmailBody(drafts, token, workerUrl) {
  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const approveStyle = 'display:inline-block;padding:8px 18px;background:#27ae60;color:#fff;' +
    'text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;margin-right:8px';
  const rejectStyle = 'display:inline-block;padding:8px 18px;background:#c0392b;color:#fff;' +
    'text-decoration:none;border-radius:4px;font-size:13px;font-weight:600';
  const dividerStyle = 'border:none;border-top:2px solid #e5e5e5;margin:24px 0';
  const bodyStyle = 'font-family:system-ui,-apple-system,sans-serif;max-width:640px;' +
    'margin:0 auto;padding:24px;color:#222';
  const preStyle = 'background:#f8f8f8;border-radius:4px;padding:12px 16px;' +
    'white-space:pre-wrap;font-family:monospace;font-size:13px;line-height:1.5;' +
    'margin:8px 0 16px';
  const metaStyle = 'font-size:13px;color:#555;margin:2px 0';
  const subjectStyle = 'font-size:13px;font-style:italic;color:#555;margin:8px 0 4px';

  let sections = '';

  drafts.forEach(function(d, i) {
    const approveUrl = buildApprovalUrl(d.draft_id, 'approve', token, workerUrl);
    const rejectUrl  = buildApprovalUrl(d.draft_id, 'reject',  token, workerUrl);
    const bodyEscaped = (d.body || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    sections += '<hr style="' + dividerStyle + '">' +
      '<p style="font-size:14px;font-weight:700;margin:0 0 8px">' +
        (i + 1) + ' of ' + drafts.length + ' &mdash; ' + (d.touch || 'OUTREACH') +
      '</p>' +
      '<p style="' + metaStyle + '"><strong>To:</strong> ' +
        (d.nm || d.fn || '') + ', ' + (d.ti || '') + ' @ ' + (d.co || '') +
      '</p>' +
      '<p style="' + metaStyle + '"><strong>Email:</strong> ' + (d.em || '') + '</p>' +
      (d.tr ? '<p style="' + metaStyle + '"><strong>Track:</strong> ' + d.tr + '</p>' : '') +
      '<p style="' + subjectStyle + '"><strong>Subject:</strong> ' + (d.subject || '') + '</p>' +
      '<pre style="' + preStyle + '">' + bodyEscaped + '</pre>' +
      '<div style="margin-top:8px">' +
        '<a href="' + approveUrl + '" style="' + approveStyle + '">Approve</a>' +
        '<a href="' + rejectUrl  + '" style="' + rejectStyle  + '">Reject</a>' +
      '</div>';
  });

  sections += '<hr style="' + dividerStyle + '">';

  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    '<body style="' + bodyStyle + '">' +
    '<h2 style="margin:0 0 4px;font-size:18px">[SDR] ' + drafts.length +
      ' draft' + (drafts.length === 1 ? '' : 's') + ' ready &mdash; ' + dateLabel + '</h2>' +
    '<p style="font-size:13px;color:#666;margin:0 0 8px">Click Approve or Reject for each.</p>' +
    sections +
    '<p style="font-size:12px;color:#aaa;margin-top:16px">' +
      'SDR System &mdash; saturdaythings/v-two-sdr' +
    '</p>' +
    '</body></html>';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const token = process.env.SDR_TOKEN;
  if (!token) {
    console.error('[approval-email] SDR_TOKEN not set — cannot build approval links');
    process.exit(1);
  }

  const workerUrl = (process.env.WORKER_URL || DEFAULT_WORKER_URL).replace(/\/$/, '');

  // Find today's draft file
  const today = new Date().toISOString().split('T')[0];
  const draftsFile = path.join(DRAFTS_DIR, today + '.json');

  if (!fs.existsSync(draftsFile)) {
    console.log('[approval-email] No drafts file for ' + today + ' — nothing to send');
    return;
  }

  const allDrafts = JSON.parse(fs.readFileSync(draftsFile, 'utf8'));
  const pending = allDrafts.filter(function(d) { return d.status === 'pending_approval'; });

  if (pending.length === 0) {
    console.log('[approval-email] No pending drafts — skipping');
    return;
  }

  console.log('[approval-email] Sending HTML digest for ' + pending.length + ' draft(s) to ' + RECIPIENT + '...');

  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const subject = '[SDR] ' + pending.length + ' draft' + (pending.length === 1 ? '' : 's') +
    ' ready for approval \u2014 ' + dateLabel;

  const body = buildEmailBody(pending, token, workerUrl);

  const oauthClient = new OAuthClient(oauthConfig);
  const result = await oauthClient.sendMailWithRetry({
    to: RECIPIENT,
    subject,
    body,
    from: 'Oliver Chase',
    isHtml: true
  });

  if (result.ok) {
    console.log('[approval-email] Sent (' + result.messageId + ')');
  } else {
    console.error('[approval-email] Send failed: ' + result.error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(function(err) {
    console.error('[approval-email] Fatal: ' + err.message);
    process.exit(1);
  });
}

module.exports = { main, buildEmailBody, buildApprovalUrl };
