# Chunk 6: Intelligence (Inbox + Reply Classification)

> **Status:** READY FOR EXECUTION | **Duration:** 8-10 hours | **Owner:** Dev + OpenClaw
>
> **Goal:** Build inbox monitoring and reply classification system.

**Architecture:** Outlook connector → Reply extraction → LLM classification → Confidence-based state updates → Draft reply suggestions.

**Tech Stack:** Node.js, @microsoft/graph-client (Microsoft Graph API), Claude API, confidence scoring, Jest.

---

## Key Tasks

- [ ] Outlook connector (Microsoft Graph, authentication, inbox polling)
- [ ] Reply extraction (match to leads by email)
- [ ] LLM-based classification (positive/negative/neutral/unclear/ooo)
- [ ] Confidence handling (>0.8 auto, 0.5–0.8 confirm, <0.5 manual review)
- [ ] State updates (move leads through state machine on classification)
- [ ] Out-of-office detection (pause sequence, resume at return date)
- [ ] Draft reply suggestions (user approves before send)
- [ ] Event logging (all replies classified and logged)
- [ ] Full test coverage (unit + mock Outlook API)
- [ ] Git commit

---

**See INDEX.md for dependencies and integration points.**

**Blocks:** Chunk 7 (Orchestration)

**Start this chunk after Chunk 4 complete.**


- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

