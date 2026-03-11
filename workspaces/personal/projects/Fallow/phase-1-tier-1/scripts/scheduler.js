#!/usr/bin/env node

/**
 * FALLOW Scheduler
 * Monitors all user-submitted venue URLs weekly
 * Can be run manually or via cron
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCanonical } from './dedup.js';
import { parseVenueUrl, logParseAttempt } from './parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

const FREQUENCY_RULES = {
  'one-off': { checkWeekly: false, completeWhen: 'dates_live' },
  'recurring': { checkWeekly: true, completeWhen: 'pattern_matches' },
  'weekly': { checkWeekly: true, completeWhen: '85_percent_complete' },
  'monthly': { checkWeekly: true, completeWhen: '85_percent_complete' }
};

/**
 * Run the monitoring job
 * Check all monitored URLs that are due
 */
export async function runMonitoringJob() {
  console.log(`\n[SCHEDULER] Starting monitoring job at ${new Date().toISOString()}`);

  const canonical = loadCanonical();
  const now = new Date();
  let checked = 0;
  let updated = 0;
  let errors = 0;

  for (const event of canonical.canonicalEvents) {
    const monitoringUrls = event.monitoring_urls || [];

    for (const monitor of monitoringUrls) {
      const nextCheck = new Date(monitor.next_check);

      // Only check if due
      if (nextCheck <= now && !event.monitoring_status?.complete) {
        console.log(`[CHECK] ${event.name} (${monitor.url})`);

        try {
          const result = await parseVenueUrl(monitor.url);
          logParseAttempt(monitor.url, result);

          if (result.success) {
            // Update check metadata
            monitor.last_checked = new Date().toISOString();
            monitor.check_count = (monitor.check_count || 0) + 1;
            monitor.next_check = result.nextCheck;

            console.log(`  ✓ Found ${result.events?.length || 0} events`);
            updated++;
          } else {
            console.log(`  ✗ Parse failed: ${result.errors?.[0]}`);
            errors++;
          }

          checked++;
        } catch (err) {
          console.error(`  ✗ Error: ${err.message}`);
          errors++;
        }
      }
    }
  }

  // Save updated canonical events
  try {
    const filePath = path.join(DATA_DIR, 'canonical_events.json');
    fs.writeFileSync(filePath, JSON.stringify(canonical, null, 2));
  } catch (err) {
    console.error('Error saving canonical events:', err.message);
  }

  console.log(`\n[SUMMARY]`);
  console.log(`  Checked: ${checked}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Completed at ${new Date().toISOString()}\n`);

  return { checked, updated, errors };
}

/**
 * Mark event as complete (stop monitoring)
 */
export function markEventComplete(eventId, reason = 'data_complete') {
  const canonical = loadCanonical();
  const event = canonical.canonicalEvents.find(e => e.id === eventId);

  if (event) {
    event.monitoring_status = 'complete';
    event.completion_confidence = 1.0;
    event.completion_reason = reason;
    event.completion_date = new Date().toISOString();

    const filePath = path.join(DATA_DIR, 'canonical_events.json');
    fs.writeFileSync(filePath, JSON.stringify(canonical, null, 2));

    console.log(`[COMPLETE] Marked ${event.name} as complete (${reason})`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMonitoringJob().catch(err => {
    console.error('Scheduler error:', err);
    process.exit(1);
  });
}

export default { runMonitoringJob, markEventComplete };
