# Chunk 5: Execution Core (Email Drafting + Approval)

> **Status:** READY FOR EXECUTION | **Duration:** 10-12 hours | **Owner:** SDR + Dev
>
> **Goal:** Build email drafting engine, knowledge base system, and approval workflow.

**Architecture:** Draft engine (LLM + verified data + KB) → Draft lifecycle → Approval workflow → Template evolution feedback loop.

**Tech Stack:** Node.js, Claude API, knowledge base (file system), Markdown templates, Jest.

---

## Key Tasks

- [ ] Email drafting engine (LLM-based, verified data only + knowledge base context)
- [ ] Knowledge base system (dynamic doc loading, live folder, change detection)
- [ ] Draft lifecycle (generated → awaiting_approval → approved/rejected/regenerated)
- [ ] Approval commands (sdr review, approve, rewrite, regenerate, skip)
- [ ] Template management (storage, versioning, evolution feedback)
- [ ] BCC tracking (oliver@vtwo.co on all outbound)
- [ ] Draft persistence (JSON log with metadata)
- [ ] Full test coverage (unit + integration + knowledge base edge cases)
- [ ] Git commit

---

**See INDEX.md for dependencies and integration points.**

**Blocks:** Chunk 7 (Orchestration)

**Start this chunk after Chunks 2, 3, 4 complete.**

