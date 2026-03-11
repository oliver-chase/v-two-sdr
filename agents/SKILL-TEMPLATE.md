# Skill: [Name]

**Category:** [Development | Business | System | Security | Analysis]
**Status:** [Active | Planned | Archived]
**Primary User(s):** [Claude Code | OpenClaw | Both | SDR | CMO | Dev persona]
**Last Updated:** YYYY-MM-DD

---

## Purpose

[One sentence: What problem does this skill solve?]

---

## Who Uses This Skill

**Agent-Agnostic (Level 1 — All agents read this)**

Describe the skill's purpose and core workflow so any agent can understand and use it without custom tooling context.

**Claude Code**
- **When:** [Specific triggers for Claude Code]
- **Example:** [Concrete scenario]
- **Tools available:** [Subset of allowed tools]

**OpenClaw**
- **When:** [Specific triggers for OpenClaw]
- **Example:** [Concrete scenario]
- **Tools available:** [Subset of allowed tools]

**SDR / CMO / Dev Personas** (if applicable)
- **When:** [Persona-specific triggers]
- **Example:** [Concrete scenario]
- **Constraints:** [Any role-specific limitations]

---

## When to Activate This Skill

**Trigger words/phrases:**
- [Trigger 1]
- [Trigger 2]
- [Trigger 3+]

**Use cases:**
- [Case 1]
- [Case 2]
- [Case 3+]

---

## Inputs (TOON Format)

**Data Specification:**

```toon
input_type[N]{field1,field2,field3,field4}:
 value1,value2,value3,value4
 value1,value2,value3,value4
```

**Validation rules:**
- [Rule 1]
- [Rule 2]
- [Rule 3]

**Required vs. Optional:**
- `field1` — required, [constraint]
- `field2` — required, [constraint]
- `field3` — optional, [constraint]

---

## Workflow

**Step-by-step execution (numbered):**

1. [First step]
   - Subtask
   - Subtask
2. [Second step]
   - Subtask
   - Subtask
3. [Continue as needed...]

**Decision trees (if applicable):**
```
If [condition]:
  → Follow path A
Else if [condition]:
  → Follow path B
Else:
  → Follow path C
```

---

## Outputs (TOON Format)

**Data Specification:**

```toon
output_type[N]{field1,field2,field3,field4}:
 value1,value2,value3,value4
 value1,value2,value3,value4
```

**Quality standards:**
- [Standard 1]
- [Standard 2]
- [Standard 3]

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER [rule 1]** — [Why: consequence or risk]
2. **NEVER [rule 2]** — [Why: consequence or risk]
3. **NEVER [rule 3]** — [Why: consequence or risk]

**Can Do:**
- [Permitted action 1]
- [Permitted action 2]
- [Permitted action 3]

**Cannot Do:**
- [Forbidden action 1]
- [Forbidden action 2]
- [Forbidden action 3]

**Credentials & Secrets:**
- How to access: [Env vars, secret-portal, read-only, etc.]
- What to log: [What's safe to output]
- What to hide: [What must never appear in output]

**Audit Trail:**
- [What to log for compliance]
- [Retention period]
- [Who reviews logs]

---

## Examples (Copy-Paste Ready)

### Example 1: [Scenario Name]

**Prompt:**
```
[User input / activation prompt]
```

**Expected Output:**
```
[Exact expected TOON or structured output]
```

**When to use this:** [Context for this example]

---

### Example 2: [Scenario Name]

**Prompt:**
```
[User input / activation prompt]
```

**Expected Output:**
```
[Exact expected TOON or structured output]
```

**When to use this:** [Context for this example]

---

### Example 3+ (Optional)

[Follow same format...]

---

## Related Skills

- **[Skill Name]** — Use this [before/after/alongside/to validate output from] this skill
- **[Skill Name]** — Works in [sequence/parallel] with [current skill]
- **[Skill Name]** — Cross-references: [How they interact]

---

## Agent-Specific Implementation (Level 2)

### Claude Code Implementation

**Tools available:**
- [Tool 1: why]
- [Tool 2: why]
- [Tool 3: why]

**Workflow customization:**
1. [Claude Code-specific step 1]
2. [Claude Code-specific step 2]

**Common challenges:**
- [Challenge + mitigation]
- [Challenge + mitigation]

**Token budget:** ~[500–2000] tokens per operation

---

### OpenClaw Implementation

**Tools available:**
- [Tool 1: why]
- [Tool 2: why]
- [Tool 3: why]

**Workflow customization:**
1. [OpenClaw-specific step 1]
2. [OpenClaw-specific step 2]

**Common challenges:**
- [Challenge + mitigation]
- [Challenge + mitigation]

**Token budget:** ~[500–2000] tokens per operation

---

## Cross-Agent Handoff (Context Pass)

When handing off mid-task to another agent, output this TOON summary:

```toon
handoff_context{skill,from_agent,to_agent,completed_tasks,pending_tasks,blockers,files_modified,next_steps}:
 skill-name,claude-code,openclaw,[task list],[task list],[any blockers or delays],[file paths],[next action]
```

**Example:**
```toon
handoff_context{skill,from_agent,to_agent,completed_tasks,pending_tasks,blockers,files_modified,next_steps}:
 api-security,claude-code,openclaw,"ADR-001 drafted, API scopes reviewed","Competitor research, risk assessment","None","skills/api-security/ADR-001.md, system/memory/2026-03-06.md","Research constraint patterns"
```

---

## Collaboration Pattern (if both agents use this skill)

**Sequence:** [Parallel / Sequential / Conditional]

- **Claude Code does:** [Task A]
- **OpenClaw does:** [Task B]
- **They coordinate by:** [How information flows between them]
- **Approval gate:** [Who approves before next step?]

**Data exchange format:**
```toon
exchange_data{from_agent,to_agent,data_type,timestamp}:
 claude-code,openclaw,credential-map,2026-03-06T14:30:00Z
```

---

## Token Budget (Per Operation Type)

| Operation | Estimated Tokens | Notes |
|-----------|------------------|-------|
| [Operation 1] | 200–500 | [Context: when/why] |
| [Operation 2] | 500–1000 | [Context: when/why] |
| [Operation 3] | 1000–2000 | [Context: when/why] |
| **Total (typical flow)** | ~[500–3000] | [Varies by complexity] |

---

## Troubleshooting & Fallbacks

**When [situation] happens:**
- Fallback: [Alternative approach]
- Escalate to: [Who/what]
- Retry with: [Modified parameters]

**Common errors:**
- **Error:** [Error message]
  - **Cause:** [Root cause]
  - **Fix:** [Step-by-step resolution]

---

## Verification Checklist (Before Completion)

- [ ] All inputs validated per spec
- [ ] TOON format outputs correct
- [ ] No credentials leaked
- [ ] Related skills referenced if applicable
- [ ] Both agents (or persona) can understand
- [ ] Example prompts tested and match expected output
- [ ] Token budget tracked
- [ ] Handoff context recorded

---

## FAQ

**Q: Can I use this skill for [scenario X]?**
A: [Yes/No], because [reason].

**Q: What if [external dependency] fails?**
A: [Fallback approach].

**Q: How do I know when this is done?**
A: [Acceptance criteria].

---

## Quality Standards Applied

✅ **Agent-agnostic Level 1:** Top sections (Purpose through Outputs) readable by ANY agent
✅ **TOON format:** All structured inputs/outputs use TOON
✅ **Security guardrails:** At least 3 explicit NEVER rules per skill
✅ **Team-specific subsections:** Named sections for Claude Code, OpenClaw, personas
✅ **Copy-paste prompts:** Min 2 ready-to-use examples
✅ **Handoff Context block:** TOON format for cross-agent continuity
✅ **Related skills:** Cross-refs to at least 2 other skills
✅ **Token budget:** Estimate per operation type
✅ **Trigger words:** Min 3 activation phrases

---

*Last updated: YYYY-MM-DD by [Agent/Human]*
