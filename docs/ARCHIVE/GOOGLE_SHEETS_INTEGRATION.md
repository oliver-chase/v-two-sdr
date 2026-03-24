# Google Sheets Integration — OpenClaw & Claude Code

**Date:** 2026-03-11 | **Status:** Setup Required | **Owners:** OpenClaw (write), Claude Code (read+validate)

---

## Canonical Data Source: Google Sheet

**Location:** (to be specified — Kiana provides share link)

**Purpose:** Live, collaborative prospect database. Single source of truth for all prospect data.

**Access:**
- OpenClaw: Read/Write (adds research, updates status)
- Claude Code: Read (validates, syncs to prospects.json)
- Kiana: Read (monitors progress)

---

## Google Sheet Structure

### Sheet 1: "Prospects" (Main Database)

| Column | Header | Type | Required | Notes |
|--------|--------|------|----------|-------|
| A | FirstName | String | Yes | Full first name (no initials) |
| B | LastName | String | Yes | Full last name |
| C | Company | String | Yes | Official company name |
| D | Title | String | Yes | Exact job title |
| E | Email | String | Yes | Work email (validated) |
| F | LinkedIn | String | Yes | Full LinkedIn profile URL |
| G | Location | String | Yes | City, State (e.g., "San Francisco, CA") |
| H | Timezone | String | Yes | IANA timezone (e.g., "America/Los_Angeles") |
| I | Track | String | Yes | One of: ai-enablement, product-maker, pace-car |
| J | Status | String | Yes | pending, sent, replied, opted-out, bounced, closed |
| K | DateAdded | Date | Yes | YYYY-MM-DD when prospect added |
| L | Notes | String | No | Buying signals, company info, research notes |
| M | Source | String | Yes | Where found: linkedin, crunchbase, yc, angellist, web_search, etc. |
| N | LastSent | Date | No | Date of last email (auto-updated by Claude Code) |
| O | LastReply | Date | No | Date of last reply (auto-updated by Claude Code) |
| P | ReplyStatus | String | No | positive, negative, neutral, ooo (auto-updated) |

### Sheet 2: "Templates" (Reference)
| Column | Header | Content |
|--------|--------|---------|
| A | TemplateID | A, B, C, D, E |
| B | Name | Cold Outreach, Follow-up 1, etc. |
| C | Subject | Email subject line |
| D | Body | Full email template with {{placeholders}} |

### Sheet 3: "OptOuts" (Maintenance)
| Column | Header | Type | Notes |
|--------|--------|------|-------|
| A | Email | String | Email address (lowercase) |
| B | FirstName | String | Person name |
| C | Company | String | Company |
| D | Reason | String | unsubscribe, bounce, complained, etc. |
| E | DateAdded | Date | When opted out |
| F | Notes | String | Why opted out |

---

## API Setup

### Step 1: Create Google Cloud Project (Kiana or admin)
1. Go to console.cloud.google.com
2. Create new project: "V.Two SDR"
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
4. Create two service accounts:
   - **openclaw-sdr** (can read/write sheets)
   - **claude-code-sdr** (can read sheets only)
5. Create JSON credentials for each
6. Store securely (see Step 2)

### Step 2: Store Credentials (Secure)

**For OpenClaw:**
- Location: `workspaces/work/projects/SDR/secrets/google-openclaw-credentials.json` (gitignored)
- Permissions: Read/Write on Prospects sheet, Read on Templates sheet

**For Claude Code:**
- Location: `workspaces/work/projects/SDR/secrets/google-code-credentials.json` (gitignored)
- Permissions: Read on all sheets

### Step 3: Share Google Sheet with Service Accounts
1. Create Google Sheet (or use existing)
2. Note Sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Share with: openclaw-sdr@{project}.iam.gserviceaccount.com (Editor)
4. Share with: claude-code-sdr@{project}.iam.gserviceaccount.com (Viewer)

### Step 4: Document Access
Create `SDR_CONFIG.json` (gitignored):
```json
{
  "google_sheets": {
    "sheet_id": "XXXXXXXXXXXXXXXXXXXX",
    "sheet_name": "Prospects",
    "templates_sheet": "Templates",
    "optouts_sheet": "OptOuts"
  },
  "openclaw": {
    "credentials": "secrets/google-openclaw-credentials.json"
  },
  "claude_code": {
    "credentials": "secrets/google-code-credentials.json"
  }
}
```

---

## OpenClaw Workflow (with Google Sheets)

### Research Phase
1. Research prospects (web_search, LinkedIn, etc.)
2. For each prospect:
   - Validate email (Hunter.io, NeverBounce)
   - Add row to Google Sheet with:
     - FirstName, LastName, Company, Title, Email, LinkedIn, Location, Timezone, Track, Status=pending, DateAdded, Source
3. Commit: `git add SDR_CONFIG.json && git commit -m "research: added N prospects to Google Sheet"`

### Send Execution Phase
1. Read Google Sheet: Prospects with Status=pending
2. Build send-plan.md (same as before)
3. Execute approved sends
4. For each sent email:
   - Update Google Sheet row: Status=sent, LastSent=now
5. For each reply:
   - Update Google Sheet row: Status=replied, LastReply=now, ReplyStatus=positive/negative/neutral/ooo

---

## Claude Code Workflow (with Google Sheets)

### Validation Phase (Daily or On-Demand)
1. Read Google Sheet: All rows with Status=pending OR Status=sent
2. Validate:
   - Email syntax (regex)
   - Email domain exists (MX lookup)
   - Not in OptOuts sheet
   - No duplicates (case-insensitive by email)
3. For invalid rows:
   - Mark with comment or flag (doesn't remove, alerts OpenClaw)
   - Log to console: "{email} failed validation: {reason}"
4. Export validated data to `prospects.json` (TOON format):
   - Only rows with valid emails
   - Include: all columns except Notes (notes go to `no` field in TOON)
   - Metadata: total count, breakdown by track/status

### Sync Phase
```
Google Sheet (Source)
    ↓ [Read via API]
prospects.json (Destination)
    ↓ [Claude Code maintains this]
Dashboard (/api/sdr/metrics, /api/sdr/pipeline)
```

### Implementation (Claude Code Scripts)
Create `scripts/sync-from-sheets.js`:
```javascript
// Pseudocode
const {GoogleSpreadsheet} = require('google-spreadsheet');

// Load credentials
const creds = require('../secrets/google-code-credentials.json');
const config = require('../SDR_CONFIG.json');

// Initialize Sheets API
const doc = new GoogleSpreadsheet(config.google_sheets.sheet_id);
await doc.useServiceAccountAuth(creds);
await doc.loadInfo();

// Read Prospects sheet
const sheet = doc.sheetsByTitle['Prospects'];
const rows = await sheet.getRows();

// Validate each row
const validated = rows.map(validateProspect);
const valid = validated.filter(r => r.valid);
const invalid = validated.filter(r => !r.valid);

// Report invalid
invalid.forEach(r => console.warn(`Invalid: ${r.email} - ${r.reason}`));

// Export valid to TOON format
const toonProspects = valid.map(rowToToon);
const prospects = {
  prospects: toonProspects,
  metadata: {
    tot: valid.length,
    by_tr: {...},
    by_st: {...},
    lu: new Date().toISOString()
  }
};

fs.writeFileSync('prospects.json', JSON.stringify(prospects, null, 2));
```

---

## Data Flow (Corrected)

```
OpenClaw Research
    ↓
Google Sheet (live source)
    ↓
Claude Code reads + validates
    ↓
prospects.json (TOON, canonical for execution)
    ↓
OpenClaw sends (executes from prospects.json)
    ↓
OpenClaw updates Google Sheet (Status, LastSent, LastReply)
    ↓
Claude Code syncs → prospects.json updated
    ↓
Dashboard shows live metrics
```

---

## Advantages of This Setup

✅ **Single source of truth:** Google Sheet (collaborative, always up-to-date)
✅ **Real-time:** Both agents read/write same source (no sync lag)
✅ **Transparency:** Kiana can see all prospects, status, notes anytime
✅ **Audit trail:** Google Sheets timestamps and revision history
✅ **Flexible:** Easy to add columns, adjust tracking without code changes
✅ **Scalable:** Handles 1000+ rows easily
✅ **Integration:** Both Claude Code and OpenClaw have native API access

---

## Setup Checklist

- [ ] Google Cloud Project created
- [ ] Google Sheets API enabled
- [ ] Service accounts created (openclaw-sdr, claude-code-sdr)
- [ ] JSON credentials generated and stored in secrets/
- [ ] Google Sheet created (or existing sheet prepared)
- [ ] Service accounts granted access (Editor for OpenClaw, Viewer for Claude Code)
- [ ] SDR_CONFIG.json created with Sheet ID and credential paths
- [ ] `scripts/sync-from-sheets.js` implemented (Claude Code)
- [ ] OpenClaw tested: Can read/write Google Sheet
- [ ] Claude Code tested: Can read Google Sheet and generate prospects.json
- [ ] prospects.csv removed from repo (no longer needed)

---

## Next Steps

1. **Kiana:** Complete Google Cloud setup and service account creation
2. **Claude Code:** Implement `sync-from-sheets.js` script
3. **OpenClaw:** Verify can read/write to Google Sheet
4. **Test:** End-to-end flow: OpenClaw writes → Claude Code reads → prospects.json generated → dashboard shows data

---

**Status:** Awaiting Google Cloud setup by Kiana before agents can activate.

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

