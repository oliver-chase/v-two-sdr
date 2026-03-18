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
const sheetsConfig = require('../config/config.sheets');

const SDR_ROOT = path.join(__dirname, '..');

// ============================================================================
// STEP RUNNERS
// ============================================================================

async function stepSync() {
  try {
    if (!process.env.GOOGLE_SHEET_ID) {
      console.log('[SDR] Step 1: Syncing sheets... skipped (no credentials)');
      return { skipped: true, reason: 'credentials_not_configured' };
    }

    const { GoogleSheetsConnector } = require('../sheets-connector');
    const config = {
      ...sheetsConfig,
      google_sheets: {
        ...sheetsConfig.google_sheets,
        // Allow environment overrides
        sheet_id: process.env.GOOGLE_SHEET_ID || sheetsConfig.google_sheets.sheet_id,
        sheet_name: process.env.GOOGLE_SHEET_NAME || sheetsConfig.google_sheets.sheet_name,
        api_key: process.env.GOOGLE_API_KEY || sheetsConfig.google_sheets.api_key
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

    console.log(`[SDR] Step 1: Syncing sheets... done (${result.prospects.length} prospects)`);
    return { synced: result.prospects.length, summary: result.summary };
  } catch (err) {
    console.error(`[SDR] Step 1: Sync failed: ${err.message}`);
    return { error: err.message };
  }
}

async function stepEnrich() {
  try {
    const { EnrichmentEngine } = require('./enrichment-engine');
    const { SheetsWriter } = require('./sheets-writer');
    const prospectsPath = path.join(SDR_ROOT, 'prospects.json');

    const { prospects } = JSON.parse(fs.readFileSync(prospectsPath, 'utf8'));
    const newProspects = prospects.filter(p => p.st === 'new' && !p.em);

    if (newProspects.length === 0) {
      console.log('[SDR] Step 2: Enriching... done (0 new)');
      return { enriched: 0 };
    }

    const engine = new EnrichmentEngine();
    let enriched = 0;
    let discovered = 0;
    let sheetsUpdated = 0;
    let sheetsUpdatesFailed = 0;

    let writer = null;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        writer = new SheetsWriter();
        await writer.authenticate();
      } catch (err) {
        writer = null;
      }
    }

    for (const prospect of newProspects) {
      const result = await engine.enrichProspect(prospect);
      if (result.email) {
        prospect.em = result.email;
        prospect.ec = result.confidence?.toString();
        prospect.ea = new Date().toISOString().split('T')[0];
        prospect.st = 'email_discovered';
        enriched++;
        if (result.confidence >= 0.8) discovered++;

        if (writer && prospect.em) {
          const enrichmentUpdates = {
            Email: prospect.em,
            Status: 'email_discovered',
            Notes: `Enriched: ${prospect.confidence >= 0.8 ? 'High confidence' : 'Moderate confidence'}`
          };

          if (prospect.tz) enrichmentUpdates.Timezone = prospect.tz;
          if (prospect.companyContext?.location) enrichmentUpdates.Location = prospect.companyContext.location;
          if (prospect.signals?.webSearchFound) enrichmentUpdates.Signal = 'Web enriched';

          const updateResult = await writer.updateEnrichedProspect(prospect.em, enrichmentUpdates);
          if (updateResult.updated) {
            sheetsUpdated++;
          } else {
            sheetsUpdatesFailed++;
          }
        }
      }
    }

    const updated = JSON.parse(fs.readFileSync(prospectsPath, 'utf8'));
    const byId = Object.fromEntries(newProspects.map(p => [p.id, p]));
    updated.prospects = updated.prospects.map(p => byId[p.id] || p);
    updated.metadata.lu = new Date().toISOString();
    fs.writeFileSync(prospectsPath, JSON.stringify(updated, null, 2));

    console.log(`[SDR] Step 2: Enriching... done (${enriched} new)`);
    return { enriched, discovered, sheetsUpdated, sheetsUpdatesFailed };
  } catch (err) {
    console.error(`[SDR] Step 2: Enrichment failed: ${err.message}`);
    return { error: err.message };
  }
}

async function stepDraft() {
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

    console.log(`[SDR] Step 3: Drafting... done (${result.drafted} drafts)`);
    return result;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('[SDR] Step 3: Drafting... skipped (not yet built)');
      return { skipped: true };
    }
    console.error(`[SDR] Step 3: Draft generation failed: ${err.message}`);
    return { error: err.message };
  }
}

async function stepInbox() {
  try {
    if (!process.env.OUTLOOK_USER || !process.env.OUTLOOK_PASSWORD) {
      console.log('[SDR] Step 4: Inbox... skipped (no credentials)');
      return { skipped: true, reason: 'credentials_not_configured' };
    }

    const { checkInbox, buildConfig } = require('./inbox-monitor');
    const config = buildConfig();
    const result = await checkInbox({
      ...config,
      paths: {
        sendsLog: 'outreach/sends.json',
        repliesLog: 'outreach/replies.json'
      }
    });

    console.log(`[SDR] Step 4: Inbox... done (${result.newReplies} replies)`);
    return result;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('[SDR] Step 4: Inbox... skipped (not yet built)');
      return { skipped: true };
    }
    console.error(`[SDR] Step 4: Inbox check failed: ${err.message}`);
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

  const results = {};

  if (steps.includes('sync')) results.sync = await stepSync();
  if (steps.includes('enrich')) results.enrich = await stepEnrich();
  if (steps.includes('draft')) results.draft = await stepDraft();
  if (steps.includes('inbox')) results.inbox = await stepInbox();
  if (steps.includes('report')) results.report = stepReport(results);

  console.log('[SDR] COMPLETE');
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
