'use strict';

/**
 * scripts/prospect.js — Weekly automated prospecting
 *
 * Calls Claude Sonnet to generate 25 new B2B prospects matching V.Two's ICP.
 * Deduplicates against prospects.json, validates required fields,
 * then appends new prospects to the Google Sheet.
 *
 * ICP:
 *   Stage: Series A–C or profitable independent
 *   Size: 15–500 employees (sweet spot 30–200)
 *   Industry: B2B SaaS, enterprise software, data infrastructure, AI/ML
 *   Geography: US-based
 *   Tracks: ai-enablement, product-maker, pace-car
 *
 * Env vars required:
 *   ANTHROPIC_API_KEY — Claude API key
 *   GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY — Sheet auth
 */

const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const { GoogleSheetsConnector } = require('../sheets-connector');
const sheetsConfig = require('../config/config.sheets');

const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const TARGET_COUNT = 25;

// ─── Deduplication ────────────────────────────────────────────────────────────

function loadLocalProspects() {
  try {
    if (fs.existsSync(PROSPECTS_FILE)) {
      var data = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
      return Array.isArray(data.prospects) ? data.prospects : [];
    }
  } catch (e) {
    console.warn('[prospect] Could not load prospects.json: ' + e.message);
  }
  return [];
}

/**
 * Extract the three dedup keys from a prospect object.
 * Handles both nm (full name) and fn+ln (split name) formats.
 */
function extractDedupKeys(p) {
  var email = (p.em || '').toLowerCase().trim();

  var fullName = p.nm
    ? p.nm.trim()
    : ((p.fn || '') + ' ' + (p.ln || '')).trim();
  var nameCompany = fullName.toLowerCase() + '|' + (p.co || '').toLowerCase().trim();

  var firstName = p.fn
    ? p.fn.toLowerCase().trim()
    : fullName.toLowerCase().split(/\s+/)[0] || '';
  var domainFirst = (p.dm || '').toLowerCase().trim() + '|' + firstName;

  return { email, nameCompany, domainFirst };
}

/**
 * Build a three-key dedup index from an array of prospects.
 * Returns { emails, nameCompanies, domainFirstNames } — all Sets.
 */
function buildDedupIndex(prospects) {
  var emails = new Set();
  var nameCompanies = new Set();
  var domainFirstNames = new Set();

  prospects.forEach(function(p) {
    var k = extractDedupKeys(p);
    if (k.email) emails.add(k.email);
    if (k.nameCompany && k.nameCompany !== '|') nameCompanies.add(k.nameCompany);
    if (k.domainFirst && k.domainFirst !== '|') domainFirstNames.add(k.domainFirst);
  });

  return { emails, nameCompanies, domainFirstNames };
}

/**
 * Return true if candidate matches any key in the given index.
 */
function matchesIndex(candidate, index) {
  var k = extractDedupKeys(candidate);
  if (k.email && index.emails.has(k.email)) return true;
  if (k.nameCompany && k.nameCompany !== '|' && index.nameCompanies.has(k.nameCompany)) return true;
  if (k.domainFirst && k.domainFirst !== '|' && index.domainFirstNames.has(k.domainFirst)) return true;
  return false;
}

// ─── Build prompt ─────────────────────────────────────────────────────────────

function buildPrompt() {
  var lines = [
    'You are a senior B2B sales researcher. Generate realistic prospects for V.Two, a software consultancy that builds custom digital products end-to-end.',
    '',
    "V.Two's three ideal customer profiles:",
    '',
    'TRACK 1 — ai-enablement:',
    'Who: CTOs, CDOs, VPs of Engineering, Heads of AI, Chief Data Officers',
    'Company stage: 200-2000 employees, past Series B',
    'Signals: Announced AI initiative in last 6 months, hiring AI/ML engineers, published about AI ROI challenges, raised growth round with AI focus, replatforming data infrastructure',
    'Industries: Healthcare tech, fintech, enterprise SaaS, logistics, insurance tech, retail tech',
    'NOT: pure AI startups building AI products, Big Tech, pre-revenue startups',
    '',
    'TRACK 2 — product-maker:',
    'Who: Founders, Co-founders, CEOs (technical), CPOs, VPs of Product',
    'Company stage: Seed to Series B, 10-150 employees, building core technical product',
    'Signals: Raised funding in last 12 months, hiring first or second engineering lead, pivoting product, launching new product line, previous agency relationship ended',
    'Industries: B2B SaaS, developer tools, vertical SaaS, climate tech, health tech, fintech',
    'NOT: consumer apps, non-technical businesses, companies with 20+ person eng teams already',
    '',
    'TRACK 3 — pace-car:',
    'Who: VP Engineering, Engineering Manager, Director of Engineering, Head of Engineering',
    'Company stage: 50-500 employees, scaling engineering organization',
    'Signals: 3+ open senior engineering roles, recently promoted into role, post-acquisition integration, scaling from startup to enterprise processes, accelerating roadmap after funding',
    'Industries: Any technical company',
    'NOT: pre-product companies, companies with fewer than 5 engineers',
    '',
    'GENERATION RULES:',
    '- Generate plausible but fictional people — do NOT use names of real identifiable individuals',
    '- Company names must sound like real companies — not TechCorp, Acme, FakeCo',
    '- Signals must be specific and plausible — not "growing company", write "raised $18M Series B in Q4 2025, now hiring engineering leadership"',
    '- Domains must be realistic — use .io, .com, .co matching what that company type would actually use',
    '- Emails must be derived from the domain and name using standard patterns',
    '- Mix of US cities weighted toward SF, NYC, Boston, Austin, Seattle, Chicago, Denver, Atlanta',
    '- No two prospects from the same company in the same batch',
    '- Distribute evenly across tracks',
    '- Generate exactly ' + TARGET_COUNT + ' prospects',
    '',
    'Return ONLY a valid JSON array. No preamble, no explanation, no markdown fences. Each object must have exactly these fields:',
    'fn, ln, ti, co, dm, em, loc, tz, ind, sig, tr, sz',
    '',
    'Field definitions:',
    '  fn: first name only (e.g. "Sarah")',
    '  ln: last name only (e.g. "Chen")',
    '  ti: exact job title',
    '  co: company name',
    '  dm: domain only, no protocol (e.g. "acme.io")',
    '  em: work email derived from dm (e.g. "sarah.chen@acme.io")',
    '  loc: city, state (e.g. "San Francisco, CA")',
    '  tz: IANA timezone (one of: America/New_York, America/Chicago, America/Denver, America/Los_Angeles)',
    '  ind: industry (e.g. "Healthcare Tech", "B2B SaaS", "Fintech")',
    '  sig: specific, plausible signal sentence — not generic (e.g. "Raised $22M Series B in Jan 2026, now scaling engineering from 8 to 20 engineers")',
    '  tr: track (one of: ai-enablement, product-maker, pace-car)',
    '  sz: employee count range (e.g. "50-100", "200-500")'
  ];

  return lines.join('\n');
}

// ─── Call Anthropic API ───────────────────────────────────────────────────────

async function generateProspects(apiKey) {
  var prompt = buildPrompt();  // TARGET_COUNT is embedded in the prompt

  var response;
  try {
    response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: ANTHROPIC_MODEL,
        max_tokens: 8192,
        messages: [
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 60000
      }
    );
  } catch (e) {
    var errMsg = e.response
      ? ('HTTP ' + e.response.status + ': ' + JSON.stringify(e.response.data))
      : e.message;
    throw new Error('Anthropic API request failed: ' + errMsg);
  }

  var content = (response.data.content || []).find(function(b) { return b.type === 'text'; });
  if (!content || !content.text) {
    throw new Error('Anthropic response had no text content');
  }

  var raw = content.text.trim();

  // Strip markdown code fences if present
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  var parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error('Could not parse Anthropic response as JSON: ' + e.message);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array from Anthropic, got: ' + typeof parsed);
  }

  return parsed;
}

// ─── Validate a single prospect ───────────────────────────────────────────────

var REQUIRED_FIELDS = ['fn', 'ln', 'ti', 'co', 'em', 'tr'];
var VALID_TRACKS = ['ai-enablement', 'product-maker', 'pace-car'];
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateProspect(p, index) {
  for (var i = 0; i < REQUIRED_FIELDS.length; i++) {
    var field = REQUIRED_FIELDS[i];
    if (!p[field] || typeof p[field] !== 'string' || !p[field].trim()) {
      return 'item[' + index + '] missing required field: ' + field;
    }
  }
  if (!EMAIL_RE.test(p.em)) {
    return 'item[' + index + '] invalid email format: ' + p.em;
  }
  if (!VALID_TRACKS.includes(p.tr)) {
    return 'item[' + index + '] invalid track: ' + p.tr;
  }
  return null;
}

// ─── Normalize to full TOON object ───────────────────────────────────────────

function normalizeProspect(p, index) {
  var today = new Date().toISOString().split('T')[0];
  var id = 'ap-' + today + '-' + String(index + 1).padStart(3, '0');
  var fn = p.fn.trim();
  var ln = p.ln.trim();

  return {
    id:  id,
    nm:  fn + ' ' + ln,
    fn:  fn,
    ln:  ln,
    ti:  p.ti.trim(),
    co:  p.co.trim(),
    dm:  (p.dm || '').toLowerCase().trim().replace(/^https?:\/\//i, '').replace(/\/.*/g, ''),
    em:  p.em.toLowerCase().trim(),
    loc: (p.loc || '').trim(),
    tz:  (p.tz || '').trim(),
    ind: (p.ind || '').trim(),
    sig: (p.sig || '').trim(),
    tr:  p.tr.trim(),
    sz:  (p.sz || '').trim(),
    src: 'ai-generated',
    st:  'new',
    da:  today
  };
}

// ─── Append to Google Sheet ───────────────────────────────────────────────────

async function appendToSheet(prospects) {
  var connector = new GoogleSheetsConnector(
    {
      google_sheets: {
        ...sheetsConfig.google_sheets,
        field_mapping: sheetsConfig.google_sheets.field_mapping
      }
    },
    'write'
  );

  await connector.authenticate();
  await connector.confirmFieldMapping();
  await connector.appendProspects(prospects);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[prospect] ANTHROPIC_API_KEY not set — skipping');
    return;
  }

  var dryRun = process.env.DRY_RUN === 'true';
  if (dryRun) {
    console.log('[prospect] DRY_RUN=true — will log candidates but not write to Sheet');
  }

  // 1. Load local prospects.json
  var localProspects = loadLocalProspects();
  console.log('[prospect] Local prospects: ' + localProspects.length);

  // 2. Try to read live Sheet for dedup — fall back to local-only on failure
  var sheetProspects = [];
  var sheetReadFailed = false;
  try {
    var readConnector = new GoogleSheetsConnector(
      { google_sheets: { ...sheetsConfig.google_sheets, field_mapping: sheetsConfig.google_sheets.field_mapping } },
      'write'
    );
    await readConnector.authenticate();
    sheetProspects = await readConnector.readProspects();
    console.log('[prospect] Live Sheet: ' + sheetProspects.length + ' existing prospect(s)');
  } catch (e) {
    sheetReadFailed = true;
    console.warn('[prospect] Sheet read failed — falling back to local-only dedup: ' + e.message);
  }

  // 3. Build separate dedup indices so we can attribute skips to their source
  var sheetIndex = buildDedupIndex(sheetProspects);
  var localIndex = buildDedupIndex(localProspects);

  // 4. Generate candidates
  var candidates;
  try {
    console.log('[prospect] Calling Claude Sonnet for ' + TARGET_COUNT + ' prospects...');
    candidates = await generateProspects(apiKey);
    console.log('[prospect] Claude returned ' + candidates.length + ' candidates');
  } catch (e) {
    console.warn('[prospect] Generation failed: ' + e.message + ' — skipping');
    return;
  }

  // 5. Validate, dedup, normalize
  var valid = [];
  var invalidCount = 0;
  var sheetDupeCount = 0;
  var localDupeCount = 0;
  var batchCompanies = new Set(); // within-batch company dedup

  candidates.forEach(function(candidate, i) {
    var err = validateProspect(candidate, i);
    if (err) {
      console.warn('[prospect] Skipping invalid: ' + err);
      invalidCount++;
      return;
    }

    // Check against Sheet index first (authoritative), then local
    if (matchesIndex(candidate, sheetIndex)) {
      sheetDupeCount++;
      return;
    }
    if (matchesIndex(candidate, localIndex)) {
      localDupeCount++;
      return;
    }

    // Within-batch: skip if same company already queued
    var coKey = (candidate.co || '').toLowerCase().trim();
    if (coKey && batchCompanies.has(coKey)) {
      console.log('[prospect] Batch dupe skipped (same company): ' + candidate.co);
      localDupeCount++;
      return;
    }

    var normalized = normalizeProspect(candidate, valid.length);
    valid.push(normalized);
    batchCompanies.add(coKey);

    // Add to local index so later candidates in the same batch can't dupe against this one
    var k = extractDedupKeys(normalized);
    if (k.email) localIndex.emails.add(k.email);
    if (k.nameCompany && k.nameCompany !== '|') localIndex.nameCompanies.add(k.nameCompany);
    if (k.domainFirst && k.domainFirst !== '|') localIndex.domainFirstNames.add(k.domainFirst);
  });

  var totalDupes = sheetDupeCount + localDupeCount;
  var sourceNote = sheetReadFailed ? '(local-only — Sheet read failed)' : '(' + sheetDupeCount + ' from Sheet, ' + localDupeCount + ' from local)';
  console.log('[prospect] Dedup: ' + candidates.length + ' generated, ' + totalDupes + ' duplicates skipped ' + sourceNote + ', ' + valid.length + ' new prospects added');

  if (valid.length === 0) {
    console.log('[prospect] Nothing to append — done');
    return;
  }

  // 6. DRY_RUN: log and stop
  if (dryRun) {
    valid.forEach(function(p) {
      console.log('[prospect] DRY_RUN would add: ' + p.nm + ' <' + p.em + '> @ ' + p.co + ' [' + p.tr + ']');
    });
    console.log('[prospect] DRY_RUN complete — no Sheet writes');
    return;
  }

  // 7. Append to Sheet
  try {
    console.log('[prospect] Appending ' + valid.length + ' prospects to Sheet...');
    await appendToSheet(valid);
    console.log('[prospect] Done. Appended: ' + valid.length);
  } catch (e) {
    console.warn('[prospect] Sheet append failed: ' + e.message + ' — skipping');
  }
}

if (require.main === module) {
  main().catch(function(err) {
    console.warn('[prospect] Fatal: ' + err.message + ' — exiting 0');
    process.exit(0);
  });
}

module.exports = { main, buildPrompt, validateProspect, normalizeProspect, buildDedupIndex, extractDedupKeys, matchesIndex };
