# Skill: SEO Content Creation

**Category:** Business
**Status:** Active
**Primary User(s):** CMO (strategy), OpenClaw (research + optimization)
**Last Updated:** 2026-03-06

---

## Purpose

Create SEO-optimized content that ranks AND maintains V.Two brand voice consistency. Research → write → optimize → analyze.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1)**

**Workflow:**
1. Research keywords + audience (competitive-intelligence)
2. Plan content structure (outline with H1, H2, H3)
3. Write content (brand-guidelines enforced)
4. Optimize for SEO (readability, keyword density, meta tags)
5. Analyze voice consistency (shared voice_analyzer tool)
6. Publish + track results

**CMO** — Strategy
- **When:** Planning content calendar, launching new content pillar
- **Example:** "Write 5 blog posts on 'AI implementation challenges' targeting CTOs"

**OpenClaw** — Research + Optimization
- **When:** Keyword research, SEO gap analysis, content optimization
- **Example:** "Find keywords competitors don't own in 'AI implementation' space"

---

## When to Activate This Skill

**Trigger words:**
- "Write SEO content"
- "Content strategy"
- "Blog post outline"
- "Optimize for keywords"
- "Content calendar"

---

## Workflow (TOON Format)

**Content Request:**

```toon
content_request{title,target_keywords,target_audience,content_type,estimated_words,deadline}:
 "AI Implementation Challenges in 2026","AI rollout, AI ops, implementation mistakes, team alignment","CTOs at 200-2000 person startups","blog-post","2000-2500","2026-03-13"
 "How We Cut AI Rollout Time by 80%","AI velocity, implementation speed, reduced friction","Same as above (case study)","case-study","1500-2000","2026-03-20"
```

**Content Result:**

```toon
content_result{title,seo_score,voice_score,keyword_coverage,final_word_count,approval_status}:
 "AI Implementation Challenges in 2026","82/100","9.2/10","95% (all 5 keywords integrated naturally)","2247","APPROVED"
 "How We Cut AI Rollout...","78/100","8.8/10","92% (missing long-tail variant)","1823","APPROVED_WITH_NOTES"
```

---

## SEO Scoring Breakdown

**SEO Score (0-100):**
- Keyword density: 0.8–1.5% in body (not stuffed)
- Readability: Flesch-Kincaid < 12 (accessible)
- Structure: Clear H1, 2-4 H2s, related H3s
- Meta title: < 60 chars, includes main keyword
- Meta description: 150-160 chars, compelling
- Internal links: 3-5 relevant links to other V.Two content
- External links: 2-3 to authority sources
- Freshness: Content date visible, updated regularly

**Target: ≥ 75/100 for publication**

---

## Voice Analyzer Integration

**Shared Tool:** `/Users/oliver/OliverRepo/skills/utils/voice_analyzer.py`

Used by both **brand-guidelines** and **seo-content-creation**

```python
# Import
from skills.utils.voice_analyzer import analyze_voice

# Use
analysis = analyze_voice(content_text)
print(f"Score: {analysis['score']}/10")
print(f"Buzzwords: {analysis['buzzwords_found']}")
```

**Output:**
- Voice score (0-10)
- Buzzwords detected (banned words)
- Readability grade (Flesch-Kincaid)
- Approval status: APPROVED or NEEDS_REVISION

---

## Content Calendar Template

**Monthly Plan (TOON):**

```toon
content_calendar{week,title,target_keywords,target_audience,content_type,status,seo_score,voice_score}:
 week-1,"AI Implementation Challenges","ai rollout, mistakes, team alignment","CTOs","blog","draft","pending","pending"
 week-2,"How V.Two Cuts Rollout Time","AI velocity, implementation speed","CTOs","case-study","published","82/100","9.2/10"
 week-3,"Avoid These 3 AI Integration Mistakes","integration mistakes, implementation roadblocks","PMs","listicle","published","78/100","8.7/10"
 week-4,"Q1 AI Implementation Trends","2026 trends, AI ops trends, market analysis","CTOs","research","draft","pending","pending"
```

---

## Example: Blog Post Creation

**Request:**
```
Title: "AI Implementation Challenges in 2026"
Keywords: ai implementation, ai rollout, implementation mistakes, team alignment, ai ops
Audience: CTOs at startups (200-2000 people)
Type: Blog post (2000-2500 words)
Goal: Rank #2-3 for "AI implementation mistakes"
```

**Outline (Before Writing):**
```
H1: "5 AI Implementation Challenges Every CTO Faces in 2026"

H2: "1. The Time Tax: AI Rollout Takes 6x Longer Than Expected"
  - Why it happens (integration, team training, unexpected edge cases)
  - Cost: $50k+ in dev time per implementation
  - V.Two solution: Pace Car reduces time 80%

H2: "2. Team Alignment Breaks: Engineering vs. Product vs. Exec"
  - Different stakeholders have different definitions of "done"
  - Example: Exec wants "AI in production", Engineers want "validated model", PM wants "user-facing feature"
  - V.Two solution: Explicit alignment framework

H2: "3. The Skills Gap: Who Knows How to Actually Use AI?"
  - Shortage of LLM/GenAI expertise
  - Training new team members expensive
  - V.Two solution: Guided implementation playbooks

H2: "4. Cost Spirals: AI Ops Is Expensive"
  - Model inference costs, token fees, API calls
  - Lack of monitoring → runaway costs
  - V.Two solution: Cost monitoring + optimization

H2: "5. Integration Fatigue: Too Many Tools, No Standards"
  - Tools: OpenAI, Anthropic, Local LLMs, vector DBs, retrieval systems
  - Each requires different setup/config
  - V.Two solution: Unified interface

Conclusion:
- AI implementation is hard. Most teams get it wrong.
- V.Two handles the complexity. You focus on product.
- CTA: "See how we helped [Company] cut rollout time by 80%"
```

**After Writing:**

```
Voice Analysis:
- Score: 9.2/10 ✅
- Buzzwords: 0 detected ✅
- Readability: Grade 11.2 (Good for CTOs) ✅

SEO Analysis:
- Keyword "ai implementation": 1.2% (optimal) ✅
- Keyword "ai rollout": 0.8% (could add 1 more mention) ⚠️
- Readability: Grade 11.2 < 12 ✅
- H1 + H2 structure clear ✅
- Meta title: "5 AI Implementation Challenges CTOs Face in 2026" (54 chars) ✅
- Meta desc: "Most AI implementations fail due to poor planning. Learn 5 challenges + solutions." (82 chars) - NEEDS EXPANSION to 150-160
- Internal links: 4 to other V.Two content ✅
- External links: 2 to authority sources (McKinsey, HBR) ✅
- Final: 2247 words ✅

APPROVAL: APPROVED with note on meta description
```

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER publish without voice check** — Run voice_analyzer before publishing. Why: Brand inconsistency damages credibility
2. **NEVER keyword-stuff** — Keep keyword density 0.8–1.5%, not 5%+. Why: Penalized by search engines
3. **NEVER plagiarize or paraphrase existing content** — Write original insights. Why: Legal + SEO penalties
4. **NEVER claim unverified stats** — "80% faster" must have source/data. Why: Credibility + legal liability
5. **NEVER publish without fact-checking** — If you claim V.Two "cuts rollout time 80%", validate with customer data. Why: Trust

**Can Do:**
- Reference data with attribution
- Use case studies with permission
- Quote competitors fairly (comparison, not FUD)
- Update old content (refresh dates, refresh keywords)

---

## Related Skills

- **brand-guidelines/** — Voice consistency (shared voice_analyzer.py)
- **competitive-intelligence/** — Keyword research + gap analysis
- **planning/** — Content calendar planning

---

## Token Budget

| Operation | Tokens |
|-----------|--------|
| Keyword research | 200–400 |
| Content outline | 100–200 |
| Write 2000-word post | 1500–2500 |
| SEO optimization | 200–400 |
| Voice analysis | 50–100 |
| **Total per post** | 2000–3600 |

---

## Tool Reference

**Shared utility:** `/Users/oliver/OliverRepo/skills/utils/voice_analyzer.py`

This tool is used by both brand-guidelines and seo-content-creation (DRY principle).

---

*Last updated: 2026-03-06 by Claude Code*
