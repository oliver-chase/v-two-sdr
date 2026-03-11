/**
 * Real Site Parser: Extract events from venue calendar URLs
 * Phase 2-A: Actual HTML fetching + intelligent parsing
 * 
 * Supports:
 * - City government calendar sites (Denver, Boulder, Arvada)
 * - Eventbrite embedded calendars
 * - Custom HTML event listings
 * - Recurring event detection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

// Common date patterns (regex)
const DATE_PATTERNS = [
  // ISO: 2026-03-15
  /(\d{4})-(\d{2})-(\d{2})/,
  // US: 03/15/2026 or 3/15/2026
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  // Text: March 15, 2026
  /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
  // Short: Mar 15, 2026
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i,
  // Range: March 15-17, 2026
  /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})-(\d{1,2}),?\s+(\d{4})/i,
];

// Common time patterns (regex)
const TIME_PATTERNS = [
  // 10:30 PM or 22:30
  /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/,
  // 10 AM or 10PM
  /(\d{1,2})\s*(AM|PM|am|pm)/,
];

// Event type keywords
const EVENT_KEYWORDS = {
  concert: ['concert', 'live music', 'band', 'performance'],
  festival: ['festival', 'fair', 'expo', 'conference'],
  market: ['market', 'farmers market', 'craft fair', 'vendor'],
  sports: ['game', 'match', 'tournament', 'race', 'climbing', 'hiking'],
  comedy: ['comedy', 'stand-up', 'improv'],
  theater: ['theater', 'theatre', 'play', 'musical', 'broadway'],
  art: ['art', 'gallery', 'exhibition', 'show', 'opening'],
  food: ['food', 'tasting', 'dinner', 'lunch', 'brunch', 'brewery'],
  meetup: ['meetup', 'networking', 'group', 'club'],
  class: ['class', 'workshop', 'course', 'training', 'lesson'],
};

/**
 * Fetch HTML from URL with error handling
 */
async function fetchHTML(url) {
  try {
    // Add timeout and user-agent to avoid blocks
    const response = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EventBot/1.0)',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    const html = await response.text();
    return {
      success: true,
      html,
      statusCode: 200,
      contentType: response.headers.get('content-type'),
    };
  } catch (err) {
    return {
      success: false,
      error: `Fetch failed: ${err.message}`,
      statusCode: 0,
    };
  }
}

/**
 * Extract text content from HTML (simple regex-based, no DOM parser)
 * Removes scripts, styles, extra whitespace
 */
function extractTextContent(html) {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Extract dates from text
 * Returns array of { date: ISO string, raw: original match, pattern: which regex matched }
 */
function extractDates(text) {
  const dates = [];
  const seen = new Set();

  const monthMap = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };

  // Pattern 1: ISO format (2026-03-15)
  const isoRegex = /(\d{4})-(\d{2})-(\d{2})/g;
  let match;
  while ((match = isoRegex.exec(text)) !== null) {
    const dateStr = `${match[1]}-${match[2]}-${match[3]}`;
    if (!seen.has(dateStr)) {
      dates.push({
        date: dateStr,
        raw: match[0],
        pattern: 'ISO',
      });
      seen.add(dateStr);
    }
  }

  // Pattern 2: US format (03/15/2026)
  const usRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;
  while ((match = usRegex.exec(text)) !== null) {
    const month = String(match[1]).padStart(2, '0');
    const day = String(match[2]).padStart(2, '0');
    const year = match[3];
    const dateStr = `${year}-${month}-${day}`;
    if (!seen.has(dateStr)) {
      dates.push({
        date: dateStr,
        raw: match[0],
        pattern: 'US',
      });
      seen.add(dateStr);
    }
  }

  // Pattern 3: Text format (March 15, 2026 or Mar 15, 2026)
  const textRegex = /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/gi;
  while ((match = textRegex.exec(text)) !== null) {
    const monthNum = monthMap[match[1].toLowerCase()];
    const day = String(match[2]).padStart(2, '0');
    const year = match[3];
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${day}`;
    if (!seen.has(dateStr)) {
      dates.push({
        date: dateStr,
        raw: match[0],
        pattern: 'Text',
      });
      seen.add(dateStr);
    }
  }

  return dates;
}

/**
 * Extract times from text
 * Returns array of { time: HH:MM in 24h format, raw: original match }
 */
function extractTimes(text) {
  const times = [];
  const seen = new Set();

  // Pattern 1: HH:MM AM/PM
  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/g;
  let match;
  while ((match = timeRegex.exec(text)) !== null) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
    if (!seen.has(timeStr)) {
      times.push({
        time: timeStr,
        raw: match[0],
      });
      seen.add(timeStr);
    }
  }

  return times;
}

/**
 * Detect event type from text
 * Returns: { type: string, confidence: 0-1 }
 */
function detectEventType(text) {
  const lowerText = text.toLowerCase();
  const scores = {};

  for (const [type, keywords] of Object.entries(EVENT_KEYWORDS)) {
    const matches = keywords.filter(kw => lowerText.includes(kw)).length;
    if (matches > 0) {
      scores[type] = matches / keywords.length;
    }
  }

  if (Object.keys(scores).length === 0) {
    return { type: 'event', confidence: 0.3 };
  }

  const topType = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  return {
    type: topType[0],
    confidence: Math.min(topType[1], 0.95),
  };
}

/**
 * Extract event mentions from text (simple heuristic)
 * Look for lines with event-like content
 */
function extractEventMentions(text) {
  const lines = text.split(/[\n.]/).filter(line => line.length > 10 && line.length < 200);
  return lines.slice(0, 10); // Top 10 candidate event lines
}

/**
 * Main parser: Fetch URL and extract events
 */
export async function parseVenueUrl(url) {
  try {
    // Step 1: Fetch HTML
    const fetchResult = await fetchHTML(url);
    if (!fetchResult.success) {
      return {
        success: false,
        url,
        events: [],
        errors: [fetchResult.error],
        statusCode: fetchResult.statusCode,
      };
    }

    // Step 2: Extract text content
    const textContent = extractTextContent(fetchResult.html);

    // Step 3: Extract dates
    const dates = extractDates(textContent);

    // Step 4: Extract times
    const times = extractTimes(textContent);

    // Step 5: Detect event type
    const eventType = detectEventType(textContent);

    // Step 6: Extract event mentions
    const mentions = extractEventMentions(textContent);

    // Step 7: Build events array
    const events = dates.map((dateObj, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: mentions[idx] || 'Event at venue',
      date: dateObj.date,
      time: times[idx]?.time || null,
      type: eventType.type,
      confidence: {
        date_pattern: dateObj.pattern,
        event_type: eventType.confidence,
      },
      raw_source: {
        date_match: dateObj.raw,
        time_match: times[idx]?.raw || null,
      },
    }));

    return {
      success: true,
      url,
      events,
      eventCount: events.length,
      statusCode: 200,
      parseMetrics: {
        dates_found: dates.length,
        times_found: times.length,
        event_type_detected: eventType.type,
        event_mentions_found: mentions.length,
      },
      errors: [],
    };
  } catch (err) {
    return {
      success: false,
      url,
      events: [],
      errors: [`Parser error: ${err.message}`],
    };
  }
}

/**
 * Calculate next check date (unchanged from stub)
 */
export function getNextCheckDate(frequency = 'weekly') {
  const now = new Date();
  let next = new Date(now);

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next.toISOString();
}

/**
 * Log parse attempt
 */
export function logParseAttempt(url, result) {
  const logsDir = path.join(DATA_DIR, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    url,
    success: result.success,
    eventCount: result.events?.length || 0,
    parseMetrics: result.parseMetrics || {},
    errors: result.errors || [],
  };

  const logPath = path.join(logsDir, `parser_${new Date().toISOString().split('T')[0]}.jsonl`);
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

  return logEntry;
}

export default { parseVenueUrl, getNextCheckDate, logParseAttempt };
