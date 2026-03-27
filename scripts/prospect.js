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

// ─── Load existing prospects ──────────────────────────────────────────────────

function loadExistingEmails() {
  try {
    if (fs.existsSync(PROSPECTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
      const list = Array.isArray(data.prospects) ? data.prospects : [];
      return new Set(list.map(function(p) { return (p.em || '').toLowerCase().trim(); }).filter(Boolean));
    }
  } catch (e) {
    console.warn('[prospect] Could not load prospects.json: ' + e.message);
  }
  return new Set();
}

// ─── Build prompt ─────────────────────────────────────────────────────────────

function buildPrompt(existingCount) {
  var today = new Date().toISOString().split('T')[0];

  var trackDescriptions = [
    'ai-enablement: Enterprise CTO, Chief Data Officer, VP Engineering, Head of AI at companies using/evaluating LLMs, RAG, or data infrastructure (>100 employees, Series B-C)',
    'product-maker: Founder, Co-Founder, CTO, VP Product at Series A-B SaaS companies actively shipping product (self-serve or SMB focus, 15-100 employees)',
    'pace-car: VP Engineering, Head of Engineering, Director of Engineering at non-AI companies currently hiring engineers (fintech, healthtech, logistics, operations software, 30-200 employees)'
  ].join('\n    ');

  var schemaDescription = [
    'nm: full name (e.g. "Sarah Chen")',
    'fn: first name only (e.g. "Sarah")',
    'ti: exact job title',
    'co: company name',
    'dm: company domain only, no protocol (e.g. "acme.com" or "acme.io")',
    'em: realistic work email derived from dm (e.g. "sarah.chen@acme.com")',
    'loc: city, state (e.g. "San Francisco, CA")',
    'tz: IANA timezone (one of: America/New_York, America/Chicago, America/Denver, America/Los_Angeles)',
    'ind: industry (e.g. "B2B SaaS", "Data Infrastructure", "Fintech", "AI/ML Platform")',
    'tr: track (one of: ai-enablement, product-maker, pace-car)',
    'no: 1-sentence signal note (e.g. "Series B startup scaling data team" or "YC W24, recently launched v2")'
  ].join('\n    ');

  var lines = [
    'Generate exactly ' + TARGET_COUNT + ' B2B sales prospects for V.Two, a software engineering agency.',
    '',
    'V.Two ICP:',
    '- US-based companies, Series A-C or profitable independent',
    '- 15-500 employees (sweet spot 30-200)',
    '- B2B software, SaaS, enterprise software, data infrastructure, AI/ML',
    '- Decision-maker contacts only (no junior engineers, no support staff)',
    '',
    'Three tracks (distribute roughly evenly across all 25 prospects):',
    '    ' + trackDescriptions,
    '',
    'For each prospect, output a JSON object with these fields:',
    '    ' + schemaDescription,
    '',
    'Rules:',
    '- Use realistic but fictional people and companies (do not invent real individuals)',
    '- Email patterns: firstname.lastname@company.com, first@company.com, or f.last@company.com',
    '- Use varied companies — no two prospects at the same company',
    '- Mix funding stages (some Series A, some B, some C)',
    '- Mix locations across US metro areas',
    '- Date added: ' + today,
    '',
    'Output ONLY a valid JSON array of ' + TARGET_COUNT + ' objects. No markdown, no explanation, no extra text.'
  ];

  return lines.join('\n');
}

// ─── Call Anthropic API ───────────────────────────────────────────────────────

async function generateProspects(apiKey) {
  var prompt = buildPrompt();

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

var REQUIRED_FIELDS = ['nm', 'fn', 'ti', 'co', 'em', 'tr'];
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

  return {
    id:  id,
    nm:  p.nm.trim(),
    fn:  p.fn.trim(),
    ti:  p.ti.trim(),
    co:  p.co.trim(),
    dm:  (p.dm || '').toLowerCase().trim().replace(/^https?:\/\//i, '').replace(/\/.*/g, ''),
    em:  p.em.toLowerCase().trim(),
    loc: (p.loc || '').trim(),
    tz:  (p.tz || '').trim(),
    ind: (p.ind || '').trim(),
    tr:  p.tr.trim(),
    src: 'ai-generated',
    st:  'new',
    da:  today,
    no:  (p.no || '').trim()
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

  // Load existing emails for dedup
  var existingEmails = loadExistingEmails();
  console.log('[prospect] Existing prospects: ' + existingEmails.size);

  // Generate candidates
  var candidates;
  try {
    console.log('[prospect] Calling Claude Sonnet for ' + TARGET_COUNT + ' prospects...');
    candidates = await generateProspects(apiKey);
    console.log('[prospect] Claude returned ' + candidates.length + ' candidates');
  } catch (e) {
    console.warn('[prospect] Generation failed: ' + e.message + ' — skipping');
    return;
  }

  // Validate, dedup, normalize
  var valid = [];
  var dupeCount = 0;
  var invalidCount = 0;

  candidates.forEach(function(candidate, i) {
    var err = validateProspect(candidate, i);
    if (err) {
      console.warn('[prospect] Skipping invalid: ' + err);
      invalidCount++;
      return;
    }
    var email = candidate.em.toLowerCase().trim();
    if (existingEmails.has(email)) {
      console.log('[prospect] Dupe skipped: ' + email);
      dupeCount++;
      return;
    }
    existingEmails.add(email);
    valid.push(normalizeProspect(candidate, valid.length));
  });

  console.log('[prospect] Valid new prospects: ' + valid.length + ' (invalid: ' + invalidCount + ', dupes: ' + dupeCount + ')');

  if (valid.length === 0) {
    console.log('[prospect] Nothing to append — done');
    return;
  }

  // Append to Sheet
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

module.exports = { main, buildPrompt, validateProspect, normalizeProspect };
