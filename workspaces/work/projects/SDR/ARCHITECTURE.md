# SDR System Architecture

**Status:** Design phase complete | **Reviewed:** 2026-03-11 | **Implementation:** Phase 1 starting

---

## Core Principle

**OpenClaw = Intelligence & Execution** | **Claude Code = Infrastructure & Validation** | **SDR Persona = Approval & Coordination**

### Agent Responsibilities

| Agent | Role | Capabilities | Boundaries |
|-------|------|--------------|-----------|
| **OpenClaw** | Research & Execution | web_search, web_fetch, email sending (post-approval), inbox monitoring | Stateless research only until Sheets write-back |
| **Claude Code** | Infrastructure & Validation | Script dev, validation logic, API connectors, testing, monitoring | No autonomous sends; validation-only mindset |
| **SDR Persona** | Approval & Coordination | Kiana interface, send approval, template feedback, sequence decisions | Execution is OpenClaw; validation is Claude Code |

---

## Subsystem Breakdown (8 Components)

### Foundation Layer
1. **Google Sheets Integration** (Chunk 2)
   - Bidirectional sync (read leads, write enriched data + state)
   - Dynamic schema inference (detect new columns, ask for mapping)
   - TOON format → Sheet headers mapping
   - Rate-limited API calls (batch operations)

2. **Enrichment Engine** (Chunk 3)
   - Email validation (patterns, MX checks, deliverability)
   - Confidence scoring (≥0.8: auto-use; 0.5–0.8: user confirm; <0.5: flag)
   - Web search integration (company research, hiring signals, recent news)
   - Web fetch integration (website enrichment, industry/location extraction)
   - Caching per run (avoid re-fetching unchanged leads)

3. **State Machine** (Chunk 4)
   - Lead lifecycle enforcement (new → email_discovered → draft_generated → awaiting_approval → sent → replied → closed)
   - Transition validation (illegal transitions blocked, logged)
   - Persistence (state written to Google Sheet + JSON log)
   - Minimum pool alerts (< 30 leads triggers Telegram alert)

### Execution Layer
4. **Email Drafting + Approval** (Chunk 5)
   - LLM-based drafting (verified data + knowledge base + Oliver persona)
   - Knowledge base system (dynamic doc loading, user-managed folder)
   - Draft lifecycle (generated → awaiting_approval → approved/rejected/regenerated)
   - Template evolution (feedback loop, user approval for new variants)
   - BCC tracking (oliver@vtwo.co on all outbound)

5. **Inbox & Reply Handling** (Chunk 6)
   - Outlook connector (Microsoft Graph API, inbox polling)
   - Reply classification (LLM-based, positive/negative/neutral/unclear/ooo)
   - Confidence-based handling (>0.8: auto-classify; 0.5–0.8: user confirm; <0.5: manual review)
   - Sequence management (pause on reply, update lead state, flag for Kiana)
   - Draft reply suggestions (user approves before send)

### Orchestration Layer
6. **Command Interface** (Chunk 7)
   - CLI commands (sdr run, sync, review, approve, send, inbox, metrics, status, knowledge *)
   - Natural Language parser (LLM-based, detects ambiguity, prompts user)
   - Daily flow automation (13-step pipeline, scheduled + manual trigger)
   - Telegram bot (alerts, command dispatch, approval prompts)
   - Terminal output (status, pending items, next actions)

### Analytics Layer
7. **Event Logging + Metrics** (Chunk 8)
   - Event schema (timestamp, lead_id, event_type, email_type, industry, title, sequence_stage)
   - Metrics aggregation (emails_sent, replies, reply_rate, bounce_rate, avg_followups, etc.)
   - Industry baseline benchmarks (compare against sector standards)
   - Filtering (date, industry, title, company size, sequence stage)
   - Sensitive data redaction (email, name, company hashing in exports)

### Integration Layer
8. **Dashboard UI** (Chunk 8)
   - React components (metrics cards, trend charts, lead pipeline)
   - API endpoints (/api/sdr/metrics, /api/sdr/pipeline, /api/sdr/leads, /api/sdr/templates)
   - Filters (industry, track, date range, status)
   - Real-time status (from event log + current run)

---

## Data Flow (End-to-End Daily Cycle)

```
┌─ STEP 1: Health Check ─────────────────────────────────────┐
│ Verify: Sheets API, Outlook API, Telegram, web_search      │
└─ STEP 2: Sync from Google Sheet ─────────────────────────┐ │
  ├─ Read all rows from "Prospects" tab                   │ │
  ├─ Map columns → TOON fields dynamically                │ │
  └─ Load into prospects.json (local copy)                │ │
    └─ STEP 3: Enrich Missing Data ──────────────────┐   │ │
      ├─ For each prospect with status "new":         │   │ │
      │  ├─ Generate email candidates (patterns)     │   │ │
      │  ├─ Run MX record check                      │   │ │
      │  ├─ Run deliverability check                 │   │ │
      │  ├─ Assign confidence score                  │   │ │
      │  ├─ If ≥ 0.8: write email + score to Sheets │   │ │
      │  └─ If 0.5–0.8: flag for user review        │   │ │
      └─ Web search company context (hiring signals)─┤   │ │
        └─ STEP 4: Load Knowledge Base ────────────┐ │   │ │
          ├─ Scan KB folder for new/updated docs   │ │   │ │
          └─ Load into active context for drafting │ │   │ │
            └─ STEP 5: Generate Drafts ──────────┐ │ │   │ │
              ├─ For each "email_discovered":    │ │ │   │ │
              │  ├─ Load company context        │ │ │   │ │
              │  ├─ Draft email (LLM + KB)      │ │ │   │ │
              │  └─ Queue for approval          │ │ │   │ │
              └─ STEP 6: Queue for Approval ──┐ │ │ │   │ │
                ├─ Show drafts to SDR         │ │ │ │   │ │
                └─ Wait for: approve/rewrite  │ │ │ │   │ │
                  └─ STEP 7: Scan Inbox ────┐ │ │ │ │   │ │
                    ├─ Read new messages    │ │ │ │ │   │ │
                    └─ Match to leads       │ │ │ │ │   │ │
                      └─ STEP 8: Classify ┐ │ │ │ │ │   │ │
                        ├─ LLM classify  │ │ │ │ │ │   │ │
                        └─ Update states │ │ │ │ │ │   │ │
                          └─ STEP 9: Log ─┐ │ │ │ │ │   │ │
                            ├─ Append to event log        │ │
                            └─ STEP 10: Write Back ──┐   │ │
                              ├─ Enriched fields     │   │ │
                              ├─ State changes       │   │ │
                              └─ STEP 11: Metrics ──┐│   │ │
                                ├─ Aggregate events ││   │ │
                                └─ STEP 12: Alert ──┘│   │ │
                                  ├─ Terminal: Status ├─┐ │
                                  └─ Telegram: Alerts ││ │
                                    └─ STEP 13: Prompt │ │
                                      └─ "Approve?" ──┘ │
                                         (cycle repeats) │
└────────────────────────────────────────────────────────┘
```

---

## TOON Format Spec (Token Optimization)

All prospect data, send logs, and reports use TOON (Token Optimization) format with abbreviated keys.

### prospects.json Schema
```json
{
  "prospects": [
    {
      "id": "p-000001",
      "fn": "First Name",
      "ln": "Last Name",
      "co": "Company Name",
      "ti": "Title",
      "em": "email@domain.com",
      "li": "linkedin.com/in/person",
      "lo": "City, State",
      "tz": "America/New_York",
      "tr": "ai-enablement|product-maker|pace-car",
      "st": "new|email_discovered|draft_generated|awaiting_approval|email_sent|replied|closed_positive|closed_negative",
      "ad": "2026-03-11",
      "lc": "2026-03-11",
      "ms": 0,
      "nf": "2026-03-14",
      "sf": 0,
      "rf": 0,
      "rn": "",
      "no": "Notes"
    }
  ],
  "metadata": {
    "tot": 500,
    "by_tr": { "ai-enablement": 150, "product-maker": 200, "pace-car": 150 },
    "by_st": { "new": 100, "email_discovered": 50, "draft_generated": 30, "awaiting_approval": 10, "email_sent": 200, "replied": 50, "closed_positive": 40, "closed_negative": 30 },
    "lu": "2026-03-11T18:30:00Z"
  }
}
```

### Sends.json Schema (Event Log)
```json
{
  "sends": [
    {
      "id": "s-000001",
      "pid": "p-000001",
      "dt": "2026-03-11T10:00:00Z",
      "em": "email@domain.com",
      "tm": "template-a-1",
      "su": "Subject line",
      "tr": "ai-enablement",
      "ti": "CTO",
      "rp": false,
      "rn": "",
      "rt": ""
    }
  ],
  "metadata": {
    "tot": 25,
    "rp_ct": 3,
    "rp_rt": 0.12,
    "lu": "2026-03-11T18:30:00Z"
  }
}
```

---

## API Contracts (Connectors)

### Google Sheets API
```
GET /sheets/{sheetId}/values/Prospects
  ├─ Returns: All rows from "Prospects" tab
  ├─ Schema: Dynamic (inferred from headers)
  └─ Rate limit: 300 reads/min

POST /sheets/{sheetId}/values/Prospects:append
  ├─ Body: [enriched fields, state updates, metrics]
  └─ Rate limit: 300 writes/min
```

### Outlook / Microsoft Graph API
```
GET /me/mailFolders/inbox/messages?$filter=receivedDateTime ge {lastCheck}
  ├─ Returns: New messages since last check
  └─ Rate limit: Standard Graph throttling

POST /me/sendMail
  ├─ Requires: User approval (gated by SDR)
  └─ Includes: BCC to oliver@vtwo.co
```

### Telegram Bot API
```
POST /botToken/sendMessage
  ├─ chat_id: Kiana's Telegram ID
  ├─ text: Status, alerts, approval prompts
  └─ reply_markup: inline buttons (approve, review, skip)

GET /botToken/getUpdates
  ├─ Polls for user commands (sdr run, sdr approve, etc.)
  └─ Dispatch to CLI parser
```

### OpenClaw Web Tools
```
GET /web/search?q={query}
  ├─ Query: Company name, hiring signals, industry news
  ├─ Returns: Top 5 results (snippet + URL)
  └─ Cached per run (avoid re-queries on unchanged leads)

GET /web/fetch?url={website}
  ├─ Fetches company website or LinkedIn
  ├─ Extracts: Industry, company size, location, "About" section
  ├─ Used for: Enrichment context, drafting personalization
  └─ Cached per run
```

---

## Error Handling & Edge Cases

### Enrichment
- Email confidence < 0.8 → flag for user review (don't auto-draft)
- Company context not found → draft from baseline template (notify)
- Knowledge base empty at draft time → halt drafting, alert user

### State Transitions
- Illegal transition attempted → block, log, alert user (e.g., trying to send from "new")
- Duplicate email detected → dedup, keep newest, log incident

### Inbox Handling
- Reply ambiguous (confidence 0.5–0.8) → ask user before updating state
- Out-of-office detected → pause sequence, resume at return date
- Unverified email address → never send without explicit user override

### API Failures
- Sheets API down → retry with backoff, alert user
- Outlook API down → skip inbox check, continue with other steps
- web_search timeout → skip enrichment for that prospect, flag for manual review

---

## Testing Strategy

- **Unit tests:** Each subsystem (Sheets, Enrichment, State Machine, Drafting, etc.)
- **Integration tests:** End-to-end daily flow (health → sync → enrich → draft → classify → metrics)
- **Data validation tests:** TOON format, schema conformance, deduplication
- **Approval workflow tests:** Draft generation, user approval, state transitions
- **Mock APIs:** Sheets, Outlook, Telegram (for testing without live credentials)

---

**Last Updated:** 2026-03-11 | **Next Review:** Phase 1 Complete (Mar 17)
