# Skill: Subagent Orchestration

**Category:** System
**Status:** Active
**Primary User(s):** Both agents (Claude Code coordinates, OpenClaw delegates)
**Last Updated:** 2026-03-06

---

## Purpose

Coordinate work across multiple agents (Claude Code, OpenClaw, future specialized agents). Decompose complex tasks into parallel/sequential subtasks, manage context handoff, and prevent deadlocks, scope drift, and context loss.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1 — All agents read this)**

This skill covers:
1. **Delegation decision** — When to handle solo vs. when to split across agents
2. **Task decomposition** — Parallel, sequential, and conditional task patterns
3. **Agent handoff protocol** — Context passing format and checklist
4. **Ensemble patterns** — Multiple agents working on the same problem (research + code)
5. **Anti-patterns** — Handoff loops, context loss, scope creep, and how to avoid them

**Claude Code**
- **When:** Starting a multi-step task that spans code + research, need external research before coding, task is too large to hold in context
- **Example:** "Design location filtering: I'll architect and code the solution. Need OpenClaw to research geolocation patterns first."
- **Tools available:** read (requirements, existing code), write (task decomposition plan), exec (coordinate and verify)

**OpenClaw**
- **When:** Task requires external research, competitive intelligence, market validation, API discovery before agent code begins
- **Example:** "Research SDR targeting: Find prospects, validate emails via Hunter API, identify positioning gaps vs. competitors"
- **Tools available:** web_fetch (research, API docs), read (requirements), write (research findings)

---

## When to Activate This Skill

**Trigger words/phrases:**
- "I need help with this"
- "This is too big for one agent"
- "Can you research while I code?"
- "Need OpenClaw to validate..."
- "Breaking this into parallel tracks"
- "Complex multi-step project"

**Use cases:**
- Feature requires code + research (e.g., "integrate new API")
- Market research runs in parallel with product development
- Competitive analysis during planning phase
- Large refactor with uncertainty about approach
- Multi-agent handoff to avoid context loss

---

## Inputs (TOON Format)

**Task Decomposition Request:**

```toon
task_decomposition{task_id,description,complexity,dependencies,requires_research,parallel_opportunities,team_members}:
 sdr-001,"Build SDR outreach platform with prospect enrichment","high","None","yes: prospect research, email validation APIs","research || code parallel","claude-code, openclaw"
 fallow-geo-001,"Implement location filtering for Fallow events","medium","None","yes: geospatial patterns, PostGIS research","research -> code sequential","claude-code, openclaw"
```

**Constraints:**
- `complexity` — [low | medium | high]
- `requires_research` — [yes | no] and [what type: API discovery, competitive intelligence, pattern validation, etc.]
- `parallel_opportunities` — Describe which subtasks can run simultaneously
- `dependencies` — What must complete before other subtasks can start

---

## Workflow

1. **Assess Task Complexity**
   - Solo threshold: < 4 hours, single agent, limited unknowns
   - Multi-agent threshold: > 4 hours, multiple domains (code + research), or significant unknowns
   - If uncertain, default to multi-agent (lower risk)

2. **Decompose Into Subtasks**
   - Identify parallel workstreams (research ∥ code ∥ testing)
   - Identify sequential gates (research → design → code → test)
   - Assign ownership (Claude Code gets code tasks, OpenClaw gets research tasks)

3. **Write Task Brief**
   - Subtask 1: [Owner], [deliverable], [acceptance criteria]
   - Subtask 2: [Owner], [deliverable], [acceptance criteria]
   - Communication points: How/when subtasks sync

4. **Establish Handoff Protocol**
   - Start: Initiating agent provides context in handoff_context TOON format
   - Progress: Both agents update memory/YYYY-MM-DD.md as they work
   - Sync points: Scheduled moments when agents exchange findings (not continuous interruption)
   - Completion: Final agent produces summary TOON, archives task breakdown

5. **Monitor for Anti-Patterns**
   - Handoff loop? (A → B → A → B again without progress)
   - Context loss? (Second agent missing critical detail)
   - Scope creep? (Task expanding beyond original bounds)
   - Blocking? (One agent waiting idle for another)

6. **Convergence & Integration**
   - Both agents produce outputs in agreed format (TOON preferred)
   - One agent (Claude Code typically) integrates results into final deliverable
   - Verify: Test integrated result, confirm all subtasks met acceptance criteria

---

## Outputs (TOON Format)

**Task Decomposition Plan:**

```toon
task_plan{task_id,subtask_id,owner,deliverable,acceptance_criteria,estimated_hours,status}:
 sdr-001,sdr-001-research,openclaw,"CSV: 100+ prospects with names, titles, emails, companies","100+ valid emails, no duplicates, 80%+ accuracy on title+company","4",pending
 sdr-001,sdr-001-architecture,claude-code,"ADR for prospect/campaign/tracking bounded contexts","3 contexts defined, API contracts specified, deployment model","2",pending
 sdr-001,sdr-001-code,claude-code,"API endpoints for prospect CRUD + campaign scheduling","All endpoints tested, database schema working, ready for integration","6",pending
 sdr-001,sdr-001-integration,claude-code,"Integrate OpenClaw research data into API, test end-to-end","API accepts research CSV, stores prospects, campaigns sendable, no errors","2",pending
```

**Handoff Context (Between Agents):**

```toon
handoff_context{task_id,from_agent,to_agent,completed_subtasks,pending_subtasks,blockers,files_modified,context_summary,next_agent_action}:
 sdr-001,openclaw,claude-code,"Prospect research complete (100+ qualified prospects)","Architecture review, API implementation, integration testing","None","system/memory/sdr-001-research.md, workspaces/work/projects/SDR/prospects.csv","Found 150 prospects across AI/Product/Sales CTOs. CSV ready for import. Top 20 pre-validated via email checks.","Review research CSV, proceed with API implementation using bounded context from architecture.json"
```

**Ensemble Work Summary (Final Output):**

```toon
ensemble_summary{task_id,agents_involved,deliverables,total_hours,status,integration_notes,quality_gates_passed}:
 sdr-001,"claude-code, openclaw","SDR platform MVP: API + prospect data + campaign scheduling","12","complete","OpenClaw research seamlessly integrated into Claude Code API. End-to-end tested. Ready for user testing.","Architecture ADR approved, code reviewed, prospect data validated, no security issues"
```

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER create a handoff loop** — If A → B → A again (same decision point), something is wrong. Why: Handoff loops waste tokens and indicate unclear task ownership or requirements.

2. **NEVER let context get lost in handoff** — Always use handoff_context TOON format and update memory. Why: Second agent shouldn't need to re-read 10k tokens of original context; summary format is required.

3. **NEVER authorize autonomous agent-to-agent actions** — If one agent needs other agent to take action, it must flow through memory + explicit request. Why: Prevents agents from making decisions in parallel that conflict or duplicate work.

4. **NEVER decompose beyond clarity** — Don't split a task into 10+ subtasks; max 5-6 parallel tracks. Why: Too many subtasks = coordination overhead > benefit of parallelization.

5. **NEVER assume shared state without explicit sync point** — If both agents touch the same data/file, they must synchronize. Why: Prevents race conditions and merge conflicts.

**Can Do:**
- Split task into parallel research + code streams
- Have agents work simultaneously on independent domains
- Use conditional decomposition (if research shows X, do Plan A; if Y, do Plan B)
- Escalate blocking issues to human (Kiana) for decision
- Abort subtask if blocker discovered (update plan, continue remaining work)

**Cannot Do:**
- Have both agents write to same file without locks/version control
- Make autonomous decisions affecting other agent's scope without notifying
- Hide context from partner agent (all findings shared via memory)
- Skip approval for task scope changes
- Retry failed handoffs without human intervention after 1st failure

---

## Examples (Copy-Paste Ready)

### Example 1: Parallel Research + Code (SDR Platform)

**Prompt:**
```
Break down the SDR platform MVP into parallel agent tasks:
- OpenClaw: Research and qualify prospects (produce CSV)
- Claude Code: Architecture and API development

Define:
1. Each agent's deliverables (specific, testable)
2. Acceptance criteria for each subtask
3. Sync points (when/how they share findings)
4. Integration point (how Claude Code uses OpenClaw's research)

Output task_plan TOON format with all subtasks, owners, and hours.
```

**Expected Output:**

```toon
task_plan{task_id,subtask_id,owner,deliverable,acceptance_criteria,estimated_hours,status}:
 sdr-001,sdr-001-research,openclaw,"CSV with 100+ prospects","Valid emails, verified titles+companies, no duplicates, scored by ICP fit","4",in_progress
 sdr-001,sdr-001-arch,claude-code,"Architecture ADR + bounded contexts","3 contexts (Prospects, Campaigns, Tracking) defined, API contracts specified","2",pending
 sdr-001,sdr-001-api,claude-code,"REST API for prospects and campaigns","CRUD endpoints working, database schema tested, ready for data import","6",pending
 sdr-001,sdr-001-integration,claude-code,"Import research data, test end-to-end","API accepts CSV, creates prospect records, campaigns can be scheduled, no errors","2",pending

Sync Points:
- After research (Day 1 EOD): OpenClaw shares CSV → Claude Code reviews for data quality
- After architecture (Day 2): Claude Code shares bounded context details → OpenClaw validates API contracts match research needs
- Integration (Day 3): Claude Code imports CSV, runs full-flow test, confirms everything works

Handoff: OpenClaw completes research → Claude Code proceeds with architecture/API in parallel.
```

---

### Example 2: Sequential with Conditional Branching (Feature Planning)

**Prompt:**
```
Plan the geolocation filtering feature (architecture depends on research):

OpenClaw researches first:
- Can PostGIS handle 1M+ geospatial queries in < 100ms?
- What are industry patterns (Uber, Google Maps)?
- Does team have PostGIS expertise?

Based on findings, Claude Code proposes architecture:
- IF PostGIS is suitable AND team is ready: In-process library architecture
- IF PostGIS is suitable BUT team lacks expertise: Microservice (separate learning curve)
- IF PostGIS is unsuitable: Switch to Elasticsearch geo-plugin

Define the task decomposition with conditional branches.
```

**Expected Output:**

```
TASK DECOMPOSITION:

Phase 1 — Research (OpenClaw, Sequential Gate)
- Research PostGIS at 1M+ scale: Industry patterns, known limits
- Assessment: Can it do < 100ms radius queries? Team expertise level?
- Deliverable: research_findings.md with decision tree
- Gate: If PostGIS unsuitable, pivot to Elasticsearch research

Phase 2 — Architecture (Claude Code, Conditional on Phase 1)
IF PostGIS is suitable:
  → Option A: Monolith (in-process library)
     Decision: Simple ops, team can maintain
     Approval gate: Kiana signs ADR
  → Proceed to Phase 3 (Code)

ELIF PostGIS is suitable but team lacks expertise:
  → Option B: Microservice (separate learning curve, separate deployment)
     Decision: Scalability + team growth path
     Approval gate: Kiana signs ADR + training plan
  → Proceed to Phase 3 (Code)

ELIF PostGIS is unsuitable:
  → Option C: Elasticsearch with geo-plugin
     Decision: Different learning curve, more ops
     Approval gate: Kiana signs ADR
  → Proceed to Phase 3 (Code) with new stack

Phase 3 — Implementation (Claude Code)
- Build chosen architecture
- Test at scale (1M rows)
- Commit and prepare for user testing

Sync Points:
- Research → Architecture: OpenClaw shares findings, Claude Code proposes options
- Architecture → Code: ADR approved, Claude Code implements chosen option
```

---

### Example 3: Detect and Break Handoff Loop

**Scenario:**
```
Task: Integrate Hunter API for email validation

Current state:
- Claude Code → OpenClaw: "Can you research Hunter API scopes?"
- OpenClaw → Claude Code: "Hunter API scopes are email-verify + domain-search. Need to know your use case to validate."
- Claude Code → OpenClaw: "We need email-verify and domain-search. What do you recommend?"
- OpenClaw → Claude Code: "Need to know if you're validating emails or finding new ones..."

Problem: Loop! Both agents are blocked waiting for the other to decide.

What went wrong: Task ownership not clear. Scope decision (what will we actually use?) not made before research.

Solution:
```

**Action:**
```
BREAK THE LOOP:

1. Identify the blocker: Unclear use case (email validation vs. discovery)
2. Escalate to human: Kiana decides → "We're doing email validation + prospect discovery"
3. Revise task: OpenClaw now has clear scope → researches Hunter API for those 2 use cases
4. Resume: OpenClaw completes research → Claude Code implements

Lesson: Define scope fully BEFORE splitting across agents. Ambiguity = handoff loops.
```

---

## Multi-Agent Team Patterns

**Team Configurations (From claude-code-mastery):**

```toon
agent_team{team_config,agents,primary_use_case,when_to_activate}:
 starter-pack,"3 agents: Senior Dev, PM, Junior Dev","Small features, rapid prototyping","Simple projects < 2 weeks"
 full-team,"11 agents: All specialists including Frontend, Backend, AI, ML, Data, Product, DevOps","Complex system design, multi-team coordination","Large projects > 1 month"
```

**Agent Activation (Slash Commands):**

```bash
/agent senior-dev     # Activate senior developer persona
/agent pm             # Activate project manager persona
/agent junior-dev     # Activate junior developer persona
/agent frontend-dev   # (Full team only) Frontend specialist
/agent backend-dev    # (Full team only) Backend specialist
/agent ai-engineer    # (Full team only) AI specialist
/agent ml-engineer    # (Full team only) ML specialist
/agent data-engineer  # (Full team only) Data specialist
/agent data-scientist # (Full team only) Data science specialist
/agent product-mgr    # (Full team only) Product manager
/agent devops         # (Full team only) DevOps specialist

/team starter         # Activate 3-agent starter pack
/team full            # Activate all 11 agents
```

**Heartbeat System:**

Weekly rotation keeps all agents sharp (even inactive ones). Each agent logs learnings:
- Monday: Senior Dev on duty
- Tuesday: PM on duty
- Wednesday: Junior Dev on duty
- Thursday-Friday: Rotation based on project needs
- Weekly summary in system/memory/heartbeat-[YYYY-WW].md

---

## Related Skills

- **planning/** — Use task decomposition before splitting across agents
- **api-security/** — When agents touch credentials, use api-security guardrails
- **software-architecture/** — Complex systems need architecture review before code split
- **personas/** — Agent activation commands (see above slash commands)

---

## Agent-Specific Implementation (Level 2)

### Claude Code Implementation

**Tools available:**
- **write** — Create task decomposition plans, handoff summaries
- **read** — Requirements, findings from OpenClaw
- **exec** — Execute code-specific subtasks, verify integration

**Workflow customization:**
1. When receiving task > 4 hours: Create task_plan TOON with all subtasks
2. Identify research dependencies: What must OpenClaw research first?
3. Schedule sync points: When do agents need to exchange findings?
4. Execute code tasks in parallel with OpenClaw research
5. Receive handoff from OpenClaw in handoff_context format
6. Integrate results, test end-to-end, produce final summary

**Common challenges:**
- **Challenge:** Waiting for OpenClaw research blocks code development
- **Mitigation:** Start with prototype based on assumptions, swap in real findings later

- **Challenge:** Integration test fails; not clear if Claude Code or OpenClaw work is the issue
- **Mitigation:** Both agents use same git repo + test fixtures; failure traceback shows the culprit

**Token budget:** ~500–1200 tokens per orchestration (planning + integration)

---

### OpenClaw Implementation

**Tools available:**
- **web_fetch** — Research external APIs, patterns, competitor data
- **write** — Document findings in format Claude Code can use
- **read** — Requirements, acceptance criteria from Claude Code

**Workflow customization:**
1. When receiving research request: Clarify scope with Claude Code (use handoff_context)
2. Execute research in parallel with Claude Code code work
3. Produce findings in agreed format (CSV for data, markdown for analysis, TOON for structured results)
4. Provide handoff_context when research complete
5. Monitor for scope creep: If research expands, escalate to Kiana for re-planning

**Common challenges:**
- **Challenge:** Research scope keeps growing ("while you're at it, research competitors too")
- **Mitigation:** Document original scope in task_plan. If new research requested, create separate task.

- **Challenge:** Findings don't match Claude Code's assumptions
- **Mitigation:** Create sync point before Claude Code starts coding, not after

**Token budget:** ~800–1500 tokens per research task (discovery + reporting)

---

## Cross-Agent Handoff (Context Pass)

```toon
handoff_context{task_id,from_agent,to_agent,completed_subtasks,pending_subtasks,blockers,files_modified,context_summary,next_agent_action}:
 sdr-001,openclaw,claude-code,"Prospect research complete (150 qualified leads)","API architecture, endpoint implementation, end-to-end test","None","workspaces/work/projects/SDR/prospects.csv, system/memory/sdr-001-research.md","Top 20 CTOs pre-validated via email checks. CSV ready for import. ICP: 200-2000 headcount, AI-first companies.","Implement API endpoints to import CSV. Structure around 3 bounded contexts: prospects, campaigns, tracking."
```

---

## Collaboration Pattern

**Sequence:** Parallel with sync points (research ∥ code, synchronized at key gates)

- **Claude Code does:** Task decomposition planning, code implementation, integration, final verification
- **OpenClaw does:** Research, validation, constraint analysis, external API discovery
- **They coordinate by:** Task plan + memory updates + scheduled sync points (no continuous interruption)
- **Approval gate:** Task decomposition approved by Kiana before agents start; blockers escalated immediately

---

## Token Budget (Per Operation Type)

| Operation | Estimated Tokens | Notes |
|-----------|------------------|-------|
| Task decomposition (2-3 parallel streams) | 300–500 | Planning document only |
| Research subtask | 800–1500 | Depends on breadth (API discovery vs. market analysis) |
| Code subtask | 500–2000 | Depends on complexity |
| Handoff context creation | 150–250 | Structured TOON summary |
| Integration + end-to-end test | 400–800 | Verify outputs from both agents work together |
| **Ensemble project (total)** | 3000–8000 | Full parallel flow with sync points |

---

## Troubleshooting & Fallbacks

**When handoff loop detected:**
- Fallback: Escalate to Kiana for scope clarification
- Action: Revise task_plan with clear ownership
- Retry: Resume with updated plan

**When one agent is blocked waiting for other:**
- Fallback: Continue with assumptions, swap in real findings later (for code); ask Claude Code for scope clarity (for research)
- Action: Create explicit sync point in task_plan
- Retry: Resume with clarity on what's needed

**When integration fails (code from Claude Code + research from OpenClaw don't work together):**
- Fallback: Debug together in shared repo + memory
- Action: Trace which output format broke the integration
- Retry: Fix format, re-test, document lesson in system/memory/

---

## Verification Checklist (Before Completion)

- [ ] Task decomposed into parallel + sequential subtasks
- [ ] Each subtask has clear owner, deliverable, acceptance criteria
- [ ] Research dependencies identified (what must complete first?)
- [ ] Sync points scheduled (when agents exchange findings)
- [ ] Anti-patterns checked (handoff loops, context loss, scope creep)
- [ ] Handoff context provided in TOON format at each transition
- [ ] Integrated result verified (both agents' work tested together)
- [ ] Memory updated with progress and learnings
- [ ] No silent failures (blockers escalated to Kiana)

---

## FAQ

**Q: When should we split a task across agents?**
A: When task > 4 hours, requires both code + research, or has significant unknowns. Otherwise, solo agent is faster.

**Q: How do we avoid handoff loops?**
A: Define scope and ownership clearly BEFORE decomposing. Ambiguity = loops.

**Q: Can both agents work on the same file?**
A: Only if coordinating via git + explicit sync (merge, not concurrent edit). Better: separate files for each agent's work.

**Q: What if one agent finishes early?**
A: They review partner's work, write tests, document findings. Don't start new tasks without Kiana approval.

---

## Quality Standards Applied

✅ **Agent-agnostic Level 1:** Purpose through Outputs readable by any agent
✅ **TOON format:** Task decomposition, handoff context, and ensemble summary use TOON
✅ **Security guardrails:** 5 explicit NEVER rules (no handoff loops, context loss, autonomous actions, overdecomposition, unsynced state)
✅ **Team-specific subsections:** Claude Code (orchestrator) and OpenClaw (researcher) + coordination patterns
✅ **Copy-paste prompts:** 3 ready-to-use examples (parallel research+code, sequential with conditions, detecting loops)
✅ **Handoff Context block:** TOON format for agent-to-agent transitions
✅ **Related skills:** References planning, api-security, software-architecture
✅ **Token budget:** Estimates per operation (300–8000 tokens depending on complexity)
✅ **Trigger words:** 6 activation phrases

---

*Last updated: 2026-03-06 by Claude Code*
