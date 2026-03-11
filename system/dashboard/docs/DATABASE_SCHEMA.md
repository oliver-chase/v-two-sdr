# Oliver Dashboard — SQLite Database Schema

**Purpose:** Track system events (config changes, plugin toggles, handoffs, errors) and store dismissed recommendations from the intelligence layer.

**Location:** `system/dashboard/data/events.db` (created on first use)

---

## Tables

### `events` — System instrumentation events

Stores all system events: configuration changes, plugin toggles, handoffs, errors, etc.

```sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  type TEXT NOT NULL,              -- 'config-change', 'plugin-toggle', 'handoff', 'error', 'project-state', etc.
  agent TEXT,                       -- agent that triggered event (e.g., 'claude-code', 'openclaw')
  target TEXT,                      -- what was affected (project name, persona, config key, etc.)

  -- Config-change fields
  config_key TEXT,                  -- which config key changed
  config_old_value TEXT,            -- previous value (JSON string)
  config_new_value TEXT,            -- new value (JSON string)

  -- Plugin fields
  plugin_name TEXT,                 -- name of plugin toggled
  plugin_enabled BOOLEAN,           -- enabled or disabled

  -- Handoff fields
  handoff_from TEXT,                -- agent A
  handoff_to TEXT,                  -- agent B
  handoff_context TEXT,             -- state passed (summary)
  handoff_success BOOLEAN,          -- true if successful

  -- Error fields
  error_message TEXT,               -- error description
  error_code TEXT,                  -- error code if applicable

  -- Generic fields
  details TEXT,                     -- additional JSON data specific to event type
  success BOOLEAN DEFAULT TRUE,     -- operation succeeded or failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_agent ON events(agent);
CREATE INDEX idx_events_target ON events(target);
```

---

### `dismissed_recommendations` — Intelligence layer recommendations

Stores dismissed intelligence recommendations so they don't re-appear unless condition is newly detected.

```sql
CREATE TABLE IF NOT EXISTS dismissed_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,           -- 'instrumentation', 'performance', 'documentation', 'error'
  target TEXT NOT NULL,             -- project, agent, persona, or 'system'
  condition TEXT NOT NULL,          -- what was detected (e.g., 'no-events', 'high-token-usage')
  reason TEXT,                      -- plain-language description of the issue
  dismissed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  dismissed_by TEXT,                -- who dismissed it (if relevant)
  expires_at DATETIME,              -- optional: if condition still exists after X days, re-notify
  details TEXT                      -- additional JSON data
);

CREATE UNIQUE INDEX idx_dismissed_key ON dismissed_recommendations(category, target, condition);
CREATE INDEX idx_dismissed_expires ON dismissed_recommendations(expires_at);
```

---

## Initialization Code

**Node.js (ESM)**

```javascript
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data', 'events.db')

// Initialize database
export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) return reject(err)

      db.serialize(() => {
        // Create events table
        db.run(`
          CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            type TEXT NOT NULL,
            agent TEXT,
            target TEXT,
            config_key TEXT,
            config_old_value TEXT,
            config_new_value TEXT,
            plugin_name TEXT,
            plugin_enabled BOOLEAN,
            handoff_from TEXT,
            handoff_to TEXT,
            handoff_context TEXT,
            handoff_success BOOLEAN,
            error_message TEXT,
            error_code TEXT,
            details TEXT,
            success BOOLEAN DEFAULT TRUE
          );
          CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
          CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
          CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent);
        `)

        // Create dismissed recommendations table
        db.run(`
          CREATE TABLE IF NOT EXISTS dismissed_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            target TEXT NOT NULL,
            condition TEXT NOT NULL,
            reason TEXT,
            dismissed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            dismissed_by TEXT,
            expires_at DATETIME,
            details TEXT
          );
          CREATE UNIQUE INDEX IF NOT EXISTS idx_dismissed_key
          ON dismissed_recommendations(category, target, condition);
        `, (err) => {
          if (err) return reject(err)
          db.close(() => resolve())
        })
      })
    })
  })
}
```

---

## Usage Examples

### Insert Config Change Event

```javascript
db.run(
  `INSERT INTO events (type, agent, target, config_key, config_old_value, config_new_value)
   VALUES (?, ?, ?, ?, ?, ?)`,
  ['config-change', 'claude-code', 'settings', 'model', 'haiku', 'sonnet'],
  (err) => { if (err) console.error(err) }
)
```

### Insert Handoff Event

```javascript
db.run(
  `INSERT INTO events (type, handoff_from, handoff_to, handoff_context, handoff_success)
   VALUES (?, ?, ?, ?, ?)`,
  ['handoff', 'claude-code', 'openclaw', 'Need real-time API data...', true],
  (err) => { if (err) console.error(err) }
)
```

### Query Recent Events

```javascript
db.all(
  `SELECT * FROM events ORDER BY timestamp DESC LIMIT 50`,
  (err, rows) => { if (err) console.error(err); else console.log(rows) }
)
```

---

## Phase Integration

| Phase | Uses | Purpose |
|-------|------|---------|
| **Phase 2** | `events` (config/plugin changes) | Chunk 8: Audit Trail tab |
| **Phase 3** | `events` (error patterns) | Intelligence layer foundation |
| **Phase 3** | `dismissed_recommendations` | Store dismissed alerts |
| **Phase 4** | Both tables | Advanced analytics and reporting |

---

**Note:** SQLite3 npm package required: `npm install sqlite3`
