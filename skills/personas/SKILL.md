# Skill: Personas

**Category:** System
**Status:** Active
**Last Updated:** 2026-03-06

---

## Purpose

Activate specialist personas (SDR, CMO, Marketing) when needed. Both agents can trigger persona activation; orchestrator (Oliver) coordinates handoffs.

---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes
- **When:**
  - Setting up persona context (reading persona files)
  - Building tools or infrastructure for personas
  - Testing persona workflows
  - Logging persona memories
- **Tools available:** read (persona_soul.md, config.json), write (memory logs)
- **Example:** "Set up the SDR persona context and test the approval workflow"

### OpenClaw
- **Can use:** Yes
- **When:**
  - Activating personas for research/external work
  - Researching prospects for SDR
  - Market research for CMO/Marketing personas
  - Relaying persona responses back to Kiana
- **Tools available:** web_search (market research), read (persona docs), write (memory logs)
- **Example:** "Activate SDR persona to research and validate prospect list"

### Collaboration Pattern
- **Claude Code sets up** → **OpenClaw executes** OR vice versa
- **Both agents** can read persona soul and activate; **orchestrator (Oliver) stays in loop**
- **Handoffs between personas** pass through orchestrator with full context
- **Memory is shared** across persona interactions

---

## When to Activate This Skill

**Trigger words/phrases:**
- "SDR" (sales outreach)
- "CMO" (brand/positioning)
- "Marketing" (content/SEO)
- "New persona"
- "Activate [persona name]"

---

## Agent Activation Commands

**Slash Command Format (From multi-agent team patterns):**

```bash
/agent sdr          # Activate SDR persona (sales outreach)
/agent cmo          # Activate CMO persona (brand/strategy)
/agent marketing    # Activate Marketing persona (content/SEO)
/agent dev          # Activate Dev persona (coding context)
/agent pm           # Activate PM persona (project management)
```

**Quick Activation (For Teams):**

```bash
/team starter       # Activate 3-agent team (Senior Dev, PM, Junior Dev)
/team full          # Activate 11-agent team (all specialties)
```

**What Happens:**
1. Agent reads persona_soul.md + config.json
2. Agent loads skill context (e.g., work-outreach for SDR)
3. Agent receives task
4. Agent works within persona constraints
5. Results logged to persona memory

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** Initial setup
**Risk Level:** Low
**Key Findings:**
- No credential exposure
- Personas follow shared constraints
- Memory is append-only, no overwrites
- No autonomous actions without Kiana approval

---

## Persona Directory Structure

```
team/members/
├── sdr/
│   ├── persona_soul.md       ✅ Active
│   ├── config.json
│   └── memory.md (optional)
├── cmo/
│   ├── persona_soul.md       🟡 Planned
│   ├── config.json
│   └── memory.md (optional)
└── marketing/
    ├── persona_soul.md       🟡 Planned
    ├── config.json
    └── memory.md (optional)

skills/
├── work-outreach/SKILL.md    (SDR execution detail)
├── cmo/SKILL.md             (CMO not yet created)
└── marketing/SKILL.md       (Marketing not yet created)
```

---

## How Both Agents Activate a Persona

### Step 1: Read the Persona Soul

```bash
# Find persona files
cat team/members/sdr/persona_soul.md
cat team/members/sdr/config.json
```

### Step 2: Understand Constraints

From config.json:
- **allowed_tools:** What the persona can use
- **restricted_tools:** What it cannot use
- **approval_required:** What needs Kiana sign-off
- **collaboration:** Other personas it can request

### Step 3: Load Context

**Both agents** pass this to the persona:

```
PERSONA ACTIVATION CONTEXT

== SOUL ==
[contents of persona_soul.md]

== CONFIG ==
[contents of config.json]

== SKILL ==
[contents of relevant SKILL.md, e.g., skills/work-outreach/SKILL.md]

== SHARED RULES ==
- Read agents/shared-instructions.md
- Follow system/souls/startup-checklist.md
- Never act without approval (except opt-outs)
- One combined message per response
- Stay in character and domain

== TASK ==
[what needs doing]
```

### Step 4: Execute

Persona works within constraints. Both agents can:
- **Claude Code:** Read/write local data, validate, build tools
- **OpenClaw:** Research, fetch data, validate externals

### Step 5: Relay Response

Orchestrator (Oliver) gets response and:
- Summarizes for Kiana
- Passes decisions through approval workflow
- Logs notable interactions

---

## Active Personas

### SDR (Sales Development Rep)

**Status:** ✅ Active
**Location:** team/members/sdr/
**Skill:** skills/work-outreach/SKILL.md
**Trigger:** "SDR" or any mention of leads, outreach, emails
**Workspace:** workspaces/work/projects/SDR/

**What it does:**
- Research prospects
- Build send lists
- Get Kiana approval
- Schedule emails
- Track replies/opt-outs
- Weekly reporting

---

## Planned Personas

### CMO (Chief Marketing Officer)

**Status:** 🟡 Planned
**Location:** team/members/cmo/
**Trigger:** "CMO" or brand/positioning/campaign
**Workspace:** workspaces/work/projects/CMO/

**What it will do:**
- Define brand identity
- Create positioning framework
- Messaging strategy
- Campaign planning
- Brand voice guidelines

**Build when:** V.Two outreach is running and needs strategic messaging

---

### Marketing (Content & Demand Gen)

**Status:** 🟡 Planned
**Location:** team/members/marketing/
**Trigger:** "Marketing" or content/SEO/demand gen
**Workspace:** workspaces/work/projects/Marketing/

**What it will do:**
- Content strategy
- SEO targeting
- Content calendar
- Demand generation
- Thought leadership

**Build when:** CMO is built and content is needed regularly

---

## Creating a New Persona

1. **Create folder:** `team/members/<name>/`
2. **Write persona_soul.md:**
   - Name, vibe, emoji
   - Role + domain
   - Operating principles
   - Constraints + allowed tools
   - Collaboration rules
3. **Write config.json:**
   - Metadata (persona type, status, trigger)
   - Tool access lists
   - Workspace path
   - Skill reference
4. **Create/reference SKILL.md:** `skills/<name>/SKILL.md` with full operational detail
5. **Update this REGISTRY:** Add new persona to active/planned list
6. **Update agents/audit-log.md:** Security audit findings

---

## Cross-Persona Handoff Protocol

When passing work between personas:

1. **Summarize:** What was done, what's pending, what decisions needed
2. **Pass context:** Include relevant files/data
3. **Stay in loop:** Orchestrator (Oliver) always aware
4. **Tag handoff:** "Passing to SDR for execution" / "CMO review needed"

**Example:**
```
OpenClaw did market research → found 50 prospects
Passing to SDR (Claude Code) for:
- Email validation
- Template selection
- Send list organization

Waiting on Kiana approval before SDR executes sends
```

---

## Persona Memory

After significant work, append to persona memory:

```bash
# Create if doesn't exist
touch team/members/<name>/memory.md

# Append
## YYYY-MM-DD
- Topic: [what happened]
- Decision: [any decisions made]
- Notable: [anything worth remembering next time]
```

---

## Token Budget

~500–2000 tokens per persona session (depending on complexity)

---

## Related Skills

- **work-outreach/** — SDR execution detail
- **planning/** — plan before persona work
- **debugging/** — if persona hits issues

---

*Last updated: 2026-03-06*
