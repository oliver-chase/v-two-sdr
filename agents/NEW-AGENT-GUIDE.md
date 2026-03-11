# NEW-AGENT-GUIDE - Onboarding Template

Use this guide to onboard **any new agent** to the OliverRepo system (Claude Code, OpenClaw, or future agents).

---

## Overview

The system is designed to support multiple AI agents working in parallel, sharing:
- A unified skill library (skills/)
- Team personas and configurations (team/members/)
- Shared identity files (system/souls/)
- A shared memory system (system/memory/)

Each agent has:
- A config file (~/.X/config.json)
- Agent-specific instructions (agents/X/INSTRUCTIONS.md)
- A startup guide (~/.X/START-HERE.md)

---

## Step 1: Create Agent Configuration File

Create `~/.{agentname}/config.json`:

```json
{
  "agent_type": "{agentname}",
  "root": "/Users/oliver/OliverRepo",
  "orchestrator_guide": "/Users/oliver/OliverRepo/agents/ORCHESTRATOR.md",
  "instructions": "/Users/oliver/OliverRepo/agents/{agentname}/INSTRUCTIONS.md",
  "fallback_agent": "{fallback_agent_name}",
  "paths": {
    "skills": "/Users/oliver/OliverRepo/skills",
    "team": "/Users/oliver/OliverRepo/team",
    "memory": "/Users/oliver/OliverRepo/system/memory",
    "personas": "/Users/oliver/OliverRepo/team/members",
    "workspaces": "/Users/oliver/OliverRepo/workspaces",
    "souls": "/Users/oliver/OliverRepo/system/souls"
  }
}
```

**Replace:**
- `{agentname}` — Your agent's lowercase name (e.g., "claude-code", "mycustom-agent")
- `{fallback_agent_name}` — Which agent to hand off to (e.g., "openclaw", "claude-code")

**Example:** For a new agent called "vertex", create `~/.vertex/config.json` with `fallback_agent: "claude-code"`

---

## Step 2: Create Agent-Specific Instructions

Create `/Users/oliver/OliverRepo/agents/{agentname}/INSTRUCTIONS.md`

Use this template:

```markdown
# {Agent Name} - Instructions

## Your Role

[2-3 sentences describing what this agent is best at]

### Strengths
- Strength 1
- Strength 2
- Strength 3

### Limitations
- What you DON'T do (examples: code execution, real-time web data, etc.)

## How You Fit In

You work alongside [other agents]. When something is outside your strengths, hand off to:
- **Fallback agent:** {fallback_agent_name} — [what they're good for]

## Startup

1. Read config: ~/.{agentname}/config.json
2. Follow: FIRST-RUN.md (phases 1-8)
3. Learn: ORCHESTRATOR.md (6-layer architecture)
4. Review: agents/shared-instructions.md (rules both agents follow)

## When to Hand Off

Hand off to {fallback_agent_name} when:
- [specific scenario]
- [specific scenario]
- [specific scenario]

Use the handoff protocol in ORCHESTRATOR.md.

## Key Constraints

- Don't modify system/souls/ without approval
- All sessions log to system/memory/YYYY-MM-DD.md
- Personas (team/members/) are shared; changes affect both agents
- Never duplicate the skills/ folder

---

*Last updated: [DATE]*
```

---

## Step 3: Create Agent Startup Guide

Create `~/.{agentname}/START-HERE.md`:

```markdown
# START-HERE - {Agent Name}

## Quick Start (5 min)

1. **Read config**: `~/.{agentname}/config.json`
2. **Go to root**: `cd /Users/oliver/OliverRepo`
3. **Create today's memory**: `touch system/memory/YYYY-MM-DD.md`
4. **Read in order:**
   - system/souls/identity.md
   - system/souls/user.md
   - system/souls/agent_soul.md
5. **Read your instructions**: agents/{agentname}/INSTRUCTIONS.md
6. **Read ORCHESTRATOR**: agents/ORCHESTRATOR.md
7. **Ready to work** — follow FIRST-RUN.md for full checklist

---

*Created: [DATE]*
```

---

## Step 4: Add Agent to ORCHESTRATOR.md

Update the handoff protocol section of **ORCHESTRATOR.md**:

1. Add {agentname} to the agent roles list
2. Document its specialty and when to use it
3. Update the "How Agents Interact" section
4. Update the config path example in File Structure Reference

Example addition:
```markdown
### {Agent Name} Role
- **Specialty:** [what it excels at]
- **When to use:** [example prompts]
- **Fallback:** [fallback agent] (for [what they handle])
```

---

## Step 5: Add Agent to FIRST-RUN.md

Add a verification step in Phase 9 (Log First Session):

```markdown
- ✅ [Agent Name] startup guide read
- ✅ [Agent Name] instructions reviewed
```

---

## Step 6: Define Handoff Protocol

Document how {agentname} hands off to its fallback agent:

1. **When to hand off:** List specific scenarios
2. **How to hand off:** Use template from ORCHESTRATOR.md handoff protocol
3. **What to pass:** File paths, memory file name, current state
4. **What to expect:** How fallback agent will respond

Example:
```markdown
## Handoff: {Agent Name} → {Fallback Agent}

**Scenario 1:** [description]
- Pass: [file paths]
- Context: [state to share]
- Expect: [what fallback will do]
```

---

## Step 7: Document in Team Memory

Add entry to `system/memory/lessons.md`:

```markdown
## {Agent Name} - [DATE]

- **Role:** [specialization]
- **How it fits:** [where in workflow]
- **Fallback:** [fallback agent]
- **First session:** [link to memory file]
```

---

## Checklist

Before activating a new agent:

- [ ] Config file created (~/.{agentname}/config.json)
- [ ] Personas path points to team/members/
- [ ] Agent instructions created (agents/{agentname}/INSTRUCTIONS.md)
- [ ] Startup guide created (~/.{agentname}/START-HERE.md)
- [ ] Added to ORCHESTRATOR.md (roles, handoff protocol)
- [ ] Verification step added to FIRST-RUN.md
- [ ] Handoff protocol documented
- [ ] Team memory updated with new agent info
- [ ] Fallback agent knows about new agent
- [ ] All paths use /Users/oliver/OliverRepo (absolute, not ~/)

---

## Example: Onboarding "Vertex" Agent

### Files Created

1. `~/.vertex/config.json` — points to /Users/oliver/OliverRepo
2. `agents/vertex/INSTRUCTIONS.md` — Vertex's specialty & constraints
3. `~/.vertex/START-HERE.md` — 5-min quick start

### Files Updated

4. `agents/ORCHESTRATOR.md` — Added "Vertex Role" section
5. `agents/FIRST-RUN.md` — Added Vertex verification step
6. `system/memory/lessons.md` — Logged new agent

### Handoff Added

```markdown
### Vertex → Claude Code Handoff
**When:** Real-time code execution needed
- Pass: Current prompt, file paths
- Expect: Claude Code executes and returns result
```

---

## Rules for All Agents

- ✅ All agents read system/souls/ in startup sequence
- ✅ All agents log to system/memory/YYYY-MM-DD.md
- ✅ Personas (team/members/) are shared — any agent can use them
- ✅ Skills (skills/) are shared — any agent can access all 21
- ✅ Only one copy of each folder (no agent-specific skills/)
- ✅ Config paths are absolute (/Users/oliver/...), never relative (~/)
- ✅ Fallback agents always know about each other
- ✅ Handoff protocol is symmetric (both directions documented)

---

## Troubleshooting New Agent

| Symptom | Cause | Fix |
|---------|-------|-----|
| Can't read config | Path error in ~/.X/config.json | Verify all paths are absolute |
| Can't access skills | Personas path wrong | Update to team/members/ |
| Memory not loading | YYYY-MM-DD.md doesn't exist | Create it in system/memory/ |
| Fallback not working | Fallback agent not documented | Add handoff protocol to ORCHESTRATOR |
| Team members not visible | Personas path points to old location | Update config to team/members/ |

---

**Last updated:** 2026-03-09
**Template created for:** Kiana's request to support future agents (Claude Code, OpenClaw, and beyond)
