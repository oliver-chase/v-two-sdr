# Skill: Project Protocol

Load this before starting or continuing any project. Universal standard for all Oliver work.

---

## Pre-Work Check

Before creating any project file, check if it already exists.

If **MASTER.md**, **PROGRESS.md**, or **AUDIT.md** exist at project root, read them first — do not overwrite or recreate.

If naming conventions differ (e.g., BRIEF.md instead of MASTER.md, STATUS.md instead of PROGRESS.md), use what exists and note the mapping in a comment.

**Consolidate only if the operator explicitly asks.**

**Never duplicate content across files** — if something is already captured in the repo, reference it, don't rewrite it.

---

## Project File Requirements

Every project requires three files at the project root:

### MASTER.md
- Full brief, all phases, all tasks, all directives
- Never pasted into chat
- Read from disk only

### PROGRESS.md
- Current state of the project
- Updated by Claude at the end of every session before stopping
- Format specified below

### AUDIT.md
- Written at project start
- Updated as findings change
- Security and structural findings

---

## Session Protocol

### Session Start (run in this order, every session)

1. **Run the test suite**
   - Report: suite count and test count
   - Confirm all passing

2. **Read git log**
   - `git log --oneline -5`

3. **Read PROGRESS.md**
   - Understand current state, branch, phase, task

4. **Read MASTER.md**
   - Start from current phase only
   - Skip all completed phases entirely

5. **Confirm current state**
   - Summarize where things stand before beginning work

### Session End (before stopping, every session)

1. **Run full test suite**
   - Confirm all tests passing
   - Report count

2. **Commit completed work**
   - Clear commit message with what was done
   - Include: Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>

3. **Update PROGRESS.md**
   - See format below

---

## Model Selection

Follow this unless the operator instructs otherwise:

- **Haiku (default):** File reads, component builds following existing patterns, CSS, test runs, data wiring
- **Sonnet:** New architecture decisions, new patterns, debugging that stumped Haiku — document reason in comment when switching
- **Never Opus**

Every response must report:
- Model used
- Tokens used (if available)

Every task that can run in parallel must use branched subagents — never run parallelizable work sequentially.

---

## Task Sizing Rules

**Every task must be completable in one focused subagent session.**

If a task feels large, split it before dispatching:
- A task is too large if it touches more than one view OR more than one data path
- No task should require reading the full MASTER.md to execute

The dispatch message must contain everything the subagent needs.

---

## Subagent Dispatch Rules

**Every parallelizable task runs on its own branch with its own subagent** — never run tasks sequentially that could run simultaneously.

Each dispatch message must include:
- The task spec (complete, self-contained)
- Names of existing components or hooks to reuse
- These two lines exactly:
  - `Design: read the frontend-design skill file and follow it. Self-review before committing.`
  - `Protocol: read the project-protocol skill file for session start and end rules.`

Do not pass MASTER.md or PROGRESS.md to subagents — they do not need the full brief, only their task.

**Subagent context must stay at or under 2000 tokens per dispatch.**

---

## File Reading Rules

**Never re-read a file that was already read in the current session** unless the file has been written to since it was last read.

**Never re-read completed phases** — PROGRESS.md tells you where you are, start there.

**Skill files are read once per session at start** — reference them by memory for the rest of the session unless a specific rule needs verification.

---

## Reporting Standards

**Every response from every subagent must include:**
- Model used
- Tokens used
- Task completed (status: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED)
- Tests passing (suite count and test count)

**Main orchestrator reports the same after merging each branch.**

**Always optimize for token efficiency** — never produce output that wastes tokens. Choose brevity over explanation unless clarification is critical.

---

## Gap-Filling

Read the repo, decide, document reasoning in a comment, and proceed.

- No questions
- No placeholders
- No TODOs

---

## Design

Before writing any UI code:
1. Read the project's design skill file (e.g., `skills/frontend-design/SKILL.md`)
2. Self-review every component against it
3. Fix violations before committing

---

## PROGRESS.md Format

Must always contain:

```
# Project: [Name]

## Current State
- **Phase:** [N] — [Name]
- **Current Task:** [Task name]
- **Last Completed:** [Previous task]
- **Branch:** [git branch name]

## Test Suite
- **Suites:** X passed, X total
- **Tests:** Y passed, Y total

## Decisions This Session
- [Decision 1 and reasoning]
- [Decision 2 and reasoning]

## Blockers or Open Questions
- [Any blockers]
- [Any open questions]

## Next Task
- [Task name and brief description]

---
```

---

## Session Protocol Block

Paste this at the top of every project's MASTER.md:

```
Session protocol: load the project-protocol skill and follow it. Then:
- Start from the current phase and task in PROGRESS.md — skip everything before it
- For any UI work: read the frontend-design skill before writing any component, self-review against it before committing
- Update PROGRESS.md before stopping
```

---

## Summary

This protocol ensures:
- **Consistency** across all projects
- **Continuity** between sessions (PROGRESS.md is the bridge)
- **No duplication** (reference existing docs)
- **Clear state tracking** (MASTER + PROGRESS + AUDIT)
- **Efficient work** (Haiku by default, Sonnet only when needed)
- **Quality** (design review, test suite verification)

---

*Last updated: 2026-03-11*
