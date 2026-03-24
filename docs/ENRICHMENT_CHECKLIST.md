# Data Enrichment Checklist & Validation Guide

**Version:** 1.0
**Purpose:** Definitive rules for what to search, validate, and update during prospect enrichment

---

## Overview

Data enrichment is the process of finding missing information for prospects before drafting outreach. This checklist defines:

1. **What to search for** — specific data fields and signals
2. **Where to look** — APIs, web search, free tools
3. **Validation rules** — how to verify data before using
4. **What to update in Sheet** — which columns to populate vs. leave blank
5. **How to flag uncertainty** — marking low-confidence data

---

## Part 1: Field-by-Field Enrichment Rules

### Required Fields (Must Fill or Flag)

#### 1. Email Address

**Purpose:** The core contact point for outreach

**Search Strategy:**
```
Pattern matching:
  • {first}{last}@{domain}
  • {first}.{last}@{domain}
  • {first}_{last}@{domain}
  • {first}@{domain}
  • {last}@{domain}
  • {initials}@{domain}

Sources:
  1. LinkedIn profile (direct email if shown)
  2. Company domain + standard patterns
  3. Hunter.io free tier (5 lookups/month)
  4. RocketReach (if available)
  5. Company website (team/contact page)
```

**Validation:**

```
FOR EACH email candidate:
  A. Format validation
     ├─ Matches RFC 5322 pattern
     ├─ No obvious errors (typos, spaces)
     └─ Domain exists and has MX records

  B. Deliverability check (free tier)
     ├─ Run Never Bounce API (1 lookup/sec)
     ├─ Check if email is valid/risky/invalid
     ├─ Accept if: valid or valid_catchall
     └─ Flag if: risky or invalid

  C. Confidence scoring
     ├─ 0.9–1.0: Direct LinkedIn match + MX verified
     ├─ 0.8–0.89: Pattern match + MX + deliverability confirmed
     ├─ 0.7–0.79: Pattern match + MX verified, no deliverability check
     ├─ 0.5–0.69: Pattern match only, MX or deliverability failing
     └─ <0.5: Uncertain guess, needs manual verification
```

**Sheet Update Rule:**
```
IF confidence >= 0.8:
  → Write email to Sheet column "Email"
  → Done

ELSE IF confidence 0.5–0.79:
  → Do NOT write to Sheet
  → Flag in Notes: "? email candidate: {email} (score: 0.68)"
  → Queue for user review before drafting

ELSE (< 0.5):
  → Do NOT write to Sheet
  → Flag in Notes: "⚠️ Email discovery failed. Manual search needed."
  → Skip this prospect until email confirmed
```

**Examples:**

```
✅ Confidence 0.95:
   Prospect: John Doe, CTO @ Acme Corp
   Email found: john.doe@acme.com
   Source: Company website team page
   Validation: MX verified, Never Bounce "valid"
   → Write to Sheet immediately

⚠️  Confidence 0.72:
   Prospect: Jane Smith, VP Eng @ TechStart
   Email candidate: jane.smith@techstart.com
   Source: Pattern match (domain extracted from LinkedIn)
   Validation: MX verified, but Never Bounce says "risky"
   → Flag in Notes: "? jane.smith@techstart.com (0.72, Never Bounce risky)"
   → Wait for user review before drafting

❌ Confidence 0.45:
   Prospect: Bob Johnson, Dir of Eng @ SoftCorp
   Email candidates: bob@softcorp.com, b.johnson@softcorp.com
   Source: Guessed from domain
   Validation: MX exists, but emails not found by Hunter
   → Flag in Notes: "⚠️ Email discovery failed. Domain is softcorp.com."
   → Skip enrichment, queue for manual verification
```

---

#### 2. Timezone

**Purpose:** Determines send window (9–11 AM and 1–3 PM in prospect's local time)

**Search Strategy:**
```
Sources (in order of preference):
  1. LinkedIn profile (location field)
  2. Company headquarters address (web_fetch)
  3. Abstract API free tier (timezone lookup by IP, if email domain known)
  4. Assume company HQ timezone if individual not found

Extraction logic:
  IF "New York, NY" → "America/New_York"
  IF "San Francisco, CA" → "America/Los_Angeles"
  IF "London, UK" → "Europe/London"
  IF "Singapore" → "Asia/Singapore"
  IF "Tokyo, Japan" → "Asia/Tokyo"
  → Use IANA timezone format (not "EST" or "PST")
```

**Validation:**

```
Must be valid IANA timezone:
  ✅ "America/New_York"
  ✅ "Europe/London"
  ✅ "Asia/Tokyo"
  ❌ "EST" (not standard)
  ❌ "GMT-5" (use IANA format instead)

Confidence scoring:
  • 0.95: LinkedIn explicit location (e.g., "New York, NY")
  • 0.85: Company HQ in location, employee at HQ office
  • 0.70: Company HQ timezone (assume employee based there)
  • 0.50: Guessed from domain location
  • <0.50: Unknown, skip
```

**Sheet Update Rule:**
```
IF confidence >= 0.7:
  → Write IANA timezone to Sheet column "Timezone"
  → Done

ELSE IF confidence 0.5–0.69:
  → Do NOT write to Sheet
  → Flag in Notes: "? Timezone: possibly {timezone} (company HQ)"
  → Use default company HQ timezone for scheduling

ELSE (< 0.5):
  → Do NOT write to Sheet
  → Use company HQ timezone as default
```

---

#### 3. Company Details (if missing)

**Purpose:** Provide context for drafting and track assignment

**Fields to enrich:**
- Company Size (e.g., "50–100", "500–1000", "10,000+")
- Industry (e.g., "AI/ML", "SaaS", "Finance", "Healthcare")
- Annual Revenue (e.g., "$1M–$5M", "$50M–$100M", "$1B+")

**Search Strategy:**

```
Company Size:
  1. LinkedIn company page (if accessible)
  2. web_fetch company website (look for "About" section)
  3. Crunchbase free tier (if available)
  4. Company size keywords in recent news

Industry:
  1. Company website mission/tagline
  2. LinkedIn company page (industry field)
  3. web_search "{company name} industry SaaS AI finance"
  4. Crunchbase classification

Annual Revenue:
  1. LinkedIn (sometimes shown)
  2. Crunchbase
  3. Press releases (funding announcements)
  4. web_search "{company name} funding revenue"
```

**Validation:**

```
Company Size:
  ✅ "50–100 employees"
  ✅ "500–1000"
  ✅ "10,000+"
  ✅ "Mid-market (200–500)"
  ❌ Avoid: "large", "small" (be specific)

Industry:
  ✅ Use industry from context (SaaS, AI/ML, Finance, Healthcare, etc.)
  ✅ Multiple categories allowed (e.g., "AI/ML + Enterprise SaaS")
  ❌ Avoid vague: "Technology" (too broad)

Annual Revenue:
  ✅ "$1M–$5M"
  ✅ "$50M–$100M"
  ✅ "$1B+ (unicorn)"
  ❌ Avoid: "High revenue" (be specific if known)
```

**Sheet Update Rule:**
```
IF confidence >= 0.8:
  → Write to Sheet columns (Company Size, Industry, Annual Revenue)
  → Done

ELSE IF confidence 0.6–0.79:
  → Do NOT write to Sheet
  → Flag in Notes: "? Company size: ~{size} (web search found {source})"
  → Use for drafting context but don't commit to sheet

ELSE (< 0.6):
  → Skip, don't flag
  → Leave blank on sheet
```

---

### Optional Enrichment (For Drafting Context Only)

These fields **should NOT be written to the Google Sheet columns** — they're for drafting context and notes only.

#### 4. Recent Signals (Hiring, Funding, News)

**Purpose:** Personalization hooks and track assignment

**Search Strategy:**

```
Web search queries:
  • "{Company Name} hiring 2025"
  • "{Company Name} funding announcement"
  • "{Company Name} product launch"
  • "{Company Name} acquisition"
  • "{Company Name} AI" (for AI adoption signals)

Look for:
  • Job openings (especially for engineer, CTO, VP Eng roles)
  • Series A/B/C funding rounds
  • Product launches or updates
  • Recent acquisitions
  • Partnerships with AI companies
  • Growth signals (new offices, expansion)

Validation:
  ✅ Must have publication date (recency < 3 months is best)
  ✅ Must be from credible source (news site, LinkedIn, official blog)
  ❌ Avoid: Speculation, outdated info, unverified claims
```

**Sheet Update Rule:**
```
NEVER write raw signals to columns. Instead:
  → Append to Notes column: "Signal: {signal}. Source: {publication}, {date}"

Example:
  Notes: "Signal: Hired CTO (Feb 2026, LinkedIn). Using AI signals."
  Notes: "Signal: Series B announced ($50M, TechCrunch, Mar 2026)."
```

---

#### 5. LinkedIn Profile URL

**Purpose:** Verify prospect details, add to CRM

**Search Strategy:**

```
LinkedIn search:
  • Query: "{First Name} {Last Name} {Company Name} LinkedIn"
  • Verify: Title matches, company matches, profile is active
  • Extract URL: linkedin.com/in/{username}

Validation:
  ✅ Title matches (or is related to outreach hook)
  ✅ Company matches (or recently worked there)
  ✅ Profile is not default/spam
  ✅ URL is valid LinkedIn profile
```

**Sheet Update Rule:**
```
IF found and verified:
  → Write LinkedIn URL to "LinkedIn" column
  → Done

ELSE:
  → Leave blank
  → Note in Notes: "LinkedIn not found" (if worth tracking)
```

---

#### 6. Buying Signals & Track Assignment

**Purpose:** Determine positioning track (AI Enablement, Product Maker, Pace Car)

**Track Mapping Logic:**

```
AI ENABLEMENT Track:
  Signals:
    • Title: CTO, Chief AI Officer, VP Infrastructure
    • Company: Hiring for AI/ML roles
    • News: "Launching AI governance" / "Building AI safely"
    • Size: Enterprise (500+)
  Hook: "We build what's missing for AI to work at scale"

PRODUCT MAKER Track:
  Signals:
    • Title: Founder, CTO, VP Product, Head of Eng (early-stage focus)
    • Company: Pre-Series C, active hiring
    • News: "Raised Series A/B" / "Launching new product"
    • Size: Startup (20–200)
  Hook: "We own the product build so you don't have to split attention"

PACE CAR Track:
  Signals:
    • Title: VP Engineering, Engineering Manager, Tech Lead
    • Company: Scaling (100–500 employees)
    • News: "Growing fast" / "Expanding eng team"
    • Size: Growth-stage (50–500)
  Hook: "Senior engineers who slot in and accelerate what you're building"
```

**Sheet Update Rule:**
```
IF track can be assigned confidently:
  → Write to Notes: "Track: {track} — {reason}"
  → Example: "Track: Product Maker — Series B, early-stage founder"

ELSE:
  → Leave Notes blank for track
  → Drafting engine will attempt assignment based on title/company
```

---

## Part 2: Validation Checklist (Per Prospect)

Use this checklist for EACH prospect before marking as "email_discovered" and eligible for drafting:

```
ENRICHMENT VALIDATION CHECKLIST
═════════════════════════════════════════════════

Prospect: {Name}
Company: {Company}
Title: {Title}

REQUIRED FIELDS:
  □ Email address
    ├─ Format valid (RFC 5322): YES / NO
    ├─ MX record exists: YES / NO
    ├─ Never Bounce check: VALID / RISKY / INVALID
    ├─ Confidence score: {0.00–1.00}
    └─ Action: WRITE_TO_SHEET / FLAG_NOTES / SKIP

  □ Timezone
    ├─ Valid IANA format: YES / NO
    ├─ Source: {LinkedIn / Company HQ / Abstract API / Guessed}
    ├─ Confidence score: {0.00–1.00}
    └─ Action: WRITE_TO_SHEET / FLAG_NOTES / USE_DEFAULT

OPTIONAL FIELDS (for drafting context):
  □ Company Size
    ├─ Found: YES / NO / PARTIAL
    ├─ Confidence: {HIGH / MEDIUM / LOW}
    └─ Action: WRITE_TO_SHEET / USE_FOR_DRAFT_ONLY / SKIP

  □ Industry
    ├─ Found: YES / NO
    ├─ Industry: {SaaS / AI/ML / Finance / Healthcare / Other}
    └─ Action: WRITE_TO_SHEET / USE_FOR_DRAFT_ONLY / SKIP

  □ Recent Signals
    ├─ Found: YES / NO
    ├─ Signals: {hiring / funding / launch / other}
    └─ Action: APPEND_TO_NOTES / USE_FOR_DRAFT_ONLY / SKIP

  □ Track Assignment
    ├─ Track: {AI Enablement / Product Maker / Pace Car}
    ├─ Confidence: {HIGH / MEDIUM / LOW}
    └─ Action: WRITE_TO_NOTES / USE_FOR_DRAFT_ONLY / SKIP

VALIDATION SUMMARY:
  □ No hallucinated data
  □ All required fields have confidence >= 0.7 or flagged
  □ Email address is verified (confidence >= 0.8)
  □ Timezone is set (at least to company HQ)
  □ Ready for drafting: YES / NO

FLAGGING (if confidence < 0.8):
  □ Email: "? {email} (score: {0.XX})"
  □ Company: "? {field}: {value} (source: {source})"
  □ Signal: "Recent: {signal} ({date}, {source})"

═════════════════════════════════════════════════
```

---

## Part 3: What To Update vs. Leave Blank

### Google Sheet Column Update Rules

| Column | Update Rule | Example |
|--------|-------------|---------|
| **Name** | Given by user | John Doe (don't enrich) |
| **Title** | Given by user | CTO (don't enrich) |
| **Company** | Given by user | Acme Corp (don't enrich) |
| **Email** | ONLY if confidence >= 0.8 | john.doe@acme.com ✅ |
| **City** | Given by user | San Francisco (don't enrich) |
| **State** | Given by user | CA (don't enrich) |
| **Country** | Given by user | USA (don't enrich) |
| **Timezone** | Write if confidence >= 0.7 | America/Los_Angeles ✅ |
| **Company Size** | Write if confidence >= 0.8 | 500–1000 ✅ |
| **Annual Revenue** | Write if confidence >= 0.8 | $50M–$100M ✅ |
| **Industry** | Write if confidence >= 0.8 | SaaS ✅ |
| **Source** | Given by user | LinkedIn (don't enrich) |
| **Status** | Update by system | email_discovered (✅ update) |
| **Date Added** | Given by user | 2026-03-16 (don't enrich) |
| **First Contact Date** | Set on first send | 2026-03-16 (don't enrich before send) |
| **Notes** | APPEND enrichment flags | `? email: john.doe@acme.com (0.72)` ✅ |

### Notes Column Rules

**DO append to Notes:**
```
✅ "Enriched 2026-03-16: Email = john.doe@acme.com (MX verified, NB: valid, confidence: 0.92)"
✅ "? email candidate: jane.smith@techstart.com (confidence: 0.68 — Never Bounce: risky)"
✅ "Signal: Hired CTO in Feb 2026 (LinkedIn). Strong hiring signal."
✅ "Track: Product Maker — Series B founder, early-stage growth"
✅ "? Timezone: ~America/Pacific (company HQ in SF)"
```

**DO NOT write:**
```
❌ "John is a great contact" (subjective)
❌ "Need to follow up" (this is tracked elsewhere)
❌ "Duplicate of ID 123" (use system dedup logic)
❌ Random observations (keep notes structured and factual)
```

---

## Part 4: Confidence Scoring Framework

Use this framework to assign confidence scores consistently.

### Email Confidence Scoring

```
1.0  — Email confirmed by LinkedIn profile, directly shown
0.95 — Email from company website (team page, staff directory)
0.90 — Email found by web search + MX verified + Never Bounce "valid"
0.85 — Pattern match (first.last@domain) + MX verified + NB "valid"
0.80 — Pattern match + MX verified, but NB "risky" (still usable)
0.75 — Pattern match + MX verified, no deliverability check
0.70 — MX verified, but pattern not confirmed anywhere
0.65 — Pattern match only, MX verification failed
0.55 — Multiple candidate emails, unclear which is correct
0.40 — Company domain not found or multiple candidates with low signals
0.20 — Guessed email, no validation sources
0.0  — No email found
```

### Timezone Confidence Scoring

```
0.95 — LinkedIn profile shows explicit location (e.g., "San Francisco, CA")
0.85 — Company HQ location + employee appears to be at main office
0.75 — Company HQ timezone, no individual location data
0.65 — Timezone inferred from email domain
0.50 — Partial information, educated guess
0.0  — No timezone information
```

### Company Info Confidence Scoring

```
0.95 — LinkedIn company profile, official field
0.90 — Web fetch of company website
0.85 — Recent news article with specific information
0.75 — Multiple sources agreeing
0.65 — One source, recent
0.50 — Partial information or outdated
0.0  — Not found
```

---

## Part 5: Handling Special Cases

### Case 1: Email Address Exists But Bounces

```
Situation:
  Email found: john.doe@acme.com
  MX verified: YES
  Never Bounce: INVALID (email doesn't exist)

Action:
  → Mark confidence as 0.40
  → Flag in Notes: "⚠️ Email bounces (NB: invalid)"
  → Do NOT write to Sheet
  → Queue for manual verification
```

### Case 2: Multiple Email Candidates

```
Situation:
  Found 3 candidates:
    1. john.doe@acme.com (company website)
    2. j.doe@acme.com (LinkedIn)
    3. jdoe@acme.com (web search)

Action:
  → Choose most likely (usually company website)
  → Confidence: 0.85 (source: company website)
  → Write most likely to Sheet
  → Note alternatives in Notes: "Also: j.doe@acme.com, jdoe@acme.com"
```

### Case 3: Email Not Found, Company Unknown

```
Situation:
  Prospect: Jane Smith, CTO @ SoftCorp
  Company website: Not reachable or doesn't exist
  LinkedIn: No direct email
  Domain: "softcorp.com" or similar found

Action:
  → Generate pattern match: jane.smith@softcorp.com
  → Confidence: 0.45 (unverified)
  → Flag in Notes: "⚠️ Email discovery failed. Domain: softcorp.com"
  → Do NOT write to Sheet
  → Skip drafting until verified
```

### Case 4: Prospect Recently Changed Company

```
Situation:
  Prospect: Bob Johnson
  LinkedIn shows: Dir of Eng @ NewTech (current)
  Also worked at: OldCorp (2–6 months ago)

Action:
  → Use current company (NewTech)
  → Note in Notes: "Recently joined from OldCorp (Feb 2026)"
  → Search for email at NewTech, not OldCorp
  → Confidence may be lower if NewTech is too new
```

### Case 5: Title Misalignment

```
Situation:
  Prospect: Listed as "VP Product" in source
  LinkedIn shows: "Senior Product Manager"

Action:
  → Use LinkedIn as source of truth (updated)
  → Note discrepancy: "LinkedIn shows 'Senior PM' (updated from 'VP Product')"
  → Use correct title for drafting (senior PM messaging different from VP)
```

---

## Part 6: Enrichment Summary Report

After enriching a batch of prospects, generate this summary:

```
ENRICHMENT RUN SUMMARY
═════════════════════════════════════════════════

Date: 2026-03-16
Prospect batch: "New - Mar 16" (10 prospects)

RESULTS:
  ✅ Email discovered: 7 (70%)
     ├─ Confidence >= 0.8: 6 (auto-draft)
     └─ Confidence 0.5–0.79: 1 (user review)

  ❓ Email flagged: 2 (20%)
     └─ Needs manual verification

  ❌ Email not found: 1 (10%)
     └─ Domain not found

  ✅ Timezone enriched: 8 (80%)
     ├─ Explicit location: 3
     └─ Company HQ: 5

  ✅ Company info enriched: 6 (60%)
     ├─ Size: 5, Industry: 6, Revenue: 2

  ✅ Signals found: 4 (40%)
     ├─ Hiring: 3, Funding: 1

  ✅ Track assigned: 7 (70%)
     ├─ AI Enablement: 2
     ├─ Product Maker: 3
     └─ Pace Car: 2

NEXT STEPS:
  • 6 prospects ready for drafting (confidence >= 0.8)
  • 1 prospect needs email review (confidence: 0.68)
  • 2 prospects hold for manual email discovery
  • 1 prospect: company domain not found (research needed)

═════════════════════════════════════════════════
```

---

## Summary

**Enrichment workflow:**
1. For EACH prospect, gather data on: email, timezone, company size, industry, signals
2. Validate each field using the rules above
3. Calculate confidence score (0–1)
4. If confidence >= 0.8, write to Sheet; otherwise flag in Notes
5. Never write uncertain data to Sheet columns (use Notes instead)
6. Always mark enrichment with date, source, and confidence
7. Queue low-confidence items for user review before drafting

**Core principle:** Verify before writing. When in doubt, flag with "?" and ask.

---

**Last Updated:** 2026-03-16
**Version:** 1.0 (Design Complete)

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

