# OpenClaw Email Discovery Strategy

**Cost Model:** Zero API verification | Research-first | Pay-as-you-go bounces

---

## Overview

Instead of verifying emails with APIs ($49-199/month), OpenClaw researches company email patterns and the system uses intelligent guessing. **Email verification only happens if emails bounce** (Phase 3).

This saves **$0 upfront** while maintaining high quality through OpenClaw's web search expertise.

---

## Your Job: Research & Pattern Discovery

For each prospect, OpenClaw should spend ~10 minutes finding:

### Step 1: Discover Company Email Format

Run these web searches (in order, stop when pattern is clear):

```
1. "{company name} email format"
   Example: "V.Two email format"
   Look for: firstname.lastname, first.last, f.lastname, etc.

2. site:{domain} employee email
   Example: site:v-two.co employee email
   Look for: Real examples like john.smith@v-two.co

3. "{domain} email addresses"
   Example: "v-two.co email addresses"
   Look for: Pattern examples in results

4. "{company name} team email"
   Example: "V.Two team email"
   Look for: LinkedIn, company website, About pages

5. "{company name} {title} email"
   Example: "V.Two CEO email" or "V.Two CTO email"
   (Only if title matches prospect)
```

### Step 2: Identify Top Pattern

From your searches, identify which pattern is used most:

- `firstname.lastname@company.com` ← Most formal
- `firstnamelastname@company.com` ← No separator
- `f.lastname@company.com` ← Initial + last
- `first.last@company.com` ← Alternative
- `firstname@company.com` ← First name only
- Any custom patterns you discover

**Record the #1 pattern found** (e.g., "firstname.lastname")

### Step 3: Cross-Check with Prospect

Search: `"{first_name} {last_name} {company}"`

Example: `"Oliver Chase V.Two"`

Look for:
- LinkedIn profile with company email
- Company directory listing
- Team page mention
- Any direct confirmation

**Record the confirmed email if found** (high confidence)

### Step 4: Add to Google Sheet

Add this row to "V.Two SDR - Master Lead Repository" sheet (Leads tab):

| Column | Value | Example |
|--------|-------|---------|
| Name | Full name | Oliver Chase |
| Email | *(optional if found)* | oliver.chase@v-two.co |
| Company | Company name | V.Two |
| Title | Job title | CEO |
| Location | City, State | San Francisco, CA |
| Research Notes | *(optional)* | Found pattern "firstname.lastname" in 3 sources, confirmed on LinkedIn |

---

## What the System Does (You Don't Need to Verify)

Once you add the prospect to Google Sheets, the automated system:

1. **Reads** your research notes
2. **Generates** 7 email candidates ranked by your discovered pattern
3. **Validates** MX records (domain accepts mail)
4. **Drafts** personalized email using LLM
5. **Sends** to best candidate based on pattern + confidence
6. **Logs** result (success/bounce) to sends.json
7. **Updates** Google Sheet with enrichment data

**You don't need to verify emails.** The system does that based on your research.

---

## If Email Bounces (Phase 3)

If the system sends to `oliver.chase@v-two.co` and gets a bounce:

1. System logs: `"Failed: oliver.chase@v-two.co (bounced)"`
2. Phase 3 adds bounce_handler (not yet built)
3. Bounce handler calls Hunter/Abstract API (costs ~$0.01)
4. Retry with verified address
5. Update Google Sheet with correct email

**You only pay API costs if something goes wrong.** Most of the time, good research = good emails = no bounces.

---

## Examples

### Example 1: V.Two

**Search 1:** "V.Two email format"
→ Found: Website mentions "firstname.lastname@" format

**Search 2:** site:v-two.co employee email
→ Found: contact pages show john.smith@v-two.co, jane.doe@v-two.co

**Search 3:** "Oliver Chase V.Two"
→ Found: LinkedIn profile → oliver.chase@v-two.co confirmed

**Result:**
- Name: Oliver Chase
- Email: oliver.chase@v-two.co (high confidence, discovered)
- Company: V.Two
- Title: CEO
- Location: San Francisco, CA
- Notes: "Pattern firstname.lastname confirmed via website and LinkedIn"

---

### Example 2: TechCorp (Unknown Company)

**Search 1:** "TechCorp email format"
→ No clear pattern mentioned

**Search 2:** site:techcorp.com employee email
→ Found: sarah.chen@techcorp.com, alex.patel@techcorp.com

**Search 3:** "Sarah Chen TechCorp"
→ Found: LinkedIn with email sarah.chen@techcorp.com

**Result:**
- Name: Sarah Chen
- Email: sarah.chen@techcorp.com (discovered)
- Company: TechCorp
- Title: VP Engineering
- Location: Seattle, WA
- Notes: "Pattern firstname.lastname found in domain search, confirmed on LinkedIn"

---

## Why This Works

✅ **No upfront API costs** — You do the research (your strength)

✅ **High quality** — OpenClaw's web_search + human reasoning beats pattern-matching

✅ **Smart fallback** — If pattern unclear, system tries all 7 patterns

✅ **Pay-as-you-go** — Only verify bounces (rare with good research)

✅ **Sustainable** — Works at 10-25 prospects/day with $0 budget

---

## Key Rules

1. **Always search for patterns first** — Don't guess
2. **Record your #1 pattern** — System uses it to rank candidates
3. **Cross-check with person** — LinkedIn/directory confirmation = high confidence
4. **Add research notes** — Helps future review + debugging
5. **No email = OK** — System will generate from pattern
6. **If uncertain** — Add prospect anyway, system tries all 7 patterns

---

## Checklist Before Adding to Sheet

- [ ] Searched for company email format (at least 2 sources)
- [ ] Identified #1 pattern (firstname.lastname, etc.)
- [ ] Cross-checked with prospect name
- [ ] Added research notes
- [ ] Email optional (you can fill it if found, or leave blank)

---

## Questions?

See `enrichment-engine.js` for email candidate generation logic.

See `mailer.js` for send + bounce handling docs.
