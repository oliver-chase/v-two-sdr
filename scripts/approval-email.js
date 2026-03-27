'use strict';

/**
 * scripts/approval-email.js — Daily approval digest
 *
 * Reads today's drafts from outreach/drafts/YYYY-MM-DD.json and sends ONE
 * summary email to oliver@vtwo.co. Each draft includes a curl command to
 * approve or reject by triggering approval-handler.yml via workflow_dispatch.
 *
 * Uses OAuthClient directly (not Mailer) — this is an internal digest, not
 * prospect outreach, so daily-limit tracking and sends.json are not needed.
 */

const fs = require('fs');
const path = require('path');
const { OAuthClient } = require('./oauth-client');
const oauthConfig = require('../config/config.oauth');

const DRAFTS_DIR = path.join(__dirname, '..', 'outreach', 'drafts');
const RECIPIENT = 'oliver@vtwo.co';
const APPROVAL_URL = process.env.APPROVAL_BASE_URL ||
  'https://api.github.com/repos/saturdaythings/v-two-sdr/actions/workflows/approval-handler.yml/dispatches';

// ─── Approval command builder ─────────────────────────────────────────────────

/**
 * Build a single-line curl command to approve or reject a draft.
 * Uses SDR_PAT for auth — scoped to actions:write only.
 */
function buildApprovalCmd(draftId, action, pat) {
  const payload = JSON.stringify({
    ref: 'main',
    inputs: { draft_id: draftId, action }
  });
  return `curl -s -X POST "${APPROVAL_URL}" -H "Authorization: Bearer ${pat}" -H "Content-Type: application/json" -d '${payload}'`;
}

// ─── Email body builder ───────────────────────────────────────────────────────

function buildEmailBody(drafts, pat) {
  const sep = '━'.repeat(44);
  const lines = [];

  const label = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  lines.push(`${drafts.length} email${drafts.length === 1 ? '' : 's'} drafted for ${label}. Run APPROVE or REJECT for each.\n`);

  drafts.forEach((d, i) => {
    lines.push(sep);
    lines.push(`${i + 1} of ${drafts.length} — ${d.touch}`);
    lines.push(`   To:    ${d.nm || d.fn}, ${d.ti} @ ${d.co}`);
    lines.push(`   Email: ${d.em}`);
    if (d.tr) lines.push(`   Track: ${d.tr}`);
    lines.push('');
    lines.push(`   Subject: ${d.subject}`);
    lines.push('');
    d.body.split('\n').forEach(l => lines.push(`   ${l}`));
    lines.push('');
    lines.push(`   APPROVE: ${buildApprovalCmd(d.draft_id, 'approve', pat)}`);
    lines.push(`   REJECT:  ${buildApprovalCmd(d.draft_id, 'reject', pat)}`);
    lines.push('');
  });

  lines.push(sep);
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // SDR_PAT is required to build authenticated approval commands
  const pat = process.env.SDR_PAT;
  if (!pat) {
    console.error('[approval-email] SDR_PAT not set — cannot build approval commands');
    process.exit(1);
  }

  // Find today's draft file
  const today = new Date().toISOString().split('T')[0];
  const draftsFile = path.join(DRAFTS_DIR, `${today}.json`);

  if (!fs.existsSync(draftsFile)) {
    console.log(`[approval-email] No drafts file for ${today} — nothing to send`);
    return;
  }

  const allDrafts = JSON.parse(fs.readFileSync(draftsFile, 'utf8'));
  const pending = allDrafts.filter(d => d.status === 'pending_approval');

  if (pending.length === 0) {
    console.log('[approval-email] No pending drafts — skipping');
    return;
  }

  console.log(`[approval-email] Sending digest for ${pending.length} draft(s) to ${RECIPIENT}...`);

  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const subject = `[SDR] ${pending.length} draft${pending.length === 1 ? '' : 's'} ready for approval — ${dateLabel}`;
  const body = buildEmailBody(pending, pat);

  const oauthClient = new OAuthClient(oauthConfig);
  const result = await oauthClient.sendMailWithRetry({
    to: RECIPIENT,
    subject,
    body,
    from: 'Oliver Chase'
  });

  if (result.ok) {
    console.log(`[approval-email] Sent (${result.messageId})`);
  } else {
    console.error(`[approval-email] Send failed: ${result.error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[approval-email] Fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main, buildEmailBody, buildApprovalCmd };
