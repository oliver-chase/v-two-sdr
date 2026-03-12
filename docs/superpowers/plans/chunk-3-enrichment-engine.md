# Chunk 3: Enrichment Engine

> **Status:** READY FOR EXECUTION | **Duration:** 8-10 hours | **Owner:** OpenClaw + Dev
>
> **Goal:** Build email validation and company context enrichment system.

**Architecture:** Email candidate generation → MX validation → Deliverability scoring → Web search/fetch wrappers → Confidence-based output.

**Tech Stack:** Node.js, dns module, web_search + web_fetch (OpenClaw), confidence scoring logic, Jest.

---

## Key Tasks

- [ ] Email candidate generation (pattern-based from domain)
- [ ] MX record validation (check if domain accepts mail)
- [ ] Deliverability checks (confidence scoring: ≥0.8 auto, 0.5–0.8 flag, <0.5 skip)
- [ ] Web search wrapper (OpenClaw integration, prospect research)
- [ ] Web fetch wrapper (company website enrichment)
- [ ] Per-run caching (avoid duplicate requests)
- [ ] Confidence thresholds enforced
- [ ] Full test coverage (unit + mocks)
- [ ] Git commit

---

**See INDEX.md for dependencies and integration points.**

**Start this chunk after receiving the full detailed plan.**

