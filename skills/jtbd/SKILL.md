# Skill: JTBD (Jobs-To-Be-Done)

**Category:** Analysis
**Status:** Active
**Last Updated:** 2026-03-06

---

## Purpose

Uncover the real "job" customers hire your product to do. Both agents use this framework for strategy, product decisions, and messaging.

---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes
- **When:**
  - Building features for Fallow
  - Product architecture decisions
  - Understanding user motivation
  - Validating feature priorities
- **Tools available:** read (specs), write (analysis docs)
- **Example:** "What job does the Radius Filter do? Build around that."

### OpenClaw
- **Can use:** Yes
- **When:**
  - Market research for V.Two
  - Understanding buyer motivation
  - Validating SDR messaging against actual job
  - Competitive analysis (what job do competitors address?)
- **Tools available:** web_search (market research), read (specs)
- **Example:** "Research what job CTOs actually need from V.Two. What problem are they hiring us to solve?"

### Collaboration Pattern
- **OpenClaw researches** the actual job from market data
- **Claude Code analyzes** how product/feature addresses it
- **Both use JTBD** to justify design decisions and messaging

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Why would customers use this?"
- "What's the real problem we're solving?"
- "Jobs to be done"
- "JTBD"
- "Why do customers hire us?"
- Feature prioritization questions

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** Initial setup
**Risk Level:** Low
**Key Findings:**
- Framework-only (no code)
- No credential exposure
- Safe research approach
- Helps validate decisions

---

## The Core Concept

**Customers don't buy products. They hire them to do a job.**

Real example:
- Customer asks: "I need a quarter-inch drill"
- What they actually want: "A quarter-inch hole"
- What they really need: "To hang a shelf"
- Why that matters: "To display photos and feel proud of my home"

**Each level reveals a deeper job.**

---

## The Three Job Dimensions

| Dimension | Question | Why It Matters |
|-----------|----------|----------------|
| **Functional** | What task needs doing? | Product feature set |
| **Emotional** | How do I want to feel? | Messaging, positioning |
| **Social** | How do I want to be seen? | Brand, community |

---

## Job Statement Formula

```
When [situation], I want to [motivation], so I can [outcome]
```

**Examples:**

*Fallow:*
> "When I want to find something fun to do locally, I want to discover niche events I didn't know existed, so I can feel like I'm making the most of where I live and be the person who knows about cool things."

*V.Two SDR:*
> "When I need to ship a product fast, I want senior engineering capacity without hiring full-time, so I can move quickly without splitting focus and be seen as someone who ships."

---

## How Both Agents Use JTBD

### Step 1: Identify the User

**Claude Code example (Fallow):**
- User: Someone searching for local events
- Situation: Weekend coming up, wants to do something new
- Pain point: Can't find niche events I'd enjoy

**OpenClaw example (V.Two):**
- Buyer: CTO / Founder needing to ship a product
- Situation: Product roadmap is ambitious, team is stretched
- Pain point: Can't hire fast enough

### Step 2: Map All Three Dimensions

**Fallow Example:**

```
JOB: "When I want to find something fun locally, I want to discover
niche events, so I can feel alive and be the person who knows cool things"

FUNCTIONAL JOB:
- Find events within X miles
- Filter by category (music, art, food, sports)
- See event details (time, location, price)

EMOTIONAL JOB:
- Feel like I'm making the most of my location
- Feel adventurous and open to new experiences
- Avoid FOMO (fear of missing out on cool things)

SOCIAL JOB:
- Be seen as someone who knows about local culture
- Be the person who finds cool things others haven't heard of
- Share discoveries with friends
```

**V.Two Example:**

```
JOB: "When I need to ship fast, I want senior engineering without
hiring full-time, so I feel confident and be seen as someone who ships"

FUNCTIONAL JOB:
- Get senior-level engineering capacity
- Integrate with existing team/processes
- Accelerate delivery on specific product goals

EMOTIONAL JOB:
- Feel confident the code is in good hands
- Feel like I'm not making risky compromises
- Trust the team won't require constant supervision

SOCIAL JOB:
- Be seen as a "shipping" leader, not "still building"
- Show investors/board that we can execute at pace
- Be seen as resourceful (hired help, didn't just add headcount)
```

---

### Step 3: Find Alternatives (Real Competition)

**What ELSE could do this job?**

*Fallow:*
- Word of mouth
- Instagram / social media
- Local tourism websites
- Eventbrite (but lacks curation)
- Just staying home

*V.Two:*
- Hiring contractors
- Hiring full-time engineers
- Using another agency
- Building internally with existing team
- Outsourcing to offshore development

---

### Step 4: Identify Underserved Aspects

**What part of the job isn't being done well?**

*Fallow:*
- ✅ Finding popular events (Eventbrite does this)
- ❌ Finding *niche* events (underserved)
- ❌ Discovering things you didn't know to search for (underserved)

*V.Two:*
- ✅ Hiring contractors (services exist)
- ❌ Hiring without long onboarding overhead (underserved)
- ❌ Hiring senior capacity at startup pace (underserved)

---

### Step 5: Prioritize

**Which jobs are most critical and least served?**

*Fallow priorities (in order):*
1. **Critical + underserved:** Discover niche events → **build this first**
2. **Critical + served:** Find events near me → **do it better**
3. **Nice to have:** Share with friends → **do later**

*V.Two priorities:*
1. **Critical + underserved:** Senior engineers at pace → **messaging focus**
2. **Critical + served:** Engineering capacity → **table stakes**
3. **Social:** "shipping" brand → **marketing angle**

---

## Applying JTBD to Projects

### Fallow (Personal Project)

**User:** Someone exploring local culture
**Primary job:** Discover niche events I didn't know existed
**Secondary job:** Feel adventurous, be the person who knows cool things
**Underserved:** Event discovery (not search) + curation

**Implication for Phase 4:** Prioritize discovery and personalization over advanced filters

---

### V.Two (Work Project)

**Buyer:** CTO/Founder needing to ship fast
**Primary job:** Get senior capacity without hiring full-time
**Secondary job:** Feel confident, be seen as a shipping leader
**Underserved:** Pace of integration + trust in quality

**Implication for SDR:** Messaging should emphasize velocity + experience, not just "we code"

---

## Using JTBD for Decisions

**Question:** Should Fallow show event price or hide it?
**JTBD answer:** If discovery job is primary, show price (helps user decide). If adventure job is primary, hide it (reduces friction).
**Decision:** Show it (helps with "make the most of my money" subconcern)

**Question:** Should V.Two emphasize cost savings or velocity?
**JTBD answer:** If shipping job is primary, emphasize velocity (speed matters more). If risk-mitigation job is primary, emphasize experience/quality.
**Decision:** Velocity first, experience as proof point.

---

## Token Budget

~500–1500 tokens per JTBD analysis (research + mapping)

---

## Related Skills

- **planning/** — use JTBD to prioritize phases
- **personas/** — SDR messaging based on buyer's job
- **pm-visualizer/** — visualize the job and outcomes

---

*Last updated: 2026-03-06*
