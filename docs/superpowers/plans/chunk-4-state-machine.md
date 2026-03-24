# Chunk 4: State Machine

> **Status:** READY FOR EXECUTION | **Duration:** 4-6 hours | **Owner:** Dev
>
> **Goal:** Build and enforce lead lifecycle state machine.

**Architecture:** State definitions → Transition validation → Persistence → Minimum pool monitoring.

**Tech Stack:** Node.js, state-machine logic, Google Sheets write-back, Jest.

---

## Key Tasks

- [ ] Define all lead states (new, email_discovered, draft_generated, awaiting_approval, email_sent, replied, closed_positive, closed_negative)
- [ ] Implement transition rules (only legal transitions allowed)
- [ ] Block illegal transitions (log violations, alert user)
- [ ] Persist state to Google Sheet + JSON
- [ ] Minimum lead pool monitoring (< 30 triggers Telegram alert)
- [ ] State query functions (filter by state, track, industry)
- [ ] Full test coverage (all transitions, edge cases)
- [ ] Git commit

---

**See INDEX.md for dependencies and integration points.**

**Start this chunk after receiving the full detailed plan.**


- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

