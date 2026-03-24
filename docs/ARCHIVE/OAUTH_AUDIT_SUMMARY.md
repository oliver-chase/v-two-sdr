# OAuth Audit: Executive Summary

**Audit Date:** 2026-03-17
**Status:** Design & Analysis Complete (No Code Changes)
**Scope:** Microsoft Graph email sending (OAuth 2.0) vs. current SMTP basic auth
**Output:** 4 documents created

---

## Key Findings

### 1. Current State (SMTP Basic Auth)

| Component | Current | Risk Level |
|-----------|---------|-----------|
| **Email Sending** | `mailer.js` → nodemailer → SMTP (smtp.office365.com:587) | 🔴 HIGH |
| **Email Receiving** | `inbox-monitor.js` → imapflow → IMAP (outlook.office365.com:993) | 🔴 HIGH |
| **Authentication** | Basic auth (username + password) | 🔴 HIGH |
| **Token Management** | None (password-based, no expiry) | 🔴 HIGH |
| **Microsoft Status** | Deprecated; retiring in 2025 | 🔴 HIGH |

**Risks:**
- Microsoft has announced deprecation of SMTP/IMAP basic auth
- If MFA is enabled on the account, basic auth is already blocked
- No token-based security model
- Credentials stored as plaintext (in GitHub Secrets)

---

### 2. Target State (OAuth 2.0)

| Component | Target | Risk Level |
|-----------|--------|-----------|
| **Email Sending** | `mailer.js` → OAuthClient → Graph API (/v1.0/users/oliver@vtwo.co/sendMail) | 🟢 LOW |
| **Email Receiving** | `inbox-monitor.js` → IMAP basic auth (interim) OR `graph-inbox-monitor.js` → Graph API (future) | 🟡 MEDIUM |
| **Authentication** | OAuth 2.0 Client Credentials Grant | 🟢 LOW |
| **Token Management** | In-memory cache with auto-refresh; 1-hour expiry | 🟢 LOW |
| **Microsoft Status** | Official recommendation | 🟢 LOW |

**Benefits:**
- Aligns with Microsoft's OAuth 2.0 standard
- Token-based security (no password exchange)
- Works with MFA enabled accounts
- Granular scopes (Mail.Send, Mail.Read)
- Audit trail in Microsoft Defender

---

### 3. Migration Paths (3 Options)

#### Option A: Dual Support (Recommended for Phase 2-3)
**Migrate sending to OAuth, keep IMAP basic auth (fallback)**

```
Email Sending:    OAuth (Graph API) ← NEW
Email Receiving:  IMAP basic auth   ← KEEP (for now)
```

- **Effort:** 2-3 hours
- **Risk:** Low (email sending isolated from IMAP logic)
- **Testing:** Can validate OAuth in production gradually
- **Future:** Gives Phase 4 time to plan Graph API IMAP migration

**GitHub Secrets:**
```
Add:     OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET
Keep:    OUTLOOK_PASSWORD (for IMAP fallback)
Total:   9 secrets (was 6)
```

**Verdict:** Best balance of progress and risk.

---

#### Option B: Full OAuth Migration (Recommended for Phase 4)
**Migrate both sending and receiving to OAuth**

```
Email Sending:    OAuth (Graph API) ← NEW
Email Receiving:  OAuth (Graph API) ← NEW
```

- **Effort:** 4-5 hours
- **Risk:** Medium (both IMAP and SMTP migration in parallel)
- **Testing:** More complex testing (two new code paths)
- **Benefit:** No legacy authentication, fully OAuth-based

**GitHub Secrets:**
```
Add:     OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET
Remove:  OUTLOOK_PASSWORD
Total:   8 secrets (was 6)
```

**Verdict:** Better long-term, defer to Phase 4.

---

#### Option C: Stay on SMTP (Not Recommended)
**Keep current SMTP basic auth, ignore deprecation**

- **Effort:** 0 hours
- **Risk:** Very High (relying on deprecated protocol)
- **Benefit:** No code changes
- **Consequence:** Will break when Microsoft retires basic auth (2025+)

**Verdict:** Not sustainable; eventually required.

---

### 4. Azure Credentials Status

**Question:** Do we have Azure OAuth credentials?

**Answer:** User reports they exist but are not yet integrated into code.

| Credential | Status | Source |
|-----------|--------|--------|
| `OUTLOOK_TENANT_ID` | ✓ Exists | User has it from Azure AD |
| `OUTLOOK_CLIENT_ID` | ✓ Exists | User has it from Azure App Reg |
| `OUTLOOK_CLIENT_SECRET` | ✓ Exists | User has it from Azure (generated) |

**Action Required:** User to provide these 3 values to enable implementation.

---

### 5. IMAP Question: Can Basic Auth Stay?

**Question:** Can `imapflow` continue using basic auth after OAuth migration?

**Answer:** Depends on Azure tenant configuration. Decision required.

| Scenario | Basic Auth Status | Action |
|----------|---|---|
| **Security Defaults ON** (likely) | ❌ BLOCKED | Migrate to Graph API |
| **MFA enabled on account** | ❌ BLOCKED | Migrate to Graph API |
| **Security Defaults OFF + No MFA** | ⚠️ May work | Keep for Phase 2-3, plan Phase 4 migration |

**Recommendation:**
1. Check Azure configuration (3-step checklist in `IMAP_OAUTH_DECISION.md`)
2. Test IMAP after Phase 2-3 (run `npm run inbox`)
3. If works → Keep basic auth for now
4. If fails → Emergency Graph API migration

---

### 6. Environment Variables: New + Updated

**To Add (Required):**
```env
OUTLOOK_TENANT_ID=<your-tenant-id>
OUTLOOK_CLIENT_ID=<your-client-id>
OUTLOOK_CLIENT_SECRET=<your-client-secret>
```

**To Keep (Existing):**
```env
OUTLOOK_USER=oliver@vtwo.co
OUTLOOK_PASSWORD=...  # For IMAP fallback (Option A)
                      # Or remove (Option B)
BCC_EMAIL=oliver+sdr@vtwo.co
SENDER_NAME=Oliver Chase
MAX_DAILY_SENDS=15
SEND_DELAY_MS=30000
GOOGLE_SHEET_ID=...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_FREE_KEY=...
```

**Updated .env.example:**
- Add 3 new OAuth variables with documentation
- Keep OUTLOOK_USER (for sender name / IMAP)
- Keep OUTLOOK_PASSWORD (with note: "IMAP fallback, deprecated for sending")
- Add comment: "See OAUTH_AUDIT.md for migration details"

---

### 7. Implementation Effort

| Task | Phase | Effort | Owner |
|------|-------|--------|-------|
| Azure credential verification | User | 15 min | User |
| Decision: Option A, B, or C | User | 15 min | User |
| Create config.oauth.js | Dev | 1-2 hours | Developer |
| Update scripts/mailer.js | Dev | 1 hour | Developer |
| Update .env.example | Dev | 30 min | Developer |
| Update GitHub Secrets (3 new) | User | 10 min | User |
| Test email send end-to-end | Dev | 1 hour | Developer |
| Test GitHub Actions workflow | Dev | 30 min | Developer |
| **Option A Total** | 2-3 | 4-5 hours | Mixed |
| **Option B Total (IMAP)** | 4 | +3-4 hours | Developer |

---

### 8. Security Considerations

**Token Handling:**
- ✓ Tokens cached in RAM (not persisted to disk)
- ✓ Tokens auto-refresh every 60 minutes
- ✓ Tokens invalidated immediately if request fails (401)
- ✓ Secrets stored in GitHub Secrets (encrypted at rest)

**Best Practices:**
- Never log tokens (even in debug mode)
- Rotate client secret annually
- Use minimal scope (`Mail.Send`, not `.default`)
- Audit all email sends (already done in sends.json log)

**Risk Assessment:**
- SMTP basic auth risk: **🔴 HIGH** (plaintext password, deprecated)
- OAuth token risk: **🟢 LOW** (encrypted transport, expiring tokens)

---

## Deliverables (This Audit)

| Document | Purpose | Length |
|----------|---------|--------|
| `OAUTH_AUDIT.md` | Complete technical reference | 500+ lines |
| `OAUTH_QUICK_REFERENCE.md` | Developer cheat sheet | 250 lines |
| `IMAP_OAUTH_DECISION.md` | IMAP-specific guidance | 300 lines |
| `OAUTH_AUDIT_SUMMARY.md` | This document | 200 lines |

**How to Use:**
1. **Start here:** `OAUTH_AUDIT_SUMMARY.md` (this file)
2. **For details:** `OAUTH_AUDIT.md` (full 11-section reference)
3. **For coding:** `OAUTH_QUICK_REFERENCE.md` (code templates)
4. **For IMAP:** `IMAP_OAUTH_DECISION.md` (decision framework)

---

## Next Steps: Decision Required

### Immediate (User Action — Next Meeting)

1. **Decide on migration strategy:**
   - [ ] Option A: Dual Support (OAuth send + SMTP IMAP fallback)
   - [ ] Option B: Full OAuth (OAuth send + Graph IMAP)
   - [ ] Option C: Status quo (not recommended)

2. **Check Azure configuration:**
   - [ ] Is Security Defaults enabled or disabled?
   - [ ] Does oliver@vtwo.co have MFA?
   - [ ] Can you test IMAP basic auth manually?
   - (See `IMAP_OAUTH_DECISION.md` Section "Azure Configuration Check")

3. **Provide Azure credentials:**
   - [ ] OUTLOOK_TENANT_ID
   - [ ] OUTLOOK_CLIENT_ID
   - [ ] OUTLOOK_CLIENT_SECRET

4. **Verify app registration:**
   - [ ] Does app have `Mail.Send` scope granted in Azure?
   - [ ] Is client secret valid (not expired)?

---

### Short-Term (After Decision — Phase 2-3)

**If Option A chosen:**
1. Implement `config.oauth.js` (OAuthClient class)
2. Update `scripts/mailer.js` to use OAuthClient
3. Update `.env.example` with 3 new OAuth variables
4. Add 3 GitHub Secrets
5. Test email send via Graph API
6. Test GitHub Actions workflow
7. Deploy to production

**If Option B chosen:**
1. Same as Option A (above), plus:
2. Create `scripts/graph-inbox-monitor.js` (Graph API alternative)
3. Update `.env.example` to remove OUTLOOK_PASSWORD (with migration note)
4. Remove OUTLOOK_PASSWORD from GitHub Secrets
5. Test inbox monitoring via Graph API

**If Option C chosen (not recommended):**
1. No action
2. Plan for future migration when basic auth breaks

---

## Risk Assessment

### Before OAuth Migration (Current State)
```
Sending:   🔴 Will break if:
           - Microsoft retires SMTP basic auth (2025+)
           - MFA becomes required on account
           - Password policy changes in M365

Receiving: 🔴 Will break if:
           - Microsoft retires IMAP basic auth (2025+)
           - MFA becomes required on account

Timeline:  ⚠️  Uncertain (Microsoft hasn't given exact date)
Likelihood: HIGH (multiple indicators point to 2024-2025)
```

### After OAuth Migration (Phase 2-3, Option A)
```
Sending:   🟢 Protected:
           - Uses OAuth 2.0 (Microsoft's official standard)
           - Works with MFA enabled
           - Token-based, no password at risk
           - Audit trail in Microsoft Defender

Receiving: 🟡 Partially protected:
           - IMAP basic auth still at risk (Option A)
           - Works for now, but plan Phase 4 migration
           - If IMAP fails, can fall back to error handling

Timeline:  ✓ Buying time for Phase 4 IMAP migration
Likelihood: Can extend runway to Q3/Q4 2026
```

### After Full OAuth Migration (Phase 4, Option B)
```
Sending:   🟢 Protected (same as Option A)
Receiving: 🟢 Protected (Graph API, no basic auth)
Timeline:  ✓ Fully future-proof
Likelihood: Compliant for 3+ years
```

---

## Cost-Benefit Summary

| Aspect | Option A (Dual) | Option B (Full OAuth) | Option C (Status Quo) |
|--------|---|---|---|
| **Implementation Cost** | 4-5 hours | 7-8 hours | 0 hours |
| **Risk Reduction** | 50% (sending only) | 100% (both) | 0% |
| **Time to Deploy** | 1 sprint | 2 sprints | Now |
| **Maintenance Burden** | Medium (2 auth paths) | Low (1 auth path) | Low (until it breaks) |
| **Recommended** | ✓ NOW | ✓ Next quarter | ❌ Not safe |

**Verdict:** **Option A in Phase 2-3, then Option B in Phase 4.**

---

## Questions & Answers

### Q: Do we have to migrate now?
**A:** No, but you should. SMTP basic auth may stop working in 2025-2026 if MFA becomes mandatory. OAuth buys 3+ years of compatibility.

### Q: Will existing code break?
**A:** No. Option A keeps IMAP basic auth as fallback. Option B requires IMAP rewrite (3-4 hours). Both are well-defined.

### Q: What if IMAP still works after OAuth migration?
**A:** Good! Option A keeps basic auth as fallback. Plan Phase 4 migration when convenient.

### Q: What if IMAP breaks immediately?
**A:** Use `IMAP_OAUTH_DECISION.md` to trigger emergency Graph API migration (3-4 hours). It's a clear signal MFA is now enforced.

### Q: Can we implement only Option A (no IMAP migration)?
**A:** Yes! Option A is completely independent. Implement OAuth for sending, keep IMAP as-is. Test after deployment.

### Q: When should we do Option B (full OAuth)?
**A:** Phase 4 (next quarter) is safe. After Option A is stable in production, migrate IMAP to Graph API.

### Q: Will token refresh cause issues?
**A:** No. Token cache in config.oauth.js handles refresh automatically. Developer won't see it—just use `getAccessToken()`.

### Q: Is Graph API more expensive than SMTP?
**A:** No. Microsoft Graph is free (included with Microsoft 365). Same cost as SMTP basic auth.

---

## Sign-Off

**Audit Scope:** Complete
**Recommendation:** Proceed with Option A (Phase 2-3), plan Option B (Phase 4)
**Risk Level:** 🟡 Medium (OAuth implementation required for long-term viability)
**Next Action:** User decision on migration strategy + Azure credential verification

---

**Documents for Reference:**
1. `OAUTH_AUDIT.md` — Full technical details (11 sections, 500+ lines)
2. `OAUTH_QUICK_REFERENCE.md` — Developer cheat sheet (code examples)
3. `IMAP_OAUTH_DECISION.md` — IMAP-specific decision framework
4. `.env.example` — To be updated with 3 new OAuth variables
5. `PROGRESS.md` — Phase 2-3 implementation tracker

---

**Audit Completed By:** Claude Haiku 4.5
**Date:** 2026-03-17
**Status:** Design & Analysis Only (No Code Implementation)

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free

