# Skill: Brand Guidelines & Voice

**Category:** Business
**Status:** Active
**Primary User(s):** CMO persona / OpenClaw (owner), SDR (executor)
**Last Updated:** 2026-03-06

---

## Purpose

Maintain consistent V.Two brand voice, positioning, and tone across all channels. Ensure every public-facing piece (email, LinkedIn, website, content) reinforces brand identity and resonates with target audience.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1 — All agents read this)**

This skill covers:
1. **Brand voice rules** — V.Two is direct, grounded, never buzzword soup
2. **Channel-specific tone** — Email vs LinkedIn vs website vs content
3. **Positioning tracks** — AI Enablement / Product Maker / Pace Car messaging
4. **Visual identity** — Placeholder for future asset definitions
5. **Content review checklist** — Before any public-facing content

**CMO Persona (Owner)**
- **When:** Brand decisions, positioning changes, creating brand guidelines, auditing content quality
- **Example:** "Review all LinkedIn content for the month and score each post against brand voice rules"
- **Tools available:** read (content library), write (brand policy docs), message (provide feedback)

**OpenClaw (Strategic)**
- **When:** Competitive brand analysis, market positioning validation, audience tone research
- **Example:** "Research how competitors position AI solutions. Are we distinctly different?"
- **Tools available:** web_fetch (competitor sites, LinkedIn), write (competitive analysis)

**SDR Persona (Executor)**
- **When:** Writing outreach emails, personalizing messaging, ensuring emails match brand voice
- **Example:** "Draft prospecting email to CTO. Tone: direct and grounded (not fluffy). Position: we're the pace car for your AI rollout."
- **Tools available:** read (brand guidelines), write (email copy)

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Does this match brand voice?"
- "Review this content for brand compliance"
- "How should we position [product/feature] to [audience]?"
- "What's the tone for [channel]?"
- "Brand audit needed"

**Use cases:**
- Writing any public-facing content (emails, posts, docs)
- Preparing for fundraising or partnership (brand consistency check)
- Launching new product or feature (positioning clarity)
- Competitive brand analysis (differentiation)
- Content calendar review (consistency audit)

---

## Inputs (TOON Format)

**Brand Review Request:**

```toon
brand_review{content_type,target_audience,channel,sample_text,positioning_track,tone_check_requested}:
 email,CTO-at-AI-first-startup,outreach,"Hi Sarah, we're helping CTOs move faster with AI. V.Two reduces AI rollout time from 6 months to 6 weeks. Interested?","pace-car","Is tone direct + grounded (not buzzword-y)?"
 linkedin-post,practitioners-and-builders,social,"AI isn't magic. It's a tool. V.Two is the tool that makes it fit your workflow, not the other way around. Check out how we're rethinking AI enablement.","product-maker","Does this differentiate from 'AI is the future'?"
```

---

## Workflow

1. **Define V.Two Brand Foundation**
   - **Core message:** V.Two removes friction from AI adoption. We're pragmatic, not hype-driven.
   - **Audience:** Technical builders (CTOs, PMs, engineers), not non-technical executives
   - **Tone:** Direct, grounded, no buzzwords (no "synergy," "paradigm shift," "revolutionary")
   - **Differentiation:** We focus on HOW (implementation, workflow fit), not WHY (AI is important)

2. **Map Positioning Tracks to Messaging**
   - **AI Enablement track:** "V.Two is the path to faster, safer AI adoption in your org"
   - **Product Maker track:** "Build with AI as a native component, not an afterthought"
   - **Pace Car track:** "We set the pace for AI rollout; your team stays in sync"

3. **Define Channel-Specific Tone**
   - **Email (outreach):** Direct, personalized, value-first (e.g., "6 weeks vs 6 months")
   - **LinkedIn:** Thought leadership, share insights + opinion (e.g., "AI implementation sucks because...")
   - **Website:** Clear, outcome-focused (what you'll achieve, not features)
   - **Content:** Deep dives, case studies, opinionated takes

4. **Create Content Review Checklist**
   - ✅ No buzzwords (synergy, paradigm, revolutionary, world-class, etc.)
   - ✅ Clear value prop (what problem do we solve?)
   - ✅ Matches positioning track (AI Enablement / Product Maker / Pace Car)
   - ✅ Tone matches channel (email ≠ LinkedIn ≠ website)
   - ✅ No exaggeration (claims must be defensible)
   - ✅ Audience-specific (talking to CTOs, not CEOs)

5. **Audit Existing Content**
   - Scan all public content (LinkedIn, website, emails, blog)
   - Score each piece against checklist
   - Flag non-compliance (tone, buzzwords, audience mismatch)
   - Document findings in brand_review TOON

6. **Review & Approve New Content**
   - CMO reviews before publishing
   - If score < 8/10, request revisions
   - If score ≥ 8/10, approve for publishing

---

## Outputs (TOON Format)

**Brand Review Score:**

```toon
brand_review_score{content_id,channel,audience_match,positioning_track,no_buzzwords,value_clear,tone_correct,overall_score,feedback,status}:
 email-2026-03-01,outreach,"✅ CTOs are target","✅ Pace Car (6wks vs 6mo)","✅ Direct language","✅ ROI focused","✅ Conversational","9/10","Excellent email. One suggestion: lead with ROI before process time.","approved"
 linkedin-post-2026-03-02,social,"⚠️ Broad (not just CTOs)","✅ Product Maker","❌ Uses 'paradigm'","✅ Clear","⚠️ Preachy tone","6/10","Remove 'paradigm shift.' Reframe as opinion on implementation, not philosophy.","needs_revision"
```

**Brand Audit Report:**

```toon
brand_audit{audit_date,content_reviewed,compliant_count,non_compliant_count,avg_score,top_issue,recommendation}:
 2026-03-06,"All LinkedIn posts Jan-Feb (8 posts)","5","3","7.4/10","Buzzwords (world-class, revolutionary used 3x)","Create banned-words list. Train SDR on approved vocabulary."
```

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER use buzzwords** — No "synergy," "paradigm shift," "revolutionary," "world-class," "game-changing," "innovative." Why: We position on HOW (implementation), not hype. Buzzwords undermine credibility.

2. **NEVER exaggerate claims** — If we say "6x faster," we must have data. Why: Credibility with technical audience = defensive against skepticism. Overstate = lose trust.

3. **NEVER talk to non-technical audience with technical features** — B2B emails to CTOs, not CMOs. Content for builders, not executives. Why: Misaligned messaging confuses positioning.

4. **NEVER post without approval** — CMO reviews all public content before publishing. Why: Brand consistency requires editorial control.

5. **NEVER mix positioning tracks in single message** — Pick one (AI Enablement OR Product Maker OR Pace Car) and own it. Why: Multiple messages = confusing brand identity.

**Can Do:**
- Share strong opinions on AI implementation (why it sucks, how we fix it)
- Use data to back claims
- Reference case studies and customer outcomes
- Explain trade-offs (we're not for everyone)
- Personalize to specific audience (startup vs enterprise tone)

**Cannot Do:**
- Make unsubstantiated claims
- Copy competitor messaging
- Publish without CMO approval
- Mix technical and non-technical messaging in one piece
- Compromise on tone for a "quick email"

---

## Examples (Copy-Paste Ready)

### Example 1: Approved Email (Pace Car Track)

**Prompt:**
```
Draft an outreach email to a CTO at an AI-first startup. Positioning: Pace Car (we set the pace for AI rollout). Tone: direct, value-first. Avoid buzzwords.
```

**Expected Output:**

```
Subject: 6 weeks instead of 6 months?

Hi Marcus,

Most CTOs tell us the same thing: their AI rollout is 3x longer than planned. Broken integrations. Team misalignment. Tools that don't talk to each other.

V.Two solves that. We've helped teams at [Company], [Company], and [Company] cut implementation time from 6 months to 6 weeks.

How? We set the pace. One dashboard for all AI components. No more context-switching. Your team stays synchronized.

Worth 20 minutes to see how?

—

Brand score: 9/10
- ✅ Direct value prop (6 weeks vs 6 months)
- ✅ Problem-first (broken integrations, misalignment)
- ✅ Pace Car track (we set the pace, teams stay in sync)
- ✅ Data-backed (specific companies, specific timeline)
- ✅ No buzzwords
- ✅ CTO-appropriate tone
```

---

### Example 2: Rejected LinkedIn Post (Too Much Hype)

**Prompt:**
```
Review this LinkedIn post for brand compliance:

"AI is revolutionizing the world. At V.Two, we're building the future of AI implementation. Our paradigm-shifting platform makes AI accessible to every team. Join the revolution. 🚀"

Score it and provide feedback.
```

**Expected Output:**

```toon
brand_review_score{content_id,channel,audience_match,positioning_track,no_buzzwords,value_clear,tone_correct,overall_score,feedback,status}:
 linkedin-draft-2026-03-06,social,"❌ Vague (not builders)","❌ None","❌ Multiple buzzwords (revolutionary, paradigm-shifting)","❌ No concrete value","❌ Hype-driven tone","3/10","Major revisions needed. Remove hype. Focus on HOW. Use data. Reframe for builders.","rejected"
```

**Feedback:**
```
Issues:
1. "Revolutionary" and "paradigm-shifting" are banned words (too hype-y)
2. No concrete value (what does "accessible to every team" actually mean?)
3. "Join the revolution" — we're not selling ideology, we're solving implementation problems
4. Not builder-focused (vague audience)

Rewrite approach:
- Start with a real problem (e.g., "AI integration sucks because X")
- Explain our solution concretely (e.g., "We solve it with Y")
- Pick ONE positioning track (Product Maker? Pace Car?)
- Use data or customer example
- Direct, opinionated, no hype

Example rewrite:
"AI integration kills productivity. You hire an ML expert to do integrations for 6 months instead of building product. We fixed that at [Company]. Now their team builds AI features in weeks, not months. Here's how..."
```

---

### Example 3: Brand Audit (Find & Fix Buzzwords)

**Prompt:**
```
Audit all V.Two content from January-February 2026 for brand compliance.

Review:
- 8 LinkedIn posts
- 3 blog articles
- 15 outreach emails

Look for:
1. Buzzword violations
2. Positioning track clarity (which track does each piece support?)
3. Tone consistency (especially email vs social)
4. Audience alignment (builder vs executive)

Output brand_audit TOON with findings and recommendations.
```

**Expected Output:**

```toon
brand_audit{audit_date,content_reviewed,compliant_count,non_compliant_count,avg_score,top_issue,recommendation}:
 2026-03-06,"Jan-Feb content (26 pieces total)","19","7","7.6/10","Buzzwords: 'world-class' (2x), 'revolutionary' (1x), 'paradigm' (1x). Tone: Some emails too formal (executive vs builder).","1. Create banned-words filter. 2. Train SDR on builder tone. 3. Require CMO pre-approval for all public content."
```

Details:
- ✅ **Compliant (19):** Good mix of Pace Car + Product Maker messaging. Direct tone. Data-backed claims.
- ❌ **Non-compliant (7):** 3 LinkedIn posts used buzzwords. 2 emails were too formal/corporate. 2 blog articles too vague on value prop.

Top issues:
1. **"World-class"** used 2x (banned: too generic)
2. **"Revolutionary"** used 1x (banned: hype-driven)
3. **Email tone too formal** — Should be conversational, not corporate
4. **Blog articles lack concrete value prop** — Too philosophical, not enough HOW

Recommendations:
1. Implement content pre-approval workflow (all public content → CMO before publishing)
2. Create "banned words" checklist (distribute to SDR, content team)
3. Training: How to write for builder audience (technical + opinionated, not hype)
4. Audit process: Monthly brand compliance check (score each piece)
```

---

## Brand Voice Analyzer Tool

**Shared Tool:** `/Users/oliver/OliverRepo/skills/utils/voice_analyzer.py`

Used by both **brand-guidelines** and **seo-content-creation** (DRY principle).

**What It Detects:**
- Readability grade (Flesch-Kincaid: lower = easier)
- Banned buzzwords (synergy, paradigm, revolutionary, etc.)
- Average sentence length (target: 12-15 words)
- Brand voice score (0-10)

**Quick Usage:**

```python
from skills.utils.voice_analyzer import analyze_voice, format_analysis_toon

# Analyze text
text = "Your email copy here..."
analysis = analyze_voice(text)

# Check approval
if analysis['approval_status'] == 'APPROVED':
    print("✅ Ready to send")
else:
    print("⚠️ Needs revision")
    print(f"Buzzwords: {analysis['buzzwords_found']}")

# Log in TOON format
toon_result = format_analysis_toon(analysis, content_id="email-001")
print(toon_result)
```

**Output Example:**

```
✅ Voice Analysis: email-001
Score: 9.2/10
Readability: Grade 10.5 (Good for business audience)
Buzzwords Found: 0 (none)
Sentence Avg Length: 14 words
Status: APPROVED
```

**Integration with Approval Workflow:**
- Score ≥ 8/10 + 0 buzzwords = APPROVED
- Score < 8/10 or buzzwords found = NEEDS_REVISION

---

## Related Skills

- **work-outreach/** — SDR uses brand guidelines when drafting outreach emails
- **competitive-intelligence/** — Compare V.Two positioning vs. competitor messaging
- **planning/** — Brand strategy review during quarterly planning

---

## Agent-Specific Implementation (Level 2)

### CMO Persona Implementation

**Tools available:**
- **read** — Content library, brand docs, competitive analysis
- **write** — Brand policy updates, review feedback, messaging guidelines
- **message** — Provide feedback to SDR, approve/reject content

**Workflow customization:**
1. Create and maintain V.Two brand guidelines (this skill document)
2. Review all public content before publishing (email templates, LinkedIn posts, blog drafts)
3. Provide specific feedback using brand_review_score format
4. Monthly audit: Score all published content, identify trends and training needs
5. Update guidelines based on learnings (what messaging resonates vs. what doesn't)

**Common challenges:**
- **Challenge:** "But everyone uses 'world-class'!"
- **Mitigation:** Yes, and it works for them. We're differentiating by NOT using it. Own the difference.

- **Challenge:** Time-consuming to review everything
- **Mitigation:** Create pre-approved templates, standard email formulas. SDR can use with minimal CMO review.

---

### OpenClaw Implementation

**Tools available:**
- **web_fetch** — Research competitor positioning, market trends
- **read** — Brand guidelines, positioning docs
- **write** — Competitive analysis, market insights

**Workflow customization:**
1. When requested: Research competitor brands and positioning
2. Compare V.Two messaging vs. competitors (differentiation gaps)
3. Validate positioning tracks resonate with market (user research confirmation)
4. Provide strategic insights to CMO (market validation, audience tone research)

---

### SDR Persona Implementation

**Tools available:**
- **read** — Brand guidelines, approval templates
- **write** — Email drafts
- **message** — Request CMO review/approval

**Workflow customization:**
1. Before writing outreach: Read brand guidelines for positioning track + tone
2. Draft email using approved voice (direct, grounded, value-first)
3. Self-review against checklist (no buzzwords, CTO-focused, concrete value prop)
4. Submit to CMO for approval (or use pre-approved template)
5. After approval: Send outreach with confidence

---

## Cross-Agent Handoff (Context Pass)

```toon
handoff_context{skill,from_agent,to_agent,completed_tasks,pending_tasks,blockers,files_modified,next_steps}:
 brand-guidelines,cmo-persona,sdr-persona,"Brand voice rules defined, positioning tracks clarified, email templates approved","Draft monthly outreach campaign using Pace Car + Product Maker messaging","None","skills/brand-guidelines/voice-rules.md, workspaces/work/projects/SDR/email-templates.md","SDR to use approved templates for prospect outreach, request CMO review for any custom variations"
```

---

## Token Budget (Per Operation Type)

| Operation | Estimated Tokens | Notes |
|-----------|------------------|-------|
| Review single content piece | 200–400 | Read, score, provide feedback |
| Monthly brand audit (20-30 pieces) | 1000–1500 | Comprehensive compliance check |
| Competitive brand analysis | 600–1000 | Research competitors, compare positioning |
| Guidance for new positioning | 400–800 | Define messaging for new product/track |
| **Template creation (reusable)** | 500–1000 | Email, LinkedIn, blog format templates |

---

## Verification Checklist (Before Approval)

- [ ] No banned buzzwords (synergy, paradigm, revolutionary, world-class, game-changing, innovative)
- [ ] Clear value proposition (what problem do we solve for what audience?)
- [ ] Matches ONE positioning track (AI Enablement / Product Maker / Pace Car)
- [ ] Tone matches channel (email ≠ LinkedIn ≠ website)
- [ ] Audience-specific (builders, not executives)
- [ ] Data or example provided (claims are defensible)
- [ ] No exaggeration (claims are realistic, tested)
- [ ] Brand voice is direct and grounded (not hype, not academic)

---

## FAQ

**Q: Can I use different positioning in different channels?**
A: Yes, but not in the same message. Pick one track per piece and own it.

**Q: What if I want to say something doesn't fit our voice?**
A: Score it 6/10 or below and explain why. CMO will provide specific feedback.

**Q: Are we positioning differently from competitors?**
A: Yes. We focus on HOW (implementation, workflow), not WHY (AI is important). Competitors hype; we solve.

**Q: How often do brand guidelines change?**
A: Quarterly review. Major changes (new positioning track) require CMO + Oliver approval.

---

## Quality Standards Applied

✅ **Agent-agnostic Level 1:** Purpose through Workflow readable by any agent/persona
✅ **TOON format:** Brand review scores and audit reports use TOON
✅ **Security guardrails:** 5 explicit NEVER rules (no buzzwords, no exaggeration, no mixed audiences, approval gate, no mixed tracks)
✅ **Team-specific subsections:** CMO (owner), OpenClaw (research), SDR (executor)
✅ **Copy-paste prompts:** 3 ready-to-use examples (approved email, rejected post, audit)
✅ **Handoff Context block:** TOON format for cross-persona transitions
✅ **Related skills:** References work-outreach, competitive-intelligence, planning
✅ **Token budget:** Estimates per operation (200–1500 tokens)
✅ **Trigger words:** 5 activation phrases

---

*Last updated: 2026-03-06 by Claude Code (on behalf of CMO)*
