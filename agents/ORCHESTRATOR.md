# ORCHESTRATOR - Master Guide

Both Claude Code and OpenClaw use this guide to understand the workspace architecture.

## 6-Layer Architecture

```
┌─────────────────────────────────────────┐
│   ORCHESTRATOR (this file)              │ ← Both agents start here
├─────────────────────────────────────────┤
│   SOUL FILES (system/souls/)            │ ← Identity, personality, constraints
├─────────────────────────────────────────┤
│   SKILLS (skills/)                      │ ← Specialized tools & capabilities
├─────────────────────────────────────────┤
│   TEAM (team/) & PERSONAS (team/members/)│ ← Role definitions & personas
├─────────────────────────────────────────┤
│   HOOKS (hooks/)                        │ ← System utilities & monitoring
├─────────────────────────────────────────┤
│   WORKSPACES (workspaces/)              │ ← Projects & execution
└─────────────────────────────────────────┘
```

## Startup Sequence (Both Agents)

1. **Read config** → ~/.claude/config.json or ~/.openclaw/config.json
2. **Read souls in order:**
   - system/souls/identity.md (who you are)
   - system/souls/user.md (who you're helping)
   - system/souls/agent_soul.md (your constraints)
3. **Check memory:** system/memory/YYYY-MM-DD.md (today's notes)
4. **Read capabilities:** system/souls/capabilities.md
5. **Note fallback:** Check config for fallback_agent — know when to hand off

## Layer Details

### Layer 1: Souls (system/souls/)
Identity, personality, constraints, and checklists. All 9 files:
- **identity.md** — Agent personality, vibe, operating style
- **user.md** — Kiana's preferences and work style
- **agent_soul.md** — Orchestrator rules, persona roster, handoff protocol
- **capabilities.md** — What you can do, what you can't
- **default.md** — Default behavior and fallback patterns
- **heartbeat.md** — Routine health check procedures
- **startup-checklist.md** — First-time startup verification
- **code-review-checklist.md** — Code review standards and gates
- **secrets-management.md** — How API keys are stored & accessed, coaching guide

### Layer 2: Skills (skills/)
Specialized tools & capabilities. 21 skill folders, each with SKILL.md:
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

### Layer 3: Team & Personas
- **team/members/** — Real team personas (dev, fe-designer, cmo, marketing, sdr) with persona_soul.md and config.json
- **team/tools.md** — Oliver's environment notes & local setup (models, scripts, gateway management)

### Layer 4: Hooks (hooks/)
System utilities and monitoring:
- **hooks/model-watch/** — OpenClaw hook that warns when expensive models are selected

### Layer 5: Workspaces (workspaces/)
Projects and execution contexts:
- **personal/projects/Fallow/** — Personal project (EDP)
- **work/projects/SDR/** — Work project (sales outreach automation)

## How Agents Interact

### Claude Code Role
- **Specialty:** Code logic, testing, local execution, architecture
- **When to use:** "Implement this feature", "Debug this", "How would you structure X?"
- **Fallback:** OpenClaw (for real-time data, APIs, external context)

### OpenClaw Role
- **Specialty:** External APIs, real-time data, web research, integrations
- **When to use:** "Check the web for X", "Call this API", "What's the latest Y?"
- **Fallback:** Claude Code (for logic, testing, code review)

### Handoff Protocol
When one agent needs the other:
1. **Summarize:** What was done, what's pending, what decisions are needed
2. **Context pass:** Include relevant file paths and memory
3. **Call fallback:** Invoke the other agent with full context
4. **Relay response:** Bring answer back to Kiana, stay in the loop

## Key Rules

1. **No duplicate folders** — Only one skills/, one team/, one workspaces/
2. **Config files** — Both agents have ~/.X/config.json pointing to /Users/oliver/OliverRepo
3. **Personas path** — Both configs point to team/members (NOT agents/personas/)
4. **Memory is shared** — system/memory/ is both agents' continuity
5. **Naming uniform** — "work", not "vtwo"; "SDR", not V.Two
6. **Both read souls** — No agent-specific personality files — use shared identity
7. **API keys** — See system/souls/secrets-management.md for how to access & coach through

## Agent Support Documentation

These files provide guidance for agents adding features, handling errors, and verifying security:
- **ERROR-HANDLING.md** — Error patterns and recovery procedures
- **CREATE-SKILL.md** — How to add a new skill
- **SKILL-TEMPLATE.md** — Template for new skills
- **DOCUMENTATION-STANDARDS.md** — Doc writing standards
- **SECURITY-VERIFICATION.md** — Security checks before deployment
- **INVOCATION.md** — How skills are invoked by users

## Operating System for All Agents

**Every agent follows a non-negotiable operating baseline. See:** `agents/OPERATING_SYSTEM.md`

This file contains the core principles, work pattern, skills matrix, escalation path, and expected behaviors for all agents (Claude Code, OpenClaw, and future agents).

---

## How to Add a New Agent

For onboarding Claude Code, OpenClaw, or any future agent to the system:
See **agents/NEW-AGENT-GUIDE.md** for complete step-by-step process.

## File Structure Reference

**See:** `FILE_STRUCTURE.md` for complete directory layout with all 21 skills, 5 team personas, souls, memories, and workspaces.

---

**Last updated:** 2026-03-09
