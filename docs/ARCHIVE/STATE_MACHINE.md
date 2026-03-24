# SDR Lead Lifecycle State Machine

## Overview

The State Machine enforces a strict lead lifecycle with 8 states and validates all transitions. It blocks illegal state changes, logs violations, persists state to JSON and Google Sheets, and monitors the active lead pool.

**Files:**
- `state-machine.js` — Core state machine logic
- `config.state.js` — Configuration (states, transitions, thresholds)
- `tests/state-machine.test.js` — Full test coverage (55 tests)

**Status:** ✅ Production-ready | 100% test coverage | TDD implementation

---

## Lead Lifecycle States (8 Total)

### Discovery Phase
1. **new** — Prospect added to database, no enrichment yet
2. **email_discovered** — Valid email found and validated via pattern/MX check

### Drafting Phase
3. **draft_generated** — Email draft created, awaiting approval (can regenerate)
4. **awaiting_approval** — Draft queued for SDR review (can reject/rewrite)

### Execution Phase
5. **email_sent** — Email delivered to prospect, awaiting reply
6. **replied** — Prospect sent reply, awaiting classification

### Closure States
7. **closed_positive** — Positive reply or meeting booked (final)
8. **closed_negative** — No reply, opt-out, or explicit negative response (final)

---

## Legal Transitions

```
new
  ↓
email_discovered
  ↓
draft_generated ← (can regenerate) ←┐
  ↓                                 │
awaiting_approval ← (can reject) ──→┴─ draft_generated
  ↓
email_sent
  ├→ replied
  ├→ closed_positive (manual)
  └→ closed_negative (manual)
     ↑
replied
  ├→ closed_positive
  └→ closed_negative

Any state → closed_negative (opt-out)
```

---

## API Reference

### StateMachine Class

#### Constructor
```javascript
const StateMachine = require('./state-machine');
const sm = new StateMachine(
  stateFile,        // Path to persist state JSON
  alertCallback     // Optional: fn(alert) for violations/warnings
);
```

#### Initialization
```javascript
sm.initializeState(prospects, force = false);
// Load state from file or create new with prospects
// Returns: current state object
```

#### Transition
```javascript
const result = sm.transitionState(
  prospectId,       // ID of prospect
  newState,         // Target state
  reason = ''       // Reason for transition
);
// Returns: { success, newState, oldState, transition } OR { success: false, violation, error }
```

#### Validation
```javascript
const isLegal = sm.isLegalTransition(prospect, newState);
// Check if transition is allowed (doesn't execute it)
```

#### Query Functions
```javascript
sm.getProspectsByState(state);           // Filter by state
sm.getProspectsByTrack(track);           // Filter by track
sm.getProspectsByStateAndTrack(s, t);    // Filter by both
sm.getStateDistribution();                // {state: count}
sm.getTrackDistribution();                // {track: count}
sm.getActivePipeline();                   // All non-closed prospects
sm.getClosedProspects();                  // All closed prospects
```

#### Google Sheets Integration
```javascript
const payload = sm.getSheetsUpdatePayload(prospectId);
// Returns: {prospectId, newState, lastModified, reason, transitionCount}
// Prepared for Chunk 2 (Google Sheets write-back)
```

#### Inspection
```javascript
const state = sm.getState();
// Returns: {prospects, transitions, violations, lastUpdated}
```

---

## Configuration (config.state.js)

### State Definitions
```javascript
config.states = {
  'new': { label, description, order, active, closedState, ... },
  ...
}
```

### Transition Rules
```javascript
config.transitions = {
  'new': ['email_discovered'],
  'email_discovered': ['draft_generated'],
  ...
}
```

### Thresholds
```javascript
config.leadPool.minThreshold = 30  // Alert if < 30 active prospects
config.leadPool.warningLevel = 50   // Secondary warning
config.leadPool.recommendedRamp = 100  // Target for scaling
```

### Integration
```javascript
config.integrations.googleSheets = {
  enabled: true,
  updateField: 'st',           // TOON format state field
  trackingFields: ['st', 'lc', 'nf'],
  writeFrequency: 'immediate'
}
```

---

## Persistence & Monitoring

### JSON State File
Persisted to disk after every transition:
```json
{
  "prospects": [
    {
      "id": "p-001",
      "st": "email_sent",
      "lc": "2026-03-12T10:30:00Z",
      ...
    }
  ],
  "transitions": [
    {
      "prospectId": "p-001",
      "from": "email_discovered",
      "to": "draft_generated",
      "timestamp": "2026-03-12T10:25:00Z",
      "reason": "Email draft created"
    }
  ],
  "violations": [
    {
      "prospectId": "p-002",
      "from": "new",
      "to": "awaiting_approval",
      "timestamp": "2026-03-12T10:20:00Z",
      "reason": "Attempted to skip email discovery"
    }
  ],
  "lastUpdated": "2026-03-12T10:30:00Z"
}
```

### Lead Pool Monitoring
Automatically checks after every state change:
- If `active_pipeline < 30` → Sends alert via callback
- Alert includes: count, threshold, closed count, total count
- Channels: Telegram (integrated in Chunk 7), logs

### Violation Tracking
Attempted illegal transitions are logged with:
- Prospect ID, source state, target state
- Timestamp, reason
- Alert sent to callback (if provided)

---

## Usage Examples

### Basic Workflow
```javascript
const StateMachine = require('./state-machine');

// Initialize
const sm = new StateMachine('./SDR_STATE.json', (alert) => {
  console.log(`⚠️  ${alert.type}: ${alert.message}`);
});

sm.initializeState(prospects);

// Transition through pipeline
sm.transitionState('p-001', 'email_discovered', 'Email validated via MX check');
sm.transitionState('p-001', 'draft_generated', 'Draft created via LLM');
sm.transitionState('p-001', 'awaiting_approval', 'Queued for SDR review');
sm.transitionState('p-001', 'email_sent', 'Approved and sent');
```

### Querying Pipeline
```javascript
// Get distribution across states
const dist = sm.getStateDistribution();
console.log(`Pending: ${dist.new}, In Draft: ${dist.draft_generated}, Sent: ${dist.email_sent}`);

// Get active prospects (non-closed)
const active = sm.getActivePipeline();
console.log(`Active prospects: ${active.length}`);

// Filter by track
const aiProspects = sm.getProspectsByTrack('ai-enablement');
```

### Violation Detection
```javascript
// Attempt illegal transition
const result = sm.transitionState('p-001', 'draft_generated', 'Manual attempt');

if (!result.success) {
  console.log(`Violation: Cannot go from ${result.violation.from} to ${result.violation.to}`);
  console.log(`Reason: ${result.violation.reason}`);
}
```

### Google Sheets Integration
```javascript
// After transition, get payload for Sheets write-back
const payload = sm.getSheetsUpdatePayload('p-001');
// {
//   prospectId: 'p-001',
//   newState: 'draft_generated',
//   lastModified: '2026-03-12T10:25:00Z',
//   reason: 'Draft created',
//   transitionCount: 2
// }

// Pass to Chunk 2 (Google Sheets Integration) for Sheet update
await sheetsConnector.updateProspectState(payload);
```

---

## Test Coverage

**Total Tests:** 55 | **All Passing** ✅

### Test Suites
1. **Initialization** (3 tests) — File loading, state creation
2. **State Definitions** (2 tests) — Valid states, valid transitions
3. **Legal Transitions** (13 tests) — All valid transition paths
4. **Illegal Transitions** (7 tests) — Blocked paths, edge cases
5. **Transition Enforcement** (6 tests) — Execution, logging, updates
6. **State Persistence** (3 tests) — File I/O, cross-instance
7. **Violation Logging** (3 tests) — Capture, details, alerts
8. **Query Functions** (7 tests) — Filter, count, distribution
9. **Lead Pool Monitoring** (3 tests) — Threshold, alerts, metadata
10. **Edge Cases** (6 tests) — Empty state, case sensitivity, validation
11. **Google Sheets Integration** (2 tests) — Payload generation

### Running Tests
```bash
cd /Users/oliver/OliverRepo/workspaces/work/projects/SDR
npm test -- tests/state-machine.test.js
```

---

## Integration Points (Other Chunks)

### Depends On
- None (foundation layer)

### Used By
- **Chunk 2** (Google Sheets) — Uses `getSheetsUpdatePayload()` for write-back
- **Chunk 5** (Email Drafting) — Transitions states during draft lifecycle
- **Chunk 6** (Inbox Monitoring) — Transitions states on reply detection
- **Chunk 7** (Orchestration) — Queries state for reporting
- **Chunk 8** (Analytics) — Uses state data for metrics

---

## Technical Details

### TOON Format Integration
State machine works seamlessly with TOON format prospects:
- Uses `st` field for state (prospects.json schema)
- Preserves all other TOON fields during transitions
- `lc` field updated with last-changed timestamp

### Error Handling
- Invalid state names → return false (isLegalTransition)
- Prospect not found → return error in result
- File I/O errors → warn to console, continue in memory
- Invalid newState → validation before transition

### Performance
- O(1) prospect lookup (if indexed)
- O(n) for full state queries (acceptable for lead pools <5000)
- Minimal JSON parsing overhead (persists only on transitions)

---

## Roadmap

### Phase 1 ✅ COMPLETE
- [x] Define 8 states
- [x] Implement transition validation
- [x] Persist to JSON
- [x] Block illegal transitions
- [x] Minimum pool monitoring
- [x] Full test coverage (55 tests)
- [x] Google Sheets integration prep

### Phase 2 (Blocked by Chunk 2)
- [ ] Implement Google Sheets write-back (via Chunk 2)
- [ ] Test with live Google Sheet

### Phase 3 (Post Phase 2)
- [ ] Dashboard visualization of state distribution
- [ ] Analytics on transition times (avg days in each state)
- [ ] SLA enforcement (close leads after N days if no reply)

---

## Known Limitations

1. **No cross-prospect constraints** — Can't enforce "if prospect X is in state Y, prospect Z must be in state W"
2. **No time-based transitions** — Can't automatically transition after N days (handled by orchestration layer)
3. **No state rollback** — Once transitioned, can't undo (by design; violations are logged instead)
4. **Single-instance design** — Assumes one state machine per SDR system (for now)

---

## Contributing

When modifying state machine:

1. **Update tests first** (TDD)
2. **Modify `config.state.js`** for new states/transitions
3. **Implement logic in `state-machine.js`**
4. **Run full test suite** before committing
5. **Update this README** with new features

---

**Created:** 2026-03-12 | **Status:** Production Ready | **Coverage:** 100% | **Last Updated:** 2026-03-12

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

