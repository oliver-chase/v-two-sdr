# Skill: Async Task Execution

**Category:** System
**Status:** Active
**Primary User(s):** OpenClaw (trigger), Claude Code (monitor)
**Last Updated:** 2026-03-06

---

## Purpose

Run long-running tasks in background. Get notifications via WhatsApp/Telegram. Don't block other work.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1)**

**Use Cases:**
- Bulk email campaigns (SDR outreach) — runs for 2 hours
- Market research compilation — crawls 100+ websites
- Large dataset processing — enrichment, scoring, analysis

**OpenClaw** — Triggers background tasks
- **When:** Need to run long operation (> 30 min)
- **Example:** "Run bulk email send for 50 prospects in background"

**Claude Code** — Monitors progress
- **When:** Waiting for OpenClaw research to complete
- **Example:** "Check if bulk prospect research finished (started 1 hour ago)"

---

## When to Activate This Skill

**Trigger words:**
- "Run in background"
- "Don't wait for results"
- "Notify me when done"
- "Bulk processing"
- "Long-running task"

---

## Workflow

```
1. Trigger task (OpenClaw or Claude Code)
   ↓
2. Task runs in background (consumes 0 tokens from main agent)
   ↓
3. Heartbeat notifications (progress updates every 5-10 min)
   ↓
4. Completion notification (with results summary)
   ↓
5. Resume work based on results
```

---

## Integration (TOON Format)

**Task Launch Request:**

```toon
async_task_request{task_id,task_type,estimated_duration_min,notification_channel,notify_on_completion}:
 bulk-send-001,"email-campaign","120","WhatsApp group: SDR","yes"
 market-research-001,"prospect-enrichment","180","Telegram DM","yes"
```

**Notification Receipt:**

```toon
async_task_notification{task_id,status,progress_percent,elapsed_min,next_heartbeat_min,result_summary}:
 bulk-send-001,"in_progress","45%","54","5","45/50 emails sent successfully. 3 bounced. 2 pending."
```

---

## Use Case: SDR Bulk Email Campaign

**Scenario:** Send 50 prospect emails without blocking main work

**Workflow:**
```bash
# 1. OpenClaw triggers task
python async_task_executor.py \
  --task-id bulk-send-001 \
  --type email-campaign \
  --prospect-file prospects.csv \
  --template template-pace-car.txt \
  --notify-channel whatsapp://<group-id>

# Output: Task queued (returns immediately)
# OpenClaw can continue with other work

# 2. Background: Task processes (1-2 hours)
# - Reads prospects.csv
# - Enriches emails (validates via Hunter.io)
# - Sends emails in batches (respects rate limits)
# - Tracks opens/bounces

# 3. Notifications arrive in WhatsApp group
# Heartbeat #1 (5 min): "Started. 0/50 sent."
# Heartbeat #2 (15 min): "10/50 sent. 0 bounces."
# Heartbeat #3 (30 min): "30/50 sent. 2 bounces. 18 pending."
# COMPLETION (120 min): "DONE. 45 sent, 3 bounced, 2 failed. See results.csv"

# 4. Claude Code retrieves results
# Results: Open rate 15%, reply rate 8%, bounce rate 6%
# Next action: Follow up with high-engagement prospects
```

---

## Configuration

**Required:**
- WhatsApp group ID or Telegram DM channel
- Task type (email-campaign, research, enrichment, etc.)
- Input file (CSV, JSON, or API reference)
- Estimated duration (for heartbeat scheduling)

**Optional:**
- Notification frequency (default: every 10 min or 25% progress)
- Result format (CSV, JSON, summary text)
- Error handling (retry failed items, notify on error)

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER run production task async without dry-run first** — Why: Hard to debug if it breaks
2. **NEVER send sensitive data unencrypted to messaging APIs** — Why: WhatsApp/Telegram are cloud services
3. **NEVER assume task completed if no notification received** — Why: Network issues could silence notifications
4. **NEVER queue infinite loops** — Why: Tasks must have exit conditions
5. **NEVER mix high-risk and low-risk tasks in same queue** — Why: Email errors shouldn't block data processing

**Can Do:**
- Run multiple tasks in parallel (separate queues)
- Retry failed items automatically
- Stream results (don't wait for full completion)
- Resume interrupted tasks

---

## Related Skills

- **work-outreach/** — SDR bulk email campaigns (use case)
- **competitive-intelligence/** — Large-scale research (use case)
- **subagent-orchestration/** — Parallel task decomposition (complements)

---

## Token Budget

| Operation | Tokens |
|-----------|--------|
| Trigger async task | 50–100 |
| Monitor notifications (per heartbeat) | 10–20 |
| Process final results | 100–300 |

---

*Last updated: 2026-03-06 by Claude Code*

---

## Implementation Note

External reference: Based on claude-code-task (vsevolodustinov) pattern. This skill focuses on WHEN to use async execution, not implementation details. For setup, see: https://github.com/openclaw/skills/tree/main/skills/vsevolodustinov/claude-code-task
