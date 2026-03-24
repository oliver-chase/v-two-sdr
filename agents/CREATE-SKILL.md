# How to Create a New Skill (Dual-Agent Ready)

When you need a new skill, use this process to build it efficiently for both Claude Code and OpenClaw.

---

## Who Creates Skills

**Claude Code only** — skill-creator is Claude Code native

But the skill **serves both agents**, so design it that way from the start.

---

## Step 1: Prepare (Claude Code)

Before using skill-creator, understand the skill's dual-agent purpose:

- **What problem does it solve?** (one sentence)
- **Can Claude Code use it?** (yes/no + why)
- **Can OpenClaw use it?** (yes/no + why)
- **Collaboration pattern:** How do they work together?

**Example (Hypothetical):**
```
Problem: Validate email addresses from multiple sources
Claude Code: Yes — local validation via regex + tool integration
OpenClaw: Yes — external validation via Hunter.io API
Collaboration: OpenClaw researches/fetches, Claude Code validates/stores
```

---

## Step 2: Create with skill-creator (Claude Code)

Use Anthropic's skill-creator tool:

```
Claude Code: Use skill-creator to build [skill description]

Inputs to skill-creator:
- Intent: [what the skill does]
- Test prompts: [2-3 realistic examples]
- Performance metrics: [what "success" looks like]
```

skill-creator will output:
- SKILL.md (skill definition)
- Test results
- Evaluation viewer
- .skill package

---

## Step 3: Add Dual-Agent Sections (Claude Code) 🔴 CRITICAL

**Immediately after skill-creator generates SKILL.md:**

Open `skills/<skill-name>/SKILL.md` and add this structure right after the Purpose section:

```markdown
---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes / No
- **When:** [Specific use cases]
- **Example:** [Concrete scenario]
- **Tools available:** [Subset of allowed tools]

### OpenClaw
- **Can use:** Yes / No
- **When:** [Specific use cases]
- **Example:** [Concrete scenario]
- **Tools available:** [Subset of allowed tools]

### Collaboration Pattern
[If both use it]:
- Claude Code does [what]
- OpenClaw does [what]
- They [sequence or parallel?]

---
```

**Do this BEFORE testing** — don't let the skill sit without dual-agent clarity.

---

## Step 4: Add Security Audit (Claude Code)

Copy this section from `agents/SKILL-TEMPLATE.md` and fill in:

```markdown
## Security Audit

**Verified:** [today's date]
**Auditor:** Claude Code
**Risk Level:** Low / Medium / High

**Key Findings:**
- Input validation: [Yes/No] — how
- Credential handling: [How] (env vars, secret-portal, none)
- External calls: [Where] (APIs used)
- Dangerous operations: [List or None]

**Red flags flagged:** None / [List any concerns]
```

---

## Step 5: Test with Both Agents (Claude Code)

### Test 1: Claude Code Reads It
```bash
cat /Users/oliver/OliverRepo/skills/<skill>/SKILL.md
# Verify:
# - Purpose is clear
# - Claude Code section makes sense
# - Examples are realistic
```

### Test 2: OpenClaw Reads It
```bash
cat /Users/oliver/OliverRepo/skills/<skill>/SKILL.md
# Verify:
# - OpenClaw section makes sense
# - Can it actually do what the skill says?
# - Any path issues or incorrect assumptions?
```

### Test 3: Can They Use It Together?
If collaboration pattern exists:
```
1. Claude Code handles its part
2. OpenClaw handles its part
3. Verify they can exchange data
```

---

## Step 6: Update Records (Claude Code)

### Add to skills/REGISTRY.md:

```toon
skill_name,category,status,claude_code_use,openclaw_use,last_updated,verified
new-skill,Category,active,yes/no,yes/no,2026-03-06,yes
```

### Add to agents/audit-log.md:

```markdown
### New-Skill (2026-03-DD)
- **Auditor:** Claude Code
- **Risk Level:** Low / Medium / High
- **Verified:** Yes
- **Findings:** [Brief summary]
- **Status:** ✅ Verified
```

### Update agents/CAPABILITY-MATRIX.md (if creating one):

```toon
[Add row for new skill if relevant to what agents do]
```

---

## Step 7: Documentation & Promotion (Claude Code)

- [ ] Skill uses TOON format for any data? (Check skills/REGISTRY.md example)
- [ ] Skill's limitations documented? (Add to OpenClaw or Claude Code section)
- [ ] Related skills linked? (Add "See also:" section)
- [ ] Token budget estimated? (Add under "Token Budget")

---

## Checklist: New Skill is Ready

- [ ] skill-creator completed (SKILL.md generated)
- [ ] Dual-agent sections added
- [ ] Security audit filled in
- [ ] Both agents can read and understand it
- [ ] Test case shows it works
- [ ] Collaboration pattern clear (if both use it)
- [ ] Added to REGISTRY.md
- [ ] Added to audit-log.md
- [ ] Token budget estimated
- [ ] Tested with both agents

---

## Example: Complete Skill Entry

```markdown
# Skill: Email-Validator

**Category:** Business
**Status:** Active
**Last Updated:** 2026-03-06

---

## Purpose

Validate email addresses from multiple sources (local regex + external API).

---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes
- **When:** Local validation, regex matching, storing validated emails
- **Example:** "Validate these 100 emails against our regex pattern"
- **Tools available:** read, write, exec (Python validation script)

### OpenClaw
- **Can use:** Yes
- **When:** External validation via API, checking against real mail servers
- **Example:** "Validate these emails using Hunter.io"
- **Tools available:** web_fetch (call API), read (pass data)

### Collaboration Pattern
- OpenClaw fetches and validates externally
- Claude Code stores results locally
- Both check duplicate emails in their processes

---

## How Both Agents Use This Skill

[Full instructions...]

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** Claude Code
**Risk Level:** Medium
**Key Findings:**
- Input validation: Yes (emails must match basic format)
- Credential handling: Via secret-portal (Hunter.io API key)
- External calls: Hunter.io API
- Dangerous operations: None

**Red flags flagged:** None

---

[Rest of skill details...]
```

---

## When You're Done

Message Kiana:
```
New skill created: [skill-name]
Purpose: [one sentence]
Who uses it: Claude Code, OpenClaw, or both
Risk level: [low/medium/high]
Ready to test? [yes/no]
```

---

*Last updated: 2026-03-06*

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

