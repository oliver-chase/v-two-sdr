# OliverRepo File Structure Reference

Complete directory layout for agents and systems.

```
/Users/oliver/OliverRepo/
├── agents/
│   ├── ORCHESTRATOR.md (master guide)
│   ├── OPERATING_SYSTEM.md (non-negotiable baseline for all agents)
│   ├── FIRST-RUN.md (startup checklist)
│   ├── NEW-AGENT-GUIDE.md (onboarding template)
│   ├── shared-instructions.md (shared rules + token reporting)
│   ├── claude/
│   │   └── INSTRUCTIONS.md (Claude Code configuration)
│   └── openclaw/
│       └── INSTRUCTIONS.md (OpenClaw configuration)
├── system/
│   ├── dashboard/ (React + Node API command center)
│   │   ├── package.json, vite.config.js, server.js
│   │   ├── src/ (components, hooks, utils, styles)
│   │   ├── __tests__/ (Jest + React Testing Library)
│   │   ├── jest.config.js, .babelrc
│   │   └── docs/ (PRD, ARCHITECTURE, ROADMAP, design specs)
│   ├── docs/ (deprecated - use project-level docs)
│   ├── souls/ (shared identity - 9 files)
│   │   ├── identity.md, user.md, agent_soul.md
│   │   ├── capabilities.md, default.md, heartbeat.md
│   │   ├── startup-checklist.md, code-review-checklist.md
│   │   └── secrets-management.md
│   └── memory/
│       ├── YYYY-MM-DD.md (daily session logs)
│       └── lessons.md
├── skills/ (21 specialized skill folders)
│   ├── api-security/, async-task-execution/, brand-guidelines/
│   ├── code-enforcement/, competitive-intelligence/, debugging/
│   ├── git/, jtbd/, personas/, planning/, pm-visualizer/
│   ├── project-configuration/, self-improvement/, seo-content-creation/
│   ├── skill-security-audit/, software-architecture/, subagent-orchestration/
│   ├── token-optimizer/, utils/, webapp-testing/, work-outreach/
│   └── [Each has: SKILL.md + supporting files]
├── team/
│   ├── members/ (personas - 5 folders)
│   │   ├── dev/persona_soul.md
│   │   ├── fe-designer/persona_soul.md
│   │   ├── cmo/persona_soul.md
│   │   ├── marketing/persona_soul.md
│   │   └── sdr/persona_soul.md
│   └── tools.md (Oliver's environment notes)
├── hooks/
│   └── model-watch/ (OpenClaw model selection monitor)
├── workspaces/
│   ├── personal/projects/Fallow/
│   └── work/projects/SDR/
└── backups/
```

---

## Key Principles

- **Agents:** Both Claude Code and OpenClaw use the same workspace
- **Souls:** Shared identity files (system/souls/) - no agent-specific personalities
- **Personas:** Team member definitions (team/members/) - reference via config.json
- **Skills:** Specialized capabilities (skills/) - 21 folders, each with SKILL.md
- **Workspaces:** Project containers (workspaces/) - isolation boundary
- **Dashboard:** Command center (system/dashboard/) - reads from OliverRepo files
- **Memory:** Shared continuity (system/memory/) - session logs + lessons

---

**See ORCHESTRATOR.md for architecture overview.**
