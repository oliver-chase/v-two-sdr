# SDR Research Brief — Week 1 Phase 1

**Status:** Ready for OpenClaw research phase
**Target:** 300+ qualified prospects for Week 1-2 ramp
**Deadline:** 2026-03-14 (Friday EOD)

---

## Research Criteria

### Company Profile
- **Stage:** Series B-C funding OR profitable independent (focused post-seed)
- **Size:** 15-500 employees (sweet spot: 30-200)
- **Industry:** B2B software, SaaS, enterprise software, data infrastructure, AI/ML platforms
- **Geography:** US-based preferred, but open to EU if English-speaking

### Target Personas

**Track 1 — AI Enablement** (Enterprise CTOs, CDOs, VPEs working on AI/data)
- **Title patterns:** CTO, Chief Technology Officer, Chief Data Officer, CDO, VP Engineering, VP Data, Head of AI, Director of Data
- **Company signals:**
  - Using/evaluating LLMs, RAG, or gen AI internally
  - Multiple data/AI initiatives in flight
  - >100 employees (typically)
  - Enterprise or mid-market software
- **Research sources:**
  - LinkedIn search: "CTO" OR "Chief Data Officer" at Series B-C companies
  - GitHub: Contributors to LLM/AI projects (GPT-4, Llama, etc.)
  - Company blogs mentioning "AI", "ML", "data infrastructure"

**Track 2 — Product Maker** (Founders, product CTOs focused on shipping)
- **Title patterns:** Founder, Co-Founder, CTO, VP Product, Head of Product, VP Engineering
- **Company signals:**
  - Active product roadmap (shipped features in past 30 days)
  - Series A-B founders scaling
  - Building consumer or SMB SaaS (self-serve model)
- **Research sources:**
  - LinkedIn: Founders at Series B startups
  - Y Combinator directory (batch 2024-2025)
  - AngelList (Talentfinder) for Series A-B execs
  - ProductHunt: Founders of trending products

**Track 3 — Pace Car** (Engineering leads needing velocity/augmentation)
- **Title patterns:** VP Engineering, Head of Engineering, Engineering Manager (if scaled team >10), Director of Engineering
- **Company signals:**
  - Hiring for engineers (current job postings)
  - Recent funding (good budget for augmentation)
  - Non-AI-focused (operations, fintech, health tech, manufacturing)
- **Research sources:**
  - LinkedIn: Engineering leaders at Series B companies
  - Job boards: Filter by company stage
  - Company websites: Engineering leadership pages

---

## Data Collection

### CSV Header (prospects.csv)
```
FirstName,LastName,Company,Title,Email,LinkedIn,Location,Timezone,Track,Status,AddDate,Notes
```

### Required Fields (Validation)
1. **FirstName** — Full first name (e.g., "Sarah", not "S.")
2. **LastName** — Full last name
3. **Company** — Official company name
4. **Title** — Exact title (from LinkedIn or company site)
5. **Email** — Work email (must validate syntax + domain)
6. **LinkedIn** — Full LinkedIn profile URL (e.g., linkedin.com/in/sarahchen)
7. **Location** — City, State (e.g., "San Francisco, CA")
8. **Timezone** — US timezone from this list:
   - America/New_York
   - America/Chicago
   - America/Denver
   - America/Los_Angeles
9. **Track** — One of: ai-enablement, product-maker, pace-car
10. **Status** — Set to "pending" for all new prospects
11. **AddDate** — Today's date (YYYY-MM-DD, e.g., 2026-03-11)
12. **Notes** — Any relevant context (e.g., "Found via Y Combinator", "Posted about AI last week", optional)

### Email Validation Checklist
Before including any email:
- [ ] Syntax valid (firstname.lastname@company.com or similar pattern)
- [ ] Domain exists (MX records, check via Hunter.io or NeverBounce)
- [ ] Mailbox likely exists (90%+ confidence via Hunter.io verify endpoint)
- [ ] NOT in opt-outs.json (hard-bounce list)

⚠️ **If email fails validation:** Research alternative email (first.last@company.com, try common patterns), don't force invalid email into database.

---

## Research Strategy

### Phase 1A: Company Lists (Monday-Tuesday)
1. **LinkedIn search** (use operator search if possible):
   - "CTO" at Series B-C companies
   - "Chief Data Officer" at Series B-C companies
   - "VP Engineering" at Series B-C companies
   - Filter by: Location (US), Current companies (exclude consultants), Title

2. **Y Combinator Directory:**
   - 2024-2025 batches
   - Focus on software, AI/ML, data categories
   - Pull founder + CTO from each company

3. **Crunchbase:**
   - Series B funding 2023-2026
   - Filter by: Software, SaaS, AI/Data
   - Extract: Company, founding team, funding date

4. **AngelList (Talentfinder):**
   - Series A-B companies
   - Filter by: Roles (engineering, product leadership)

### Phase 1B: Individual Research (Wednesday-Thursday)
1. **Per prospect:**
   - Verify LinkedIn profile
   - Find work email (try: first.last@company.com, firstlast@company.com, f.last@company.com)
   - Confirm title matches track assignment
   - Add note if relevant (e.g., "Posted about AI governance", "Recently hired 10 engineers")

2. **Email validation:**
   - Use Hunter.io API or website (free tier allows 100 lookups/month)
   - NeverBounce for batch validation
   - Syntax + domain check minimum

### Phase 1C: Compile & Dedupe (Friday morning)
1. Load all prospects into prospects.csv
2. Run validation: `node scripts/validate-prospects.js`
3. Review errors/warnings, fix data quality issues
4. Remove duplicates
5. Ensure all 3 tracks are represented

---

## Success Criteria

| Target | Metric | Notes |
|--------|--------|-------|
| **300+ prospects** | Row count in prospects.csv | Minimum target for Week 1 ramp |
| **<2% invalid emails** | Email validation pass rate | Must be 98%+ valid or no sends |
| **Balanced tracks** | Distribution across 3 tracks | Aim for ~100 per track (no track <80) |
| **Complete data** | All required fields populated | First, Last, Company, Title, Email, LinkedIn, Location, Timezone, Track required |
| **No duplicates** | Unique emails | Run dedupe check before Friday submission |

---

## Output

**Deliverable:** `workspaces/work/projects/SDR/prospects.csv` (updated)

**Friday Submission to Claude Code + SDR:**
- Total prospects researched: X
- By track: AI Enablement (Y), Product Maker (Z), Pace Car (W)
- Email validation: X% pass rate
- Any notes on data quality or gaps

**Then:** Claude Code validates, deduplicates, converts to prospects.json (TOON format)

---

## Tools & Resources

- **LinkedIn:** Operator search, company pages, profile direct links
- **Hunter.io:** Email lookup and batch validation (free tier: 100 lookups/month, paid for higher volume)
- **Y Combinator:** ycombinator.com/directory (free, searchable)
- **Crunchbase:** crunchbase.com (some data free, paid for full access)
- **Company websites:** careers.example.com or /team pages for contact info
- **GitHub:** For engineers, check contributions to AI/ML projects

---

## Anti-Patterns (Don't Do)

❌ Include email without validation
❌ Use first initial only (e.g., "J. Smith") — full names required
❌ Assume everyone at a company is the right persona
❌ Mix timezones incorrectly (must be accurate for sending window)
❌ Add prospects from purchased lists (compliance risk)
❌ Include non-decision-makers (support staff, HR, junior engineers)
❌ Submit without removing duplicates

---

## Questions?

Flag blockers or questions to Claude Code or Kiana immediately. Research is only valuable if it's accurate and validated.
