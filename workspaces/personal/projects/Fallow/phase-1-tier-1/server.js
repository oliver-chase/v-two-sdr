#!/usr/bin/env node

/**
 * FALLOW Phase 1 Server
 * Express API + React frontend for community-powered event discovery
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCanonical, checkUrlExists, checkEventExists } from './scripts/dedup.js';
import { parseVenueUrl, getNextCheckDate } from './scripts/parser.js';
import { runSweep } from './scripts/scheduler-tier2.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// HELPERS
// ============================================================================

function saveCanonical(data) {
  const filePath = path.join(DATA_DIR, 'canonical_events.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// API: SUBMISSION
// ============================================================================

/**
 * POST /api/submit
 * User submits: name, location, url
 * System checks for duplicates, creates canonical event, starts monitoring
 */
app.post('/api/submit', async (req, res) => {
  try {
    const { name, location, url } = req.body;

    // Validate input
    if (!name || !location || !url) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, location, url' 
      });
    }

    // Check if URL already being monitored
    const urlCheck = checkUrlExists(url);
    if (urlCheck.exists) {
      return res.status(409).json({
        status: 'duplicate',
        message: `We already monitor this URL`,
        existingEvents: urlCheck.events,
        suggestion: `Open existing event?`
      });
    }

    // Create canonical event
    const canonical = loadCanonical();
    const newEvent = {
      id: generateId(),
      name,
      city: location.includes(',') ? location.split(',')[0].trim() : location,
      state: location.includes(',') ? location.split(',')[1].trim() : 'CO',
      monitoring_urls: [
        {
          url,
          added_date: new Date().toISOString(),
          added_by: 'user_submission',
          last_checked: null,
          next_check: getNextCheckDate('weekly'),
          check_frequency: 'weekly',
          check_count: 0,
          events_found: []
        }
      ],
      monitoring_status: 'active',
      completion_confidence: 0,
      status: 'active',
      type: 'community-submitted',
      first_seen: new Date().toISOString()
    };

    canonical.canonicalEvents.push(newEvent);
    canonical.lastUpdated = new Date().toISOString();
    saveCanonical(canonical);

    // Log submission
    console.log(`[SUBMIT] ${name} at ${url}`);

    res.status(201).json({
      status: 'created',
      event: {
        id: newEvent.id,
        name: newEvent.name,
        location: `${newEvent.city}, ${newEvent.state}`,
        url,
        nextCheck: getNextCheckDate('weekly'),
        message: 'Event added! We\'ll monitor this URL weekly.'
      }
    });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: VENUES
// ============================================================================

/**
 * GET /api/venues
 * List all monitored venues
 */
app.get('/api/venues', (req, res) => {
  const canonical = loadCanonical();
  const venues = new Map();

  for (const event of canonical.canonicalEvents) {
    for (const monitor of event.monitoring_urls || []) {
      if (!venues.has(monitor.url)) {
        venues.set(monitor.url, {
          url: monitor.url,
          events: [],
          lastChecked: monitor.last_checked,
          nextCheck: monitor.next_check,
          checkCount: monitor.check_count || 0
        });
      }
      venues.get(monitor.url).events.push({
        id: event.id,
        name: event.name,
        status: event.monitoring_status
      });
    }
  }

  res.json({
    venues: Array.from(venues.values()),
    count: venues.size
  });
});

// ============================================================================
// API: EVENTS
// ============================================================================

/**
 * GET /api/events
 * List all events with filtering
 */
app.get('/api/events', (req, res) => {
  const { city, status } = req.query;
  const canonical = loadCanonical();
  let events = canonical.canonicalEvents;

  if (city) {
    events = events.filter(e => 
      e.city.toLowerCase() === city.toLowerCase()
    );
  }

  if (status && status !== 'all') {
    events = events.filter(e => e.monitoring_status === status);
  }

  res.json({
    events: events.map(e => ({
      id: e.id,
      name: e.name,
      location: `${e.city}, ${e.state}`,
      status: e.monitoring_status,
      monitoringUrl: e.monitoring_urls?.[0]?.url,
      lastChecked: e.monitoring_urls?.[0]?.last_checked,
      completionConfidence: e.completion_confidence
    })),
    count: events.length
  });
});

// ============================================================================
// API: SEARCH
// ============================================================================

/**
 * GET /api/search
 * Search events by name or venue
 */
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const canonical = loadCanonical();
  const searchLower = q.toLowerCase();
  const results = canonical.canonicalEvents.filter(e =>
    e.name.toLowerCase().includes(searchLower) ||
    (e.city && e.city.toLowerCase().includes(searchLower))
  );

  res.json({
    query: q,
    results: results.map(e => ({
      id: e.id,
      name: e.name,
      location: `${e.city}, ${e.state}`,
      status: e.monitoring_status
    })),
    count: results.length
  });
});

// ============================================================================
// API: STATUS
// ============================================================================

/**
 * GET /api/status
 * Overall monitoring status
 */
app.get('/api/status', (req, res) => {
  const canonical = loadCanonical();
  const total = canonical.canonicalEvents.length;
  const active = canonical.canonicalEvents.filter(e => 
    e.monitoring_status !== 'complete'
  ).length;
  const complete = total - active;

  const nextChecks = canonical.canonicalEvents
    .flatMap(e => (e.monitoring_urls || []).map(m => ({
      date: new Date(m.next_check),
      event: e.name
    })))
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  res.json({
    summary: {
      totalEvents: total,
      activeMonitoring: active,
      complete: complete,
      lastUpdated: canonical.lastUpdated
    },
    nextChecks: nextChecks.map(c => ({
      event: c.event,
      scheduled: c.date.toISOString()
    }))
  });
});

// ============================================================================
// PHASE 2: TIER 2 DISCOVERY
// ============================================================================

/**
 * POST /api/sweep
 * Trigger full Tier 1 + Tier 2 sweep (may take a few minutes)
 */
app.post('/api/sweep', async (req, res) => {
  try {
    const { cities = ['Denver', 'Boulder', 'Arvada'], apiKeys = {} } = req.body;

    // Return immediately with sweep ID, run in background
    res.json({
      status: 'sweep_started',
      message: 'Sweep running in background. Check /api/sweep/<sweep_id> for progress.',
      timestamp: new Date().toISOString(),
    });

    // Run sweep async (don't wait)
    setTimeout(() => {
      runSweep({ cities, apiKeys }).catch(err => {
        console.error('Sweep failed:', err);
      });
    }, 100);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/sweep/latest
 * Get latest sweep results
 */
app.get('/api/sweep/latest', (req, res) => {
  try {
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      return res.json({ error: 'No sweeps yet' });
    }

    const sweeps = fs.readdirSync(logsDir)
      .filter(f => f.startsWith('sweep_') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (sweeps.length === 0) {
      return res.json({ error: 'No sweeps yet' });
    }

    const latest = JSON.parse(fs.readFileSync(path.join(logsDir, sweeps[0]), 'utf-8'));
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/events/all
 * Get all canonical events (post-dedup)
 */
app.get('/api/events/all', (req, res) => {
  try {
    const canonical = loadCanonical();
    const events = canonical.events || [];
    res.json({
      count: events.length,
      events: events.map(e => ({
        id: e.id,
        name: e.name,
        date: e.date,
        venue: e.venue,
        city: e.city,
        type: e.type,
        sources: e.sources || [e.source],
        last_updated: e.last_merged || canonical.last_updated,
      })),
      last_updated: canonical.last_updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n[FALLOW PHASE 1]`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST   /api/submit      - Add venue`);
  console.log(`  GET    /api/venues      - List monitored venues`);
  console.log(`  GET    /api/events      - List events`);
  console.log(`  GET    /api/search      - Search events`);
  console.log(`  GET    /api/status      - Monitoring status`);
  console.log(`  GET    /health          - Health check\n`);
});

export default app;
