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
  const fn = prospect.fn || '';
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
// EXPORTS
// ============================================================================

module.exports = { loadTemplates, selectTemplate, mergeDraft, generateDrafts };
