# Chunk 7: Orchestration (CLI + Daily Flow + Alerts)

> **Status:** READY FOR EXECUTION | **Duration:** 12-14 hours | **Owner:** Dev
>
> **Goal:** Build command interface, daily automation pipeline, and Telegram alerts.

**Architecture:** CLI parser → NL-to-CLI mapper → 13-step daily flow → Telegram dispatcher → Terminal output.

**Tech Stack:** Node.js, Telegram API, CLI arg parsing, LLM (NL parsing), cron-like scheduling, Jest.

---

## Key Tasks

- [ ] CLI command parser (sdr run, sync, review, approve, send, inbox, metrics, status, knowledge *)
- [ ] Natural language → CLI mapper (parse user intent, detect ambiguity)
- [ ] 13-step daily flow automation (health → sync → enrich → draft → classify → report)
- [ ] Telegram bot integration (alerts, command dispatch, approval prompts)
- [ ] Terminal status output (human-readable, colorized)
- [ ] Scheduled execution (daily 09:00, manual trigger support)
- [ ] Approval prompts (queue pending items, wait for user action)
- [ ] Full test coverage (unit + CLI integration)
- [ ] Git commit

---

**See INDEX.md for dependencies and integration points.**

**Blocks:** None (final orchestration layer)

**Start this chunk after Chunks 5, 6 complete.**

