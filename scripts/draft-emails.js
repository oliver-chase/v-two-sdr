/**
 * Draft Emails -- Generate email drafts for eligible prospects
 *
 * Responsibilities:
 * - Parse templates.md to extract A/B/C/D/E templates
 * - Select template based on prospect track (tr field)
 * - Merge [Name]/[Company] placeholders with prospect TOON data
 * - Filter by eligibility (status, opt-out, has email)
 * - Write draft-plan.json with status='draft' entries
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// TEMPLATE PARSING
// ============================================================================

/**
 * Parse templates.md and extract subject + body for each template (A-E)
 *
 * @param {string} templatesPath - Absolute path to templates.md
 * @returns {{ A: {subject, body}, B: {subject, body}, C: {subject, body}, D: {subject, body}, E: {subject, body} }}
 */
function loadTemplates(templatesPath) {
  const raw = fs.readFileSync(templatesPath, 'utf8');

  const templates = {};

  // Match each ## Template X section and capture content until next section or end
  const sectionRegex = /## Template ([A-E])[^\n]*\n([\s\S]*?)(?=\n## Template [A-E]|$)/g;

  let match;
  while ((match = sectionRegex.exec(raw)) !== null) {
    const letter = match[1];
    const sectionContent = match[2];

    // Extract subject from **Subject:** line
    const subjectMatch = sectionContent.match(/\*\*Subject:\*\*\s*(.+)/);
    const subject = subjectMatch ? subjectMatch[1].trim() : '';

    // Extract body from first fenced code block
    const bodyMatch = sectionContent.match(/```\n?([\s\S]*?)```/);
    const body = bodyMatch ? bodyMatch[1].trim() : '';

    templates[letter] = { subject, body };
  }

  return templates;
}

// ============================================================================
// TEMPLATE SELECTION
// ============================================================================

/**
 * Select template based on prospect track (tr)
 * product-maker -> A, ai-enablement -> B, pace-car -> C, default -> A
 *
 * @param {Object} templates - Result of loadTemplates()
 * @param {Object} prospect  - TOON prospect object
 * @returns {{ subject: string, body: string }}
 */
function selectTemplate(templates, prospect) {
  const trackMap = {
    'product-maker': 'A',
    'ai-enablement': 'B',
    'pace-car': 'C'
  };

  const key = trackMap[prospect.tr] || 'A';
  return templates[key];
}

// ============================================================================
// TEMPLATE MERGING
// ============================================================================

/**
 * Replace [Name] and [Company] placeholders in subject and body
 *
 * @param {{ subject: string, body: string }} template
 * @param {Object} prospect - TOON prospect object (fn, co)
 * @returns {{ subject: string, body: string }}
 */
function mergeDraft(template, prospect) {
  // fn is set directly, or derived from nm (full name) by parseSheetRow
  const fn = prospect.fn || (prospect.nm ? prospect.nm.split(' ')[0] : '') || '';
  const co = prospect.co || '';

  const subject = template.subject
    .replace(/\[Name\]/g, fn)
    .replace(/\[Company\]/g, co);

  const body = template.body
    .replace(/\[Name\]/g, fn)
    .replace(/\[Company\]/g, co);

  return { subject, body };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate draft emails for all eligible prospects
 *
 * Eligibility rules:
 * - prospect.st is 'new' or 'email_discovered'
 * - prospect.em is present
 * - prospect.em is NOT in opt-outs list
 *
 * @param {Object} config
 * @param {Object} config.paths
 * @param {string} config.paths.templatesPath  - Path to templates.md
 * @param {string} config.paths.prospectsPath  - Path to prospects.json
 * @param {string} config.paths.optOutsPath    - Path to opt-outs.json
 * @param {string} config.paths.draftPlanPath  - Output path for draft-plan.json
 *
 * @returns {{ total: number, drafted: number, skipped_optout: number, skipped_no_email: number, errors: number }}
 */
function generateDrafts(config) {
  const { templatesPath, prospectsPath, optOutsPath, draftPlanPath } = config.paths;

  const summary = {
    total: 0,
    drafted: 0,
    skipped_optout: 0,
    skipped_no_email: 0,
    errors: 0
  };

  // Load templates
  const templates = loadTemplates(templatesPath);

  // Load prospects
  const prospectsData = JSON.parse(fs.readFileSync(prospectsPath, 'utf8'));
  const allProspects = prospectsData.prospects || [];
  summary.total = allProspects.length;

  // Load opt-outs into a Set for O(1) lookup
  const optOutsData = JSON.parse(fs.readFileSync(optOutsPath, 'utf8'));
  const optOutEmails = new Set(
    (optOutsData.opt_outs || []).map(function(o) { return (o.em || '').toLowerCase(); })
  );

  const ELIGIBLE_STATUSES = new Set(['new', 'email_discovered']);
  const trackMap = { 'product-maker': 'A', 'ai-enablement': 'B', 'pace-car': 'C' };
  const drafts = [];

  for (let i = 0; i < allProspects.length; i++) {
    const prospect = allProspects[i];
    try {
      // Must be in eligible status
      if (!ELIGIBLE_STATUSES.has(prospect.st)) {
        continue;
      }

      // Must have email
      if (!prospect.em) {
        summary.skipped_no_email++;
        continue;
      }

      // Must not be opted out
      if (optOutEmails.has(prospect.em.toLowerCase())) {
        summary.skipped_optout++;
        continue;
      }

      // Select and merge template
      const template = selectTemplate(templates, prospect);
      const merged = mergeDraft(template, prospect);
      const tpl = trackMap[prospect.tr] || 'A';

      drafts.push({
        id: prospect.id,
        em: prospect.em,
        fn: prospect.fn,
        ln: prospect.ln,
        co: prospect.co,
        ti: prospect.ti,
        tr: prospect.tr,
        tpl: tpl,
        subject: merged.subject,
        body: merged.body,
        ts: new Date().toISOString(),
        status: 'draft'
      });

      summary.drafted++;
    } catch (err) {
      summary.errors++;
      console.error('Error drafting prospect ' + (prospect.id || '?') + ': ' + err.message);
    }
  }

  // Ensure output directory exists
  const draftDir = path.dirname(draftPlanPath);
  if (!fs.existsSync(draftDir)) {
    fs.mkdirSync(draftDir, { recursive: true });
  }

  // Write draft-plan.json
  fs.writeFileSync(draftPlanPath, JSON.stringify(drafts, null, 2));

  return summary;
}

// ============================================================================
// AI-POWERED TEMPLATE GENERATION (Production path — requires ANTHROPIC_API_KEY)
// ============================================================================

const axios = require('axios');

/**
 * Classify title into a broad seniority bucket for grouping
 */
function classifyTitle(title) {
  const t = (title || '').toLowerCase();
  if (/\b(ceo|cto|cpo|cfo|coo|founder|co-founder|president|owner|managing partner|managing director)\b/.test(t)) return 'executive';
  if (/\b(vp|vice president|director|head of)\b/.test(t)) return 'vp-director';
  if (/\b(manager|lead|principal|senior|staff)\b/.test(t)) return 'manager';
  return 'ic';
}

/**
 * Classify funding stage into a bucket for grouping
 */
function classifyFunding(funding) {
  const f = (funding || '').toLowerCase();
  if (!f || /bootstrap|self.fund|unfunded|boot/.test(f)) return 'bootstrap';
  if (/pre-seed|pre seed/.test(f)) return 'pre-seed';
  if (/\bseed\b/.test(f)) return 'seed';
  if (/series a/i.test(f)) return 'series-a';
  if (/series [b-z]|growth/i.test(f)) return 'growth';
  if (/public|nasdaq|nyse|ipo/i.test(f)) return 'public';
  return 'unknown';
}

/**
 * Derive a group key from a prospect's segmentation fields.
 * Prospects with the same key get the same AI-generated template.
 */
function getGroupKey(prospect) {
  const titleLevel = classifyTitle(prospect.ti);
  const industry = (prospect.ind || 'tech').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20);
  const funding = classifyFunding(prospect.fnd);
  return `${titleLevel}|${industry}|${funding}`;
}

/**
 * Group prospects by similarity so one template can serve multiple leads
 */
function groupProspects(prospects) {
  const groups = new Map();
  for (const p of prospects) {
    const key = getGroupKey(p);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  return groups;
}

// ============================================================================
// LLM PROVIDER FALLBACK CHAIN
// Priority: Anthropic → OpenRouter paid → OpenRouter free → static templates
// ============================================================================

/* istanbul ignore next */
async function _callAnthropic(prompt, apiKey) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    { model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] },
    { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, timeout: 15000 }
  );
  return response.data.content[0].text;
}

/* istanbul ignore next */
async function _callOpenRouter(prompt, apiKey, model) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    { model, max_tokens: 400, messages: [{ role: 'user', content: prompt }] },
    { headers: { 'Authorization': `Bearer ${apiKey}`, 'content-type': 'application/json' }, timeout: 15000 }
  );
  return response.data.choices[0].message.content;
}

/**
 * Returns the active LLM provider name for logging.
 * Checks env vars in priority order.
 */
function getLLMProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter-paid';
  if (process.env.OPENROUTER_FREE_KEY) return 'openrouter-free';
  return null;
}

/**
 * Call LLM with 3-tier fallback. Returns response text or null.
 * Logs which provider is active and warns on fallback.
 */
/* istanbul ignore next */
async function callLLM(prompt) {
  // Tier 1: Anthropic (fastest, best quality)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const text = await _callAnthropic(prompt, process.env.ANTHROPIC_API_KEY);
      return { text, provider: 'anthropic' };
    } catch (err) {
      console.warn(`[llm] Anthropic failed (${err.message}) — trying OpenRouter paid...`);
    }
  }

  // Tier 2: OpenRouter paid (gpt-4o-mini)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const text = await _callOpenRouter(prompt, process.env.OPENROUTER_API_KEY, 'openai/gpt-4o-mini');
      return { text, provider: 'openrouter-paid' };
    } catch (err) {
      console.warn(`[llm] OpenRouter paid failed (${err.message}) — trying OpenRouter free...`);
    }
  }

  // Tier 3: OpenRouter free (slower, may queue)
  if (process.env.OPENROUTER_FREE_KEY) {
    try {
      const text = await _callOpenRouter(prompt, process.env.OPENROUTER_FREE_KEY, 'meta-llama/llama-3.3-70b-instruct:free');
      return { text, provider: 'openrouter-free' };
    } catch (err) {
      console.warn(`[llm] OpenRouter free failed (${err.message})`);
    }
  }

  return null;
}

/**
 * Generate a soft-custom email template for a prospect group via LLM.
 * Returns null if no provider is available or all calls fail.
 *
 * @param {string}   groupKey  - Derived group key (titleLevel|industry|funding)
 * @param {Object[]} members   - Prospects in this group
 * @param {Object}   templates - Existing A-E templates for tone reference
 * @returns {Promise<{subject: string, body: string}|null>}
 */
/* istanbul ignore next */
async function generateGroupTemplate(groupKey, members, templates) {
  const sample = members[0];
  const [titleLevel, industry, funding] = groupKey.split('|');

  const toneExamples = ['A', 'B', 'C']
    .filter(k => templates[k])
    .map(k => `Template ${k}:\nSubject: ${templates[k].subject}\n${templates[k].body}`)
    .join('\n\n---\n\n');

  const prompt = `You write cold outreach emails for Oliver Chase at V.Two (vtwo.co).

V.Two builds custom digital products end-to-end — strategy, engineering, delivery. We work with founders, product leaders, and engineering leaders who need to ship serious software without fragmenting across vendors.

TARGET GROUP:
- Seniority: ${titleLevel} (e.g. "${sample.ti}")
- Industry: ${industry}
- Funding stage: ${funding}
- Company size: ${sample.sz || 'unknown'}
- Signal: ${sample.sig || 'not specified'}

Write one short, direct cold email (not salesy, no buzzwords) that would resonate with this person.

TONE EXAMPLES — match this voice (brief, confident, specific):
${toneExamples}

REQUIREMENTS:
- Subject line: short and specific — no "I hope this finds you well" energy
- Body: 3-4 sentences max. One clear ask at the end.
- Use [Name] for first name and [Company] for company name
- End with: [Oliver]\\nV.Two | vtwo.co

Respond in exactly this format (nothing else):
SUBJECT: <subject line>
BODY:
<email body>`;

  try {
    const result = await callLLM(prompt);
    if (!result) return null;

    const subjectMatch = result.text.match(/SUBJECT:\s*(.+)/);
    const bodyMatch = result.text.match(/BODY:\s*([\s\S]+)/);
    if (!subjectMatch || !bodyMatch) return null;

    return { subject: subjectMatch[1].trim(), body: bodyMatch[1].trim(), provider: result.provider };
  } catch (err) {
    console.warn(`[draft-emails] Template generation failed for group "${groupKey}": ${err.message}`);
    return null;
  }
}

/**
 * AI-powered version of generateDrafts.
 * Groups prospects by similarity, generates a soft-custom template per group
 * via Claude Haiku, then merges and writes draft-plan.json.
 *
 * Falls back to static template selection if ANTHROPIC_API_KEY is not set
 * or if an API call fails.
 *
 * @param {Object} config - Same config shape as generateDrafts
 * @returns {Promise<{ total, drafted, skipped_optout, skipped_no_email, errors }>}
 */
/* istanbul ignore next */
async function generateDraftsWithAI(config) {
  const { templatesPath, prospectsPath, optOutsPath, draftPlanPath } = config.paths;
  const provider = getLLMProvider();

  // Warn clearly if no AI provider is configured
  if (!provider) {
    console.warn('\n⚠️  No LLM API key found. Falling back to static templates.');
    console.warn('   Set one of: ANTHROPIC_API_KEY, OPENROUTER_API_KEY, or OPENROUTER_FREE_KEY\n');
  } else {
    const tierLabels = { anthropic: '1 (Anthropic)', 'openrouter-paid': '2 (OpenRouter paid)', 'openrouter-free': '3 (OpenRouter free)' };
    console.log(`[draft-emails] Using LLM provider: ${provider} (Tier ${tierLabels[provider] || provider})`);
  }

  const summary = { total: 0, drafted: 0, skipped_optout: 0, skipped_no_email: 0, errors: 0 };

  const templates = loadTemplates(templatesPath);
  const prospectsData = JSON.parse(fs.readFileSync(prospectsPath, 'utf8'));
  const allProspects = prospectsData.prospects || [];
  summary.total = allProspects.length;

  const optOutsData = JSON.parse(fs.readFileSync(optOutsPath, 'utf8'));
  const optOutEmails = new Set(
    (optOutsData.opt_outs || []).map(function(o) { return (o.em || '').toLowerCase(); })
  );

  // Filter eligible prospects
  const ELIGIBLE_STATUSES = new Set(['new', 'email_discovered']);
  const eligible = [];
  for (const p of allProspects) {
    if (!ELIGIBLE_STATUSES.has(p.st)) continue;
    if (!p.em) { summary.skipped_no_email++; continue; }
    if (optOutEmails.has(p.em.toLowerCase())) { summary.skipped_optout++; continue; }
    eligible.push(p);
  }

  // Group and generate templates
  const groups = groupProspects(eligible);
  const templateCache = new Map();  // key → { subject, body, provider }

  if (provider) {
    console.log(`[draft-emails] Generating AI templates for ${groups.size} prospect group(s)...`);
    for (const [key, members] of groups) {
      const generated = await generateGroupTemplate(key, members, templates);
      if (generated) {
        templateCache.set(key, generated);  // includes provider from actual LLM call
      } else {
        templateCache.set(key, { ...selectTemplate(templates, members[0]), provider: null });
      }
    }
  }

  // Build drafts
  const drafts = [];
  for (const prospect of eligible) {
    try {
      const key = getGroupKey(prospect);
      const cached = templateCache.get(key);
      const template = cached || selectTemplate(templates, prospect);
      const actualProvider = cached ? cached.provider : null;

      const merged = mergeDraft(template, prospect);

      drafts.push({
        id: prospect.id,
        em: prospect.em,
        fn: prospect.fn || (prospect.nm ? prospect.nm.split(' ')[0] : ''),
        nm: prospect.nm || '',
        co: prospect.co,
        ti: prospect.ti,
        ind: prospect.ind || '',
        sig: prospect.sig || '',
        grp: key,
        tpl: actualProvider ? `AI:${actualProvider}` : 'static',
        subject: merged.subject,
        body: merged.body,
        ts: new Date().toISOString(),
        status: 'draft'
      });

      summary.drafted++;
    } catch (err) {
      summary.errors++;
      console.error('Error drafting prospect ' + (prospect.id || '?') + ': ' + err.message);
    }
  }

  // Write output
  const draftDir = path.dirname(draftPlanPath);
  if (!fs.existsSync(draftDir)) fs.mkdirSync(draftDir, { recursive: true });
  fs.writeFileSync(draftPlanPath, JSON.stringify(drafts, null, 2));

  const usedProviders = [...new Set(drafts.map(d => d.tpl))].join(', ');
  console.log(`[draft-emails] ${summary.drafted} drafts written (${usedProviders})`);
  return summary;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  loadTemplates,
  selectTemplate,
  mergeDraft,
  generateDrafts,
  generateDraftsWithAI,
  getLLMProvider,
  // Exposed for testing
  classifyTitle,
  classifyFunding,
  getGroupKey,
  groupProspects
};
