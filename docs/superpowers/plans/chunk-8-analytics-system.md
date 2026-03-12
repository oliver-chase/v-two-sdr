# Chunk 8: Analytics (Metrics + Dashboard)

> **Status:** READY FOR EXECUTION | **Duration:** 10-12 hours | **Owner:** FE Designer + Dev
>
> **Goal:** Build event logging, metrics aggregation, and dashboard UI.

**Architecture:** Event logger → Metrics aggregator → Industry benchmarking → React dashboard UI → API endpoints.

**Tech Stack:** Node.js, React, Recharts (or similar), Jest, system/dashboard (existing).

---

## Key Tasks

- [ ] Event logging schema (timestamp, lead_id, event_type, email_type, industry, title, sequence_stage)
- [ ] Metrics aggregation (emails_sent, replies, reply_rate, bounce_rate, avg_followups, etc.)
- [ ] Industry baseline benchmarks (fetch + comparison)
- [ ] Metric filters (date range, industry, track, title, company size, sequence stage)
- [ ] Sensitive data redaction (email, name, company hashing in exports)
- [ ] React dashboard components (metrics cards, trend charts, lead pipeline visualization)
- [ ] Dashboard API endpoints (/api/sdr/metrics, /api/sdr/pipeline, /api/sdr/leads)
- [ ] Integration with existing system/dashboard (design system, responsive layout)
- [ ] Full test coverage (unit + integration)
- [ ] Git commit

---

**See INDEX.md for dependencies and integration points.**

**Blocks:** None (final analytics layer)

**Start this chunk after Chunk 4 complete (can run parallel to Chunks 5-6).**

