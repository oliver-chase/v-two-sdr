# SDR Project — Current State
**Date:** March 17, 2026 | **Status:** Phase 2 Complete ✅ + Queue System | **Tests:** 386/386 Passing

---

## Executive Summary

**What:** AI Sales Development Representative system for cold outreach automation
**Status:** Phase 2 + queue system complete, ready for first production run
**Repository:** github.com/saturdaythings/v-two-sdr
**Tests:** 386/386 passing (100%) | Coverage: 60.97% (Phase 3 target: 80%)

---

## What's Built (7 Core Systems)

| System | Status | Purpose | Files |
|--------|--------|---------|-------|
| **Google Sheets Sync** | ✅ Complete | Bidirectional read/write to lead repository | sheets-connector.js, sheets-writer.js, config/config.google-sheets-write.js |
| **Enrichment Engine** | ✅ Complete | Email validation, timezone detection, signal discovery | enrichment-engine.js, hunter-verifier.js |
| **Email Drafting** | ✅ Complete | LLM-powered template generation with 3-tier fallback | draft-emails.js, oauth-client.js |
| **Email Queue System** | ✅ New | Timezone-aware scheduling (Tue-Thu 9-11 AM), persistent queue, graceful processing | send-queue.js, queue-executor.js |
| **Email Sending** | ✅ Complete | Outlook SMTP via Microsoft Graph OAuth, processes queued emails | mailer.js, oauth-client.js |
| **Inbox Monitoring** | ✅ Complete | IMAP reply detection and classification | inbox-monitor.js, reply-classifier.js |
| **Daily Orchestration** | ✅ Complete | 5-step workflow runner: sync → enrich → draft → inbox → report (with [SDR] structured output) | daily-run.js, scripts/* |

---

## Secrets Configured (10 Total)

All secrets are set in GitHub Actions repository settings. Pull via: `Settings → Secrets and variables → Actions`

| Secret | Purpose | Usage | Provider |
|--------|---------|-------|----------|
| **GOOGLE_SHEET_ID** | Lead repository ID | `sheets-connector.readProspects()` | Manual (from Google Sheets URL) |
| **GOOGLE_API_KEY** | Read-only API key | `sheets-connector.authenticate()` (read mode) | Google Cloud Console |
| **GOOGLE_SERVICE_ACCOUNT_EMAIL** | Write service account | `sheets-writer.authenticate()` | Google Cloud Console (service account) |
| **GOOGLE_PRIVATE_KEY** | Service account key | `JWT({email, key})` for Sheets write | Google Cloud Console (service account JSON) |
| **OUTLOOK_TENANT_ID** | Azure tenant ID | Microsoft Graph OAuth flow | Azure Active Directory |
| **OUTLOOK_CLIENT_ID** | OAuth app ID | Microsoft Graph token endpoint | Azure AD registered app |
| **OUTLOOK_CLIENT_SECRET** | OAuth secret | Microsoft Graph token endpoint | Azure AD registered app |
| **OUTLOOK_PASSWORD** | Email login | IMAP fallback (inbox-monitor.js) | Outlook/Microsoft 365 account |
| **ABSTRACT_API_KEY** | Timezone API | `EnrichmentEngine.enrichTimezone()` | AbstractAPI.com |
| **HUNTER_IO_API_KEY** | Email verification | `HunterVerifier.verifyEmail()` | Hunter.io |
| **ANTHROPIC_API_KEY** | LLM tier 1 | Primary drafting model | Anthropic (funding required) |
| **OPENROUTER_API_KEY** | LLM tier 2 | Paid fallback (if Anthropic unavailable) | OpenRouter.ai |
| **OPENROUTER_FREE_KEY** | LLM tier 3 | Free tier fallback | OpenRouter.ai |

---

## Test Status (386/386 Passing)

**Overall:** 100% pass rate | **Coverage:** 60.97% | **Phase 3 Target:** 80%+

| Module | Tests | Coverage | Status |
|--------|-------|----------|--------|
| enrichment-engine.js | 85 | 81.88% | ✅ Above threshold |
| draft-emails.js | 42 | 90% | ✅ Excellent |
| mailer.js | 35 | 90.38% | ✅ Excellent |
| reply-classifier.js | 56 | 94.73% | ✅ Excellent |
| sheets-connector.js | 48 | 59.41% | 🔲 Below threshold (Phase 3) |
| state-machine.js | 35 | 86.79% | ✅ Above threshold |
| send-queue.js | 7 | 64% | ✅ New (queue scheduling) |
| queue-executor.js | 4 | 68.85% | ✅ New (queue processing) |
| hunter-verifier.js | 28 | 57.89% | 🔲 Below threshold (Phase 3) |
| oauth-client.js | 22 | 0% | 🔲 Mocked (Phase 3: integration tests) |
| sheets-writer.js | 24 | 0% | 🔲 Mocked (Phase 3: integration tests) |

**Known Coverage Gaps (Phase 3 work):**
- OAuth client (mocked for Phase 2, needs integration tests)
- Sheets writer (newly integrated, needs unit + integration tests)
- Hunter verifier (email verification network calls)
- Sheets connector (write operations not fully covered)
- Queue system (send-queue.js, queue-executor.js at 64-69%, target 80%+)

---

## Recent Work (Last 3 Sessions)

| Commit | Date | Summary |
|--------|------|---------|
| (Latest) | Mar 17 | feat: add email queue system — timezone-aware scheduling, persistent queue, graceful executor |
| 2de415d | Mar 16 | fix: close 4 critical gaps — protected fields schema + GitHub Actions secrets |
| a5e1206 | Mar 11 | feat: implement full environment variable setup per spec (13K lines, 42 files) |

**Milestone Achievements (This Session):**
- ✅ Timezone-aware send scheduling (Tue-Thu 9-11 AM in prospect timezone)
- ✅ Persistent send queue (outreach/send-queue.json)
- ✅ Queue executor with Mailer integration
- ✅ Updated daily-run.js with [SDR] structured output for OpenClaw parsing
- ✅ Updated send-approved.js to queue instead of immediate sends
- ✅ 11 new tests added (send-queue.test.js: 7, queue-executor.test.js: 4)
- ✅ All 386 tests passing (100%)

**Earlier Milestone Achievements:**
- ✅ All 8 test failures fixed (was 8, now 0)
- ✅ Protected fields schema enforced (Name, Email, Company, Title, DateAdded, FirstContact)
- ✅ GitHub Actions workflow validated (all 10 secrets mapped)
- ✅ Write mode integrated into daily-run.js (stepEnrich)

---

## Column Schema (18 Fields)

Google Sheet columns (left to right) with TOON mappings and protection status:

| # | Sheet Column | TOON | Type | Protected | Writable | Notes |
|---|--------------|------|------|-----------|----------|-------|
| 1 | Name | nm | text | 🔒 YES | ✗ NO | Primary identifier — derives fn (first name) |
| 2 | Title | ti | text | 🔒 YES | ✗ NO | Job title — segment for templates |
| 3 | Company | co | text | 🔒 YES | ✗ NO | Org name — segment for templates |
| 4 | Email | em | email | 🔒 YES | ✗ NO | Contact address — validated by Hunter |
| 5 | Location | loc | text | ✓ NO | ✅ YES | City, State — updated by enrichment |
| 6 | Timezone | tz | text | ✓ NO | ✅ YES | IANA zone (e.g., "America/New_York") |
| 7 | LinkedIn | li | url | ✓ NO | ✅ YES | Profile URL — discovered during research |
| 8 | Company Size | sz | enum | ✓ NO | ✅ YES | 1-10, 11-50, 51-200, 500+ |
| 9 | Industry | ind | text | ✓ NO | ✅ YES | SaaS, FinTech, etc. — extracted from web |
| 10 | Funding | fnd | text | ✓ NO | ✅ YES | Series A, Bootstrap, etc. |
| 11 | Signal | sig | text | ✓ NO | ✅ YES | Intent signal from web search |
| 12 | Source | src | text | ✓ NO | ✅ YES | How prospect was found |
| 13 | Status | st | enum | ✓ NO | ✅ YES | new → email_discovered → draft_generated → ... |
| 14 | Date Added | da | date | 🔒 YES | ✗ NO | When added to sheet — audit trail |
| 15 | First Contact | fc | date | 🔒 YES | ✗ NO | First email date — audit trail |
| 16 | Last Contact | lc | date | ✓ NO | ✅ YES | Most recent email — updated by mailer |
| 17 | Follow-Up Count | fuc | number | ✓ NO | ✅ YES | Number of emails sent — updated by mailer |
| 18 | Next Follow-Up | nfu | date | ✓ NO | ✅ YES | Scheduled next contact — set by state machine |
| 19 | Notes | no | text | ✓ NO | ✅ YES | Enrichment notes, decision notes, etc. |

**Protection Rules:**
- 🔒 Protected fields: Cannot be overwritten by enrichment or write operations
- ✅ Writable fields: Updated by daily-run.js stepEnrich, mailer, reply-classifier
- ✗ Read-only in write mode: Prevents accidental overwrites

---

## Email Queue Architecture (NEW)

Emails are now queued with timezone-aware scheduling instead of sending immediately. This allows:
- **Timezone Optimization:** Sends are scheduled for Tue-Thu 9-11 AM in prospect's local timezone
- **Graceful Processing:** Failed sends are retried, with status tracking
- **Decoupled Workflow:** Drafting and sending are separate steps (allows manual review)

### Send Queue Flow

```
Approved Email
    ↓
send-approved.js (calls queueSend)
    ↓
send-queue.js (calculateNextSendWindow)
    ↓ Calculate next Tue-Thu 9-11 AM in prospect timezone
    ↓
outreach/send-queue.json (append queued item)
    ↓ [Later, when scheduledSendAt arrives]
    ↓
queue-executor.js (executeQueue)
    ↓ Filter: status=queued AND scheduledSendAt <= now
    ↓
mailer.send()
    ↓ Update status → sent/failed, commit to git
```

### Queue Item Schema

```json
{
  "id": "prospect-123",
  "fn": "John",
  "em": "john@example.com",
  "co": "Acme Inc",
  "tz": "America/New_York",
  "ti": "VP Sales",
  "subject": "Email subject line",
  "body": "Email body text",
  "status": "queued",           // queued | sent | failed
  "scheduledSendAt": "2026-03-20T14:30:00Z",  // Next Tue-Thu 9-11 AM UTC
  "queuedAt": "2026-03-17T16:00:00Z",
  "sentAt": "2026-03-20T14:32:00Z"  // (added when sent)
}
```

**Integration Points:**
- `send-approved.js` calls `queueSend(prospect)` from send-queue.js
- `queue-executor.js` runs hourly (via OpenClaw) to process due sends
- Both scripts use `commitToGit()` for audit trail

---

## Daily Run Flow (5 Steps)

Triggered by GitHub Actions at 8 AM ET weekdays, or manually via `node scripts/daily-run.js`

### Step 1: Sync from Google Sheet
```
Read all "Leads" tab rows → TOON conversion → prospects.json
```
- **Input:** Google Sheet with N prospects
- **Output:** prospects.json (local copy)
- **Skipped if:** GOOGLE_SHEET_ID not configured
- **Time:** ~2-5 seconds (depends on sheet size)

### Step 2: Enrich Missing Data
```
For each prospect with status "new" and no email:
  1. Generate email candidates (patterns: fname@company.com, f.last@company.com, etc.)
  2. Verify with Hunter.io API
  3. Assign confidence score
  4. If >= 0.8: write email + status to Google Sheet
  5. Optional: query Abstract API for timezone
```
- **Input:** prospects.json (status = "new", no email)
- **Output:** Updated Google Sheet + prospects.json
- **Skipped if:** HUNTER_IO_API_KEY not configured
- **Rate limiting:** Hunter API quota respected (API calls tracked)

### Step 3: Draft Emails
```
For each prospect with status "email_discovered" and no draft:
  1. Load knowledge base (docs folder)
  2. Call LLM (3-tier: Anthropic → OpenRouter paid → OpenRouter free)
  3. Generate draft (Oliver persona, prospect context)
  4. Update Sheet: Status → "draft_generated", Notes → draft preview
  5. Save draft to proposals/ folder
```
- **Input:** prospects.json (status = "email_discovered")
- **Output:** proposal files + updated Google Sheet
- **Skipped if:** No LLM API keys configured (graceful degradation)
- **Time:** ~5-10 seconds per prospect (LLM latency)

### Step 4: Check Inbox (Optional)
```
Connect to Outlook via IMAP:
  1. Fetch new emails
  2. Classify replies (positive/negative/neutral/ooo)
  3. Update prospect status if reply detected
  4. Log classification confidence
```
- **Input:** Outlook mailbox (oliver@vtwo.co)
- **Output:** Updated Google Sheet + event log
- **Skipped if:** OUTLOOK_PASSWORD not configured or IMAP unavailable
- **Time:** ~3-5 seconds (depends on inbox size)

### Step 5: Report Summary
```
Print daily summary:
  - Prospects synced
  - Emails discovered
  - Drafts generated
  - Replies received
  - API calls used
  - Any errors
```
- **Output:** Console log + optional Telegram notification
- **Time:** <1 second

---

## GitHub Actions Workflow

**File:** `.github/workflows/daily-sdr.yml`

**Schedule:**
- **Trigger:** 0 13 * * 1-5 (8:00 AM ET, Monday-Friday)
- **Manual trigger:** Yes (Actions → SDR Daily Run → Run workflow)
- **Runner:** ubuntu-latest | Node 20

**Secrets Passed:**
```yaml
# Azure OAuth (Email Sending & Inbox)
OUTLOOK_TENANT_ID
OUTLOOK_CLIENT_ID
OUTLOOK_CLIENT_SECRET
OUTLOOK_PASSWORD

# Google Sheets (Read & Write)
GOOGLE_SHEET_ID
GOOGLE_API_KEY
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY

# Enrichment APIs
ABSTRACT_API_KEY
HUNTER_IO_API_KEY

# LLM Fallback Chain
ANTHROPIC_API_KEY
OPENROUTER_API_KEY
OPENROUTER_FREE_KEY
```

**Steps:**
1. Checkout code
2. Setup Node 20, npm cache
3. Install dependencies
4. Run: `node scripts/daily-run.js` (sync → enrich → draft → inbox → report)
5. Run: `node scripts/inbox-monitor.js` (check for replies, ignore failures)

---

## First Run Checklist

Before first automated run, verify locally:

- [ ] **Add test prospect** to "Leads" tab in Google Sheet
  - Example: John Smith | Engineer | TechCorp | john.smith@techcorp.com | ...
  - Minimal required: Name, Title, Company, Email

- [ ] **Run enrichment locally** (5 minutes)
  ```bash
  node scripts/daily-run.js --step=enrich
  ```
  - Verify output: "Enriched X prospects"
  - Check prospectsl.json: Status updated to "email_discovered"
  - Check Google Sheet: New columns populated (Timezone, Location, Signal if available)

- [ ] **Verify Google Sheet updated**
  - Email column: populated
  - Status column: "email_discovered"
  - Timezone column: populated (e.g., "America/New_York")
  - Notes column: Hunter verification confidence

- [ ] **Verify oauth-token.json created** (token cache)
  - If present: `ls -la oauth-token.json`
  - Indicates Outlook OAuth successful (ready for inbox monitoring)

- [ ] **Check logs for errors**
  - Look for any API failures, auth errors, network timeouts
  - If errors: Review CURRENT_STATE.md § First Run Troubleshooting

- [ ] **If successful: Enable GitHub Actions**
  - Commit .env changes (or ensure secrets in GitHub)
  - Next Monday at 8 AM ET: Workflow runs automatically
  - Monitor via Actions tab in GitHub

---

## First Run Troubleshooting

If enrichment step fails, check in order:

| Error | Cause | Fix |
|-------|-------|-----|
| "GOOGLE_SHEET_ID not set" | Missing environment variable | Add to .env or GitHub Secrets |
| "Cannot read properties of undefined (reading 'sheets')" | Sheet not found or no access | Verify sheet ID, check sharing permissions |
| "Invalid API key" | GOOGLE_API_KEY incorrect | Regenerate in Google Cloud Console |
| "HUNTER_IO_API_KEY not set" | Missing Hunter.io API key | Create free Hunter account, add to secrets |
| "Hunter.io rate limited (429)" | Too many API calls | Reduce prospect batch size, wait 60s, retry |
| "No LLM API keys configured" | All three LLM keys missing | Add ANTHROPIC_API_KEY or OPENROUTER_API_KEY |
| "Sheets writer not configured" | Missing service account secrets | Follow SHEETS_WRITE_QUICK_START.md setup |

---

## Next Steps (After First Run Succeeds)

### Week 1: Daily Monitoring
- Check GitHub Actions workflow every morning (Status tab)
- Monitor inbox for replies (manually, via Outlook)
- Verify Google Sheet updates correctly

### Week 2: Scaling Phase (10 prospects/day)
- Add 10 new prospects to "Leads" tab Monday morning
- Let daily-run sync and enrich automatically
- Review 5 drafts, approve via dashboard (Phase 3)
- Send 5 emails manually or via approval workflow

### Week 3: Scale to 15/day (10 days)
- Repeat: add 15 new prospects
- Monitor reply rate, adjust template if needed

### Week 4: Scale to 20/day (20 days)
- Continue scaling
- Track key metrics: discovery rate, draft quality, reply rate

### Ongoing: Scale to 25/day
- Full production mode
- Monitor: open rates, reply rates, opt-outs
- Quarterly: adjust targeting, templates, follow-up sequences

---

## Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| **sheets-connector.js** | 646 | Core Google Sheets connector (read & write operations) |
| **sheets-writer.js** | 297 | Service account OAuth + write methods (enrichment integration) |
| **scripts/daily-run.js** | 298 | Master orchestration (5-step workflow) |
| **scripts/enrichment-engine.js** | 520 | Email discovery + timezone + signal detection |
| **scripts/hunter-verifier.js** | 215 | Hunter.io API integration (email validation) |
| **scripts/draft-emails.js** | 380 | LLM template generation + approval workflow |
| **scripts/mailer.js** | 256 | Outlook SMTP email sending (OAuth-based) |
| **scripts/oauth-client.js** | 299 | Microsoft Graph OAuth flow + token management |
| **scripts/inbox-monitor.js** | 185 | IMAP reply detection + classification |
| **scripts/reply-classifier.js** | 190 | LLM-based reply sentiment analysis |
| **scripts/state-machine.js** | 380 | Lead lifecycle enforcement (status transitions) |
| **scripts/approve-drafts.js** | 142 | Draft approval CLI + feedback loop |
| **scripts/send-approved.js** | 80 | Queue approved emails (calls send-queue.js) |
| **scripts/send-queue.js** | 204 | NEW: Queue emails with timezone-aware scheduling (Tue-Thu 9-11 AM) |
| **scripts/queue-executor.js** | 158 | NEW: Process send queue, send due emails, update statuses |
| **scripts/validate-prospects.js** | 98 | Data validation + TOON schema check |
| **config/config.google-sheets-write.js** | 72 | Write mode configuration (protected fields) |
| **config.sheets.js** | 89 | Read mode configuration (field mappings) |
| **config.email.js** | 24 | Email sender settings (name, BCC, delays) |
| **jest.config.js** | 34 | Test framework configuration |
| **.github/workflows/daily-sdr.yml** | 63 | GitHub Actions scheduling + secrets |

**Total Production Code:** ~3,934 lines (added send-queue.js + queue-executor.js) | **Tests:** 386 passing | **Docs:** 12 MD files

---

## Security & Compliance

✅ **Credentials Management:**
- All secrets in GitHub Actions (not in .env or code)
- .gitignore protects local .env files
- Service account (not user OAuth) for Google Sheets

✅ **Protected Fields:**
- Name, Email, Company, Title, DateAdded, FirstContact cannot be overwritten
- Validation enforced in SheetsWriter.updateProspectRow()

✅ **Data Privacy:**
- TOON format reduces token usage (60-80% reduction)
- Sensitive data (emails, names) hashed in analytics exports
- No logging of email addresses or API keys

✅ **API Rate Limiting:**
- Google Sheets: 300 requests/min (tracked, auto-retry 3x)
- Hunter.io: Plan-based limits (free: 100/month, paid: unlimited)
- Abstract API: 300 requests/month (free), 300/day (paid)

✅ **Error Handling:**
- Graceful degradation (missing API keys = skip step, continue)
- Retry logic (exponential backoff: 1s → 2s → 4s)
- Comprehensive error logging (no data leaks)

---

## Support & Resources

**Setup Questions?**
- Google Sheets: See `SHEETS_WRITE_QUICK_START.md`
- OAuth: See `OAUTH_AUDIT_SUMMARY.md`
- Architecture: See `ARCHITECTURE.md`

**Code Questions?**
- Enrichment: `scripts/enrichment-engine.js` (inline comments)
- Email: `scripts/mailer.js` + `scripts/oauth-client.js`
- State machine: `scripts/state-machine.js` (status transitions)

**Running Tests?**
```bash
npm test                      # All tests
npm test -- --coverage        # With coverage report
npm test -- sheets-connector  # Single test suite
npm test -- --watch          # Watch mode (development)
```

---

**Status:** ✅ Ready for production (with queue system) | **Last Updated:** March 17, 2026 (Queue System Complete)

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

