# CLAUDE.md — Startup Sequence for All Agents & Projects

## ⚠️ CRITICAL STARTUP ORDER (NON-NEGOTIABLE)

**You MUST follow this sequence. Do not skip or reorder:**

1. **READ FIRST:** `agents/STRUCTURE-MANIFEST.md` (source of truth for ALL file locations)
   - This document is AUTHORITATIVE and overrides everything else
   - Run validation checklist (bash commands in STRUCTURE-MANIFEST.md)
   - STOP if any validation fails

2. **READ SECOND:** Agent-specific INSTRUCTIONS
   - If Claude Code: `agents/claude/INSTRUCTIONS.md`
   - If OpenClaw: `agents/openclaw/INSTRUCTIONS.md`

3. **READ THIRD:** This file (CLAUDE.md — project startup guidance)

4. **READ FOURTH:** Project files (PROGRESS.md, CHECKPOINT.md, MASTER.md)

**If you deviate from this sequence, you WILL mess up the structure. Don't do it.**

---

## For This Project (SDR): After Reading agents/claude/INSTRUCTIONS.md

**Add these 3 steps to your startup sequence:**

### Step 1: Read Project Status Files (2 min)
```bash
cd /Users/oliver/OliverRepo/workspaces/work/projects/SDR/
cat PROGRESS.md          # Shows: Phase, Current Task, Decisions, Blockers, Next Task
cat CHECKPOINT.md        # Recovery guide (if conversation compacted)
cat MASTER.md           # Full brief (skip completed phases)
```

### Step 2: Check Task Status (1 min)
```bash
claude task list        # Shows: Which tasks ready, which blocked
```

### Step 3: Load Project Memory (1 min)
```bash
cat /Users/oliver/.claude/projects/-Users-oliver/memory/2026-03-11-sdr-implementation-checkpoint.md
# Shows: Decisions made, lessons learned, what to do next
```

**You are now fully caught up. Proceed with current task.**

---

## If Conversation Compacted (No Chat History)

You will have ZERO conversation context. That's OK:

1. Read `agents/claude/INSTRUCTIONS.md` (general rules)
2. Read this file (project setup)
3. Load `workspaces/work/projects/SDR/PROGRESS.md` → See current phase, current task
4. Load `workspaces/work/projects/SDR/CHECKPOINT.md` → See 30-second recovery guide
5. Load `system/memory/2026-03-11-sdr-implementation-checkpoint.md` → See decisions
6. Run `claude task list` → See task status
7. **Fully caught up without chat history.**

All necessary state is persisted to disk. No context lost.

---

## Critical (Already in agents/claude/INSTRUCTIONS.md — Don't Skip)

**These are NON-NEGOTIABLE and already documented elsewhere. Enforce them:**
- ✅ **Startup sequence:** agents/claude/INSTRUCTIONS.md "On Startup — Minimal Read Protocol"
- ✅ **Max 3 files per startup:** agents/claude/INSTRUCTIONS.md "Hard rule"
- ✅ **Token reporting:** agents/claude/INSTRUCTIONS.md "Token report"
- ✅ **Memory updates:** agents/claude/INSTRUCTIONS.md "Update system/memory/YYYY-MM-DD.md"
- ✅ **Session end:** skills/project-protocol/SKILL.md "Session End" section
- ✅ **Output rules:** agents/claude/INSTRUCTIONS.md "Output Rules"

**This file only adds PROJECT-SPECIFIC startup steps. Everything else references existing docs.**

---

## Session End (From agents/claude/INSTRUCTIONS.md + project-protocol SKILL)

Before closing any session:
1. Run full test suite → Report: Suites/Tests counts
2. Commit work → Clear message + Co-Authored-By
3. Update `workspaces/work/projects/SDR/PROGRESS.md` → Phase | Current Task | Decisions | Blockers | Next
4. Update `system/memory/YYYY-MM-DD.md` → Decisions + lessons learned
5. **Report response:** `[Model: haiku-4-5 | Tokens: ~XXXX this response]`

See `skills/project-protocol/SKILL.md` for exact PROGRESS.md format.

---

## Recovery Timeline

If conversation compacts:
- Read this file: 1 min
- Load project status: 1 min
- Load memory: 1 min
- Check tasks: 1 min
- **Total recovery: 4 minutes**
- **Context loss: 0%**

All state is on disk. Nothing in chat history is required.

---

**Last Updated:** 2026-03-11
**Status:** Active for SDR project
**Conflicts:** None — references existing rules in INSTRUCTIONS.md + project-protocol SKILL.md
