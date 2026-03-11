# Skill: Software Architecture

**Category:** Development
**Status:** Active
**Primary User(s):** Claude Code (proposes) + OpenClaw (researches constraints)
**Last Updated:** 2026-03-06

---

## Purpose

Design system architecture using Domain-Driven Design (DDD), Architecture Decision Records (ADR), and production patterns. Ensure scalable, maintainable systems that survive team growth and requirement changes.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1 — All agents read this)**

This skill covers:
1. **Domain-Driven Design (DDD)** — Bounded contexts, ubiquitous language, aggregate design
2. **Architecture Decision Records (ADR)** — Document WHY architectural choices were made, not just WHAT
3. **System design patterns** — Monolith, services, event-driven, CQRS tradeoffs
4. **Dual-agent collaboration** — Claude Code proposes, OpenClaw researches constraints
5. **Review gates** — No over-engineering; explicit approval before implementation

**Claude Code**
- **When:** Planning any feature > 4 hours, starting new project, major refactoring, adding new module/service
- **Example:** "Before building location filtering, propose ADR: monolith vs. microservice for location data + geolocation service"
- **Tools available:** write (ADRs and architecture docs), read (requirements, existing code), exec (test architecture assumptions)

**OpenClaw**
- **When:** Validating proposed architecture against constraints, researching production patterns, industry best practices
- **Example:** "Research: how do distributed systems handle geolocation service failures? What's the industry pattern for timeout + fallback?"
- **Tools available:** read (research docs), web_fetch (find patterns, case studies), write (constraint analysis)

**Dev Persona**
- **When:** Using this before planning features > 4 hours, onboarding to project architecture
- **Constraint:** "Use existing bounded contexts; don't create new ones without senior review"

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Design the architecture for..."
- "Should this be a microservice?"
- "How do we structure this?"
- "New feature > 4 hours of work"
- "We need to scale [system]"
- "I'm concerned about [architectural issue]"

**Use cases:**
- Starting new project or major feature
- Planning service split from monolith
- Designing event-driven system
- Refactoring large module
- Evaluating architectural trade-offs
- Onboarding developer to codebase

---

## Inputs (TOON Format)

**Architecture Design Brief:**

```toon
design_brief{project_name,problem_statement,constraints,non_goals,timeline,tech_stack}:
 location-filtering,"Users filter events by proximity",must-scale-to-1M-events-support-geospatial-queries,not-building-maps-app,2-weeks,"React/Node/PostgreSQL"
 sdr-outreach-platform,"Automate prospect research and email scheduling",no-deployment-tools-no-sales-crm,not-building-full-CRM,4-weeks,"Node/PostgreSQL/Bull-queue"
```

**Constraints (Required Input):**
- `scalability` — [e.g., "1M concurrent users" or "10k queries/min"]
- `latency` — [e.g., "< 100ms response time" or "eventual consistency OK"]
- `data_consistency` — [e.g., "strong consistency for payments" or "eventually consistent OK"]
- `team_size` — [e.g., "1 dev = keep simple" or "10+ devs = modular boundaries"]
- `timeline` — [e.g., "2 weeks" or "6 months"]

---

## Workflow

1. **Understand the Problem Domain**
   - Identify bounded contexts (distinct areas with own rules)
   - Define ubiquitous language (common terminology all stakeholders understand)
   - Document core, supporting, and generic subdomains
   - Example: In SDR platform: `prospects` (core), `email-service` (supporting), `auth` (generic)

2. **Propose Architectural Options**
   - Option A: Architecture pattern + rationale
   - Option B: Alternative pattern + tradeoff vs A
   - Option C: If applicable, third option
   - Rate each by: scalability, complexity, team readiness

3. **Write ADRs for Decision Points**
   - 1 ADR per significant architectural decision
   - Format: Context, Decision, Consequences (Positive + Negative)
   - Example: "ADR-001: Use geolocation microservice vs. in-process library"

4. **Research Constraints & Validate**
   - Claude Code proposes
   - OpenClaw researches: industry patterns, tools, failure modes
   - Both review: feasibility, hidden costs, known pitfalls

5. **Define Bounded Contexts**
   - Each context: owns its data, defines its API contract
   - Boundaries: clear, documented, enforced
   - Communication: events (loose) or API calls (tight)

6. **Document & Gate**
   - All ADRs in skills/software-architecture/ADRs/
   - Approval: Kiana reviews before implementation starts
   - Review cadence: Quarterly architecture review

---

## Outputs (TOON Format)

**Architecture Decision Record (ADR):**

```toon
adr{adr_number,title,status,context,decision,consequences_positive,consequences_negative,related_adrs}:
 ADR-001,"Geolocation: Microservice vs In-Process Library",Approved,"1M+ events, need sub-100ms response time, scaling to multiple APIs","Use dedicated geolocation microservice (Node + PostGIS) isolated from main app","Clear separation, easy to scale independently, reusable API","Added latency (service call), operational complexity, potential single point of failure"
 ADR-002,"Event Filtering: Elasticsearch vs PostgreSQL Geospatial",Approved,"Need fast radius queries on location + metadata, sub-100ms requirement","Use PostgreSQL with PostGIS for geospatial + GIN indexes, no Elasticsearch","Simpler stack (one database), easier backups, cheaper ops","Scaling to 10M+ events may require Elasticsearch later"
```

**Architecture Diagram (Text Format):**

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                    │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐  ┌─────▼─────┐  ┌────▼────┐
   │  API    │  │  Location │  │  Events │
   │ Gateway │  │  Service  │  │ Service │
   └────┬────┘  └─────┬─────┘  └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐  ┌─────▼─────┐  ┌────▼────┐
   │ User DB │  │ PostGIS   │  │ Event   │
   │         │  │ Index     │  │ Cache   │
   └─────────┘  └───────────┘  └─────────┘

Bounded Contexts:
- User Service: User accounts, auth, profiles (generic)
- Location Service: Geospatial queries, radius filtering (supporting)
- Event Service: CRUD, search, recommendations (core)
- Notification Service: Email, webhooks (supporting)
```

**Bounded Context Definition:**

```toon
bounded_context{context_name,responsibility,data_owned,api_contract,communication_pattern,team_owner}:
 prospects-context,"Manage prospect data, enrichment, scoring","prospects, emails, enrichment_history","POST /prospects, GET /prospects/:id, PATCH /prospects/:id","Event-driven (prospect.created, prospect.scored)","openclaw-agent"
 outreach-context,"Email campaigns, scheduling, tracking","campaigns, sends, opens, replies","POST /campaigns, GET /campaigns/:id/stats","Queue-based (Bull) + sync API","claude-code"
 auth-context,"Identity, JWT tokens, RBAC","users, tokens, permissions","POST /login, GET /verify, DELETE /logout","Sync API calls only","claude-code"
```

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER over-engineer for hypothetical scale** — Start simple. If you don't have 1M users yet, don't build for them. Why: Premature optimization kills team velocity and creates maintenance debt.

2. **NEVER skip the "team readiness" check** — Design must match team size + experience. A 1-dev team can't operate a 10-service event-driven system. Why: Operational complexity becomes the blocker, not feature development.

3. **NEVER implement architecture without an ADR** — Decision must be documented BEFORE code starts. Why: Future developers need to understand WHY this way, not just WHAT was chosen. Prevents repeated "Why did we do this?" debates.

4. **NEVER cross bounded context boundaries without events or APIs** — Shared databases between contexts = tight coupling = scale nightmares. Why: Each context owns its data and can evolve independently.

5. **NEVER skip approval gate** — Architectural changes > scope of single feature must be approved by Kiana + at least one research round. Why: Wrong architecture is 10x more expensive to fix than right architecture from start.

**Can Do:**
- Propose new bounded context if it solves a real pain point
- Suggest technology changes with research backing
- Document ADRs for all major decisions
- Refactor within boundaries without approval
- Prototype multiple options to validate feasibility

**Cannot Do:**
- Implement without understanding domain (requirements gathering first)
- Mix data ownership across contexts
- Choose technology just because it's "cool" or new
- Skip research on failure modes and operational complexity
- Approve own ADRs (requires peer + human review)

---

## Examples (Copy-Paste Ready)

### Example 1: Design Geolocation Feature (Event Filtering)

**Prompt:**
```
Design architecture for location filtering on events. Requirements:
- 1M+ events in database
- Users filter by: lat/lon + radius (0-50km)
- Must respond < 100ms
- Scale to 100 concurrent users without degradation

Propose 3 architectural options (monolith approach, microservice, hybrid). For each: explain tradeoffs, database choice, and operational complexity. Write an ADR recommending the best option.
```

**Expected Output:**

```toon
adr{adr_number,title,status,context,decision,consequences_positive,consequences_negative,related_adrs}:
 ADR-003,"Location Filtering Architecture",Approved,"1M+ events, sub-100ms requirement, 100 concurrent users","PostgreSQL + PostGIS + GIN index on (lat, lon) with geospatial query planner","Simpler stack, familiar tech, easy to debug, sub-100ms queries on 1M rows","Will likely need Elasticsearch or dedicated geo-service if 10M+ events"
```

Context + Rationale:
- **Why PostGIS:** Native geospatial support, proven at scale
- **Why GIN indexes:** Fast radius queries (< 5ms for 1M rows)
- **Why no microservice (yet):** Team is 1 dev; operational complexity not justified
- **Migration path:** If needed: move to separate geo-service later, PostGIS remains the engine

---

### Example 2: Design Microservice Boundary (SDR Outreach)

**Prompt:**
```
Design bounded contexts for SDR outreach platform:
- User uploads CSV with prospects
- System enriches each prospect (name, title, email, company)
- User creates campaign, schedules emails
- System sends, tracks opens/replies

Define 3-4 bounded contexts. For each:
1. What data does it own?
2. What API does it expose?
3. How do contexts communicate (sync API or events)?
4. What team member owns this context?

Output in bounded_context TOON format.
```

**Expected Output:**

```toon
bounded_context{context_name,responsibility,data_owned,api_contract,communication_pattern,team_owner}:
 prospects-context,"Prospect data + enrichment","prospects, enrichment_data, email_validity","GET /prospects, POST /prospects, PATCH /prospects/:id/enrich","Event: prospect.enriched","openclaw"
 campaigns-context,"Email campaigns, scheduling","campaigns, templates, schedule_jobs","POST /campaigns, PATCH /campaigns/:id/schedule","Event: campaign.scheduled, prospect.emailed","claude-code"
 tracking-context,"Opens, replies, engagement","sends, opens, replies, bounces","GET /campaigns/:id/stats, POST /webhooks/email-events","Event: email.opened, reply.received","claude-code"
 auth-context,"Users, identity, RBAC","users, roles, tokens","POST /auth/login, GET /auth/verify","Sync API (JWT)","claude-code"
```

---

### Example 3: Evaluate Architectural Trade-off (Monolith vs Services)

**Prompt:**
```
Evaluate: Should location service be a separate microservice or part of main app?

Provide analysis:
1. Monolith (in-process library + colocated in main app)
   - Pros: [list]
   - Cons: [list]
   - Operational load: [estimate]
2. Microservice (separate Node service)
   - Pros: [list]
   - Cons: [list]
   - Operational load: [estimate]
3. Recommendation + reasoning
4. Write ADR-XXX with decision + consequences
```

**Expected Output:**

```
# Option 1: Monolith (In-Process Library)
Pros:
- Single deployment unit
- No network latency (< 1ms vs 5-20ms over HTTP)
- Easier debugging (stack trace spans app)
- Lower ops cost

Cons:
- Location service scales with main app (if 1M events, entire app gets hammered)
- Can't update location logic without app redeploy
- Team must understand geospatial code (learning curve)

Operational load: Minimal (one service, one database)

# Option 2: Microservice
Pros:
- Scales independently (only geolocation service handles spikes)
- Can update without main app downtime
- Reusable API (mobile, third-party apps could use it)
- Clear ownership boundary

Cons:
- Added latency (5-20ms network call)
- Operational complexity (two services, potential failures to handle)
- Overkill for current user base (premature optimization)

Operational load: High (two services, monitoring, potential debugging across services)

# Recommendation
Choose MONOLITH (in-process library) because:
- Current scale doesn't justify separate service (premature optimization)
- Team is small (1 dev can maintain monolith geospatial code)
- Can migrate to microservice later with clear API contract already in place

MIGRATION PATH: If location queries start timing out, split to microservice using PostGIS as engine (no rewrite needed).

ADR-004: LOCATION_HANDLING_MONOLITH_VS_MICROSERVICE - Monolith (in-process library) chosen for simplicity at current scale.
```

---

## Related Skills

- **planning/** — Use architecture design to drive feature planning estimates (complex architecture = more time upfront)
- **api-security/** — Each bounded context has API contract; ensure auth at boundaries
- **webapp-testing/** — Architecture decisions affect test strategy (microservices need integration tests; monolith can unit test more)
- **git/** — Document architectural changes in commit history using ADR format

---

## Agent-Specific Implementation (Level 2)

### Claude Code Implementation

**Tools available:**
- **write** — Create ADRs, architecture documentation, design diagrams
- **read** — Review requirements, existing code, constraints
- **exec** — Prototype architecture, test assumptions, validate database queries

**Workflow customization:**
1. Read requirements + constraints carefully (don't skip this)
2. Sketch 2-3 architectural options (text or ASCII diagram)
3. Write ADR for chosen option
4. Prototype key assumptions (e.g., "Can PostGIS handle 1M geospatial queries in < 100ms?")
5. Request OpenClaw research before starting implementation

**Common challenges:**
- **Challenge:** Proposed architecture is too complex for team size
- **Mitigation:** Keep it simple. If 1 dev, monolith beats microservices. Always.

- **Challenge:** Assumptions about database performance are wrong (learned during implementation)
- **Mitigation:** Prototype early. Run queries on test data at scale before committing to architecture.

**Token budget:** ~1000–2000 tokens per major design (requirements → ADR → prototype validation)

---

### OpenClaw Implementation

**Tools available:**
- **web_fetch** — Research industry patterns, find case studies, validate proposed technology choices
- **read** — Review design proposals, constraints, existing architecture docs
- **write** — Document findings, constraint analysis, risk assessment

**Workflow customization:**
1. Claude Code provides architectural proposal + ADR
2. OpenClaw researches: industry patterns, known failure modes, operational complexity estimates
3. OpenClaw writes constraint analysis (e.g., "PostGIS handles 1M+ geospatial queries in 10ms at Uber scale")
4. OpenClaw flags risks (e.g., "No team experience with event-driven systems → operational learning curve")
5. Both review findings; Kiana approves before implementation

**Common challenges:**
- **Challenge:** Technology is new/unproven; hard to find case studies
- **Mitigation:** Prototype small scale first. Validate assumptions before full commitment.

- **Challenge:** Industry patterns don't match team readiness
- **Mitigation:** Scale architecture down to team capacity, document migration path for future growth

**Token budget:** ~800–1500 tokens per research (industry patterns + risk assessment)

---

## Cross-Agent Handoff (Context Pass)

When handing off mid-task to another agent:

```toon
handoff_context{skill,from_agent,to_agent,completed_tasks,pending_tasks,blockers,files_modified,next_steps}:
 software-architecture,claude-code,openclaw,"ADR-001 drafted (Location Microservice vs Monolith), 3 architectural options sketched","Research PostGIS scalability at 1M+ events, validate team operational readiness","None","skills/software-architecture/ADR-001.md, system/memory/2026-03-06.md","OpenClaw to validate assumptions and flag operational risks"
```

---

## Collaboration Pattern

**Sequence:** Sequential (Claude Code proposes, OpenClaw validates, Kiana approves)

- **Claude Code does:** Gathers requirements, proposes 2-3 architectural options, writes ADRs
- **OpenClaw does:** Researches patterns, validates technology choices, assesses operational complexity, identifies risks
- **They coordinate by:** Claude Code shares ADR draft → OpenClaw provides research + constraint analysis → Both review for approval
- **Approval gate:** Kiana reviews ADR + OpenClaw research + team readiness before implementation begins

---

## Token Budget (Per Operation Type)

| Operation | Estimated Tokens | Notes |
|-----------|------------------|-------|
| Simple architecture (monolith feature) | 500–800 | Bounded context definition + one ADR |
| Medium design (microservice boundary) | 1200–1800 | 2-3 ADRs, bounded context definitions, research |
| Complex design (system refactor) | 2000–3000 | Multiple ADRs, risk assessment, migration path |
| Architecture review | 800–1200 | Quarterly cadence, validate against actual usage |
| **Handoff context** | 150–250 | Summary TOON format |

---

## Troubleshooting & Fallbacks

**When proposed architecture doesn't match team readiness:**
- Fallback: Scale down to simpler pattern, document migration path for future growth
- Escalate to: Kiana for approval of "simple now, complex later" approach
- Retry with: Validated team capacity + training plan if complex architecture is essential

**When technology assumptions are wrong (e.g., PostGIS can't handle 10M events):**
- Fallback: Shift to alternative (Elasticsearch for geospatial, document tradeoff in ADR)
- Escalate to: Kiana for architecture revision approval
- Retry with: Updated ADR + new prototype validation

**When bounded context boundary is unclear:**
- Fallback: Keep data more tightly coupled temporarily, document as "tech debt to refactor when clearer"
- Escalate to: Kiana + product owner to clarify domain boundaries
- Retry with: Domain-driven design workshop to align understanding

---

## Verification Checklist (Before Completion)

- [ ] Requirements fully understood (constraints documented)
- [ ] 2-3 architectural options proposed + tradeoffs analyzed
- [ ] ADRs written for all major decisions
- [ ] Bounded contexts defined if multi-service design
- [ ] OpenClaw research completed (if dual-agent task)
- [ ] Team readiness evaluated (can team operate this architecture?)
- [ ] Technology choices validated (prototypes run, assumptions tested)
- [ ] Migration path documented (how to scale if needed later)
- [ ] Approval gate passed (Kiana sign-off on ADR + approach)

---

## FAQ

**Q: When do we need an ADR?**
A: Anytime architectural decision affects > 1 team member, impacts scalability, or introduces new technology.

**Q: Can we choose microservices for 1 developer?**
A: No. Operational complexity > velocity gain. Monolith first, split later if needed.

**Q: How detailed should ADRs be?**
A: Context + Decision + Consequences (positive + negative). 1-2 pages is fine. Just capture the essential tradeoff.

**Q: What if we disagree with Kiana's architectural choice?**
A: Document the disagreement in the ADR under "Consequences." If critical, escalate to Kiana with research backing.

---

## Quality Standards Applied

✅ **Agent-agnostic Level 1:** Purpose through Outputs readable by any agent
✅ **TOON format:** ADRs and bounded context definitions use structured TOON format
✅ **Security guardrails:** 5 explicit NEVER rules (no over-engineering, require ADRs, no cross-context data sharing, etc.)
✅ **Team-specific subsections:** Claude Code (proposes) and OpenClaw (researches) + Dev persona constraints
✅ **Copy-paste prompts:** 3 ready-to-use examples (geolocation design, microservice boundaries, monolith vs service)
✅ **Handoff Context block:** TOON format for cross-agent continuity
✅ **Related skills:** References planning, api-security, webapp-testing, git
✅ **Token budget:** Estimates per operation type (500–3000 tokens)
✅ **Trigger words:** 6 activation phrases

---

*Last updated: 2026-03-06 by Claude Code*
