# Skill: Competitive Intelligence & Market Analysis

**Category:** Business
**Status:** Active
**Primary User(s):** OpenClaw (researcher) + SDR + CMO personas
**Last Updated:** 2026-03-06

---

## Purpose

Analyze competitors, map market landscape, and track developer growth to inform positioning, pricing, and go-to-market strategy. Identify gaps in competitor offerings that V.Two can exploit, and validate ICP assumptions.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1 — All agents read this)**

This skill covers:
1. **Competitor ad analysis** — What's running, messaging angles, targeting, frequency
2. **Market landscape mapping** — ICP segments, key players, positioning gaps, pricing
3. **Developer growth tracking** — Read ~/.claude/history.jsonl for pattern analysis
4. **Intelligence report format** — Weekly/monthly deliverable for internal use
5. **Data collection ethics** — No scraping without permission, respect robots.txt, B2B only

**OpenClaw (Researcher)**
- **When:** Quarterly competitive analysis, new market entry research, positioning validation
- **Example:** "Research 5 top AI implementation vendors. What are they claiming? Who are they targeting? Where are gaps?"
- **Tools available:** web_fetch (competitor sites, LinkedIn, ads), read (market data, history analysis), write (intelligence reports)

**SDR Persona (User)**
- **When:** Personalizing outreach, understanding competitive landscape, finding positioning differentiation
- **Example:** "What are competitors saying to CTOs at 500-person companies? How does V.Two differ?"
- **Tools available:** read (intelligence reports), message (request specific research)

**CMO Persona (User)**
- **When:** Brand positioning, messaging differentiation, market strategy, pricing review
- **Example:** "Who is our real competition? Are we the pace car or a follower?"
- **Tools available:** read (intelligence reports), message (request deep-dives on specific competitors)

---

## When to Activate This Skill

**Trigger words/phrases:**
- "What are competitors doing?"
- "Market landscape analysis needed"
- "How are we different from [competitor]?"
- "Quarterly competitive analysis"
- "Research [company]'s positioning"
- "Identify market gaps"

**Use cases:**
- New feature launch (validate market demand)
- Pricing strategy (understand competitor pricing)
- Positioning clarity (what makes us different?)
- Sales enablement (arm SDR with competitive context)
- Go-to-market planning (identify sweet spot)

---

## Inputs (TOON Format)

**Intelligence Request:**

```toon
intelligence_request{request_id,research_focus,competitors_to_analyze,data_sources,timeline,deliverable_format}:
 q1-2026-ai-vendors,"Position analysis for AI implementation vendors","Vercel, Replit, Modal, Hugging Face, AWS SageMaker","LinkedIn, company websites, job posts, news","1 week","Landscape map + messaging comparison table"
 sdr-research-ctoys,"CTO personas at 200-2000 person AI startups","n/a","LinkedIn (CTO profiles), Angellist (company profiles)","Ongoing","Monthly update on who's moving/funding"
```

---

## Workflow

1. **Define Research Scope**
   - **Competitors:** Who are we actually competing with? (not 20+ companies; focus top 3-5)
   - **Data sources:** Company websites, LinkedIn, ads (Google/Facebook), job posts, news, customer reviews
   - **Timeline:** Snapshot (now) or trend (over 3 months)?
   - **Use:** Sales enablement, positioning, pricing, feature prioritization?

2. **Competitor Analysis Framework**
   - **Company info:** Founded, funding, team size, HQ
   - **Product offering:** Core features, positioning, pricing (if public)
   - **Target market:** ICP, company size, industry, role
   - **Sales/marketing:** What channels? Messaging? Frequency?
   - **Ad strategy:** What ads are running? Copy? Targeting? (LinkedIn Ads tool + Google Ads transparency)
   - **Positioning:** Main claim? Differentiation? Weaknesses?

3. **Map Market Landscape**
   - Visual grid: Companies × Positioning tracks (AI Enablement / Product Maker / Pace Car / Other)
   - Identify gaps: Where are no competitors? (opportunity for V.Two)
   - Identify crowded space: Where are 5+ competitors? (avoid or differentiate harder)

4. **Track Developer Growth**
   - Analyze ~/.claude/history.jsonl for platform usage patterns
   - Developer sentiment (from comments, interaction patterns)
   - What problems are developers solving?
   - What tools/platforms are they using?

5. **Competitive Positioning Report**
   - Who are top 3 competitors?
   - What are they claiming?
   - Who are they targeting?
   - What's their blind spot?
   - How does V.Two differentiate?
   - What's our pricing strategy vs. theirs?

6. **Validation & Quarterly Review**
   - Every quarter: Update competitive landscape
   - Track: Positioning changes, new competitors, market shifts
   - Test: Does ICP feedback match our assumptions?

---

## Outputs (TOON Format)

**Competitive Landscape Map:**

```toon
competitor_landscape{company,positioning_track,target_icu,main_claim,pricing_model,year_founded,competitive_strength}:
 vercel,"product-maker","Developers 0->1, Nextjs community","Ship faster with modern infra","Freemium + Pro ($20/mo)","2015","HIGH - dominant in frontend"
 modal,"product-maker","ML engineers, data scientists","Serverless for ML","Usage-based ($0.01-1 per GB)","2019","MEDIUM - niche in ML ops"
 huggingface,"ai-enablement","AI teams, researchers","Model hub + inference","Freemium + Pro ($9/mo)","2016","HIGH - community network effect"
 aws-sagemaker,"ai-enablement","Enterprise data teams","Full ML platform","Usage-based (complex)","2017","MEDIUM - hard to use, costly"
 v-two,"pace-car","CTOs at 200-2000 person AI startups","Implementation velocity + team alignment","TBD","2025","UNKNOWN - too new to assess"
```

**Competitor Analysis (Single Competitor Deep-Dive):**

```toon
competitor_analysis{company,positioning,target_market,key_features,messaging_angle,blind_spot,v_two_advantage}:
 vercel,"Ship faster","Developers, startups","Nextjs framework, serverless edge","Modern infra (sexy tech)","Not about AI, limited AI tooling","We're for AI ops, not web ops"
 huggingface,"Model marketplace","ML teams, researchers","Model hub, spaces, datasets","Community + open source","No implementation guidance, hard to use in production","We guide implementation + team alignment"
```

**Market Gaps & Opportunities:**

```toon
market_gaps{gap_description,market_size_estimate,competitors_serving_gap,v_two_fit,confidence_level}:
 "AI implementation as service (not just tooling)","Large (1000+ mid-market companies)","None (HF tries, but poor UX)","✅ YES (Pace Car track)","HIGH"
 "Implementation governance + team dynamics","Medium (300+ companies)","None explicit","✅ YES (unique angle)","HIGH"
 "Cost optimization (AI ops costs)","Very large","HF + AWS (basic)","⚠️ PARTIAL (secondary feature)","MEDIUM"
```

**Developer Growth Tracking (From history.jsonl Analysis):**

```toon
developer_growth_metrics{metric,current_month,previous_month,trend,notes}:
 unique-developers,"245","189","↑ +30%","Organic growth from open source community"
 average-session-length-mins,"28","22","↑ +27%","Indicates deeper engagement (not just quick Q&A)"
 returning-developers-percent,"64%","58%","↑ +6pts","Strong retention, not churn"
 top-use-case,"AI implementation debugging","LLM prompt tuning","↔️ SHIFT","New use case emerging"
```

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER scrape websites without authorization** — Respect robots.txt, Terms of Service, legal limits. Why: Violates Copyright Digital Millennium Copyright Act (DMCA) + competitor's ToS. Legal risk.

2. **NEVER use unethical data collection** — No fake profiles, no bot scraping, no account hacking. Why: Legal and ethical liability. Not worth it.

3. **NEVER target personal data** — Focus on public company data only (LinkedIn company pages, public press releases). Why: GDPR + privacy regulations.

4. **NEVER publish competitor research without context** — All findings must be fair and defensible. No FUD (fear, uncertainty, doubt). Why: Credibility + legal (defamation risk).

5. **NEVER assume market = V.Two's market** — Just because competitors exist doesn't mean we're competing. Why: Market analysis without strategy is noise.

**Can Do:**
- Use LinkedIn (company pages, public posts, job listings)
- Monitor public ads (Google Ads Transparency, LinkedIn Ads tool)
- Read press releases, job posts, news articles
- Analyze company websites and marketing claims
- Survey customers and prospects for competitive feedback
- Track pricing (public websites only)

**Cannot Do:**
- Scrape competitor websites without permission
- Create fake LinkedIn profiles for research
- Access competitor internal documents/code
- Publish defamatory content (stick to facts)
- Make FUD claims (fear-based, no data)
- Spam competitor employees

**Data Collection Ethics:**
- **Public data only:** Company websites, LinkedIn public pages, job posts, news
- **Respect robots.txt:** Don't scrape if site blocks it
- **No bot scraping:** Use human research, not automated crawlers
- **No fake profiles:** Research as OpenClaw agent, not as fake person
- **Data retention:** Keep competitive research for 1 year, then archive

---

## Examples (Copy-Paste Ready)

### Example 1: Competitor Analysis (AI Implementation Vendors)

**Prompt:**
```
Research top 5 AI implementation vendors competing in our space:
1. Who are they?
2. What's their positioning?
3. Who are they targeting (ICP)?
4. What's their main claim?
5. What's their blind spot (what they're NOT good at)?
6. How does V.Two compare?

Output: competitor_landscape TOON with all 5, then a detailed analysis of the top 3.
```

**Expected Output:**

```toon
competitor_landscape{company,positioning_track,target_icu,main_claim,pricing_model,year_founded,competitive_strength}:
 replicate,"product-maker","ML teams, data scientists","Run open-source models on serverless","$0.25-5 per prediction","2021","MEDIUM - great for inference, limited guidance"
 weights-biases,"ai-enablement","ML teams at enterprises","Experiment tracking + MLOps","Freemium + $10k+/yr","2018","HIGH - strong in ML ops workflow"
 modal,"product-maker","ML engineers","Serverless for AI workloads","Usage-based ($0.001-1 per compute)","2019","MEDIUM - developer-focused, niche"
 huggingface,"ai-enablement + marketplace","Researchers, ML teams","Model hub + community","Freemium + $9/mo","2016","HIGH - network effect, community"
 v-two,"pace-car","CTOs 200-2000 person startups","Implementation velocity + team sync","TBD (predicted: $500-5k/mo)","2025","UNKNOWN - pre-revenue"
```

**Top 3 Deep-Dive:**

**Weights & Biases (strongest competitor)**
- Positioning: MLOps + experiment tracking
- Target: ML teams at enterprises (not our primary)
- Blind spot: Not about implementation velocity or team alignment
- V.Two advantage: We focus on non-ML teams (CTOs, PMs) trying to implement AI

**Hugging Face (community threat)**
- Positioning: Open source + community
- Target: Researchers, ML teams
- Blind spot: Model zoo without guidance; hard for non-ML teams
- V.Two advantage: We guide implementation; HF assumes you know what you're doing

**Replicate (inference competitor)**
- Positioning: Easy inference (run models without managing servers)
- Target: ML teams, data scientists
- Blind spot: No team alignment or governance layer
- V.Two advantage: We own the full workflow (not just inference)

**Recommendation:**
- Top 3 are not direct competitors (they serve ML teams; we serve CTOs/PMs)
- Real competitors are: Internal tools + custom implementations (no SaaS alternative exists)
- Market opportunity: Large (1000+ mid-market companies) + differentiated (no one owns implementation + team dynamics)
```

---

### Example 2: Market Gap Analysis (Emerging Opportunity)

**Prompt:**
```
Analyze market gaps in AI implementation tooling.

Existing competitors cover:
- Model serving (Replicate, Modal, HuggingFace)
- ML ops / experiment tracking (Weights & Biases, Databricks)
- LLM APIs (OpenAI, Anthropic, others)

Question: What's NOT covered that's valuable?

Research:
1. Talk to 3 CTOs at 500-2000 person startups
2. Find what problems they solve manually (opportunities for tooling)
3. Check if competitors address those gaps
4. Estimate market size for that gap

Output: market_gaps TOON identifying top 3 gaps.
```

**Expected Output:**

```toon
market_gaps{gap_description,market_size_estimate,competitors_serving_gap,v_two_fit,confidence_level}:
 "Implementation playbook + team training (how to actually use AI)","Large (800+ companies x $2k/yr = $1.6M TAM)","None (all assume you know how)","✅ PERFECT FIT (our thesis)","VERY HIGH"
 "Cost monitoring + optimization (AI ops is expensive)","Very large (2000+ companies x $5k/yr = $10M TAM)","Partial (HF, AWS basic tools)","⚠️ PARTIAL (secondary feature)","HIGH"
 "Cross-team governance (who can deploy what, audit trails)","Medium (300+ enterprise companies x $10k/yr = $3M TAM)","None (security teams add manually)","✅ GOOD FIT (unique)","MEDIUM"
```

**Opportunity Score:**
- Highest: Implementation playbook (large market, no competition, perfect V.Two fit)
- Second: Cost monitoring (larger market, but more competition)
- Third: Governance (smaller market, but still valuable)

**Recommendation:**
Focus on implementation playbook + team training as primary story. Cost monitoring and governance as secondary features (future roadmap).
```

---

### Example 3: Developer Growth Tracking (From history.jsonl)

**Prompt:**
```
Analyze developer engagement from ~/.claude/history.jsonl (last 30 days).

Metrics to track:
1. Unique developers using V.Two (month-over-month growth)
2. Average session length (engagement depth)
3. Returning developers % (retention)
4. Top use cases (what problems are they solving?)
5. Sentiment (positive/negative interactions)

Output: developer_growth_metrics TOON, then trend analysis + recommendations.
```

**Expected Output:**

```toon
developer_growth_metrics{metric,current_month_feb,previous_month_jan,trend,notes}:
 unique-developers,"312","245","↑ +26%","Strong organic growth"
 avg-session-length-mins,"31","26","↑ +19%","Deeper engagement (not just quick Q&A)"
 returning-dev-percent,"68%","61%","↑ +7pts","Good retention, low churn"
 top-use-case,"AI implementation debugging","LLM prompt tuning","SHIFT → implementation","New primary use case emerging"
 sentiment-positive,"82%","78%","↑ +4pts","Improved satisfaction"
```

**Trend Analysis:**
- ✅ **Growth trajectory strong:** 26% MoM growth indicates strong product-market fit
- ✅ **Engagement depth improving:** Session length up 19% = developers doing more with V.Two
- ✅ **Retention solid:** 68% returning = low churn, high value perception
- ⚠️ **Use case shift:** Developers shifting from prompt tuning to implementation debugging
  - Implication: V.Two is becoming THE tool for implementation problems (validates thesis)
  - Action: Lean into this positioning; update messaging to emphasize implementation

**Recommendation:**
- Messaging update: "V.Two: Debug and ship AI features faster" (from "Tune prompts")
- SDR focus: Target CTOs struggling with implementation (not ML researchers)
- Feature roadmap: Prioritize implementation debugging over prompt optimization
```

---

## Related Skills

- **brand-guidelines/** — Use competitive analysis to validate positioning messaging
- **work-outreach/** — SDR uses competitive insights for personalized outreach
- **planning/** — Competitive landscape informs quarterly strategy

---

## Agent-Specific Implementation (Level 2)

### OpenClaw Implementation

**Tools available:**
- **web_fetch** — Research competitor websites, LinkedIn pages, ads
- **read** — Analyze history.jsonl for developer patterns
- **write** — Intelligence reports, landscape maps, analysis documents

**Workflow customization:**
1. Quarterly: Full competitive landscape analysis (top 3-5 competitors)
2. Monthly: Developer growth tracking (history.jsonl analysis)
3. Ad-hoc: Deep-dive on specific competitor or market gap
4. Ongoing: Monitor for new competitors, positioning shifts, pricing changes

**Common challenges:**
- **Challenge:** Too much data; hard to find signal in noise
- **Mitigation:** Focus on top 3-5 competitors + specific metrics. Ignore the rest.

- **Challenge:** Competitive data changes rapidly
- **Mitigation:** Set regular cadence (quarterly landscape, monthly metrics) rather than ad-hoc.

---

### SDR Persona Usage

**Tools available:**
- **read** — Intelligence reports
- **message** — Request specific competitive research

**Workflow customization:**
1. Before outreach campaign: Read competitive landscape (know who we compete with)
2. Personalizing email: "What are competitors claiming to CTOs? How are we different?"
3. Sales call: "What blind spots do competitors have that we solve?"

---

### CMO Persona Usage

**Tools available:**
- **read** — Intelligence reports, market analysis
- **message** — Request deep-dives, strategy guidance

**Workflow customization:**
1. Quarterly strategy: Review competitive landscape, identify positioning opportunities
2. Pricing review: Compare V.Two pricing vs. competitors
3. Messaging updates: Use competitive insights to sharpen positioning

---

## Cross-Agent Handoff (Context Pass)

```toon
handoff_context{skill,from_agent,to_agent,completed_tasks,pending_tasks,blockers,files_modified,next_steps}:
 competitive-intelligence,openclaw,sdr,"Competitive landscape mapped (5 vendors analyzed), top 3 deep-dives complete, market gaps identified","SDR to use findings in personalized outreach, CMO to refine positioning messaging","None","skills/competitive-intelligence/landscape-q1-2026.md, system/memory/2026-03-06-competitive-analysis.md","SDR/CMO to leverage insights for outreach and messaging; OpenClaw to track ongoing competitive shifts monthly"
```

---

## Token Budget (Per Operation Type)

| Operation | Estimated Tokens | Notes |
|-----------|------------------|-------|
| Single competitor analysis | 400–700 | Research + write-up |
| Competitive landscape (5 companies) | 1200–1800 | Full market map + positioning |
| Market gap analysis | 600–1000 | Identify opportunities |
| Developer growth tracking (monthly) | 500–800 | Analyze history.jsonl + metrics |
| **Quarterly competitive review** | 2500–3500 | Full landscape + trends + strategy |

---

## Verification Checklist (Before Submitting Report)

- [ ] Data sources are ethical (public data, no scraping, respect ToS)
- [ ] Competitor information is current (within last 90 days)
- [ ] Positioning analysis is fair (facts-based, no FUD)
- [ ] Market gaps are defensible (backed by customer research or data)
- [ ] V.Two positioning is clear (how we differ, not just what competitors do)
- [ ] Report is actionable (clear recommendations for SDR, CMO, strategy)
- [ ] Sensitivity analysis done (what if assumptions are wrong?)

---

## FAQ

**Q: Should we do daily competitive monitoring?**
A: No. Weekly check-ins for major news (funding, launches), quarterly deep dives. Daily is noise.

**Q: What if a competitor launches a similar product?**
A: Analyze it (positioning, pricing, features), compare to V.Two (blind spots, advantages), update playbooks.

**Q: How do we use competitive data in sales?**
A: Know it, but don't lead with it. Lead with V.Two value, use competitor context to close (if needed).

**Q: Is it ethical to research competitors?**
A: Yes, if using public data. No fake profiles, no scraping, no hacking. Stick to ethics.

---

## Quality Standards Applied

✅ **Agent-agnostic Level 1:** Purpose through Workflow readable by any stakeholder
✅ **TOON format:** Landscape maps, competitor analysis, market gaps, and growth metrics use TOON
✅ **Security guardrails:** 5 explicit NEVER rules (no scraping, no unethical collection, no personal data, no FUD, strategy-driven research)
✅ **Team-specific subsections:** OpenClaw (researcher), SDR (user), CMO (user)
✅ **Copy-paste prompts:** 3 ready-to-use examples (competitor analysis, market gaps, growth tracking)
✅ **Handoff Context block:** TOON format for agent-to-team transitions
✅ **Related skills:** References brand-guidelines, work-outreach, planning
✅ **Token budget:** Estimates per operation (400–3500 tokens)
✅ **Trigger words:** 6 activation phrases

---

*Last updated: 2026-03-06 by Claude Code (on behalf of OpenClaw)*
