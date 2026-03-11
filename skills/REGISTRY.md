# Skills Registry

Master list of all skills in the system. Both agents consult this to understand what's available.

---

## Format (TOON)

```toon
skill[10]{name,category,status,both_agents_compatible,claude_code_use,openclaw_use,last_updated,audited}:
 debugging,Development,active,yes,code debugging,api/integration debugging,2026-03-06,yes
 planning,Development,active,yes,code planning,research planning,2026-03-06,yes
 git,Development,active,yes,commit/branch/merge,status checks,2026-03-06,yes
 webapp-testing,Development,active,yes,unit/integration/e2e tests,smoke tests,2026-03-06,yes
 software-architecture,Development,active,yes,ADR/design,constraint research,2026-03-06,yes
 work-outreach,Business,active,yes,data validation/tools,prospect research,2026-03-06,yes
 brand-guidelines,Business,active,yes,tone reference,competitive brand analysis,2026-03-06,yes
 competitive-intelligence,Business,active,yes,n/a,market analysis/research,2026-03-06,yes
 api-security,Security,active,yes,credential audit/rotation,permission validation,2026-03-06,yes
 subagent-orchestration,System,active,yes,task decomposition,parallel research,2026-03-06,yes
 personas,System,active,yes,activation protocol,coordination,2026-03-06,no
 token-optimizer,System,active,yes,model routing,budget tracking,2026-03-06,partial
 self-improvement,System,active,yes,error logging,pattern tracking,2026-03-06,no
 pm-visualizer,System,active,yes,roadmap visualization,project tracking,2026-03-06,no
 jtbd,Analysis,active,yes,framework reference,user research,2026-03-06,no
```

---

## Active Skills (Ready to Use)

### NEW Skills (Added 2026-03-06)

| Skill | Category | Both Agents? | Status | Audited? |
|-------|----------|--------------|--------|----------|
| **api-security** | Security | ✅ Yes | Active | ✅ Yes |
| **software-architecture** | Development | ✅ Yes | Active | ✅ Yes |
| **subagent-orchestration** | System | ✅ Yes | Active | ✅ Yes |
| **webapp-testing** | Development | ✅ Yes | Active | ✅ Yes |
| **brand-guidelines** | Business | ✅ Yes | Active | ✅ Yes |
| **competitive-intelligence** | Business | ✅ Yes | Active | ✅ Yes |

### Existing Skills (Updated or Unchanged)

| Skill | Category | Both Agents? | Status | Updated | Audited? |
|-------|----------|--------------|--------|---------|----------|
| **debugging** | Development | ✅ Yes | Active | 2026-03-06 (upgraded) | ✅ Yes |
| **planning** | Development | ✅ Yes | Active | 2026-03-06 (upgraded) | ✅ Yes |
| **git** | Development | ✅ Yes | Active | 2026-03-06 (upgraded) | ✅ Yes |
| **work-outreach** | Business | ✅ Yes | Active | 2026-03-06 (upgraded) | ✅ Yes |
| **personas** | System | ✅ Yes | Active | 2026-03-06 | ❌ No |
| **token-optimizer** | System | ✅ Yes | Active | 2026-03-06 | 🟡 Partial |
| **self-improvement** | System | ✅ Yes | Active | 2026-03-06 | ❌ No |
| **pm-visualizer** | System | ✅ Yes | Active | 2026-03-06 | ❌ No |
| **jtbd** | Analysis | ✅ Yes | Active | 2026-03-06 | ❌ No |

---

## Planned Skills (Not Yet Active)

| Skill | Category | Status | Trigger | Owner |
|-------|----------|--------|---------|-------|
| **cmo** | Business | Planned | "CMO" | Oliver |
| **marketing** | Business | Planned | "Marketing" | Oliver |

---

## Updating a Skill

When you update a SKILL.md:

1. **Add dual-agent section** at the top:
   ```
   ### Claude Code
   - Can use: Yes/No
   - When: [specific use cases]

   ### OpenClaw
   - Can use: Yes/No
   - When: [specific use cases]
   ```

2. **Update REGISTRY.md** (this file):
   - Mark as "Audited" or "Partial" once verified
   - Update "Last Updated" date
   - Note any new use cases

3. **Add to audit-log.md**:
   - Document security verification
   - Note findings

---

## Skills to Update (Priority Order)

### 🔴 Critical (Complete this session)
- [ ] **work-outreach** — finish dual-agent compatibility section
- [ ] **personas** — activation protocol for both agents

### 🟡 Important (Complete this week)
- [ ] **token-optimizer** — explain how both agents use it
- [ ] **self-improvement** — logging protocol for both agents
- [ ] **pm-visualizer** — visualization for both agents

### 🟢 Nice to Have (Complete when ready)
- [ ] **jtbd** — framework for both agents
- [ ] **cmo** — write SKILL.md when persona activates
- [ ] **marketing** — write SKILL.md when persona activates

---

## Skill File Locations

```
skills/
├── api-security/SKILL.md                 ✨ NEW (2026-03-06 Batch 1)
├── software-architecture/SKILL.md        ✨ NEW (2026-03-06 Batch 1)
├── subagent-orchestration/SKILL.md       ✨ NEW (2026-03-06 Batch 1) + ⬆️ Enhanced
├── webapp-testing/SKILL.md               ✨ NEW (2026-03-06 Batch 1)
├── brand-guidelines/SKILL.md             ✨ NEW (2026-03-06 Batch 1) + ⬆️ Enhanced
├── competitive-intelligence/SKILL.md     ✨ NEW (2026-03-06 Batch 1)
├── project-configuration/SKILL.md        ✨ NEW (2026-03-06 Batch 2)
├── skill-security-audit/SKILL.md         ✨ NEW (2026-03-06 Batch 2)
├── code-enforcement/SKILL.md             ✨ NEW (2026-03-06 Batch 2) + hooks/
├── async-task-execution/SKILL.md         ✨ NEW (2026-03-06 Batch 2)
├── seo-content-creation/SKILL.md         ✨ NEW (2026-03-06 Batch 2)
├── debugging/SKILL.md                    ⬆️ Enhanced (2026-03-06 Batch 1)
├── planning/SKILL.md                     ⬆️ Enhanced (2026-03-06 Batch 1 + 2)
├── git/SKILL.md                          ⬆️ Enhanced (2026-03-06 Batch 1 + 2)
├── work-outreach/SKILL.md                ⬆️ Enhanced (2026-03-06 Batch 1)
├── personas/SKILL.md                     ⬆️ Enhanced (2026-03-06 Batch 2)
├── token-optimizer/SKILL.md
├── self-improvement/SKILL.md
├── pm-visualizer/SKILL.md
├── jtbd/SKILL.md
├── utils/
│   └── voice_analyzer.py                 ✨ SHARED (2026-03-06 Batch 2)
└── (future) cmo/SKILL.md, marketing/SKILL.md

code-enforcement/hooks/
├── pre-commit-secrets                    ✨ SHARED (2026-03-06 Batch 2)
├── pre-commit-paths                      ✨ SHARED (2026-03-06 Batch 2)
└── pre-commit-tests                      ✨ SHARED (2026-03-06 Batch 2)
```

**Summary:**
- 11 new skills created (6 from external comparison + 5 new implementation)
- 5 existing skills enhanced (upgraded with new sections)
- 2 shared utilities created (voice_analyzer.py, 3x git hooks)
- Total: 21 active skills (11 original + 11 new - 1 duplicate counting)

---

## How to Add a New Skill

1. Create `skills/<name>/SKILL.md` following SKILL-TEMPLATE.md
2. Include **Dual-Agent Compatibility** section
3. Document both agents' use cases explicitly
4. Add security audit
5. Update this REGISTRY.md
6. Add to agents/audit-log.md
7. Both agents can now use it

---

*Last updated: 2026-03-06*
