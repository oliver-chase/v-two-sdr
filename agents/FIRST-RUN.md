# First Run Checklist

Both Claude Code and OpenClaw follow this when starting their first session (or if memory is missing).

---

## Phase 1: Verify Configuration (2 min)

- [ ] Read `~/.X/config.json` (where X = claude or openclaw)
- [ ] Verify `"root": "/Users/oliver/OliverRepo"`
- [ ] Note `"fallback_agent"` (yours is documented)
- [ ] Verify paths in `"paths"` object are accessible

**If any verification fails:** Stop and report to Kiana.

---

## Phase 2: Navigate to Root (1 min)

- [ ] Change to `/Users/oliver/OliverRepo`
- [ ] Verify these folders exist:
  - `agents/`
  - `system/souls/`
  - `skills/`
  - `team/members/`
  - `workspaces/`
- [ ] List `agents/` — should see:
  - ORCHESTRATOR.md
  - shared-instructions.md
  - claude/ (or openclaw/)
  - audit-log.md

**If folders missing:** Report to Kiana.

---

## Phase 3: Create Today's Memory File (1 min)

```bash
touch /Users/oliver/OliverRepo/system/memory/YYYY-MM-DD.md
```

**Format of new memory file:**
```markdown
# Session: YYYY-MM-DD

## Startup
- Agent: [Claude Code | OpenClaw]
- Time: HH:MM
- Status: ✅ Started

## Work
(Notes will be added as we work)

## Completion
- Status: (will fill at end)
```

---

## Phase 4: Load Identity (3 min)

Read these files **in order** (don't skip):

1. [ ] `system/souls/identity.md` — Who you are
2. [ ] `system/souls/user.md` — Who you serve (Kiana)
3. [ ] `system/souls/agent_soul.md` — Orchestrator rules
4. [ ] `system/souls/capabilities.md` — What you can do
5. [ ] `system/souls/secrets-management.md` — How to access API keys & coach Kiana
6. [ ] `agents/shared-instructions.md` — Rules you both follow

**If any file missing:** Report to Kiana.

---

## Phase 5: Load Your Agent-Specific Instructions (1 min)

- [ ] **Claude Code:** Read `agents/claude/INSTRUCTIONS.md`
- [ ] **OpenClaw:** Read `agents/openclaw/INSTRUCTIONS.md`

**Verify you understand:**
- Your primary role
- Your fallback agent (when to call them)
- Your tool access level

---

## Phase 6: Verify Skills Accessible (2 min)

```bash
ls /Users/oliver/OliverRepo/skills/
```

Should see **21 folders:**
1. api-security
2. async-task-execution
3. brand-guidelines
4. code-enforcement
5. competitive-intelligence
6. debugging
7. git
8. jtbd
9. personas
10. planning
11. pm-visualizer
12. project-configuration
13. self-improvement
14. seo-content-creation
15. skill-security-audit
16. software-architecture
17. subagent-orchestration
18. token-optimizer
19. utils
20. webapp-testing
21. work-outreach

- [ ] Count is correct (21 folders)
- [ ] Try reading one SKILL.md (e.g., `skills/git/SKILL.md`)
- [ ] Verify it has both `### Claude Code` and `### OpenClaw` sections

**If any skill missing:** Report to Kiana, but continue.

---

## Phase 7: Verify Team Members (1 min)

```bash
ls /Users/oliver/OliverRepo/team/members/
```

Should see **5 folders:**
- dev (active)
- fe-designer (active)
- sdr (active)
- cmo (planned)
- marketing (planned)

- [ ] All five exist
- [ ] Each has `persona_soul.md`
- [ ] SDR, CMO, Marketing also have `config.json`

---

## Phase 8: Understand Your Context (2 min)

- [ ] Read `agents/ORCHESTRATOR.md` (master guide)
- [ ] You now understand:
  - 5-layer architecture
  - How personas work
  - When to hand off
  - How memory persists

---

## Phase 9: Log First Session

Update today's memory file:

```markdown
## Startup
- Agent: [your name]
- Time: [current time]
- Status: ✅ Started

## First-Run Checklist
- ✅ Config verified
- ✅ Root navigated
- ✅ Memory file created
- ✅ Identity loaded
- ✅ Agent-specific instructions read
- ✅ 9 skills verified
- ✅ 3 team members verified
- ✅ ORCHESTRATOR understood

**Ready to work.**
```

---

## Phase 10: Ready Signal

**Message to Kiana:**
```
Hi Kiana, I'm [Agent Name].
First session complete. I'm ready to work.
Current token budget: [check with token_tracker.py]
```

---

## Time Estimate

- **Total:** ~15 minutes
- **Blockers to report:** Missing files, config issues, skill access failures
- **OK to continue with:** Missing projects (they'll be created as needed)

---

## If Anything's Wrong

**Symptom: Can't read config**
→ Path might have changed. Check `~/.X/config.json` syntax.

**Symptom: Root folder doesn't exist**
→ Report to Kiana. Critical blocker.

**Symptom: Missing souls or agent instructions**
→ Report to Kiana. Critical blocker.

**Symptom: Missing a skill**
→ OK to continue. Skill might be under development. Log and move on.

---

*Last updated: 2026-03-09*
