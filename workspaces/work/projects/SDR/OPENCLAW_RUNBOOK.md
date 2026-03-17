# OpenClaw SDR Runbook

## Morning Run (8 AM ET daily, or when Kiana says "SDR" in Telegram)

1. Run: node scripts/queue-executor.js (flush any sends due from prior day)
2. Run: node scripts/daily-run.js (enrich → draft → inbox → report)
3. Read stdout
4. Send Kiana a Telegram summary:
   - How many prospects enriched
   - How many drafts ready
   - How many replies classified
   - Preview each draft: name, company, subject line, first 2 lines of body
5. Wait for Kiana to reply "APPROVE" or give feedback

## On "APPROVE" from Kiana

1. Run: node scripts/send-approved.js
2. This queues emails with timezone-correct send times (not immediate)
3. Confirm to Kiana in Telegram: "✅ Queued — emails go out Tue-Thu 9-11 AM their local time"

## Daily Inbox Check

1. Read outreach/replies.json for new classified replies
2. Send Kiana a Telegram summary: who replied, sentiment, suggested next step
3. Wait for Kiana's direction on follow-ups

## Prospect Research (run when Google Sheet has fewer than 10 prospects with status "new")

1. web_search for companies matching V.Two ICP (Series A-C, 50-500 employees, SaaS/FinTech/Enterprise)
2. For each prospect, research email format per OPENCLAW_EMAIL_RESEARCH_STRATEGY.md
3. Add to Google Sheet
4. Notify Kiana in Telegram: "Added N prospects — ready for tomorrow's run"

## Web Search

OpenClaw uses Serper (not Brave) for all web search in this project.
SERPER_API_KEY is configured in the environment.

To search, make a POST request:
- URL: https://google.serper.dev/search
- Header: X-API-KEY: [value of SERPER_API_KEY env var]
- Body: {"q": "your search query", "num": 5}

Use this for all prospect research, email pattern discovery,
and company enrichment. Follow OPENCLAW_EMAIL_RESEARCH_STRATEGY.md
for research process.

## Reading Script Output

All scripts print structured [SDR] prefixed lines to stdout. Read these to understand what happened. Errors go to stderr — if a script exits 1, alert Kiana in Telegram with the error message before stopping.

## Sending Emails

Never send emails autonomously. Always wait for Kiana's explicit "APPROVE" in Telegram. The only exception is queue-executor.js which sends pre-approved emails that were already queued with Kiana's prior approval.
