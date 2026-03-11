# Skill: API Security & Credentials Hygiene

**Category:** Security
**Status:** Active
**Primary User(s):** Both agents (Claude Code manages, OpenClaw validates)
**Last Updated:** 2026-03-06

---

## Purpose

Manage API credentials, environment variables, and secret rotation systematically across projects. Prevent credential leaks and maintain audit trails for compliance.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1 — All agents read this)**

This skill covers:
1. **Credential inventory** — Where keys live, who owns them, rotation cadence
2. **Env var migration** — Moving secrets from code to environment/secret-portal
3. **Least-privilege review** — Ensuring each API has minimal required permissions
4. **Rotation runbook** — Step-by-step credential refresh procedures
5. **Audit trail** — What to log for compliance and incident response

**Claude Code**
- **When:** Auditing code for hardcoded secrets, adding new APIs, rotating keys
- **Example:** "Before pushing, audit all .env references and move hardcoded API keys to secret-portal"
- **Tools available:** read (scan files), write (update .env.example), exec (verify env vars are set)

**OpenClaw**
- **When:** Validating API permissions, researching credential scope requirements, compliance checks
- **Example:** "Verify that Hunter.io API key has only 'email-verification' scope, not admin access"
- **Tools available:** read (audit logs), web_fetch (API docs), message (report findings)

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Check for hardcoded secrets"
- "Rotate API keys"
- "Audit credential permissions"
- "Does this API need that access?"
- "Where are the secrets stored?"
- "Prepare for security audit"

**Use cases:**
- New API integration (before writing code)
- Pre-deployment security check
- Quarterly credential rotation
- Incident response (potential leak)
- Compliance audit (SOC 2, GDPR, etc.)

---

## Inputs (TOON Format)

**Data Specification:**

```toon
credential_request{api_name,current_location,permissions_needed,rotation_due,owner,sensitivity}:
 hunter-io,.env.local,email-verify + domain-search,2026-04-06,OpenClaw,high
 stripe-test,secret-portal,test-only,2026-06-06,Claude-Code,high
 github-token,GitHub Actions secrets,repo-write,2026-05-06,Claude-Code,high
```

**Validation rules:**
- `api_name` — Must match service provider exactly (e.g., "hunter-io", "stripe-test")
- `current_location` — One of: code (❌ invalid), `.env`, `.env.local`, `secret-portal`, `CI/CD secrets`, `environment variable`
- `permissions_needed` — Least privilege scopes only (e.g., "read" not "admin")
- `rotation_due` — ISO 8601 date, max 90 days from today
- `owner` — Agent or human responsible for managing this credential

---

## Workflow

1. **Audit Current State**
   - Scan codebase for hardcoded API keys (grep for patterns)
   - List all .env files and their contents
   - Check CI/CD for exposed secrets
   - Document where each credential is stored

2. **Classify by Risk**
   - `HIGH` — Financial (Stripe, AWS), user data (email, password)
   - `MEDIUM` — Research APIs (Hunter.io, Clearbit), service APIs
   - `LOW` — Public API keys (GitHub public, Google public)

3. **Review Permissions (Least Privilege)**
   - For each API, determine minimum required scopes
   - Check current API token/key permissions
   - Request reduced scope from provider if over-privileged
   - Document approval of scope reduction

4. **Migrate Secrets**
   - For `code` location: Delete from repo (git rm), add to .gitignore
   - For `.env`: Move to secret-portal or GitHub Actions secrets
   - Update code to read from environment only
   - Test that app still works

5. **Establish Rotation Schedule**
   - APIs with user data: rotate every 90 days
   - Financial APIs: rotate every 60 days
   - Service tokens: rotate every 90 days
   - Public keys: rotate every 180 days (or as provider recommends)

6. **Document Audit Trail**
   - Log who created/rotated each credential
   - Log scope changes
   - Log access patterns (if API provider supports)
   - Keep in system/memory/[YYYY-MM-DD].md

---

## Outputs (TOON Format)

**Credential Map (Audit-Ready Format):**

```toon
credential_inventory{api_name,env_var_name,current_permissions,owner,last_rotated,next_rotation,location,status}:
 hunter-io,HUNTER_API_KEY,"email-verify, domain-search",openclaw,2025-12-06,2026-03-06,secret-portal,active
 stripe-test,STRIPE_TEST_KEY,"invoice.write, charge.read",claude-code,2025-09-06,2026-06-06,GitHub-Actions,active
 github-token,GITHUB_TOKEN,"repo:write, actions:write",claude-code,2026-02-06,2026-05-06,GitHub-Actions,active
 sendgrid,SENDGRID_API_KEY,"mail.send",openclaw,2025-11-06,2026-02-06,secret-portal,⚠️-rotate-now
```

**Rotation Runbook Output:**

```toon
rotation_log{api_name,old_key_deleted,new_key_created,verified_working,timestamp,completed_by}:
 hunter-io,true,true,true,2026-03-06T14:30:00Z,claude-code
 stripe-test,true,true,true,2026-03-06T15:00:00Z,claude-code
```

**Security Audit Report:**

```toon
audit_findings{check,status,details,remediation,priority}:
 hardcoded-keys,❌-FAIL,"Found AWS_ACCESS_KEY in config.js line 42","Delete from code, use env var","CRITICAL"
 permissions-audit,⚠️-PARTIAL,"Hunter API has admin scope, needs email-verify only","Request scope reduction from Hunter","HIGH"
 rotation-overdue,❌-FAIL,"Stripe key last rotated 2025-09-06, due 2026-06-06 but 90-day policy","Rotate immediately","HIGH"
 env-validation,✅-PASS,"All .env vars match code references, no missing keys","None","LOW"
```

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER output real secrets in chat, logs, or reports** — Always use `[REDACTED-hunter-io-key]` or `${HUNTER_API_KEY}` placeholder format. Why: Prevents accidental exposure of credentials that could compromise accounts or user data.

2. **NEVER migrate credentials without verification** — Test that the app works with new env var location before deleting old copy. Why: Prevents "secret is set but app breaks" scenarios that require emergency rotation.

3. **NEVER grant credentials more permissions than needed** — Always request least-privilege scopes from API provider. Why: Reduces blast radius if credential is compromised; attackers can only do what the token allows.

4. **NEVER rotate credentials without documenting it** — Log who, what, when, why in system/memory/. Why: Audit trail required for compliance and incident investigation.

5. **NEVER leave rotation overdue** — Check rotation schedule weekly, rotate 7 days before deadline. Why: Stale credentials are common attack vectors and compliance violations.

**Can Do:**
- Read .env files and audit their contents
- Check environment variable presence
- Document credential locations and ownership
- Request reduced permissions from API providers
- Automate rotation reminders and checklists
- Generate audit reports for compliance

**Cannot Do:**
- Share real secrets in messages or code comments
- Automate credential rotation without human approval (only for CI/CD provider-managed secrets)
- Delete credentials without testing alternative location first
- Store passwords or API keys in plaintext files not in .gitignore

**Credentials & Secrets:**
- **How to access:** Via secret-portal or GitHub Actions secrets (never read from .env directly unless auditing)
- **What to log:** Timestamp, action (created/rotated/deleted), who performed it, which API
- **What to hide:** Actual credential values always, first 6 chars of old keys in rotation logs (e.g., "stripe_test_5156xx")

**Audit Trail:**
- Log every credential creation, access, rotation, and deletion
- Retention: Keep for 2 years (compliance requirement)
- Reviewer: Kiana quarterly, agents weekly

---

## Examples (Copy-Paste Ready)

### Example 1: Audit for Hardcoded Secrets Pre-Deployment

**Prompt:**
```
Before we deploy, audit the codebase for hardcoded API keys. Check:
1. All .js/.ts files for API_KEY, SECRET, TOKEN patterns
2. .env files for credentials not in .gitignore
3. CI/CD config for exposed secrets in logs
Report findings in credential_inventory TOON format. Use [REDACTED] for real values.
```

**Expected Output:**
```toon
audit_findings{check,status,details,remediation,priority}:
 hardcoded-keys,✅-PASS,"No hardcoded keys found in /src or /server","None","LOW"
 env-files,✅-PASS,".env.local in .gitignore, .env.example has placeholders","None","LOW"
 ci-cd-logs,⚠️-WARN,"GitHub Actions log shows STRIPE_KEY briefly in build output","Use secrets masking in Actions","MEDIUM"
```

---

### Example 2: Rotate Expired Hunter.io API Key

**Prompt:**
```
Hunter.io API key expired 2026-02-06 (90-day rotation policy). Execute rotation:
1. Log into Hunter dashboard, create new API key with "email-verify, domain-search" scope
2. Update HUNTER_API_KEY in secret-portal
3. Test: Run a test email validation to confirm new key works
4. Log the rotation in system/memory with timestamp and status
Output rotation_log TOON format when complete.
```

**Expected Output:**
```toon
rotation_log{api_name,old_key_deleted,new_key_created,verified_working,timestamp,completed_by}:
 hunter-io,true,true,true,2026-03-06T14:30:00Z,openclaw

Verification test:
- Validated 5 test emails successfully with new key
- Response time: 0.3s (normal)
- No errors in logs
Status: ✅ Rotation complete and verified
```

---

### Example 3: Least-Privilege Audit (Stripe Integration)

**Prompt:**
```
Review Stripe API token permissions:
Current scope: API key has unrestricted access (can create/update/delete charges, customers, invoices, disputes, etc.)
Required scope: Only needs ability to create charges and read transaction history (for SDR payment processing)
Action: Request reduced scope from Stripe API settings. Output audit_findings TOON showing what permissions were removed.
```

**Expected Output:**
```toon
audit_findings{check,status,details,remediation,priority}:
 stripe-permissions,⚠️-PARTIAL,"Token has admin scope, reduced to: charge.create + charge.read + customer.read","Verify app still works, monitor API errors","HIGH"
 permission-test,✅-PASS,"Tested: Can create charge ✓, Can read charge history ✓, Cannot delete charge ✓ (correctly denied)","Continue using reduced-scope key","LOW"
```

---

## Related Skills

- **git/** — Commit with `git commit -m "chore: audit API credentials"` and never commit .env files
- **work-outreach/** — When adding new APIs for SDR (e.g., Hunter.io, email service), run API-security skill first
- **planning/** — Plan credential rotation into quarterly maintenance sprints

---

## Agent-Specific Implementation (Level 2)

### Claude Code Implementation

**Tools available:**
- **read** — Scan files for hardcoded credentials and .env references
- **write** — Update .env.example, .gitignore, documentation
- **exec** — Run `grep` to find API key patterns, test env var presence, verify git history for secret removal

**Workflow customization:**
1. Scan codebase: `grep -r "API_KEY\|SECRET\|TOKEN" src/ --exclude-dir=node_modules`
2. Verify .gitignore: Check all credential files are listed
3. Test env vars: Run app with `echo $HUNTER_API_KEY` to confirm presence
4. Audit git history: `git log --all --full-history -- path/to/secret` to find if ever committed

**Common challenges:**
- **Challenge:** .env file deleted but git history still has it
- **Mitigation:** Use `git filter-branch` or `git-crypt` to remove from history. Rotate the key immediately.

- **Challenge:** App breaks after moving credential to env var
- **Mitigation:** Check that all references match (e.g., `process.env.HUNTER_API_KEY` in code, `HUNTER_API_KEY` in secret-portal)

**Token budget:** ~500–800 tokens per audit (scanning + reporting)

---

### OpenClaw Implementation

**Tools available:**
- **read** — Access audit logs, credential inventory, API documentation
- **web_fetch** — Check API provider documentation for recommended permissions, verify scope policies
- **message** — Report audit findings to Kiana

**Workflow customization:**
1. Validate permissions: Fetch API provider's doc, compare current scope to required
2. Research rotation policies: Industry standards (90-day for user data, 180-day for public keys)
3. Compliance check: Verify rotation schedule meets SOC 2 / GDPR / HIPAA requirements if applicable
4. Report: Summarize findings for human review

**Common challenges:**
- **Challenge:** API provider doesn't expose current permissions in API (requires manual check)
- **Mitigation:** Document which APIs require manual permission review in system/memory/api-vendors.md

- **Challenge:** Different teams use different rotation schedules
- **Mitigation:** Establish company-wide standard (90-day default) in system/memory/security-policy.md

**Token budget:** ~800–1200 tokens per validation (research + reporting)

---

## Cross-Agent Handoff (Context Pass)

When handing off mid-task to another agent, output this TOON summary:

```toon
handoff_context{skill,from_agent,to_agent,completed_tasks,pending_tasks,blockers,files_modified,next_steps}:
 api-security,claude-code,openclaw,"Codebase audited (no hardcoded keys found), .env.local verified, Hunter key rotation logged","Verify permissions with Hunter API docs, validate Stripe least-privilege scope","None","skills/api-security/audit-2026-03-06.md, system/memory/2026-03-06.md","OpenClaw to validate API scopes match required permissions"
```

---

## Collaboration Pattern

**Sequence:** Sequential (Claude Code first, then OpenClaw validates)

- **Claude Code does:** Scans code for hardcoded secrets, audits .env files, moves credentials to secret-portal, tests that app works
- **OpenClaw does:** Validates API permissions match least-privilege policy, researches rotation requirements, generates compliance report
- **They coordinate by:** Claude Code provides audit findings, OpenClaw validates against API provider policies, both log in shared memory
- **Approval gate:** Kiana reviews audit and permission changes before implementation

---

## Token Budget (Per Operation Type)

| Operation | Estimated Tokens | Notes |
|-----------|------------------|-------|
| Hardcoded secret scan | 200–400 | Quick file grep + analysis |
| Permission audit | 500–800 | Review current, research required, generate report |
| Credential rotation | 300–600 | Execute rotation steps + verification |
| Compliance audit (quarterly) | 1000–1500 | Full inventory + policy check + report |
| **Handoff context** | 100–200 | Summary TOON format |

---

## Troubleshooting & Fallbacks

**When credential is accidentally exposed in git history:**
- Fallback: `git filter-branch --tree-filter 'rm -f <secret-file>' -- --all` (Claude Code) + Rotate the key immediately
- Escalate to: Kiana (human review for incident response)
- Retry with: New secret value, verified working before cleanup

**When API provider doesn't allow scope reduction:**
- Fallback: Document why (vendor limitation) + increase monitoring for this credential
- Escalate to: Kiana for risk acceptance decision
- Retry with: Different API provider if available

**When rotation automation fails:**
- Fallback: Manual rotation following runbook, followed by test
- Escalate to: Kiana if vendor API changes
- Retry with: Updated rotation procedure in system/memory/

---

## Verification Checklist (Before Completion)

- [ ] All hardcoded secrets identified and removed
- [ ] .gitignore covers all credential files
- [ ] Env vars verified present in execution environment
- [ ] API permissions reviewed for least-privilege
- [ ] Rotation schedule documented and added to calendar/memory
- [ ] Audit trail logged in system/memory/[YYYY-MM-DD].md
- [ ] Both agents (if both involved) signed off on findings
- [ ] Credential map in TOON format matches current state

---

## FAQ

**Q: Can we commit .env to git if it's empty (placeholders only)?**
A: Yes. `.env.example` with placeholders (e.g., `HUNTER_API_KEY=your-key-here`) is safe. Real values go in `.env.local` (in .gitignore).

**Q: How often should we rotate?**
A: 90 days for user-data APIs (Hunter, email), 60 days for financial (Stripe), 180 days for public keys.

**Q: What if the credential is already public?**
A: Rotate immediately. Treat as security incident. Log in system/memory/ with incident flag.

**Q: Can we use the same API key across projects?**
A: No. Each project gets its own key, reducing blast radius if one is compromised.

---

## Quality Standards Applied

✅ **Agent-agnostic Level 1:** Purpose through Outputs readable by any agent
✅ **TOON format:** Credential inventory, rotation log, and audit findings use TOON
✅ **Security guardrails:** 5 explicit NEVER rules covering secret exposure, verification, permissions, audit trails, and rotation
✅ **Team-specific subsections:** Named sections for Claude Code (scanning) and OpenClaw (validation)
✅ **Copy-paste prompts:** 3 ready-to-use examples (audit, rotation, least-privilege)
✅ **Handoff Context block:** TOON format for cross-agent continuity
✅ **Related skills:** References git, work-outreach, planning
✅ **Token budget:** Estimates per operation type (200–1500 tokens)
✅ **Trigger words:** 6 activation phrases

---

*Last updated: 2026-03-06 by Claude Code*
