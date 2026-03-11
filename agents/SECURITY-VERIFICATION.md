# Security Verification Protocol

**When adding ANY skill, tool, integration, or external code: ALWAYS verify and read in full first.**

This is mandatory for both Claude Code and OpenClaw.

---

## The Rule

**NEVER copy/paste external code without:**
1. Reading the entire repository
2. Understanding security implications
3. Verifying it doesn't contain malware, supply chain risks, or unwanted behavior
4. Documenting what it does in TOON format with security notes

---

## Before Adding a Skill from GitHub

### Step 1: Clone & Inspect

```bash
# Shallow clone to read code
git clone --depth 1 <repo-url> /tmp/skill-audit
cd /tmp/skill-audit

# List all files
find . -type f -name "*.py" -o -name "*.js" -o -name "*.ts" | head -20

# Look for red flags
grep -r "subprocess\|exec\|eval\|os.system\|shell=True" . 2>/dev/null
grep -r "API_KEY\|SECRET\|PASSWORD" . 2>/dev/null
```

### Step 2: Read README First

What does it claim to do? What are the inputs/outputs? Look for:
- Clear use case documentation
- Security warnings or notices
- Dependencies listed
- Author/maintainer info

### Step 3: Read the Core Code

Don't skim. **Read the actual implementation.** Look for:
- **Unvalidated inputs** — does it trust user input without sanitizing?
- **Shell execution** — does it run shell commands unsafely?
- **Credential handling** — does it ask for API keys in chat? (✗ Bad)
- **Network calls** — where do requests go? Are they verified?
- **File operations** — does it read/write files safely?
- **Supply chain risks** — does it download code at runtime?

### Step 4: Check Dependencies

```bash
cat package.json    # npm
cat requirements.txt # python
cat Gemfile          # ruby
```

Are these dependencies trustworthy? Do any have known CVEs?

### Step 5: Look for Tests

A well-maintained skill has tests. If there are no tests, that's a red flag.

### Step 6: Check the License

- MIT, Apache 2.0, GPL → OK
- Unknown or proprietary → flag it
- Commercial with restrictions → understand the limits

### Step 7: Document Your Audit

**ALWAYS write a SECURITY note in the SKILL.md:**

```markdown
## Security Audit

**Verified on:** 2026-03-06
**Auditor:** Claude Code
**Risk Level:** Low / Medium / High
**Key Findings:**
- Inputs are validated via X
- No shell execution of user input
- API keys handled via environment variables
- Dependencies: [list key ones]

**Flagged for Review:**
- (If any concerns remain, list them)
```

---

## Red Flags — Stop Immediately

✋ **STOP if you find:**

1. **Eval/exec on user input** — code that runs arbitrary input as code
2. **Plaintext credentials** — hardcoded API keys, passwords, tokens
3. **Unrestricted shell execution** — subprocess.run(cmd, shell=True) with untrusted input
4. **Supply chain downloads** — code that fetches and executes scripts at runtime
5. **No input validation** — user input trusted without checks
6. **Suspicious dependencies** — packages with similar names to legitimate ones (typosquatting)
7. **Unmaintained code** — last commit >1 year ago, no active maintenance
8. **No license** — unknown legal status
9. **Spaghetti dependencies** — dozens of transitive dependencies, high attack surface
10. **No tests** — unverified code path

**If you find ANY of these:** Flag it to Kiana. Do not integrate. Audit results go in agents/audit-log.md.

---

## Safe Patterns

✅ **These are OK:**

- Input validated against whitelist
- Shell execution of trusted, hardcoded commands only
- Credentials via environment variables or secret-portal
- Well-tested, maintained code (active commits, issue responses)
- Clear, documented API surface
- Minimal dependencies
- Clear license (MIT, Apache 2.0, etc.)

---

## Skill Integration Checklist

Before integrating a verified skill:

- [ ] Full code read and understood
- [ ] Security audit completed
- [ ] TOON-formatted SKILL.md written with security notes
- [ ] Team members who use it have read the SKILL.md
- [ ] Usage boundaries clearly documented (what it can/can't do)
- [ ] Fallback plan if skill becomes unavailable

---

## When External Code Can Be Trusted

| Source | Trust Level | Conditions |
|--------|-------------|-----------|
| Anthropic | ✅ High | Official SDKs, signed releases |
| Major open source (npm, PyPI, etc.) | ✅ Medium | >1k stars, active maintenance, security tracking |
| Small/niche GitHub repos | 🟡 Conditional | Single author, clear purpose, recent updates, read full code |
| Closed-source tools | 🟡 Conditional | Reputable vendor, transparent security policy |
| Random GitHub repos | ❌ Low | No integration without full security audit |
| Commercial platforms | 🟡 Conditional | Vendor accountability, SLAs, security certs |

---

## Audit Log

All skill verifications are logged in `agents/audit-log.md`. Both agents can read it to see:
- What's been audited
- When
- By whom
- Risk level
- Any flags

Before using a skill, check: has it been audited? If not, audit it first.

---

## What If You're Unsure?

1. **Ask Kiana** — flag the decision point, let her decide
2. **Use the conservative path** — don't integrate if you have doubts
3. **Time-limit it** — integrate with a review deadline ("re-audit in 3 months")

Better to be overly cautious with security than overly permissive.

---

*Last updated: 2026-03-06*
