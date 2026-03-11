# Error Handling & Recovery

What to do when things break or get stuck.

---

## By Symptom

### "File not found" / "Path doesn't exist"

**Likely cause:** Path reference is old or wrong

**Claude Code:**
```bash
# Check path exists
ls -la /Users/oliver/OliverRepo/skills/work-outreach/SKILL.md

# If missing, check SKILL.md file exists in that skill folder
find /Users/oliver/OliverRepo/skills -name "SKILL.md"
```

**Fix:**
- Update reference to correct path
- Check agents/DOCUMENTATION-STANDARDS.md for path conventions
- Report to Kiana if path is fundamentally wrong

**Who fixes:** Claude Code

---

### "Skill not found" / "Can't access skill"

**Likely cause:** Skill folder exists but SKILL.md missing or in wrong location

**Verify:**
```bash
ls /Users/oliver/OliverRepo/skills/<skill-name>/SKILL.md
```

**Fix:**
- [ ] File exists? Check permissions: `ls -la`
- [ ] File readable? Try: `head -20 SKILL.md`
- [ ] Path correct? Compare to REGISTRY.md

**Who fixes:** Claude Code (check file system)

---

### "Can't read memory" / "Where's yesterday's context?"

**Likely cause:** Memory file not created or in wrong location

**Verify:**
```bash
ls /Users/oliver/OliverRepo/system/memory/
```

**Should have:**
- YYYY-MM-DD.md (today)
- YYYY-MM-DD.md (yesterday)
- lessons.md
- archive/ (folder)

**Fix:**
- [ ] Create today's file: `touch /Users/oliver/OliverRepo/system/memory/YYYY-MM-DD.md`
- [ ] Read yesterday's file: `cat /Users/oliver/OliverRepo/system/memory/YYYY-MM-DD.md`
- [ ] Log findings to today's file

**Who fixes:** Both agents (self-service)

---

### API / External Service Fails (OpenClaw)

**Symptom:** "Connection refused" / "API returned 401" / "Rate limited"

**Steps:**
1. Check API documentation (web_search or web_fetch)
2. Verify credentials in secret-portal (if auth needed)
3. Check rate limits or service status
4. Log to system/memory/YYYY-MM-DD.md: "API X failed at time Y"

**If blocked >5 min:** "Claude Code, I can't reach [API]. Can you help debug or will we use a workaround?"

**Who fixes:** OpenClaw (primary), Claude Code (if it's a credential issue)

---

### Code Breaks / Test Fails (Claude Code)

**Symptom:** "Script error" / "Tests failing" / "Build broken"

**Steps:**
1. Read full error (not just first line)
2. Check git log to see what changed
3. Revert last change: `git reset --soft HEAD~1`
4. Debug using skills/debugging/SKILL.md
5. Log root cause to system/memory/lessons.md

**If can't fix in 10 min:** "OpenClaw, I'm stuck on [X]. Can you research [relevant topic]?"

**Who fixes:** Claude Code (primary), OpenClaw (if research needed)

---

### Both Agents Confused (Stuck Loop)

**Symptom:** Agents keep passing back and forth / not making progress

**Escalation:**
```
"I'm stuck in a loop with [other agent].
What I've tried: [list]
Where I'm stuck: [specific blocker]
@Kiana - help?"
```

**Kiana's job:** Clarify goal or reset context

**Both agents:** Stop handoff loop, wait for Kiana's direction

---

### Memory Gets Too Large

**Symptom:** system/memory/YYYY-MM-DD.md >5k tokens

**Fix:**
1. Archive old entries to system/memory/archive/
2. Keep active notes only
3. Summarize key decisions to lessons.md
4. Keep current file clean

**Who fixes:** Claude Code (file operations)

---

### Persona Activation Fails

**Symptom:** "Can't read SDR persona" / "Missing persona_soul.md"

**Verify:**
```bash
ls -la /Users/oliver/OliverRepo/team/members/sdr/
```

**Should have:**
- persona_soul.md ✅
- config.json ✅
- memory.md (optional)

**If missing:**
- For SDR: Critical. Report to Kiana.
- For CMO/Marketing: OK, they're planned.

**Who fixes:** Claude Code (verify files), Kiana (create if missing)

---

### Fallback Agent Unreachable

**Symptom:** "Claude Code, I need you but you're not responding"

**Steps:**
1. Check fallback agent is still running
2. Try one more time with full context
3. If still stuck: Escalate to Kiana with specific data

**Who fixes:** Both (wait for other to respond)

---

## Recovery Patterns

### Pattern 1: File Not Found
```
1. Check if file exists (ls -la)
2. Check if path is correct (compare to docs)
3. Check permissions (ls -la)
4. If still stuck: Report to Kiana with path
```

### Pattern 2: External Service Failed
```
1. Check service docs (web_search)
2. Verify auth (check secret-portal)
3. Check rate limits
4. Log attempt + error
5. If >5 min: Switch to fallback or escalate
```

### Pattern 3: Logic Error
```
1. Read full error message
2. Check git diff to see what changed
3. Run tests for that module
4. Revert if needed, then fix
5. Log root cause to lessons.md
```

### Pattern 4: Unclear Requirements
```
1. State what you think the task is
2. Ask clarifying question
3. If Kiana doesn't respond: Proceed with assumption
4. Update memory with assumption
5. Adjust if Kiana corrects you
```

---

## Escalation Path

| Issue | Who Handles | When to Escalate |
|-------|------------|-----------------|
| Missing local file | Claude Code | >2 min stuck |
| API credential error | OpenClaw | >3 min stuck |
| Code logic error | Claude Code | >10 min stuck |
| Unclear task | Either | Immediately |
| Both agents stuck | Either | >5 min |
| Configuration wrong | Both | Immediately |
| Kiana needs to decide | — | Immediately |

---

## What NOT to Do

❌ **Don't:**
- Force past errors without understanding them
- Overwrite files without backup
- Hardcode credentials in code
- Ignore security warnings
- Delete memory without archiving
- Loop in handoffs >3 times without escalating

✅ **Do:**
- Read full error messages
- Log what went wrong
- Ask for help early
- Escalate to Kiana transparently
- Archive before deleting
- Document fixes in lessons.md

---

## Logging Errors

When something goes wrong, add to system/memory/YYYY-MM-DD.md:

```markdown
## [TIME] Error: [Name]

**What failed:** [Description]
**Error message:** [First 3 lines of error]
**Attempted fix:** [What you tried]
**Result:** [Worked | Still stuck | Escalated]

If escalated:
**Blocker:** [Why you can't proceed]
**Need:** [What help is needed]
```

---

*Last updated: 2026-03-06*
