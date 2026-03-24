# Operating System for All Agents (Non-Negotiable)

**Every agent (Claude Code, OpenClaw, future agents) follows this baseline.**

---

## Core Principles

- **Design First** — Brainstorm → Spec → Plan → Build (never skip design approval)
- **Security Mandatory** — Audit before shipping; no exceptions
- **Testing Required** — TDD always (tests before code); 80%+ coverage
- **Accuracy Non-Negotiable** — Live data only (no hardcoding), validate edge cases
- **Token Optimization** — Haiku default, Sonnet for architecture only, never Opus
- **No Duplicates** — Consolidate logic, don't sprawl; keep .md files ≤200 lines
- **Clear Ownership** — Every file has one owner; no overlapping responsibility
- **Verify Before Ship** — Use verification-before-completion skill; all tests pass

---

## Work Pattern (Every Project)

1. **Understand & Design** — Audit existing state, brainstorm, create spec, get approval
2. **Staff & Organize** — Define roles (developer, designer, tester, researcher), assign tasks
3. **Execute with Verification** — TDD, security audit, code review (simplify skill), verify output
4. **Deliver & Handoff** — All tests pass, coverage verified, docs complete, clear commit

---

## TOON Format (Token Optimization)

Use abbreviated keys in API responses (40% fewer tokens than JSON):

```
name→nm
description→ds
content→c
path→p
type→t
emoji→e
isDir→d
children→ch
enabled→en
version→v
```

---

## Consolidation Rules

- Before creating ANY file: search codebase first
- If similar logic exists: consolidate, don't duplicate
- If extending existing: modify the file, don't create new one
- Keep .md files ≤200 lines; split into topic files if needed
- Each .md file must have an owner

---

## Skills (Use These, Don't Reinvent)

| Skill | Purpose |
|-------|---------|
| `superpowers:brainstorming` | Design & requirements |
| `superpowers:writing-plans` | Implementation planning |
| `superpowers:subagent-driven-development` | Parallel execution |
| `superpowers:test-driven-development` | TDD discipline |
| `superpowers:systematic-debugging` | Bug investigation |
| `superpowers:verification-before-completion` | QA validation |
| `simplify` | Code review & cleanup |
| `code-review:code-review` | Formal code review |
| `frontend-design` | UI/UX design |

---

## Escalation Path

- **Technical/Security:** Claude Code (orchestrator)
- **Design/UX:** FE Designer persona
- **Testing:** Test Engineer persona (Phase 2+)
- **External APIs:** OpenClaw
- **Unclear:** Ask Kiana directly (AskUserQuestion)

---

## Expected Behavior — You SHOULD:

✅ Ask clarifying questions upfront
✅ Design before coding
✅ Create test infrastructure first
✅ Use TDD (tests before implementation)
✅ Reuse existing patterns
✅ Document as you go
✅ Escalate when unsure
✅ Create skills for reusable patterns
✅ Minimize file creation

---

## Expected Behavior — You should NOT:

❌ Start coding before design approval
❌ Skip tests
❌ Copy-paste code instead of consolidating
❌ Hardcode values
❌ Add dependencies without approval
❌ Create files without checking for duplicates
❌ Ship code with security warnings
❌ Leave dead code or comments
❌ Create massive .md files
❌ Build from ad-hoc patterns (create a skill instead)

---

**Reference:** See ORCHESTRATOR.md for workspace architecture overview.

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

