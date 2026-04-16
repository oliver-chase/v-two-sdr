'use strict';

/**
 * scripts/draft.js — Daily draft step
 *
 * Eligible: prospects with st === 'email_discovered' (initial) or 'followup_due' (touches 2 & 3)
 *
 * 1. Read prospects.json, filter eligible
 * 2. Build a single batched prompt with all eligible prospects
 * 3. ONE Anthropic Claude Haiku call → parse individual drafts
 * 4. Fall back to static templates on API failure (no crash, no exit)
 * 5. Write outreach/drafts/YYYY-MM-DD.json
 * 6. Update prospect statuses → draft_generated in prospects.json
 * 7. Optionally write status changes back to Google Sheet
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { GoogleSheetsConnector } = require('../sheets-connector');
const sheetsConfig = require('../config.sheets');

const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');
const DRAFTS_DIR = path.join(__dirname, '..', 'outreach', 'drafts');
const TEMPLATES_FILE = path.join(__dirname, '..', 'outreach', 'templates.md');

const ELIGIBLE_STATUSES = new Set(['email_discovered', 'followup_due']);

// ─── Templates ───────────────────────────────────────────────────────────────

/**
 * Parse outreach/templates.md → { A: {subject, body}, B: ..., C: ..., D: ..., E: ... }
 */
function loadTemplates() {
  const raw = fs.readFileSync(TEMPLATES_FILE, 'utf8');
  const templates = {};
  const re = /## Template ([A-E])[^\n]*\n([\s\S]*?)(?=\n## Template [A-E]|$)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const content = m[2];
    const sub = content.match(/\*\*Subject:\*\*\s*(.+)/);
    const body = content.match(/```\n?([\s\S]*?)```/);
    templates[m[1]] = {
      subject: sub ? sub[1].trim() : '',
      body: body ? body[1].trim() : ''
    };
  }
  return templates;
}

/**
 * Apply static template for a prospect.
 * Initial: A/B/C by track. Follow-up: D (touch 2) or E (touch 3).
 */
function applyStaticTemplate(templates, prospect) {
  const fn = prospect.fn || (prospect.nm ? prospect.nm.split(' ')[0] : '');
  const co = prospect.co || '';
  const fuc = parseInt(prospect.fuc, 10) || 1;

  let tpl;
  if (prospect.st === 'followup_due') {
    tpl = templates[fuc >= 2 ? 'E' : 'D'];
  } else {
    const trackMap = { 'product-maker': 'A', 'ai-enablement': 'B', 'pace-car': 'C' };
    tpl = templates[trackMap[prospect.tr] || 'A'];
  }

  const origSubj = prospect.orig_subj || 'my previous email';
  const subject = tpl.subject
    .replace('[original subject]', origSubj)
    .replace(/\[Name\]/g, fn)
    .replace(/\[Company\]/g, co);

  const body = tpl.body
    .replace(/\[Name\]/g, fn)
    .replace(/\[Company\]/g, co);

  return { subject, body };
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

function callAnthropic(prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Anthropic ${res.statusCode}: ${data.slice(0, 200)}`));
        }
        try {
          resolve(JSON.parse(data).content[0].text);
        } catch (e) {
          reject(new Error(`Bad Anthropic response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Anthropic timeout (30s)')));
    req.write(payload);
    req.end();
  });
}

// ─── Prompt + parser ──────────────────────────────────────────────────────────

function buildBatchPrompt(prospects, templates) {
  const toneExamples = ['A', 'B', 'C']
    .filter(k => templates[k])
    .map(k => `Template ${k}:\nSubject: ${templates[k].subject}\n${templates[k].body}`)
    .join('\n\n---\n\n');

  const prospectLines = prospects.map((p, i) => {
    const fuc = parseInt(p.fuc, 10) || 1;
    const fn = p.fn || (p.nm ? p.nm.split(' ')[0] : '?');
    const isFinal = p.st === 'followup_due' && fuc + 1 >= 3;
    const touchLabel = p.st === 'followup_due'
      ? `FOLLOW-UP touch ${fuc + 1}` + (isFinal ? ' (FINAL — close gracefully, leave door open)' : ' (brief — bump the thread naturally)')
      : 'INITIAL OUTREACH';
    return [
      `${i + 1}. ID: ${p.id}`,
      `   Name: ${fn} | Title: ${p.ti || '?'} | Company: ${p.co || '?'}`,
      `   Industry: ${p.ind || 'unknown'} | Track: ${p.tr || 'product-maker'}`,
      `   Signal: ${p.sig || 'none'}`,
      `   Touch: ${touchLabel}`
    ].join('\n');
  }).join('\n\n');

  return `You are Oliver Chase at V.Two (vtwo.co), a software consultancy that builds custom digital products end-to-end — strategy, engineering, and delivery. V.Two works with founders, product leaders, and engineering leaders who need to ship serious software. Current work spans AI infrastructure, healthcare platforms, and enterprise SaaS. V.Two's edge: full product ownership, not just code.

TRACK HOOKS — use the right one based on the prospect's track:
- ai-enablement: "We build what's missing for AI to actually work at scale — data pipelines, governance, model integration, cost control. Not strategy decks. Actual infrastructure."
- product-maker: "We own the full product build — strategy, architecture, engineering, delivery — so founders don't have to split attention across vendors."
- pace-car: "Senior engineers who slot into existing teams and accelerate what's already being built. Not a consultancy, not an outsource — augmentation with AI-assisted velocity."

VOICE RULES — non-negotiable:
- Write like a smart person sending a genuine note, not a sales rep following a script
- First sentence must be specific to this person — use their signal, industry, or role
- Never start with: "I hope", "I wanted to reach out", "My name is", "I came across"
- Never use: reach out, touch base, circle back, synergy, leverage, pain points, game-changer, innovative, passionate, excited, streamline, robust, scalable, cutting-edge, best-in-class
- Initial outreach: 3-4 sentences maximum
- Follow-up touch 2: 2 sentences maximum — bump the thread naturally, reference the original subject
- Follow-up touch 3: 1-2 sentences — close the loop gracefully, leave the door open
- Never start two emails in the same batch the same way
- End every email body with exactly: Oliver\\nV.Two | vtwo.co

PERSONALIZATION PRIORITY (use whatever is available, in this order):
1. sig — if present, reference it specifically in sentence 1
2. ind — make the email feel relevant to their world
3. ti — speak to their specific role and what they care about
4. co — use company name if it adds context
5. tr — use the track hook if nothing more specific is available

TONE EXAMPLES — match this voice exactly:
${toneExamples}

For EACH prospect respond in EXACTLY this format — nothing outside the blocks:
---BEGIN DRAFT---
ID: [prospect_id]
SUBJECT: [subject line — specific, max 8 words, never "Quick question" or "Following up"]
BODY:
[email body]
---END DRAFT---

PROSPECTS:
${prospectLines}`;
}

/**
 * Parse ---BEGIN DRAFT--- blocks from LLM response.
 * Returns Map of prospect_id → { subject, body }
 */
function parseBatchResponse(text) {
  const drafts = new Map();
  const re = /---BEGIN DRAFT---\s*([\s\S]*?)---END DRAFT---/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const block = m[1].trim();
    const id = block.match(/^ID:\s*(.+)/m);
    const sub = block.match(/^SUBJECT:\s*(.+)/m);
    const body = block.match(/^BODY:\s*([\s\S]+)/m);
    if (id && sub && body) {
      drafts.set(id[1].trim(), {
        subject: sub[1].trim(),
        body: body[1].trim()
      });
    }
  }
  return drafts;
}

// ─── Sheet write-back ─────────────────────────────────────────────────────────

async function writeStatusToSheet(drafted) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return; // creds not present, skip silently
  }
  try {
    const connector = new GoogleSheetsConnector({
      google_sheets: { ...sheetsConfig.google_sheets, field_mapping: sheetsConfig.field_mapping }
    }, 'write');
    await connector.authenticate();
    for (const p of drafted) {
      await connector.updateProspectStatus(p.em, 'draft_generated');
    }
  } catch (e) {
    console.warn(`[draft] Sheet write-back failed: ${e.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[draft] Starting draft generation...');

  // Load prospects
  const raw = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
  const prospects = raw.prospects || [];
  const eligible = prospects.filter(p => p.em && ELIGIBLE_STATUSES.has(p.st));

  if (eligible.length === 0) {
    console.log('[draft] No eligible prospects. Done.');
    return;
  }

  const initialCount = eligible.filter(p => p.st === 'email_discovered').length;
  const followupCount = eligible.filter(p => p.st === 'followup_due').length;
  console.log(`[draft] ${eligible.length} eligible: ${initialCount} initial, ${followupCount} follow-up`);

  const templates = loadTemplates();

  // Attempt ONE batched LLM call
  let llmDrafts = new Map();
  let usedLLM = false;
  let llmCallFailed = false;
  let promptTokensEst = null;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const prompt = buildBatchPrompt(eligible, templates);
      promptTokensEst = Math.ceil(prompt.length / 4);
      console.log('[draft] Calling Anthropic Claude Haiku (batched)...');
      const response = await callAnthropic(prompt);
      llmDrafts = parseBatchResponse(response);
      usedLLM = true;
      console.log(`[draft] LLM returned ${llmDrafts.size}/${eligible.length} draft(s)`);
      if (llmDrafts.size < eligible.length) {
        console.warn(`[draft] ${eligible.length - llmDrafts.size} missing from LLM response — static fallback for those`);
      }
    } catch (e) {
      llmCallFailed = true;
      console.warn(`[draft] LLM call failed: ${e.message}`);
      console.warn('[draft] Falling back to static templates for all prospects');
    }
  } else {
    console.warn('[draft] ANTHROPIC_API_KEY not set — using static templates');
  }

  // Build draft objects
  const today = new Date().toISOString().split('T')[0];
  const dateTag = today.replace(/-/g, '');
  const drafts = [];

  for (const p of eligible) {
    const llm = llmDrafts.get(p.id);
    const isLlm = !!(usedLLM && llm);
    const { subject, body } = llm || applyStaticTemplate(templates, p);
    const fuc = parseInt(p.fuc, 10) || 1;

    let fallbackReason = null;
    if (!isLlm) {
      if (!process.env.ANTHROPIC_API_KEY) fallbackReason = 'no_api_key';
      else if (llmCallFailed) fallbackReason = 'llm_call_failed';
      else fallbackReason = 'missing_from_parse';
    }

    const templateKey = p.st === 'followup_due'
      ? (fuc >= 2 ? 'E' : 'D')
      : ({ 'product-maker': 'A', 'ai-enablement': 'B', 'pace-car': 'C' }[p.tr] || 'A');

    drafts.push({
      draft_id: `${dateTag}-${p.id}`,
      prospect_id: p.id,
      em: p.em,
      fn: p.fn || (p.nm ? p.nm.split(' ')[0] : ''),
      nm: p.nm || '',
      ti: p.ti || '',
      co: p.co || '',
      tr: p.tr || '',
      touch: p.st === 'followup_due' ? `FOLLOW-UP (Day ${fuc === 1 ? 5 : 12})` : 'INITIAL OUTREACH',
      fuc,
      subject,
      body,
      gen: isLlm ? 'llm' : 'static',
      ts: new Date().toISOString(),
      status: 'pending_approval',
      audit_trace: {
        prompt_tokens_est: isLlm ? promptTokensEst : null,
        fallback_reason: fallbackReason,
        pattern_used: isLlm ? 'llm' : templateKey,
        generated_at: new Date().toISOString(),
      },
    });
  }

  // Write outreach/drafts/YYYY-MM-DD.json
  if (!fs.existsSync(DRAFTS_DIR)) fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  const draftsFile = path.join(DRAFTS_DIR, `${today}.json`);
  fs.writeFileSync(draftsFile, JSON.stringify(drafts, null, 2));
  console.log(`[draft] Wrote ${drafts.length} draft(s) → ${path.relative(process.cwd(), draftsFile)}`);

  // Update st → draft_generated in memory
  const draftedIds = new Set(drafts.map(d => d.prospect_id));
  for (const p of prospects) {
    if (draftedIds.has(p.id)) p.st = 'draft_generated';
  }

  // Write back to Sheet (best-effort, only if creds present)
  await writeStatusToSheet(drafts);

  // Write prospects.json
  const byState = prospects.reduce((acc, p) => {
    const k = p.st || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const draftProspectsPayload = JSON.stringify({
    prospects,
    metadata: { ...raw.metadata, lu: new Date().toISOString(), by_st: byState }
  }, null, 2);
  const draftTmpFile = PROSPECTS_FILE + '.tmp';
  fs.writeFileSync(draftTmpFile, draftProspectsPayload);
  fs.renameSync(draftTmpFile, PROSPECTS_FILE);

  // Write drafts to Supabase sdr_approval_items (best-effort)
  await writeDraftsToSupabase(drafts, today);

  console.log(`[draft] Done. ${drafts.length} draft(s) (${usedLLM ? 'llm' : 'static'})`);
}

// ─── Supabase dual-write ──────────────────────────────────────────────────────

async function writeDraftsToSupabase(drafts, batchDate) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    const https = require('https');
    const payload = JSON.stringify(drafts.map(d => ({
      id: d.draft_id,
      batch_date: batchDate,
      prospect_id: d.prospect_id,
      em: d.em,
      fn: d.fn,
      nm: d.nm,
      ti: d.ti,
      co: d.co,
      tr: d.tr,
      touch: d.touch,
      subject: d.subject,
      body: d.body,
      gen: d.gen,
      status: 'pending_approval',
      ts: d.ts,
    })));
    await new Promise((resolve, reject) => {
      const urlObj = new URL(url + '/rest/v1/sdr_approval_items');
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
    console.log(`[draft] Wrote ${drafts.length} draft(s) to Supabase`);
  } catch (e) {
    console.warn(`[draft] Supabase write failed: ${e.message}`);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[draft] Fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main, loadTemplates, applyStaticTemplate, buildBatchPrompt, parseBatchResponse };
