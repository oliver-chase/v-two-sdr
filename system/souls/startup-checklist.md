# Startup Checklist — Every Session (Minimal Protocol)

Both Claude Code and OpenClaw follow this. Read in order. **Goal: Load only what you need.**

---

## Phase 1: Boot (Do This First) — 1 min

```
□ Check ~/.X/config.json (where X = claude or openclaw)
□ Verify root path: /Users/oliver/OliverRepo
□ If first run, read agents/ORCHESTRATOR.md completely
```

---

## Phase 2: Load Identity (System/Souls) — 2 min

Read ONLY these three (unless task requires more):

```
□ system/souls/identity.md — who you are
□ system/souls/user.md — who you serve
□ system/souls/agent_soul.md — your orchestrator rules

SKIP unless task requires:
  □ system/souls/capabilities.md — only if unclear what you can do
  □ system/souls/heartbeat.md — only if short/routine session
  □ system/souls/default.md — only if behavior unclear
```

---

## Phase 3: Load Instructions — 2 min

```
□ agents/shared-instructions.md — rules BOTH agents follow, token optimization
□ agents/claude/INSTRUCTIONS.md (if Claude Code: model defaults, operational structure)
   OR
□ agents/openclaw/INSTRUCTIONS.md (if OpenClaw: model defaults, operational structure)
```

---

## Phase 4: Load Memory

```
□ system/memory/YYYY-MM-DD.md — today's notes
  (If missing, it's a fresh session)
□ system/memory/lessons.md — rules you learned from past mistakes
```

---

## Phase 5: Know Your Fallback

```
□ Check your config's "fallback_agent" field
□ Claude Code fallback: OpenClaw (for APIs, real-time data, web research)
□ OpenClaw fallback: Claude Code (for logic, testing, code review)
□ Know how to invoke it (see shared-instructions.md)
```

---

## Phase 6: Understand the Structure — Reference Only

This is the map. Don't read everything — use it to find what you need.

```
├── agents/
│   ├── ORCHESTRATOR.md (master guide — use to find files)
│   ├── SECURITY-VERIFICATION.md (security protocol for all code)
│   ├── DOCUMENTATION-STANDARDS.md (how we maintain docs)
│   ├── shared-instructions.md (rules + token optimization)
│   ├── claude/INSTRUCTIONS.md (Claude defaults + protocol)
│   ├── openclaw/INSTRUCTIONS.md (OpenClaw defaults + protocol)
│   └── audit-log.md (security verification records)
├── system/
│   ├── docs/ (PRD.md, ROADMAP.md — product specs)
│   ├── souls/ (shared identity — load only 3 on startup)
│   └── memory/ (daily notes and lessons)
├── skills/ (specialized tools — load only relevant SKILL.md)
├── team/members/ (personas: dev, fe-designer, sdr, cmo, marketing)
├── workspaces/
│   ├── personal/projects/Fallow/ (personal project)
│   └── work/projects/SDR/ (V.Two sales outreach)
└── backups/
```

---

## Phase 7: OpenClaw Startup Verification (If Using OpenClaw)

```
□ Gateway health check: verify openclaw channels status shows 'Gateway reachable'
  └─ If healthy: proceed with normal startup
  └─ If down: run: gw restart (alias for: openclaw gateway restart)
  └─ If crashes on start: check ~/.openclaw/logs/gateway.err.log for root cause
```

---

## When You Have Questions

1. **"How do I...?"** → Check the relevant SKILL.md in skills/
2. **"What can I use?"** → Read agents/CAPABILITIES.md
3. **"Is this secure?"** → Check agents/SECURITY-VERIFICATION.md
4. **"How do I add new stuff?"** → Read agents/DOCUMENTATION-STANDARDS.md
5. **"What did we do yesterday?"** → Check system/memory/YYYY-MM-DD.md

---

## Critical Constraints (ALL agents must follow)

```
✋ NEVER blindly add external code
   → Always verify security first (agents/SECURITY-VERIFICATION.md)
   → Read the code in full
   → Audit and document findings

✋ NEVER create new documentation files
   → Update existing files instead
   → Consolidate when possible
   → Follow DOCUMENTATION-STANDARDS.md

✋ NEVER access these:
   → ~/.ssh/, ~/.aws/, .env files
   → ~/.claude/ or ~/.openclaw/ (except config.json)
   → Any credentials or API keys

✋ NEVER send external messages without approval
   → Emails, Slack, PRs, tweets, etc.
   → Opt-outs are the only exception (immediate action)

✋ NEVER ask Kiana for credentials in chat
   → Guide her to secret-portal or environment setup
   → Credentials only go in env files or secure vaults
```

---

## If You're Stuck

1. **Read more** — the answer is usually in the docs
2. **Ask yourself** — have I read the SKILL.md? The SECURITY-VERIFICATION.md?
3. **Call your fallback** — if stuck, that's what they're for
4. **Flag to Kiana** — if still stuck, that's what she's for

---

## One Session Cycle

```
Start
  ↓
Load this checklist
  ↓
Read startup phases 1-6
  ↓
Do work
  ↓
Update system/memory/YYYY-MM-DD.md
  ↓
End with one message to Kiana (if significant)
```

---

*Last updated: 2026-03-06*
