# CLAUDE.md — Claude Code Project Enforcement Rules

**MANDATORY:** Every Claude Code session MUST read this file first, before ANY other work.

This file enforces the startup sequence that prevents protocol violations and ensures proper continuation across conversation compactions.

---

## ⚠️ MANDATORY STARTUP SEQUENCE (EVERY SESSION)

**DO NOT SKIP. DO NOT RATIONALIZE. THESE ARE MANDATORY.**

### Step 1: Read Orchestration Files (5 min) — MANDATORY
- `agents/ORCHESTRATOR.md` — 6-layer architecture, agent roles, handoff protocol
- `agents/OPERATING_SYSTEM.md` — Core principles (Design First, TDD, Token Optimization, No Duplicates)
- `skills/project-protocol/SKILL.md` — Session protocol, PROGRESS.md format, file placement rules

### Step 2: Identify Current Project (1 min) — MANDATORY
```bash
git branch  # Shows current branch
git log --oneline -1  # Shows last commit
```
Then navigate to the project root and read:
- `PROGRESS.md` — Current phase, current task, blockers, next steps
- `MASTER.md` — Full brief (start from CURRENT phase only, skip completed phases)
- `CHECKPOINT.md` (if exists) — Recovery guide for compacted conversations

### Step 3: Check Task Tracking (1 min) — MANDATORY
```bash
claude task list  # Shows which tasks are pending/in-progress/blocked
```
Load the relevant chunk/task plan from the filesystem (NOT from chat history).

### Step 4: Understand Current State (2 min) — MANDATORY
- Read `system/memory/YYYY-MM-DD.md` (today's notes from prior sessions)
- See what decisions were made, what blockers exist, what's next
- **If conversation is compacted:** This file contains everything you need to know

### Step 5: Proceed with Work
You now have full context. Execute per the project's current phase and task.

---

## Why This Sequence Is Mandatory

**Prior Session Example (2026-03-11):**

I skipped steps 1-2 and jumped straight to work:
- ❌ Didn't read `skills/project-protocol/SKILL.md` → Created files in wrong locations
- ❌ Didn't follow PROGRESS.md format spec → Wrote my own format (wrong)
- ❌ Didn't update system/memory → Broke continuity
- ❌ Didn't report model + tokens → Violated output rules
- ❌ Didn't verify file structure → Created redundant files

**This sequence prevents those failures and ensures proper continuation across compactions.**

---

## If Conversation Compacts (You Will Have No Chat History)

**You will be starting fresh with no prior messages. That's OK. Do this:**

1. Read this file (you're reading it now)
2. Read orchestration files (5 min) — steps 1 above
3. Navigate to project root: `cd /Users/oliver/OliverRepo/workspaces/work/projects/SDR/` (example)
4. Load `PROGRESS.md` → See: Phase, current task, decisions, blockers
5. Load `CHECKPOINT.md` (if exists) → See: Recovery guide with 30-second status check
6. Load `system/memory/YYYY-MM-DD.md` → See: Session decisions, lessons, what was built
7. Run `claude task list` → See: Task status, blockers, what's ready
8. **You are fully caught up.** Proceed with next task.

**Critical:** All necessary state is in persistent files. You don't need the chat history. The files have everything.

---

## Non-Negotiable Rules (From agents/OPERATING_SYSTEM.md)

✅ **Design First** — Brainstorm → Spec → Plan → Build (never skip)
✅ **Token Optimization** — Haiku default, Sonnet only for architecture, never Opus
✅ **TDD Always** — Tests before code, 80%+ coverage minimum
✅ **No Duplicates** — One owner per file, consolidate logic, .md ≤200 lines
✅ **File Structure** — Orchestrator paths (system/souls/ identity only, team/members/ personas, workspaces/ projects)
✅ **Verify Before Ship** — Run tests, verify output, commit only when all passing
✅ **Report Always** — Every response: Model used + Tokens consumed
✅ **Update PROGRESS.md** — Every session end: Phase, Current Task, Decisions, Blockers, Next Task
✅ **Update Memory** — system/memory/YYYY-MM-DD.md: Decisions + reasoning + what's next

---

## Session End Checklist (MANDATORY)

Before closing any session:

- [ ] Run full test suite → Report: Suites passed/total, Tests passed/total
- [ ] Commit completed work → Clear message + Co-Authored-By
- [ ] Update PROGRESS.md → Use exact format: Phase | Current Task | Last Completed | Branch | Test Suite | Decisions | Blockers | Next Task
- [ ] Update system/memory/YYYY-MM-DD.md → Decisions made, lessons learned, what to do next session
- [ ] **Report in response:** Model used + Tokens consumed

---

## File Placement Rules (Orchestrator Structure)

| Purpose | Location | Owner | Example |
|---------|----------|-------|---------|
| Agent identity | system/souls/ | Shared | agent_soul.md, identity.md, user.md |
| Team personas | team/members/NAME/ | Shared | sdr/persona_soul.md, dev/persona_soul.md |
| Skills | skills/NAME/ | Shared | skills/project-protocol/SKILL.md |
| Project brief | workspaces/SCOPE/projects/NAME/ | Project | MASTER.md, PROGRESS.md, CHECKPOINT.md |
| Implementation plans | docs/superpowers/plans/ | Project | chunk-1-*.md, INDEX.md |
| Session continuity | system/memory/YYYY-MM-DD.md | Shared | Decisions + lessons from today |

**Hard rule:** Never create duplicate persona files. If something is already defined in team/members/, don't recreate it in system/souls/.

---

## Token Reporting (MANDATORY Every Response)

Every response must end with:
```
[Model: haiku-4-5 | Tokens: ~XXXX this response]
```

Example:
```
[Model: haiku-4-5 | Tokens: ~2,300 this response]
```

If upgrading to Sonnet:
```
[Model: sonnet-4-6 (upgraded for architectural decision) | Tokens: ~3,100 this response]
```

---

## Quick Reference: What To Do If Stuck

| Situation | Action |
|-----------|--------|
| Don't know current phase | Read PROGRESS.md → "Phase: X" |
| Don't know current task | Read PROGRESS.md → "Current Task: X" |
| Don't know where to start | Read CHECKPOINT.md → Has 30-second status check + next steps |
| Don't know what changed since last session | Read system/memory/YYYY-MM-DD.md → Decisions + decisions this session |
| Don't know which tasks are ready | Run `claude task list` → Shows pending/in-progress/blocked |
| Don't know file structure | Read agents/ORCHESTRATOR.md → "6-Layer Architecture" section |
| Don't know session protocol | Read skills/project-protocol/SKILL.md → "Session Start/End" section |
| Don't know output format | This file → "Token Reporting" section |

---

## What Happens If You Skip This Startup Sequence

❌ Wrong file locations (like I did on 2026-03-11)
❌ Wrong PROGRESS.md format (violation of project-protocol SKILL)
❌ No token reporting (violation of output rules)
❌ No memory updates (broken continuity for next session)
❌ Duplicate files (violation of consolidation rules)
❌ Context lost if conversation compacts (because memory not updated)

**This startup sequence prevents ALL of these failures.**

---

## Summary

**This file is your safety rail.**

Every session:
1. Read orchestration files (agents/ORCHESTRATOR.md, agents/OPERATING_SYSTEM.md, skills/project-protocol/SKILL.md)
2. Read project status (PROGRESS.md, CHECKPOINT.md, MASTER.md)
3. Check task tracking (claude task list)
4. Proceed with work
5. At session end: Run tests, commit, update PROGRESS.md + memory, report tokens

**If conversation compacts:** Load PROGRESS.md + CHECKPOINT.md + memory file → Fully caught up (no chat history needed).

---

**Last Updated:** 2026-03-11
**Enforced Since:** 2026-03-11 (after context loss incident)
**Status:** Active for all Claude Code sessions
