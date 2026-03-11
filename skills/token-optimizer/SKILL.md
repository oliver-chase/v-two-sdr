# Skill: Token-Optimizer

**Category:** System
**Status:** Active
**Last Updated:** 2026-03-06

---

## Purpose

Reduce token usage and API costs through smart model routing, context optimization, and budget tracking. Both agents use this to stay efficient.

---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes
- **When:**
  - Checking token budget before starting work
  - Model routing for expensive code tasks
  - Evaluating if a feature should use Sonnet vs Haiku
  - Budget tracking/alerting
- **Tools available:** exec (run Python scripts), read (budget files)
- **Example:** "Check daily token budget before writing 2000 lines of code"

### OpenClaw
- **Can use:** Yes
- **When:**
  - Checking daily budget before API research
  - Model routing for market research vs complex analysis
  - Cost estimating API integrations
  - Tracking multi-provider costs (if using OpenRouter)
- **Tools available:** exec (run Python scripts), read (budget files)
- **Example:** "Estimate token cost for 3-hour market research session"

### Collaboration Pattern
- **Both agents** check budget before expensive work
- **Both agents** route prompts to appropriate models (cheap vs expensive)
- **Both agents** log usage to shared system/memory/YYYY-MM-DD.md
- **Alert threshold:** If >85% of daily budget spent, flag to Kiana before continuing

---

## When to Activate This Skill

**Trigger words/phrases:**
- "How many tokens will this take?"
- "Check the budget"
- "Should I use Sonnet or Haiku?"
- Approaching session end (check remaining budget)
- Starting expensive work (research, complex code)

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** Initial setup (verified from GitHub v1.4.3)
**Risk Level:** Low
**Key Findings:**
- Scripts are local-only (no network requests)
- No code execution (safe Python)
- No subprocess calls
- Data processing is local only
- Reference files describe optional external services (require explicit API key setup)

---

## How Both Agents Use This Skill

### Before Starting Work

**Quick budget check:**

```bash
python3 /Users/oliver/OliverRepo/skills/token-optimizer/scripts/token_tracker.py check
```

**Output example:**
```
Daily budget: 100,000 tokens
Used today: 42,000 tokens
Remaining: 58,000 tokens
Percentage: 42%
```

**Decision:**
- **< 50% used:** Proceed normally
- **50–75% used:** Use cheaper models (Haiku)
- **75–85% used:** Quick tasks only, or defer to tomorrow
- **> 85% used:** Flag to Kiana, minimal use only

---

### Model Routing (Which Model to Use?)

**Claude Code example:**

```bash
python3 /Users/oliver/OliverRepo/skills/token-optimizer/scripts/model_router.py \
  "Write a complex authentication system with multi-factor support"
```

**Output:** Recommends model based on task complexity

**Rule of thumb:**
- **Haiku** (~$0.80/M tokens): Routine work, simple tasks, debugging
- **Sonnet** (~$3/M tokens): Complex code, architecture, refactoring
- **Opus** (~$15/M tokens): Only for critical decisions or teaching

---

### Usage Logging

Both agents log work to system/memory/YYYY-MM-DD.md:

```markdown
## Token Usage

### Sessions
- 09:00–10:30: Claude Code (debugging) ~2000 tokens
- 10:30–11:45: OpenClaw (market research) ~3500 tokens
- 14:00–14:30: SDR planning ~1000 tokens

Total today: 6,500 tokens
Budget: 100,000 tokens (6.5% used)
Status: ✅ Healthy
```

---

## Core Capabilities

### 1. Budget Tracking

**Check daily usage:**

```bash
python3 /Users/oliver/OliverRepo/skills/token-optimizer/scripts/token_tracker.py check
```

**Outputs:**
- Tokens used today
- Daily budget
- Percentage spent
- Recommendation (continue / caution / stop)

---

### 2. Model Routing

**Get model recommendation for a task:**

```bash
python3 /Users/oliver/OliverRepo/skills/token-optimizer/scripts/model_router.py "<task description>"
```

**Examples:**

```bash
# Routine debugging
python3 ... "Fix a 404 error in the API"
# → Output: Use Haiku (low complexity)

# Complex architecture
python3 ... "Design a real-time SDR outreach system with API webhooks"
# → Output: Use Sonnet (high complexity)

# Simple task
python3 ... "Format this JSON"
# → Output: Use Haiku (trivial)
```

---

### 3. Context Optimization (Advanced)

**See what context you actually need:**

```bash
python3 /Users/oliver/OliverRepo/skills/token-optimizer/scripts/context_optimizer.py \
  recommend "hi, how are you?"
```

**Output:** Shows minimal required files instead of loading everything

---

## Practical Workflow

### At Session Start (Both Agents)

1. **Check budget:**
   ```bash
   python3 .../token_tracker.py check
   ```
   - If < 75%: proceed normally
   - If 75–85%: caution mode (cheaper models)
   - If > 85%: defer non-essential work

2. **Plan model use:**
   ```bash
   python3 .../model_router.py "Today's work: debugging + market research"
   ```
   - Estimate tokens needed
   - Choose models

3. **Log to memory:**
   ```
   ## YYYY-MM-DD
   Daily budget: 100,000 tokens
   Plan: debugging + research, ~5,000 tokens estimated
   ```

### During Work

- **Expensive task starting:** Quick budget check
- **Approaching end:** Stop if budget nearly depleted
- **Models:** Use model_router.py output to choose

### At Session End (or Hourly if Long)

```bash
python3 .../token_tracker.py check
```

Log final usage to system/memory/YYYY-MM-DD.md

---

## Budget Alerts

**Set alerts in system/memory/YYYY-MM-DD.md:**

```markdown
⚠️ ALERT: 82% of budget used. 18,000 tokens remaining.
Next session recommended if more work needed.
```

If > 85%, don't start new expensive tasks without Kiana approval.

---

## Multi-Provider Strategy (Optional)

If using OpenRouter or Together.ai for cheaper models:

Reference: `skills/token-optimizer/assets/config-patches.json`

**Ask Claude Code or OpenClaw to set up** if needed. Requires external API keys.

---

## Token Budget per Operation

**Rough estimates:**

| Operation | Claude Code | OpenClaw |
|-----------|-------------|----------|
| Debugging (read logs, git) | 500–1000 | 300–600 |
| Code review | 1000–2000 | — |
| Market research | — | 2000–5000 |
| API integration planning | 1000–1500 | 1500–2000 |
| Writing tests | 1000–3000 | — |
| SDR research | — | 1000–2000 |
| Daily memory/startup | 500–1000 | 500–1000 |

**Total per session:** 3,000–10,000 tokens depending on work

---

## Related Skills

- **planning/** — estimate tokens before planning phases
- **debugging/** — quick operations (low token cost)
- **git/** — status checks (very low token cost)

---

*Last updated: 2026-03-06*
