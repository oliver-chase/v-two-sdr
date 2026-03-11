/**
 * Auto-dedup logic for venue URLs
 * Checks if a URL is already being monitored
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

export function loadCanonical() {
  try {
    const filePath = path.join(DATA_DIR, 'canonical_events.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading canonical events:', err.message);
  }
  return { canonicalEvents: [] };
}

/**
 * Check if a URL is already being monitored
 * Returns: { exists: bool, events: [], suggestion: string }
 */
export function checkUrlExists(url) {
  const canonical = loadCanonical();
  const normalized = normalizeUrl(url);
  
  const matching = canonical.canonicalEvents.filter(event => {
    const monitoringUrls = event.monitoring_urls || [];
    return monitoringUrls.some(m => normalizeUrl(m.url) === normalized);
  });

  return {
    exists: matching.length > 0,
    eventCount: matching.length,
    events: matching.map(e => ({
      id: e.id,
      name: e.name,
      city: e.city,
      lastChecked: e.monitoring_urls?.[0]?.last_checked
    })),
    suggestion: matching.length > 0 
      ? `We already monitor ${url}. Found ${matching.length} event(s) there.`
      : null
  };
}

/**
 * Normalize URL for comparison
 * Remove protocol, trailing slash, www
 */
function normalizeUrl(url) {
  return url
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/$/, '');
}

/**
 * Check if an event exists within a URL
 * (for checking duplicates within same venue)
 */
export function checkEventExists(url, eventName) {
  const canonical = loadCanonical();
  const normalized = normalizeUrl(url);
  
  const venueEvents = canonical.canonicalEvents.filter(event => {
    const monitoringUrls = event.monitoring_urls || [];
    return monitoringUrls.some(m => normalizeUrl(m.url) === normalized);
  });

  const matches = venueEvents.filter(e => 
    levenshtein(e.name.toLowerCase(), eventName.toLowerCase()) < 5
  );

  return {
    exists: matches.length > 0,
    matches: matches.map(m => ({ id: m.id, name: m.name }))
  };
}

/**
 * Levenshtein distance (fuzzy matching)
 * Used for soft dedup of event names
 */
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export default { loadCanonical, checkUrlExists, checkEventExists };
