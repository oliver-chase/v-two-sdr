# Chunk 2: Google Sheets Integration

> **Status:** READY FOR EXECUTION | **Duration:** 6-8 hours | **Owner:** Dev
>
> **Goal:** Build bidirectional Google Sheets sync with dynamic schema inference.

**Architecture:** OAuth connector + dynamic schema mapper + batch read/write operations.

**Tech Stack:** Node.js, @google-cloud/sheets, googleapis, TDD (Jest).

---

## Key Tasks

- [ ] Google Sheets OAuth connector (authenticate, refresh tokens)
- [ ] Dynamic schema inference (detect columns → TOON field mapping)
- [ ] Field confirmation workflow (user confirms each mapping)
- [ ] Read operations (sync all leads from Sheet)
- [ ] Write operations (append enriched fields, state updates, metrics)
- [ ] Batch API optimization (respect rate limits, cache)
- [ ] Full test coverage (unit + integration + mocks)
- [ ] Git commit

---

**See INDEX.md for dependencies and integration points.**

**Start this chunk after receiving the full detailed plan.**

