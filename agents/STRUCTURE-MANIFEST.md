# STRUCTURE MANIFEST — Authoritative Directory of All Files

**MANDATORY:** Read this BEFORE reading any other file. This is the source of truth for file locations and purposes.

**Purpose:** Prevent structural violations by documenting EXACTLY where every file belongs and what each one does.

---

## CRITICAL RULE

**You may NOT create, move, or modify ANY file without first verifying it in this manifest.**

If a file is not listed here, ask before creating it.
If a file belongs in a different location than where you're putting it, this manifest takes precedence.

---

## ARCHITECTURE REFERENCE

**See `agents/ORCHESTRATOR.md` for the 6-layer architecture overview.**

This document provides the FILE-BY-FILE manifest and validation checklist (not the architecture explanation).

---

## MANIFEST: Complete Directory

**SHARED FILES (For All Agents: Claude Code + OpenClaw)**
```
agents/
├── ORCHESTRATOR.md           [6-layer architecture, agent roles, handoff protocol]
├── OPERATING_SYSTEM.md       [Core principles: Design First, TDD, Token Opt, No Dups]
├── FIRST-RUN.md              [First session checklist for all agents]
├── shared-instructions.md    [Rules both agents follow]
├── CLAUDE.md                 [Project startup sequence for all agents/projects] ← YOU ARE HERE FIRST
├── audit-log.md              [Session audit trail]
├── NEW-AGENT-GUIDE.md        [Onboarding new agents]
├── CREATE-SKILL.md           [How to create new skills]
├── SKILL-TEMPLATE.md         [Template for new skills]
├── DOCUMENTATION-STANDARDS.md[Writing standards for .md files]
├── ERROR-HANDLING.md         [Error patterns and recovery]
├── SECURITY-VERIFICATION.md  [Security checks before deploy]
├── INVOCATION.md             [How skills are invoked]
└── [7 files total above]
```

**CLAUDE CODE SPECIFIC (Claude Code Agent Only)**
```
agents/claude/
├── INSTRUCTIONS.md           [Claude Code startup, capabilities, rules]
└── [1 file total]
```

**OPENCLAW SPECIFIC (OpenClaw Agent Only)**
```
agents/openclaw/
├── INSTRUCTIONS.md           [OpenClaw startup, capabilities, rules]
└── [1 file total]
```

**KEY RULE:** If a file is in agents/claude/ or agents/openclaw/, it is AGENT-SPECIFIC and should have an equivalent in the other agent's folder (or be truly unshared).

---

### Layer 2: SOULS (system/souls/) — Shared Identity

**All agents use identical soul files (no agent-specific variants)**
```
system/souls/
├── identity.md               [Who you are (agent vibe, operating style)]
├── user.md                   [Who you serve (Kiana's preferences)]
├── agent_soul.md             [Orchestrator rules, persona roster, handoff]
├── capabilities.md           [What you can do, what you can't]
├── default.md                [Default behavior, fallback patterns]
├── heartbeat.md              [Routine health check procedures]
├── startup-checklist.md      [First-time startup verification]
├── code-review-checklist.md  [Code review standards and gates]
└── secrets-management.md     [How API keys stored/accessed, coaching]
```

**KEY RULE:** No agent-specific personality files in system/souls/. All souls are shared.

---

### Layer 3: SKILLS (skills/) — Specialized Capabilities

```
skills/
├── project-protocol/         [MANDATORY first read for all projects]
│   └── SKILL.md              [Session protocol, PROGRESS.md format, subagent rules]
├── [20 other skill folders]
└── [21 folders total]
```

**KEY RULE:** Every skill folder has SKILL.md (no duplicates of skills).

---

### Layer 4: TEAM (team/) — Personas and Members

```
team/
├── tools.md                  [Oliver's environment notes, local setup]
└── members/
    ├── dev/
    │   └── persona_soul.md   [Dev persona: backend, fullstack, testing]
    ├── fe-designer/
    │   └── persona_soul.md   [FE Designer persona: UI/UX, components]
    ├── sdr/
    │   ├── persona_soul.md   [SDR persona: execution, approval gates]
    │   └── config.json       [SDR config: name, email, tools]
    ├── cmo/
    │   └── persona_soul.md   [CMO persona: brand, positioning (planned)]
    └── marketing/
        └── persona_soul.md   [Marketing persona: content, campaigns (planned)]
```

**KEY RULE:** Personas go in team/members/NAME/, not in system/souls/.

---

### Layer 5: WORKSPACES (workspaces/) — Projects

```
workspaces/
├── personal/
│   └── projects/
│       └── Fallow/           [Personal project: EDP]
│           ├── PROGRESS.md   [Current status (format: Phase, Current Task, Decisions, Blockers, Next)]
│           ├── MASTER.md     [Full brief, all phases]
│           ├── ARCHITECTURE.md [System design]
│           └── [other project files]
│
└── work/
    └── projects/
        └── SDR/              [Work project: Sales outreach]
            ├── PROGRESS.md   [Current status]
            ├── MASTER.md     [Full brief]
            ├── ARCHITECTURE.md [System design]
            ├── ROADMAP.md    [Timeline, milestones]
            ├── CHECKPOINT.md [Recovery guide for compaction]
            ├── AUDIT.md      [Security/structural findings]
            ├── prospects.json [TOON format data]
            ├── outreach/
            │   ├── sends.json [Event log]
            │   ├── opt-outs.json [Opt-out list]
            │   └── weekly-reports.json [Metrics]
            └── scripts/
                └── validate-prospects.js [Validation script]
```

**KEY RULE:** Each project has PROGRESS.md, MASTER.md, ARCHITECTURE.md (standardized). Project-specific files stay in project folder.

---

### Layer 6: MEMORY (system/memory/) — Session Continuity

```
system/memory/
├── YYYY-MM-DD.md             [Daily session notes (created at session start)]
├── lessons.md                [Lessons learned from past mistakes]
└── 2026-03-11-sdr-implementation-checkpoint.md [Session decisions, lessons]
```

**KEY RULE:** Memory is shared (not per-agent). Updated at session end with decisions + reasoning.

---

### Layer 7: PLANS (docs/superpowers/plans/) — Implementation Plans

```
docs/superpowers/plans/
├── 2026-03-11-oliver-sdr-implementation-INDEX.md [Master plan: 8 chunks, dependencies]
├── chunk-1-cleanup-and-reorganization.md [Detailed implementation (TDD steps)]
├── chunk-2-google-sheets-integration.md [Plan stub]
├── chunk-3-enrichment-engine.md [Plan stub]
├── [... chunks 4-8 ...]
```

**KEY RULE:** Implementation plans go in docs/superpowers/plans/, not in project folders or agents/.

---

## VALIDATION CHECKLIST (Run Before Starting Work)

**YOU MUST RUN THIS EVERY SESSION:**

```bash
# 1. Verify shared agents/ files exist
ls agents/{ORCHESTRATOR,OPERATING_SYSTEM,FIRST-RUN,shared-instructions,CLAUDE}.md

# 2. Verify agent-specific files exist (one per agent)
ls agents/claude/INSTRUCTIONS.md
ls agents/openclaw/INSTRUCTIONS.md

# 3. Verify souls/ are shared (no agent-specific duplicates)
ls system/souls/{identity,user,agent_soul,capabilities}.md

# 4. Verify project structure
ls workspaces/work/projects/SDR/{PROGRESS,MASTER,ARCHITECTURE,ROADMAP,CHECKPOINT}.md

# 5. Verify no duplicates exist
find . -name "CLAUDE.md" | wc -l  # Should be 1 (agents/CLAUDE.md only)
find . -name "persona_soul.md" | grep -v "team/members" | wc -l  # Should be 0

# 6. Verify memory structure
ls system/memory/YYYY-MM-DD.md (or touch it if missing)
```

**If any of these fail:** STOP. Fix before proceeding.

---

## RULES (Non-Negotiable)

1. **Shared vs Agent-Specific:**
   - ✅ Shared files go in `agents/` (not `agents/claude/` or `agents/openclaw/`)
   - ✅ Agent-specific go in `agents/claude/` AND `agents/openclaw/` (paired symmetry)
   - ✅ Persona files go in `team/members/NAME/` (not `system/souls/`)

2. **Project Structure:**
   - ✅ Every project has PROGRESS.md, MASTER.md, ARCHITECTURE.md
   - ✅ Use mandatory PROGRESS.md format (Phase | Current Task | Decisions | Blockers | Next)
   - ✅ Project files stay in project folder (workspaces/SCOPE/projects/NAME/)

3. **Memory:**
   - ✅ Updated at session end with decisions + reasoning
   - ✅ One daily file: system/memory/YYYY-MM-DD.md
   - ✅ Shared across all agents, all projects

4. **No Duplicates:**
   - ✅ If a file exists, don't recreate it in a different location
   - ✅ If a file needs to exist in multiple places, consolidate first
   - ✅ Search manifest BEFORE creating any new file

5. **File Consolidation:**
   - ✅ Single source of truth for each rule/concept
   - ✅ Reference existing files instead of replicating content
   - ✅ Keep .md files ≤200 lines; split into topics if needed

---

## What Happens If You Violate This

❌ **Violation:** Create `agents/openclaw/CLAUDE.md` (agent-specific, breaks symmetry)
✅ **Correction:** Use `agents/CLAUDE.md` (shared) instead

❌ **Violation:** Put project startup guide in `docs/superpowers/plans/CLAUDE.md`
✅ **Correction:** Put it in `agents/CLAUDE.md` (shared) or `workspaces/work/projects/SDR/CLAUDE.md` (project-specific)

❌ **Violation:** Create `system/souls/oliver-chase.md` (persona duplicates team/members/)
✅ **Correction:** Document Oliver in project files (MASTER.md, ARCHITECTURE.md)

❌ **Violation:** Forget to update PROGRESS.md at session end
✅ **Correction:** Always use mandatory format (Phase | Current Task | Decisions | Blockers | Next)

---

## How To Use This Manifest

**Before creating ANY file:**
1. Search this manifest for similar files
2. Verify location matches the rules above
3. Check the validation checklist
4. If unsure, ask

**Before starting work:**
1. Run the validation checklist (bash commands above)
2. Fix any failures
3. Proceed only when all checks pass

**Before committing:**
1. Verify no new files violate this manifest
2. Verify no duplicates created
3. Verify all project files are in correct locations

---

## Last Updated
2026-03-11

## Authority
This manifest overrides everything else (agents/CLAUDE.md, project INSTRUCTIONS, verbal requests).
If there's a conflict, this manifest wins.

---

**Read this file FIRST, before agents/CLAUDE.md, before any project file.**
**This is the safety rail that prevents structural violations.**
