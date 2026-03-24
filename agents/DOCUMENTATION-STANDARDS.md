# Documentation Standards

How to write, update, and maintain documentation for this shared system.

**Key Principle:** Consolidate. Rewrite existing. Update in place. Don't add new files unless absolutely necessary.

---

## TOON Format for Data

Use TOON (Token-Oriented Object Notation) for:
- Team member profiles
- Lead lists and structured data
- Configuration arrays
- Anything that's rows of consistent data

**Why:** Saves tokens, improves LLM accuracy, easier for both agents to parse.

### Example: Team Members

Instead of individual JSON files:

```
team_members[3]{name,role,persona_type,status,trigger_keyword,focus}:
 sdr,Sales Development Rep,work,active,SDR,Lead generation and outreach
 cmo,Chief Marketing Officer,work,planned,CMO,Brand positioning and campaigns
 marketing,Content & Demand Gen,work,planned,Marketing,Content creation and SEO
```

### Example: Skills Registry

```
skills[5]{name,category,status,purpose,risk_level,security_verified}:
 debugging,Development,active,Structured debugging by symptom,low,2026-03-06
 git,Development,active,Commit conventions and recovery,low,2026-03-06
 planning,Development,active,Phase/sprint planning,low,2026-03-06
 token-optimizer,System,active,Token budget tracking and routing,medium,2026-03-06
 work-outreach,Business,active,B2B sales outreach and SDR workflows,medium,2026-03-06
```

---

## SKILL.md Format (Template)

Every skill has a SKILL.md at `skills/<skill-name>/SKILL.md`. Use this template:

```markdown
# Skill: <Name>

**Category:** [Development | Business | System | Analysis]
**Status:** [Active | Planned | Archived]
**Both agents can use:** [Yes | No]

---

## Purpose

One sentence: what problem does this solve?

---

## When to Use This Skill

- Trigger word (if applicable): "SDR" for work-outreach
- Use case 1
- Use case 2
- Use case 3

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** [Agent name]
**Risk Level:** Low / Medium / High
**Key Findings:**
- Input validation: [Yes/No] — how
- Credential handling: [How] — use secret-portal, env vars, etc.
- External calls: [Where] — APIs used
- Dangerous operations: [None/List them]

---

## How to Use

### Setup

[One-time configuration if needed]

### Basic Usage

[Concrete example]

### Advanced Usage

[If applicable]

---

## Data Structures

If this skill works with data files, document the structure:

```toon
prospects[2]{firstName,lastName,company,title,email,status}:
 John,Doe,Acme Corp,CTO,john@acme.com,contacted
 Jane,Smith,TechCo,VP Eng,jane@techco.com,pending
```

---

## Security Boundaries

**Can:**
- Read files in system/
- Access configured APIs
- Write to memory/

**Cannot:**
- Run arbitrary shell commands
- Access ~/.ssh/, ~/.aws/, .env files
- Share credentials in chat

---

## Fallback / Collaboration

If this skill needs help from another agent:
- **Claude Code needed for:** [describe when]
- **OpenClaw needed for:** [describe when]

---

## Token Budget

Estimated tokens for typical operations: ~500–2000

---

## Last Updated

2026-03-06 by [Agent/Human]
```

---

## Team Member Profiles

Create `team/members/<name>/` with:

1. **persona_soul.md** — personality, constraints, role
2. **config.json** — TOON-formatted config with tools, workspace paths, collaboration rules

**Example persona_soul.md:**

```markdown
# Persona Soul: SDR

**Name:** SDR Oliver
**Role:** Sales Development Representative
**Company:** V.Two
**Vibe:** Sales expert, direct, no fluff
**Emoji:** 📬

## Identity
Sales and outreach specialist...

## Operating Principles
- Pre-organize everything so Kiana just approves
- Never send without approval (except opt-outs)
- Short, readable, friend-not-salesperson tone

## Constraints
Allowed tools: web_search, write, message, read
Restricted: exec, secrets.access

## Collaboration
- Marketing strategy needed → Oliver pulls in CMO
- Content assets → Oliver pulls in Marketing
```

**Example config.json:**

```json
{
  "persona": "sdr",
  "role": "Sales Development Rep",
  "company": "V.Two",
  "workspace": "workspaces/work/projects/SDR",
  "allowed_tools": ["web_search", "write", "message", "read"],
  "restricted_tools": ["exec", "secrets.access"],
  "collaboration": {
    "can_access": ["cmo", "marketing"],
    "shared_data": {
      "prospects": "workspaces/work/projects/SDR/prospects.json",
      "templates": "workspaces/work/projects/SDR/outreach/templates.md"
    }
  }
}
```

---

## Project Documentation

Each project in `workspaces/` has a SKILL.md in its root:

```
workspaces/
├── personal/projects/Fallow/
│   ├── SKILL.md
│   ├── README.md
│   └── [code/assets]
└── work/projects/SDR/
    ├── SKILL.md
    ├── README.md
    └── [data/templates/outreach]
```

---

## agents.md Consolidation Rule

**NEVER have agent-specific startup instructions scattered.** Keep them:
1. In system/souls/ (shared)
2. In agents/shared-instructions.md (both agents)
3. In agents/<agent-type>/INSTRUCTIONS.md (agent-specific roles)

---

## Memory Consolidation

**Never create new memory files.** Use:
- `system/memory/YYYY-MM-DD.md` — today's notes (both agents write/read)
- `system/memory/lessons.md` — rules you've learned from mistakes

Archive old memory to `system/memory/archive/` if it gets too large.

---

## Doc Hygiene Rules

**When completing a task or sprint:**
1. Update the SKILL.md for that project — current state, what's done, what's not
2. Update system/souls/ if identity or capabilities changed
3. Archive old docs to `<project>/archive/` if they're stale

**Never let a SKILL.md lag more than one session behind reality.**

---

## Adding New Documentation

**Questions to ask before creating a new file:**

1. Does an existing file cover this? → Update it instead
2. Is this a skill? → Add to skills/ with a SKILL.md
3. Is this a team member? → Add to team/members/ with persona_soul.md + config.json
4. Is this a project? → Add to workspaces/ with SKILL.md + README.md
5. Is this a rule or constraint? → Add to system/souls/ (agents.md, heartbeat.md, etc.)
6. Is this temporary notes? → Add to system/memory/YYYY-MM-DD.md

**If none of the above:** Probably shouldn't exist. Ask Kiana.

---

## File Size Limits

- SKILL.md: 10k (focused, not a novel)
- personas_soul.md: 1k (personality + constraints)
- README.md: 5k (setup + basics)
- system/souls/ files: 2k each (concise)
- system/memory/YYYY-MM-DD.md: unconstrained (raw notes)

**Why:** Large files = high token cost. Keep them lean.

---

## Markup Conventions

- Use **bold** for emphasis
- Use `code` for file paths and commands
- Use ## Headers for sections (not #)
- Use tables for comparisons and structured data
- Use TOON format for data rows

---

*Last updated: 2026-03-06*

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

