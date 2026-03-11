# Skill: Self-Improvement

**Category:** System
**Status:** Active
**Last Updated:** 2026-03-06

---

## Purpose

Log errors, corrections, and learnings so both agents improve across sessions. Turn mistakes into permanent rules.

---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes
- **When:**
  - Code breaks unexpectedly
  - Kiana corrects implementation approach
  - Discovers a better pattern
  - Command fails and root cause found
- **Tools available:** write (to system/memory/lessons.md)
- **Example:** "Tried using exec without proper error handling. Kiana corrected: always wrap in try/catch. Log it."

### OpenClaw
- **Can use:** Yes
- **When:**
  - API integration fails
  - Market research approach needs adjustment
  - Kiana corrects research methodology
  - Data validation error found
- **Tools available:** write (to system/memory/lessons.md)
- **Example:** "Email validation API returned unexpected format. Log the fix for next time."

### Collaboration Pattern
- **Both agents log independently** to system/memory/lessons.md
- **Shared learning:** One agent's lesson benefits the other
- **Kiana corrections:** Always logged for both agents to reference
- **Promotion rule:** If broadly applicable, move from memory to system/souls/

---

## When to Activate This Skill

**Trigger words/phrases:**
- "No, that's wrong..."
- "You keep doing X..."
- "Try this instead..."
- Command error (non-zero exit)
- "Can you also... (feature request)"
- Self-discovered pattern or better approach

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** Initial setup
**Risk Level:** Low
**Key Findings:**
- Only writes to system/memory/ (safe location)
- Never reads credentials
- Never modifies code without explicit approval
- Append-only logging (no destructive changes)

---

## How Both Agents Log

### Type 1: Learning / Correction

When Kiana says: "No, that's wrong..." or "Try this instead..."

```markdown
## [2026-03-06] category

**Priority:** low | medium | high
**Area:** code | api | data | workflow | docs

### What happened
Brief description of the mistake or suboptimal approach

### What's correct
The right way to do it

### Action
Specific rule or pattern to apply next time

### Promotion to
(If broadly applicable): SOUL.md / agents/startup-checklist.md / system/souls/ (which file)
```

**Example:**

```markdown
## [2026-03-06] git-commits

**Priority:** high
**Area:** code

### What happened
Claude Code committed with message: "fix: stuff"
Kiana: "That's too vague. What did you actually fix?"

### What's correct
Commit messages must describe the WHAT and WHY:
- `fix: correct event schema validation for empty strings`
- `feat: add geolocation radius filtering`

Not: "fix: stuff" or "update code"

### Action
Always use specific, 50-char descriptive messages.
Format: `type: description`

### Promotion to
system/souls/code-review-checklist.md (add to commit section)
```

---

### Type 2: Error Found & Fixed

When debugging yields a solution:

```markdown
## [2026-03-06] operation-name

**Priority:** high | medium | low
**Area:** code | api | infra | config

### What failed
Brief description

### Error output
Paste actual error message or stack trace (first 5 lines)

### Root cause
Why it happened

### Fix
What resolves it (command, code change, config, etc.)

### Prevention
Rule to prevent this next time
```

**Example:**

```markdown
## [2026-03-06] api-validation

**Priority:** high
**Area:** api

### What failed
OpenClaw's email validation returned "invalid JSON"

### Error output
```
requests.exceptions.JSONDecodeError: Expecting value: line 1 column 1
```

### Root cause
API returns HTML error page on rate limit (not JSON)

### Fix
Check response status code before parsing JSON:
```python
if response.status_code != 200:
    log error page, don't parse JSON
else:
    parse JSON
```

### Prevention
Always check HTTP status code before assuming JSON response
```

---

### Type 3: Feature Request

When Kiana says: "Can you also..." or "I wish we could..."

```markdown
## [2026-03-06] feature-request

**Requested by:** Kiana
**Area:** feature | improvement | automation

### Request
What Kiana asked for

### Impact
How this would help (time saved, error reduction, etc.)

### Priority**
critical | high | medium | low

### Status
pending | in-progress | blocked | completed
```

**Example:**

```markdown
## [2026-03-06] feature-request

**Requested by:** Kiana
**Area:** automation

### Request
"Can you automatically flag prospects with bounced emails and move them to a separate list?"

### Impact
Saves manual review time, keeps send list clean

### Priority
high

### Status
pending
```

---

## Promotion Rule (Critical!)

If a learning applies broadly, **promote it immediately** to permanent files:

| Learning Type | Promote To | When |
|---|---|---|
| Behavioral pattern | system/souls/startup-checklist.md | Always applies to both agents |
| Code pattern | system/souls/code-review-checklist.md | Code quality rule |
| Workflow improvement | agents/shared-instructions.md | Both agents should follow |
| Tool gotcha | system/souls/heartbeat.md | Routine operations issue |
| Project convention | workspaces/<project>/SKILL.md | Specific to one project |
| Security finding | agents/SECURITY-VERIFICATION.md | Security-related |

**Don't let learnings sit in memory if they should be permanent rules.**

---

## Setup (First Time)

```bash
mkdir -p /Users/oliver/OliverRepo/system/memory/archive
touch /Users/oliver/OliverRepo/system/memory/lessons.md
touch /Users/oliver/OliverRepo/system/memory/errors.md (optional)
```

---

## Reviewing Lessons

Both agents should review learnings periodically:

```bash
# Every week
cat /Users/oliver/OliverRepo/system/memory/lessons.md

# Promote any that should be permanent
# Delete any that have been fixed
```

---

## Archive Old Lessons

When lessons.md gets too large (>2K):

```bash
# Move old entries to archive
mv /Users/oliver/OliverRepo/system/memory/lessons.md \
   /Users/oliver/OliverRepo/system/memory/archive/lessons-2026-01.md

# Start fresh
touch /Users/oliver/OliverRepo/system/memory/lessons.md
```

---

## Scope

This skill **only** writes to:
- system/memory/lessons.md
- system/memory/errors.md (optional)
- system/memory/archive/

It **never**:
- Reads credentials or env files
- Modifies code files (except system/souls/ with approval)
- Deletes or overwrites existing lessons (append only)

---

## Token Budget

~100–300 tokens per log entry

---

## Related Skills

- **debugging/** — often triggers error logs
- **planning/** — review lessons before planning new phases

---

*Last updated: 2026-03-06*
