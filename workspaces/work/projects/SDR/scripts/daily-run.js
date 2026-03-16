/**
 * Daily Run — SDR Orchestration Script
 *
 * Master script that runs the full SDR daily workflow:
 *   1. Sync prospects from Google Sheets (if configured)
 *   2. Run enrichment on new prospects (email discovery)
 *   3. Generate email drafts for eligible prospects
 *   4. Check inbox for replies, classify and update statuses
 *   5. Print daily summary report
 *
 * Designed to be called by OpenClaw or run manually:
 *   node scripts/daily-run.js [--step=all|sync|enrich|draft|inbox|report]
 *
 * OpenClaw triggers this at 8am Mon-Fri, reviews output, then
 * calls approve-drafts.js before triggering execute-sends.js.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

const SDR_ROOT = path.join(__dirname, '..');

// ============================================================================
// STEP RUNNERS
// ============================================================================

async function stepSync() {
  console.log('\n[1/5] Syncing prospects from Google Sheets...');
  try {
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CREDENTIALS_PATH) {
      console.log('  ⚠ GOOGLE_SHEET_ID or GOOGLE_CREDENTIALS_PATH not set — skipping sync');
      return { skipped: true, reason: 'credentials_not_configured' };
    }

    const { GoogleSheetsConnector } = require('../sheets-connector');
    const config = {
      google_sheets: {
        sheet_id: process.env.GOOGLE_SHEET_ID,
        sheet_name: process.env.GOOGLE_SHEET_NAME || 'Prospects',
        credentials_path: process.env.GOOGLE_CREDENTIALS_PATH
      }
    };

    const connector = new GoogleSheetsConnector(config);
    await connector.authenticate();
    const result = await connector.fullSync();

    const prospectsPath = path.join(SDR_ROOT, 'prospects.json');
    const current = JSON.parse(fs.readFileSync(prospectsPath, 'utf8'));
    const updated = {
      prospects: result.prospects,
      metadata: { ...result.metadata, lu: new Date().toISOString() }
    };
    fs.writeFileSync(prospectsPath, JSON.stringify(updated, null, 2));

    console.log(`  ✓ Synced ${result.prospects.length} prospects`);
    return { synced: result.prospects.length, summary: result.summary };
  } catch (err) {
    console.error(`  ✗ Sync failed: ${err.message}`);
    return { error: err.message };
  }
}

async function stepEnrich() {
  console.log('\n[2/5] Enriching new prospects...');
  try {
    const { EnrichmentEngine } = require('./enrichment-engine');
    const prospectsPath = path.join(SDR_ROOT, 'prospects.json');

    const { prospects } = JSON.parse(fs.readFileSync(prospectsPath, 'utf8'));
    const newProspects = prospects.filter(p => p.st === 'new' && !p.em);

    if (newProspects.length === 0) {
      console.log('  ✓ No new prospects to enrich');
      return { enriched: 0 };
    }

    const engine = new EnrichmentEngine();
    let enriched = 0;
    let discovered = 0;

    for (const prospect of newProspects) {
      const result = await engine.enrichProspect(prospect);
      if (result.email) {
        prospect.em = result.email;
        prospect.ec = result.confidence?.toString();
        prospect.ea = new Date().toISOString().split('T')[0];
        prospect.st = 'email_discovered';
        enriched++;
        if (result.confidence >= 0.8) discovered++;
      }
    }

    // Write back
    const updated = JSON.parse(fs.readFileSync(prospectsPath, 'utf8'));
    const byId = Object.fromEntries(newProspects.map(p => [p.id, p]));
    updated.prospects = updated.prospects.map(p => byId[p.id] || p);
    updated.metadata.lu = new Date().toISOString();
    fs.writeFileSync(prospectsPath, JSON.stringify(updated, null, 2));

    console.log(`  ✓ Enriched ${enriched} prospects, ${discovered} high-confidence emails`);
    return { enriched, discovered };
  } catch (err) {
    console.error(`  ✗ Enrichment failed: ${err.message}`);
    return { error: err.message };
  }
}

async function stepDraft() {
  console.log('\n[3/5] Generating email drafts...');
  try {
    const { generateDraftsWithAI } = require('./draft-emails');
    const result = await generateDraftsWithAI({
      paths: {
        prospectsPath: path.join(SDR_ROOT, 'prospects.json'),
        optOutsPath: path.join(SDR_ROOT, 'outreach/opt-outs.json'),
        templatesPath: path.join(SDR_ROOT, 'outreach/templates.md'),
        draftPlanPath: path.join(SDR_ROOT, 'outreach/draft-plan.json')
      }
    });

    console.log(`  ✓ ${result.drafted} drafts generated (${result.skipped_optout} opt-outs skipped, ${result.skipped_no_email} no email)`);
    return result;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('  ⚠ draft-emails.js not yet built — skipping');
      return { skipped: true };
    }
    console.error(`  ✗ Draft generation failed: ${err.message}`);
    return { error: err.message };
  }
}

async function stepInbox() {
  console.log('\n[4/5] Checking inbox for replies...');
  try {
    if (!process.env.OUTLOOK_USER || !process.env.OUTLOOK_PASSWORD) {
      console.log('  ⚠ Outlook credentials not configured — skipping inbox check');
      return { skipped: true, reason: 'credentials_not_configured' };
    }

    const { checkInbox, buildConfig } = require('./inbox-monitor');
    const config = buildConfig();
    const result = await checkInbox({
      ...config,
      sendsPath: path.join(SDR_ROOT, 'outreach/sends.json'),
      repliesPath: path.join(SDR_ROOT, 'outreach/replies.json'),
      prospectsPath: path.join(SDR_ROOT, 'prospects.json')
    });

    console.log(`  ✓ Checked inbox: ${result.newReplies} new replies (${result.classified?.filter(r => r.classification === 'positive').length || 0} positive)`);
    return result;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('  ⚠ inbox-monitor.js not yet built — skipping');
      return { skipped: true };
    }
    console.error(`  ✗ Inbox check failed: ${err.message}`);
    return { error: err.message };
  }
}

function stepReport(results) {
  console.log('\n[5/5] Daily Summary Report');
  console.log('=' .repeat(50));
  console.log(`Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`);
  console.log('');

  const prospectsPath = path.join(SDR_ROOT, 'prospects.json');
  const sendsPath = path.join(SDR_ROOT, 'outreach/sends.json');

  try {
    const { prospects } = JSON.parse(fs.readFileSync(prospectsPath, 'utf8'));
    const byStatus = {};
    for (const p of prospects) {
      byStatus[p.st || 'unknown'] = (byStatus[p.st || 'unknown'] || 0) + 1;
    }

    console.log('Pipeline:');
    const stateLabels = {
      new: 'New', email_discovered: 'Email Found', draft_generated: 'Draft Ready',
      awaiting_approval: 'Pending Approval', email_sent: 'Sent', replied: 'Replied',
      closed_positive: 'Won ✓', closed_negative: 'Closed'
    };
    for (const [st, label] of Object.entries(stateLabels)) {
      const count = byStatus[st] || 0;
      if (count > 0) console.log(`  ${label.padEnd(20)} ${count}`);
    }
  } catch {
    console.log('  (no prospect data yet)');
  }

  try {
    const { sends } = JSON.parse(fs.readFileSync(sendsPath, 'utf8'));
    const today = new Date().toISOString().split('T')[0];
    const todaySends = sends.filter(s => s.sd?.startsWith(today));
    console.log(`\nToday's sends: ${todaySends.length}`);
  } catch {
    // no sends yet
  }

  if (results.draft?.drafted > 0) {
    console.log(`\n⚡ Action needed: ${results.draft.drafted} drafts ready for approval`);
    console.log('   Run: node scripts/approve-drafts.js');
  }

  console.log('\n' + '='.repeat(50));

  const reportPath = path.join(SDR_ROOT, 'outreach/weekly-reports.json');
  try {
    const reports = fs.existsSync(reportPath)
      ? JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      : [];
    reports.push({ dt: new Date().toISOString(), results });
    fs.writeFileSync(reportPath, JSON.stringify(reports.slice(-30), null, 2)); // keep 30 days
  } catch { /* non-fatal */ }

  return { reported: true };
}

// ============================================================================
// MAIN
// ============================================================================

async function run() {
  const stepArg = process.argv.find(a => a.startsWith('--step='))?.split('=')[1] || 'all';
  const steps = stepArg === 'all'
    ? ['sync', 'enrich', 'draft', 'inbox', 'report']
    : [stepArg];

  console.log(`SDR Daily Run — ${new Date().toISOString()}`);
  console.log(`Steps: ${steps.join(' → ')}`);

  const results = {};

  if (steps.includes('sync')) results.sync = await stepSync();
  if (steps.includes('enrich')) results.enrich = await stepEnrich();
  if (steps.includes('draft')) results.draft = await stepDraft();
  if (steps.includes('inbox')) results.inbox = await stepInbox();
  if (steps.includes('report')) results.report = stepReport(results);

  return results;
}

// Run if called directly
if (require.main === module) {
  run().catch(err => {
    console.error('Daily run failed:', err.message);
    process.exit(1);
  });
}

module.exports = { run, stepSync, stepEnrich, stepDraft, stepInbox, stepReport };
