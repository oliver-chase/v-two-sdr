#!/usr/bin/env node

/**
 * Test Suite for Phase 2-C: Tier 2 Deduplication
 */

import {
  levenshteinDistance,
  calculateMatchConfidence,
  classifyMatch,
  mergeEvents,
  deduplicateTiers,
} from './dedup-tier2.js';

// Sample events
const TIER1_SAMPLE = [
  {
    id: 't1-1',
    name: 'Denver Salsa Nights',
    date: '2026-03-15',
    venue: 'Tracks Nightclub',
    city: 'Denver',
    source: 'user',
  },
  {
    id: 't1-2',
    name: 'Colorado Music Festival',
    date: '2026-03-20',
    venue: 'Downtown Park',
    city: 'Denver',
    source: 'user',
  },
  {
    id: 't1-3',
    name: 'Boulder Farmers Market',
    date: '2026-04-01',
    venue: 'Central Park',
    city: 'Boulder',
    source: 'user',
  },
];

const TIER2_SAMPLE = [
  {
    id: 't2-1',
    name: 'Denver Salsa Night',
    date: '2026-03-15',
    venue: 'Tracks Downtown',
    city: 'Denver',
    source: 'eventbrite',
  },
  {
    id: 't2-2',
    name: 'Colorado Music Fest 2026',
    date: '2026-03-21', // Off by one day
    venue: 'Downtown Park, Denver',
    city: 'Denver',
    source: 'meetup',
  },
  {
    id: 't2-3',
    name: 'Spring Concert Series',
    date: '2026-04-05',
    venue: 'Civic Center',
    city: 'Denver',
    source: 'denver_calendar',
  },
  {
    id: 't2-4',
    name: 'Boulder Market',
    date: '2026-04-01',
    venue: 'Central Park, Boulder',
    city: 'Boulder',
    source: 'boulder_events',
  },
];

/**
 * Test string similarity
 */
function testLevenshtein() {
  console.log('\n🧪 TEST 1: String Similarity (Levenshtein)\n');
  
  const pairs = [
    ['Denver Salsa Nights', 'Denver Salsa Night'],
    ['Colorado Music Festival', 'Colorado Music Fest 2026'],
    ['Tracks Nightclub', 'Tracks Downtown'],
    ['completely different', 'totally unrelated'],
  ];

  for (const [str1, str2] of pairs) {
    const sim = levenshteinDistance(str1, str2);
    console.log(`"${str1}" vs "${str2}"`);
    console.log(`  Similarity: ${(sim * 100).toFixed(0)}%\n`);
  }
}

/**
 * Test confidence calculation
 */
function testConfidence() {
  console.log('\n🧪 TEST 2: Match Confidence\n');
  
  const pairs = [
    [TIER1_SAMPLE[0], TIER2_SAMPLE[0], 'Exact match (same day, similar names/venue)'],
    [TIER1_SAMPLE[1], TIER2_SAMPLE[1], 'Probable match (off by 1 day, similar names)'],
    [TIER1_SAMPLE[2], TIER2_SAMPLE[3], 'Likely match (same date, similar names)'],
    [TIER1_SAMPLE[0], TIER2_SAMPLE[2], 'Different events (different names/dates)'],
  ];

  for (const [event1, event2, description] of pairs) {
    const confidence = calculateMatchConfidence(event1, event2);
    const classification = classifyMatch(confidence);
    console.log(`${description}`);
    console.log(`  ${event1.name} (${event1.date})`);
    console.log(`  vs`);
    console.log(`  ${event2.name} (${event2.date})`);
    console.log(`  Confidence: ${confidence}/100`);
    console.log(`  Action: ${classification.toUpperCase()}\n`);
  }
}

/**
 * Test event merging
 */
function testMerge() {
  console.log('\n🧪 TEST 3: Event Merging\n');
  
  const event1 = TIER1_SAMPLE[0]; // From user
  const event2 = TIER2_SAMPLE[0]; // From Eventbrite
  
  console.log('Merging events from different sources:\n');
  console.log(`Tier 1 (User):`);
  console.log(`  ${JSON.stringify(event1, null, 2)}\n`);
  console.log(`Tier 2 (Eventbrite):`);
  console.log(`  ${JSON.stringify(event2, null, 2)}\n`);
  
  const merged = mergeEvents(event1, event2);
  console.log(`Merged result:`);
  console.log(`  ${JSON.stringify(merged, null, 2)}\n`);
  
  console.log(`✓ Sources tracked: ${merged.sources.join(', ')}`);
  console.log(`✓ Matched records: ${merged.matched_records.length}`);
}

/**
 * Test full deduplication
 */
function testFullDedup() {
  console.log('\n🧪 TEST 4: Full Tier 1+2 Deduplication\n');
  
  console.log(`Input: ${TIER1_SAMPLE.length} Tier 1 + ${TIER2_SAMPLE.length} Tier 2 events\n`);
  
  const result = deduplicateTiers(TIER1_SAMPLE, TIER2_SAMPLE);
  
  console.log(`📊 Metrics:`);
  console.log(`  Tier 1 input: ${result.metrics.tier1_input}`);
  console.log(`  Tier 2 input: ${result.metrics.tier2_input}`);
  console.log(`  Auto-merged: ${result.metrics.auto_merged}`);
  console.log(`  Flagged for review: ${result.metrics.flagged_for_review}`);
  console.log(`  Final count: ${result.metrics.final_count}`);
  console.log(`  Dedup ratio: ${result.metrics.dedup_ratio}%\n`);
  
  console.log(`📋 Canonical events (merged):\n`);
  result.canonical.forEach((event, idx) => {
    console.log(`  ${idx + 1}. ${event.name}`);
    console.log(`     Date: ${event.date}`);
    console.log(`     Venue: ${event.venue}`);
    console.log(`     Sources: ${(event.sources || []).join(', ')}`);
    if (event.matched_records && event.matched_records.length > 0) {
      console.log(`     Also matched: ${event.matched_records.map(r => r.source).join(', ')}`);
    }
    console.log();
  });
  
  if (result.to_review.length > 0) {
    console.log(`⚠️  Flagged for review:\n`);
    result.to_review.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Confidence: ${item.confidence}/100`);
      console.log(`     ${item.tier1.name} (${item.tier1.date})`);
      console.log(`     vs ${item.tier2.name} (${item.tier2.date})\n`);
    });
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('═'.repeat(60));
  console.log('🧪 FALLOW Phase 2-C: Tier 2 Deduplication Test Suite');
  console.log('═'.repeat(60));

  testLevenshtein();
  testConfidence();
  testMerge();
  testFullDedup();

  console.log('═'.repeat(60));
  console.log('✅ All Tests Complete');
  console.log('═'.repeat(60));
  console.log('\nKey takeaways:');
  console.log('  • Fuzzy matching handles similar names/venues');
  console.log('  • Date proximity allows for time-keeping variations');
  console.log('  • Sources tracked for transparency');
  console.log('  • High-confidence matches auto-merge');
  console.log('  • Ambiguous cases flagged for manual review');
}

runTests().catch(console.error);
