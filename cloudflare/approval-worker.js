'use strict';

/**
 * cloudflare/approval-worker.js — SDR Approval Handler (Cloudflare Worker)
 *
 * Accepts GET requests:
 *   ?draft_id=DRAFT_ID&action=approve&token=SDR_TOKEN
 *
 * 1. Validates token against env var SDR_TOKEN
 * 2. Calls GitHub API to trigger approval-handler.yml workflow_dispatch
 * 3. Returns a plain HTML result page (works on any device, no login required)
 *
 * Env vars (set in Cloudflare dashboard):
 *   SDR_TOKEN   — shared secret; must match value in GitHub Secrets
 *   GITHUB_PAT  — GitHub PAT with actions:write scope only
 *   GITHUB_REPO — e.g. saturdaythings/v-two-sdr (defaults to this value)
 *
 * Deploy: npx wrangler deploy (from the cloudflare/ directory)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const draftId = url.searchParams.get('draft_id');
    const action  = url.searchParams.get('action');
    const token   = url.searchParams.get('token');

    // Validate token
    if (!token || token !== env.SDR_TOKEN) {
      return htmlResponse('401 &mdash; Invalid or missing token', '#c0392b', 401);
    }

    // Validate required params
    if (!draftId) {
      return htmlResponse('400 &mdash; Missing draft_id', '#c0392b', 400);
    }
    if (action !== 'approve' && action !== 'reject') {
      return htmlResponse('400 &mdash; action must be approve or reject', '#c0392b', 400);
    }

    // Trigger GitHub workflow_dispatch
    const repo   = env.GITHUB_REPO || 'saturdaythings/v-two-sdr';
    const apiUrl = 'https://api.github.com/repos/' + repo +
                   '/actions/workflows/approval-handler.yml/dispatches';

    let ghRes;
    try {
      ghRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.GITHUB_PAT,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'sdr-approval-worker'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { draft_id: draftId, action: action }
        })
      });
    } catch (e) {
      return htmlResponse('500 &mdash; GitHub API unreachable: ' + e.message, '#c0392b', 500);
    }

    // 204 No Content = success for workflow_dispatch
    if (ghRes.status === 204 || ghRes.status === 200) {
      if (action === 'approve') {
        return htmlResponse('&#x2705; Approved &mdash; email will send shortly', '#27ae60', 200);
      }
      return htmlResponse('&#x274C; Rejected &mdash; draft discarded', '#7f8c8d', 200);
    }

    if (ghRes.status === 401) {
      return htmlResponse('502 &mdash; GitHub auth failed (GITHUB_PAT invalid or expired)', '#c0392b', 502);
    }

    const errText = await ghRes.text().catch(function() { return ''; });
    return htmlResponse(
      'GitHub API error ' + ghRes.status + ': ' + errText.slice(0, 200),
      '#c0392b',
      502
    );
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function htmlResponse(message, color, status) {
  const body = '<!DOCTYPE html>' +
    '<html><head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>SDR Approval</title>' +
    '</head><body style="font-family:system-ui,sans-serif;display:flex;align-items:center;' +
    'justify-content:center;min-height:100vh;margin:0;background:#f5f5f5">' +
    '<div style="background:#fff;border-radius:8px;padding:32px 48px;' +
    'box-shadow:0 2px 8px rgba(0,0,0,.1);text-align:center;max-width:480px">' +
    '<p style="font-size:20px;font-weight:600;color:' + color + ';margin:0 0 12px">' +
    message + '</p>' +
    '<p style="font-size:13px;color:#888;margin:0">SDR System &mdash; V.Two</p>' +
    '</div></body></html>';

  return new Response(body, {
    status: status,
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  });
}
