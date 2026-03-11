/**
 * Phase 2-D: Integrated Scheduler
 * Combines Tier 1 (user monitoring) + Tier 2 (free APIs)
 * Runs weekly: parse monitored URLs, fetch API data, dedup, update canonical
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseVenueUrl } from './parser-real.js';
import { fetchAllTier2Events } from './api-integrations.js';
import { deduplicateTiers } from './dedup-tier2.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const LOGS_DIR = path.join(__dirname, '../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Load canonical events
 */
function loadCanonical() {
  const filePath = path.join(DATA_DIR, 'canonical_events.json');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
  return { events: [], last_updated: null };
}

/**
 * Save canonical events
 */
function saveCanonical(data) {
  const filePath = path.join(DATA_DIR, 'canonical_events.json');
  data.last_updated = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Load monitoring URLs (venues to watch)
 */
function loadMonitoringUrls() {
  const filePath = path.join(DATA_DIR, 'monitoring_urls.json');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
  return [];
}

/**
 * Parse all monitored URLs (Tier 1)
 */
async function parseTier1() {
  const monitoringUrls = loadMonitoringUrls();
  const tier1Events = [];

  for (const monitor of monitoringUrls) {
    try {
      console.log(`  📡 Parsing: ${monitor.url}`);
      const parseResult = await parseVenueUrl(monitor.url);

      if (parseResult.success && parseResult.events.length > 0) {
        for (const event of parseResult.events) {
          tier1Events.push({
            ...event,
            source: 'user_monitored',
            monitoring_url: monitor.url,
            venue: event.venue || monitor.name,
            city: monitor.city,
            state: monitor.state,
          });
        }
        console.log(`    ✓ Found ${parseResult.events.length} events`);
      } else {
        console.log(`    ✗ Parse failed: ${parseResult.errors.join(', ')}`);
      }
    } catch (err) {
      console.log(`    ✗ Error: ${err.message}`);
    }
  }

  return tier1Events;
}

/**
 * Fetch all Tier 2 events (free APIs)
 */
async function parseTier2(cities = ['Denver', 'Boulder', 'Arvada'], apiKeys = {}) {
  const tier2Events = [];

  for (const city of cities) {
    try {
      console.log(`  🔄 Fetching Tier 2 data for ${city}`);
      const tier2Result = await fetchAllTier2Events(city, 'CO', apiKeys);

      const allEvents = [
        ...tier2Result.meetup.events,
        ...tier2Result.eventbrite.events,
        ...tier2Result.city_calendar.events,
      ];

      tier2Events.push(...allEvents);
      console.log(`    ✓ Found ${allEvents.length} total events (Meetup: ${tier2Result.meetup.events.length}, Eventbrite: ${tier2Result.eventbrite.events.length}, City: ${tier2Result.city_calendar.events.length})`);

      if (tier2Result.meetup.error) console.log(`      ⚠️  Meetup: ${tier2Result.meetup.error}`);
      if (tier2Result.eventbrite.error) console.log(`      ⚠️  Eventbrite: ${tier2Result.eventbrite.error}`);
      if (tier2Result.city_calendar.error) console.log(`      ⚠️  City calendar: ${tier2Result.city_calendar.error}`);
    } catch (err) {
      console.log(`    ✗ Error: ${err.message}`);
    }
  }

  return tier2Events;
}

/**
 * Filter out past events (optional)
 */
function filterFutureEvents(events, daysAhead = 365) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= now && eventDate <= futureDate;
  });
}

/**
 * Main sweep: Run full Tier 1 + 2 pipeline
 */
export async function runSweep(options = {}) {
  const {
    cities = ['Denver', 'Boulder', 'Arvada'],
    apiKeys = {},
    daysAhead = 365,
    filterPast = true,
  } = options;

  const sweep = {
    id: `sweep-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: 'running',
    phases: {
      tier1: { status: 'pending', events: 0 },
      tier2: { status: 'pending', events: 0 },
      dedup: { status: 'pending', metrics: {} },
      save: { status: 'pending' },
    },
  };

  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔄 FALLOW Phase 2 Sweep: Full Pipeline');
    console.log('═══════════════════════════════════════════════════════\n');

    // Phase 1: Parse user-monitored URLs
    console.log('📋 Phase 1: Parse User-Monitored URLs (Tier 1)');
    sweep.phases.tier1.status = 'running';
    const tier1Events = await parseTier1();
    sweep.phases.tier1.status = 'complete';
    sweep.phases.tier1.events = tier1Events.length;
    console.log(`  Total: ${tier1Events.length} events\n`);

    // Phase 2: Fetch Tier 2 APIs
    console.log('🔍 Phase 2: Fetch Free APIs (Tier 2)');
    sweep.phases.tier2.status = 'running';
    const tier2Events = await parseTier2(cities, apiKeys);
    sweep.phases.tier2.status = 'complete';
    sweep.phases.tier2.events = tier2Events.length;
    console.log(`  Total: ${tier2Events.length} events\n`);

    // Phase 3: Deduplication
    console.log('🔗 Phase 3: Deduplication (Merge Tier 1 + 2)');
    sweep.phases.dedup.status = 'running';
    const tier1Filtered = filterPast ? filterFutureEvents(tier1Events, daysAhead) : tier1Events;
    const tier2Filtered = filterPast ? filterFutureEvents(tier2Events, daysAhead) : tier2Events;

    const dedupResult = deduplicateTiers(tier1Filtered, tier2Filtered);
    sweep.phases.dedup.status = 'complete';
    sweep.phases.dedup.metrics = dedupResult.metrics;

    console.log(`  Input: ${dedupResult.metrics.tier1_input} Tier 1 + ${dedupResult.metrics.tier2_input} Tier 2`);
    console.log(`  Output: ${dedupResult.metrics.final_count} canonical events`);
    console.log(`  Auto-merged: ${dedupResult.metrics.auto_merged}`);
    console.log(`  Flagged for review: ${dedupResult.metrics.flagged_for_review}`);
    console.log(`  Dedup ratio: ${dedupResult.metrics.dedup_ratio}%\n`);

    // Phase 4: Save canonical + review list
    console.log('💾 Phase 4: Save Results');
    sweep.phases.save.status = 'running';

    // Save canonical
    const canonical = {
      events: dedupResult.canonical,
      sweep_id: sweep.id,
      last_updated: new Date().toISOString(),
    };
    saveCanonical(canonical);
    console.log(`  ✓ Saved ${canonical.events.length} canonical events`);

    // Save review list
    if (dedupResult.to_review.length > 0) {
      const reviewPath = path.join(LOGS_DIR, `review_${sweep.id}.json`);
      fs.writeFileSync(reviewPath, JSON.stringify(dedupResult.to_review, null, 2));
      console.log(`  ✓ Saved ${dedupResult.to_review.length} items for manual review`);
    }

    // Save sweep summary
    sweep.status = 'complete';
    sweep.phases.save.status = 'complete';
    const sweepPath = path.join(LOGS_DIR, `sweep_${sweep.id}.json`);
    fs.writeFileSync(sweepPath, JSON.stringify(sweep, null, 2));

    console.log(`  ✓ Saved sweep summary\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Sweep Complete');
    console.log('═══════════════════════════════════════════════════════\n');

    return sweep;
  } catch (err) {
    sweep.status = 'failed';
    sweep.error = err.message;
    console.error(`\n✗ Sweep failed: ${err.message}`);
    throw err;
  }
}

/**
 * Schedule sweep to run weekly
 */
export function scheduleWeekly(options = {}) {
  // Run immediately on startup
  runSweep(options).catch(err => {
    console.error('Sweep error:', err);
  });

  // Schedule weekly (every 7 days)
  const interval = setInterval(() => {
    console.log('\n🕐 Weekly sweep triggered');
    runSweep(options).catch(err => {
      console.error('Sweep error:', err);
    });
  }, 7 * 24 * 60 * 60 * 1000); // 7 days in ms

  console.log('📅 Weekly scheduler started (runs every 7 days)');
  return interval;
}

export default { runSweep, scheduleWeekly };
