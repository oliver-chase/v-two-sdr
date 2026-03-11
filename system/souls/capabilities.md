# CAPABILITIES.md — Oliver's Loaded Skills & Local Skills

Master registry of all active OpenClaw external plugins and local Claude Code/OpenClaw skills with use cases, security boundaries, and API key requirements.

**Note:** This document covers external OpenClaw plugins (Instagram API, Kalshi, etc.). For internal Claude Code skills, see `/Users/oliver/OliverRepo/skills/REGISTRY.md`.

---

## Local Skills (Claude Code Native)

These skills are maintained locally in `/Users/oliver/OliverRepo/skills/` and work with both Claude Code and OpenClaw.

**NEW Skills (Added 2026-03-06) — Production Ready:**

| Skill | Purpose | Replaces/Complements |
|-------|---------|-----------|
| **api-security** | Credential management, rotation, audit trails | Complements: secret-portal; Guides: api-credentials-hygiene workflows |
| **software-architecture** | ADR documentation, design patterns, system design | Complements: design decisions for any implementation |
| **subagent-orchestration** | Task decomposition, agent handoff, parallel workflows | Improves: multi-agent coordination across Claude Code + OpenClaw |
| **webapp-testing** | Unit/integration/E2E test strategy | Improves: test-first debugging, coverage standards |
| **brand-guidelines** | Tone consistency, positioning messaging | Improves: outreach email quality (complements lead-gen-crm) |
| **competitive-intelligence** | Market analysis, competitor tracking | Complements: solo-research with focused competitive analysis |

**Existing Skills (Also Available):**
- debugging, planning, git, work-outreach (upgraded 2026-03-06)
- personas, token-optimizer, self-improvement, pm-visualizer, jtbd

**Full Registry:** See `/Users/oliver/OliverRepo/skills/REGISTRY.md`

---

## Core Tools (Built-in)

These are native OpenClaw tools, not skills:

| Tool | Purpose | Auth | Risk |
|------|---------|------|------|
| web_search | Search via Brave (real-time, sources) | Not needed | Low |
| web_fetch | Lightweight HTML→markdown | Not needed | Low |
| image | Vision model analysis | Not needed | Low |
| browser | Automation (screenshot, click, type) | Not needed | Medium |
| exec | Shell commands (with PTY support) | Not needed | High* |
| message | Telegram/Signal/Discord sending | Not needed | Medium |
| TTS | Text-to-speech | Not needed | Low |

*exec is powerful but sandboxed. Use only on trusted systems.

---

## Business Skills (Added)

### 1. **instagram-api**
- **Purpose:** Post to Instagram Feed, Story, Reels, Carousel + Threads via Meta Graph API
- **Status:** OPERATIONAL (V.Two outreach)
- **Use Case:** Social media content distribution, campaign launches
- **Auth:** Meta Business Account API key (`META_API_KEY`)
- **Risk:** Medium (external API, rate limits)
- **Security Note:** Never store tokens in chat. Use secret-portal for credential setup.
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/lifeissea/instagram-api

### 2. **adaptlypost**
- **Purpose:** Schedule and manage social posts across 7 platforms (Instagram, X, Bluesky, TikTok, Threads, LinkedIn, Facebook)
- **Status:** FUTURE (multi-platform scheduling)
- **Use Case:** Centralized social media campaign management
- **Auth:** Per-platform API keys (varies)
- **Risk:** Medium (multiple external APIs)
- **Security Note:** Requires OAuth flows per platform. Use secret-portal.
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/tarasshyn/adaptlypost

### 3. **insta-cog**
- **Purpose:** Full video production from a single text prompt
- **Status:** FUTURE (video content creation)
- **Use Case:** Auto-generate Instagram Reels, TikTok videos
- **Auth:** Video rendering service credentials (varies)
- **Risk:** Medium (external rendering, storage)
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/nitishgargiitd/insta-cog

---

## Market Intelligence Skills

### 4. **kalshi-agent**
- **Purpose:** Prediction market agent — analyzes markets, executes trades via Kalshi v2 API
- **Status:** FUTURE (automated trading)
- **Use Case:** Real-money prediction market participation
- **Auth:** Kalshi API key (`KALSHI_API_KEY`) + account funding
- **Risk:** HIGH (financial exposure)
- **Security Note:** **NEVER execute trades autonomously.** All trades require explicit Kiana approval.
- **Usage Rule:** Analysis-only mode by default. Trades require manual review first.
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/jthomasdevs/kalshi-agent

### 5. **solo-research**
- **Purpose:** Deep market research — competitor analysis, user pain points, SEO/ASO keywords, domain availability
- **Status:** APPROVED
- **Use Case:** PRE-launch market validation, competitive landscape analysis
- **Auth:** Brave Search (already configured)
- **Risk:** Low
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/fortunto2/solo-research

---

## Web & Design Skills

### 6. **solo-deploy**
- **Purpose:** Deploy projects to hosting platforms — reads stack.yaml, detects local CLI tools (vercel, wrangler, etc.)
- **Status:** APPROVED
- **Use Case:** One-command deployment for FALLOW, V.Two, or future projects
- **Auth:** Per-platform credentials (Vercel, Cloudflare, etc.)
- **Risk:** Medium (deployment access)
- **Security Note:** Never auto-deploy to production without confirmation.
- **Usage Rule:** Always show deployment plan before executing.
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/fortunto2/solo-deploy

### 7. **sell-evoweb-ai**
- **Purpose:** Create AI-First Website with GEO (Generative Engine Optimization) and marketing rules
- **Status:** FUTURE (landing page generation)
- **Use Case:** Quick landing pages for V.Two products or experiments
- **Auth:** None required
- **Risk:** Low
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/galizki/sell-evoweb-ai

---

## Analysis & Audit Skills

### 8. **pls-audit-website**
- **Purpose:** Full health check on websites — technical friction, UX issues, performance
- **Status:** APPROVED
- **Use Case:** Pre-launch audits, competitor analysis, FALLOW UX validation
- **Auth:** None required
- **Risk:** Low
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/mattvalenta/pls-audit-website

### 9. **pls-seo-audit**
- **Purpose:** SEO gap analysis — identify opportunities to outrank competitors
- **Status:** APPROVED
- **Use Case:** Content strategy optimization, FALLOW / V.Two SEO planning
- **Auth:** Brave Search (already configured)
- **Risk:** Low
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/mattvalenta/pls-seo-audit

### 10. **security-scanner**
- **Purpose:** Automated security scanning — nmap, nuclei, sslscan, testssl.sh integration
- **Status:** CONDITIONAL
- **Use Case:** Vulnerability assessments for FALLOW, V.Two, or client work
- **Auth:** None required (uses local tools)
- **Risk:** Medium (can trigger alerts on remote hosts)
- **Security Note:** Tool is neutral; misuse is illegal.
- **Usage Rule:** ⚠️ **MANDATORY** — Requires explicit target authorization from Kiana BEFORE scanning. No autonomous scans.
- **Ethics:** Only scan targets with written permission. Report responsibly.
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/dmx64/security-scanner

---

## Credentials & Secrets

### 11. **secret-portal**
- **Purpose:** One-time web UI for securely entering secret keys and env vars
- **Status:** APPROVED
- **Use Case:** Credential rotation, API key setup (cloudflared tunnel)
- **Auth:** None required (generates ephemeral tokens)
- **Risk:** Low (time-gated, token-scoped, no storage in chat)
- **Features:** 
  - Auto-expires after 300s or single submission
  - URL contains random 32-byte token
  - Secrets never logged to stdout/stderr
  - Env file written with 600 permissions (owner-only)
  - Free cloudflared tunnel (no account needed)
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/awlevin/secret-portal

---

## Lead Generation (CONDITIONAL)

### 12. **lead-gen-crm** ⚠️
- **Purpose:** End-to-end lead pipeline — discovery, enrichment, scoring, CRM push, email outreach
- **Status:** CONDITIONAL (GDPR/CAN-SPAM safeguards required)
- **Use Case:** V.Two sales outreach, prospect research (with manual review)
- **Auth:** 
  - Brave Search (configured)
  - Hunter.io (email finding) — `HUNTER_API_KEY`
  - CRM choice: HubSpot, Pipedrive, Zoho
  - Email: SendGrid or SMTP
- **Risk:** HIGH (privacy, compliance)
- **Security Rules:**
  1. **Email Enrichment OK** — Use Hunter.io for B2B only (lower privacy risk)
  2. **Lead Scoring OK** — Uses public web signals
  3. **CRM Push REQUIRES REVIEW** — Never auto-push. Kiana must approve before bulk CRM imports.
  4. **Outreach REQUIRES REVIEW** — Never auto-send emails. Kiana reviews all templates + prospect list.
  5. **Unsubscribe Required** — All emails MUST include unsubscribe link (CAN-SPAM compliance)
  6. **GDPR Compliance** — Document consent basis for EU prospects (Age + IP check)
- **Usage Rule:** Lead enrichment is manual-triggered only. CRM push and email campaigns require human approval.
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/reighlan/lead-gen-crm

---

## Utility Skills

### 13. **shelly-brand-name-generator**
- **Purpose:** Generate 20 creative brand name suggestions + .com domain availability
- **Status:** APPROVED
- **Use Case:** Product naming, business naming, domain scouting
- **Auth:** None required
- **Risk:** Low
- **Repo:** https://github.com/openclaw/skills/tree/main/skills/claudiodrusus/shelly-brand-name-generator

---

---

## Additional Skills (3 from second batch review)

### 14. **agent-browser-clawdbot**
- **Purpose:** Fast headless browser automation using accessibility tree snapshots + ref-based element selection
- **Status:** APPROVED
- **Use Case:** Complex multi-step browser workflows, E2E testing, faster than my native browser tool
- **Auth:** None required (local CLI)
- **Risk:** Low (no external APIs, session-isolated)
- **Repo:** https://github.com/vercel-labs/agent-browser

### 15. **agent-dashboard**
- **Purpose:** Real-time task monitoring — Canvas rendering (zero setup), GitHub Pages (static), or Supabase Realtime (websockets)
- **Status:** APPROVED
- **Use Case:** Monitor FALLOW/V.Two pipeline status from anywhere (phone, laptop)
- **Auth:** Optional (Supabase if using Tier 3)
- **Risk:** Low (Canvas = local only, data is operational status only — no secrets)
- **Features:** PIN-protected, multiple deployment tiers, no external services required for Tier 1
- **Repo:** https://github.com/tahseen137/agent-dashboard

### 16. **clawdbot-skill-update**
- **Purpose:** Comprehensive backup, update, restore workflow with dynamic multi-agent workspace detection
- **Status:** APPROVED (for future multi-agent setup)
- **Use Case:** Backup/restore when managing multiple agents
- **Auth:** None required
- **Risk:** Low (standard shell operations, tar + git)
- **Repo:** https://github.com/pasogott/clawdbot-skill-update

---

## Conditional (if needed)

### actionbook
- **Purpose:** Pre-verified page interaction library (selectors, actions for 1000+ sites)
- **Status:** Conditional — add if building E2E tests on FALLOW
- **Risk:** Low (selector freshness depends on maintenance)
- **Repo:** https://github.com/adcentury/actionbook

### artyomx33/jtbd-analyzer
- **Purpose:** Jobs-to-be-Done analysis (product strategy)
- **Status:** Conditional — add for future product market fit research
- **Risk:** Low (analysis tool, no execution)

### leoyessi10-tech/context-engineering
- **Purpose:** Context window optimization (token management)
- **Status:** Conditional — add if token optimization becomes critical
- **Risk:** Low (meta tool, no execution)

---

## Skipped (and Why)

| Skill | Reason |
|-------|--------|
| web-pilot, web-search-hub, url-fetcher | Duplicate my web_search + web_fetch tools |
| awwwards-design, web-design-pro, kj-evoweb-ai, kj-web-deploy-github | Design/deployment overlap; solo-deploy handles deployments |
| vibe-ship, solo-factory, solo-landing-gen | Over-engineered for current workflow; solo-research + solo-deploy sufficient |
| unloopa-api | Niche (website sales); no current business case |
| botpicks, prediction-market-aggregator | kalshi-agent covers prediction markets |
| plvr-event-discovery | Use plvr-event-discovery-safe (read-only) instead if needed later |
| lead-enrichment | Privacy risk (non-consensual dossiers); use lead-gen-crm instead |
| self-evolve | **SECURITY VIOLATION** — Autonomous self-modification of config/prompts forbidden |
| kj-ui-ux-pro-max | Guidance-only; not operational |
| automation-workflows, playwright-scraper-skill, playwright-mcp, obsidian-direct, lb-nextjs16-skill | Pending clarification or not relevant to current stack |

---

## Security Boundaries

### External API Calls
- All external APIs (instagram-api, adaptlypost, kalshi-agent, lead-gen-crm) require credentials in `secret-portal`.
- Never paste API keys directly into chat.
- Credentials are stored in local env files (600 permissions).

### Financial Exposure
- **kalshi-agent** — Real money. Always require explicit confirmation before trades.

### Compliance
- **lead-gen-crm** — CAN-SPAM (unsubscribe links mandatory), GDPR (consent documentation).
- **security-scanner** — CFAA (only scan with authorization).

### Autonomous Restrictions
- No autonomous trades (kalshi-agent).
- No autonomous scanning (security-scanner).
- No autonomous CRM/email pushes (lead-gen-crm).
- No autonomous self-modification (self-evolve forbidden).

---

## Setup (Summary)

1. **API Keys:** Use secret-portal for Instagram, Hunter.io, CRM, SendGrid, Kalshi credentials.
2. **Local Tools:** security-scanner requires nmap, nuclei, sslscan (brew install).
3. **Hosting:** solo-deploy requires Vercel, Cloudflare, or similar CLI tools.
4. **Credentials File:** `~/.openclaw/secrets.env` (600 permissions, never in git).

---

## Future Review

- **Obsidian, Playwright:** Pending clarity on scope + robots.txt compliance.
- **NextJS16 skill:** Only if FALLOW/V.Two migrate from Vite.
- **More prediction markets:** Only if Kalshi integration proves stable + compliant.

---

**Last Updated:** 2026-03-06 (6 new local skills added, 4 existing skills upgraded)
**Added By:** Claude Code (security audit + implementation)
**Approved By:** Pending Kiana confirmation

**2026-03-06 Changes:**
- Added 6 new production-ready skills (api-security, software-architecture, subagent-orchestration, webapp-testing, brand-guidelines, competitive-intelligence)
- Upgraded 4 existing skills (debugging, planning, git, work-outreach) with enhanced features and security guardrails
- Updated SKILL-TEMPLATE.md to new 11-section production standard
- All new skills follow TOON format for inputs/outputs and include cross-agent handoff support
