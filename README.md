# Oliver Chase SDR System

**Status:** Phase 2 Complete ✅ | **Infrastructure:** Shipped & Ready for Production

Sales Development Representative system with Google Sheets integration, prospect enrichment, email drafting, and analytics.

---

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
See: `CURRENT_STATE.md` for complete environment setup

```bash
# GitHub Secrets are already configured for GitHub Actions
# For local testing, create .env with values from .env.example
# Required: 12 secrets (Outlook, Google, APIs, LLM providers)
```

### 3. Run Sync
```bash
npm run sync
```

### 4. Verify
```bash
npm test
cat prospects.json
```

---

## Architecture

### Current Phase (2/3) — Phase 2 Complete

**Phase 1 (Foundation):** ✅ Mar 11-17
- Chunk 1: ✅ Cleanup & file reorganization
- Chunk 2: ✅ Google Sheets integration
- Chunk 3: ✅ Enrichment engine (email validation, web search)
- Chunk 4: ✅ Lead state machine

**Phase 2 (Execution + Intelligence):** ✅ Mar 16 (Complete)
- Chunk 5: ✅ Email drafting + approval workflow
- Chunk 6: ✅ Inbox monitoring + reply classification
- Chunk 7: ✅ CLI & daily orchestration

**Phase 3 (Analytics):** 📋 In Progress
- Chunk 8: 📋 Event logging, metrics, dashboard

### Data Flow

```
Google Sheet (Source)
    ↓ [Sync]
prospects.json (TOON Format)
    ↓ [Enrich]
prospects.json + enrichment metadata
    ↓ [Draft]
Email drafts (awaiting approval)
    ↓ [Send]
Sent emails (tracked)
    ↓ [Monitor]
Replies (classified)
    ↓ [Metrics]
Dashboard analytics
```

---

## Available Commands

```bash
# Sync prospects from Google Sheet
npm run sync
npm run sync -- --validate
npm run sync -- --verbose

# Run tests
npm test
npm test -- --watch
npm test -- --coverage

# Validate prospects.json
npm run validate
npm run validate prospects.json

# Watch mode (development)
npm test -- --watch
```

---

## Documentation

- **[SHEETS_CONNECTOR.md](docs/SHEETS_CONNECTOR.md)** — API reference, usage guide
- **[GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md)** — Step-by-step setup
- **[PHASE1_CHUNK2_COMPLETE.md](docs/PHASE1_CHUNK2_COMPLETE.md)** — Project summary
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System design overview

---

## Project Structure

```
workspaces/work/projects/SDR/
├── sheets-connector.js              # Core Google Sheets connector
├── config.sheets.js                 # Configuration
├── jest.config.js                   # Test setup
├── package.json                     # Dependencies
├── .gitignore                       # Credential protection
├── scripts/
│   ├── validate-prospects.js        # Data validation
│   └── sync-from-sheets.js          # Sync CLI command
├── tests/
│   └── sheets-connector.test.js     # Comprehensive tests (48+)
├── docs/
│   ├── SHEETS_CONNECTOR.md
│   ├── GOOGLE_CLOUD_SETUP.md
│   └── PHASE1_CHUNK2_COMPLETE.md
├── prospects.json                   # Generated (TOON format)
├── secrets/                         # Credentials (gitignored)
└── logs/                            # Sync logs (gitignored)
```

---

## Key Features (Chunk 2)

✅ **Google Sheets Integration**
- Service account authentication
- Dynamic schema inference
- Field mapping confirmation
- Read/write operations
- Batch optimization
- Rate limiting

✅ **TOON Format** (Token Optimization)
- Abbreviated field names
- 60% token reduction per prospect
- Metadata tracking

✅ **Testing**
- 48+ tests
- 80%+ coverage
- Mocked APIs
- Unit + integration tests

✅ **Documentation**
- API reference
- Setup guide
- Troubleshooting

---

## Configuration

Edit `config.sheets.js`:

```javascript
const config = {
  google_sheets: {
    sheet_id: 'YOUR_SHEET_ID',           // From spreadsheet URL
    sheet_name: 'Prospects',              // Tab name
    templates_sheet: 'Templates',         // Optional
    optouts_sheet: 'OptOuts'             // Optional
  },
  credentials_path: './secrets/google-code-credentials.json'
};
```

---

## Environment Variables

```bash
# Override sheet ID
export GOOGLE_SHEETS_ID=your-sheet-id

# Override credentials path
export GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json

# Set log level (debug, info, warn, error)
export LOG_LEVEL=debug
```

---

## Troubleshooting

### Common Issues

**"Credentials file not found"**
- Download from Google Cloud Console
- Save to `secrets/google-code-credentials.json`

**"Sheet 'Prospects' not found"**
- Check sheet tab name (case-sensitive)
- Update `config.sheets.js`

**"The caller does not have permission"**
- Verify service account is shared on sheet
- Check permissions (Viewer for Claude Code, Editor for OpenClaw)

See full troubleshooting: `docs/GOOGLE_CLOUD_SETUP.md`

---

## Testing

```bash
# Run all tests with coverage
npm test

# Watch mode (re-run on file changes)
npm test -- --watch

# Run specific test file
npm run test:sheets

# Run with verbose output
npm test -- --verbose
```

**Coverage Target:** 80%+ (achieved)

---

## Data Format (TOON)

### Prospect Schema
```json
{
  "id": "p-000001",
  "fn": "First",
  "ln": "Last",
  "em": "email@domain.com",
  "co": "Company",
  "ti": "Title",
  "li": "linkedin.com/in/...",
  "lo": "City, State",
  "tz": "America/New_York",
  "tr": "ai-enablement",
  "st": "new",
  "ad": "2026-03-11"
}
```

### Valid Values

**Track:** ai-enablement | product-maker | pace-car

**Status:** new | email_discovered | draft_generated | awaiting_approval | email_sent | replied | closed_positive | closed_negative | opted_out | bounced

---

## Next Phase

**Phase 2 (Chunk 3):** Enrichment Engine
- Email validation + confidence scoring
- Web search integration
- Company context extraction

See: `ROADMAP.md`

---

## Support

- **Questions:** Check documentation in `docs/`
- **Issues:** Run tests, check troubleshooting section
- **Debugging:** Enable verbose logging: `LOG_LEVEL=debug npm run sync`

---

## Security

- ✅ Credentials in `.gitignore` (never committed)
- ✅ Service account (not user OAuth)
- ✅ Environment variable support
- ✅ No secrets in logs
- ✅ Minimal permissions (Viewer for read-only)

---

**Version:** 1.0 | **Phase:** 1 Chunk 2 | **Status:** Complete ✅

For detailed API reference, see: `docs/SHEETS_CONNECTOR.md`
