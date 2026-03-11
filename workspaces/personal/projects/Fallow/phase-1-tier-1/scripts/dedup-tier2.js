/**
 * Phase 2-C: Enhanced Deduplication
 * Merges Tier 1 (user-submitted URLs) + Tier 2 (free APIs)
 * Prevents duplicates across sources while preserving provenance
 */

/**
 * Levenshtein distance for fuzzy string matching
 * Returns similarity score 0-1 (1 = identical)
 */
export function levenshteinDistance(a, b) {
  const aLen = a.length;
  const bLen = b.length;
  const matrix = Array(bLen + 1).fill(null).map(() => Array(aLen + 1).fill(0));

  for (let i = 0; i <= aLen; i++) matrix[0][i] = i;
  for (let j = 0; j <= bLen; j++) matrix[j][0] = j;

  for (let j = 1; j <= bLen; j++) {
    for (let i = 1; i <= aLen; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[bLen][aLen];
  const maxLen = Math.max(aLen, bLen);
  return 1 - (distance / maxLen);
}

/**
 * Extract event key for comparison
 * Normalizes name, date, and optionally venue
 */
function getEventKey(event) {
  const name = (event.name || '').toLowerCase().trim();
  const date = event.date || '';
  const venue = (event.venue || '').toLowerCase().trim();
  return { name, date, venue };
}

/**
 * Calculate match confidence between two events
 * Scores: 0-100 (100 = confirmed match)
 */
export function calculateMatchConfidence(event1, event2) {
  const key1 = getEventKey(event1);
  const key2 = getEventKey(event2);

  let confidence = 0;

  // Name similarity (0-40 points)
  const nameSim = levenshteinDistance(key1.name, key2.name);
  if (nameSim > 0.85) confidence += 40;
  else if (nameSim > 0.70) confidence += 20;
  else if (nameSim > 0.50) confidence += 10;

  // Date match (0-35 points)
  if (key1.date === key2.date) {
    confidence += 35;
  } else if (key1.date && key2.date) {
    // Check if dates are within 3 days (same event might have time variations)
    const date1 = new Date(key1.date);
    const date2 = new Date(key2.date);
    const daysDiff = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 3) confidence += 15;
    else if (daysDiff <= 7) confidence += 5;
  }

  // Venue similarity (0-25 points)
  if (key1.venue && key2.venue) {
    const venueSim = levenshteinDistance(key1.venue, key2.venue);
    if (venueSim > 0.80) confidence += 25;
    else if (venueSim > 0.60) confidence += 10;
  }

  return Math.round(confidence);
}

/**
 * Deduplication strategy:
 * - Confidence >= 85: Auto-merge (same event, different source)
 * - Confidence 60-84: Flag for review (probable duplicate)
 * - Confidence < 60: Keep separate (different events)
 */
export function classifyMatch(confidence) {
  if (confidence >= 85) return 'auto_merge';
  if (confidence >= 60) return 'review';
  return 'keep_separate';
}

/**
 * Merge two events, keeping provenance from both sources
 */
export function mergeEvents(primary, secondary) {
  const merged = { ...primary };

  // Add secondary event to sources
  if (!merged.sources) merged.sources = [primary.source || 'user'];
  if (!merged.sources.includes(secondary.source)) {
    merged.sources.push(secondary.source);
  }

  // Fill missing fields from secondary
  if (!merged.venue && secondary.venue) merged.venue = secondary.venue;
  if (!merged.time && secondary.time) merged.time = secondary.time;
  if (!merged.description && secondary.description) merged.description = secondary.description;
  if (!merged.url && secondary.url) merged.url = secondary.url;

  // Keep array of all matching records
  if (!merged.matched_records) merged.matched_records = [];
  merged.matched_records.push({
    id: secondary.id,
    source: secondary.source,
    confidence: calculateMatchConfidence(merged, secondary),
  });

  // Update timestamp
  merged.last_merged = new Date().toISOString();

  return merged;
}

/**
 * Deduplicate events within a single tier
 */
export function deduplicateWithinTier(events) {
  const deduplicated = [];
  const seen = new Set();

  for (const event of events) {
    const key = `${event.date}|${event.name.toLowerCase()}`;
    if (!seen.has(key)) {
      deduplicated.push(event);
      seen.add(key);
    }
  }

  return deduplicated;
}

/**
 * Main deduplication: Merge Tier 1 + Tier 2 events
 * Returns: { canonical: merged events, duplicates: flagged for review, metrics: stats }
 */
export function deduplicateTiers(tier1Events, tier2Events) {
  // Step 1: Deduplicate within each tier
  const tier1Dedup = deduplicateWithinTier(tier1Events);
  const tier2Dedup = deduplicateWithinTier(tier2Events);

  // Step 2: Compare tier1 vs tier2
  const merged = [];
  const tier2Used = new Set();
  const toReview = [];

  for (const t1Event of tier1Dedup) {
    let bestMatch = null;
    let bestConfidence = 0;

    for (let i = 0; i < tier2Dedup.length; i++) {
      if (tier2Used.has(i)) continue;

      const confidence = calculateMatchConfidence(t1Event, tier2Dedup[i]);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = i;
      }
    }

    if (bestMatch !== null) {
      const classification = classifyMatch(bestConfidence);
      const t2Event = tier2Dedup[bestMatch];

      if (classification === 'auto_merge') {
        // Merge automatically
        merged.push(mergeEvents(t1Event, t2Event));
        tier2Used.add(bestMatch);
      } else if (classification === 'review') {
        // Flag for review
        toReview.push({
          tier1: t1Event,
          tier2: t2Event,
          confidence: bestConfidence,
          action_required: 'Review and confirm merge',
        });
        tier2Used.add(bestMatch);
      } else {
        // Keep tier1 event as-is
        merged.push(t1Event);
      }
    } else {
      // No match found, keep tier1 event
      merged.push(t1Event);
    }
  }

  // Step 3: Add unmatched tier2 events
  for (let i = 0; i < tier2Dedup.length; i++) {
    if (!tier2Used.has(i)) {
      merged.push({
        ...tier2Dedup[i],
        source: tier2Dedup[i].source,
        sources: [tier2Dedup[i].source],
      });
    }
  }

  // Step 4: Sort by date
  merged.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    canonical: merged,
    to_review: toReview,
    metrics: {
      tier1_input: tier1Events.length,
      tier2_input: tier2Events.length,
      tier1_dedup: tier1Dedup.length,
      tier2_dedup: tier2Dedup.length,
      auto_merged: merged.filter(e => (e.sources || []).length > 1).length,
      flagged_for_review: toReview.length,
      final_count: merged.length,
      dedup_ratio: ((tier1Events.length + tier2Events.length - merged.length) / (tier1Events.length + tier2Events.length) * 100).toFixed(1),
    },
  };
}

/**
 * Batch deduplication: Process multiple cities
 */
export function batchDeduplicateCities(cityData) {
  const results = {};

  for (const [city, data] of Object.entries(cityData)) {
    results[city] = deduplicateTiers(data.tier1 || [], data.tier2 || []);
  }

  return results;
}

export default {
  levenshteinDistance,
  calculateMatchConfidence,
  classifyMatch,
  mergeEvents,
  deduplicateWithinTier,
  deduplicateTiers,
  batchDeduplicateCities,
};
