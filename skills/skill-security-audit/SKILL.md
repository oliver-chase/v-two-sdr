# Skill: Skill Security Audit

**Category:** Security
**Status:** Active
**Primary User(s):** Claude Code (auditing), OpenClaw (verification)
**Last Updated:** 2026-03-06

---

## Purpose

Audit local skills library for security vulnerabilities before publishing or deploying. Detect credential leaks, dangerous file access, hardcoded paths, and git history exposure.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1 — All agents read this)**

This skill scans skills for:
1. **Credential leaks** — API keys, tokens, passwords in code
2. **Dangerous file access** — Reading ~/.ssh, ~/.aws, ~/.config without justification
3. **Hardcoded paths** — /Users/oliver paths that break on other machines
4. **Git history secrets** — Credentials committed in past (git log scanning)
5. **Permission issues** — Overly permissive file modes or env variables

**Claude Code**
- **When:** Before publishing a skill, quarterly security audit of all skills
- **Example:** "Audit skills/ directory for credential leaks before releasing to GitHub"
- **Tools available:** exec (grep, git log, find), read (skill files)

**OpenClaw**
- **When:** Validating that audit passed, verifying remediation
- **Example:** "Check that the audit finds no secrets in skills/"
- **Tools available:** read (audit reports), web_fetch (security best practices)

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Audit skills for security"
- "Check for credential leaks"
- "Before publishing skill"
- "Security audit needed"
- "Quarterly security review"

**Use cases:**
- Before pushing to GitHub/public repo
- Quarterly security review of all skills
- After adding new credential handling code
- Incident response (suspected leak)

---

## Inputs (TOON Format)

**Audit Request:**

```toon
audit_request{scope,target_directory,check_git_history,check_file_permissions,remediate_on_find}:
 all-skills,/Users/oliver/OliverRepo/skills/,yes,yes,no
 single-skill,/Users/oliver/OliverRepo/skills/work-outreach/,no,yes,no
 incident-response,/Users/oliver/OliverRepo/skills/api-security/,yes,yes,yes
```

---

## Outputs (TOON Format)

**Audit Results:**

```toon
audit_result{skill_name,secrets_found,dangerous_files,hardcoded_paths,git_history_issues,overall_status,remediation_needed}:
 work-outreach,"0 (clean)","0 (clean)","0 (uses env vars)","0 (clean)","PASSED","None"
 api-security,"0","0","0","0","PASSED","None"
 brand-guidelines,"0","0","0","0","PASSED","None"
 sample-vulnerable,"2 API keys in .py","1 /Users/oliver path","3 hardcoded paths","1 old token in git log","FAILED","Remove secrets, use env vars, fix paths, git filter-branch"
```

---

## Workflow

1. **Scan Codebase for Hardcoded Secrets**
   - Pattern matching: `api_key`, `secret`, `password`, `Bearer`, `AKIA` (AWS format)
   - Search scope: All files EXCEPT .git, node_modules, dist, build
   - Output: List of files + line numbers with matches

2. **Check Dangerous File Access**
   - Patterns: Reading ~/.ssh, ~/.aws, ~/.config, ~/.openssl
   - Check if access is documented/justified
   - Flag: "This looks suspicious; is it intentional?"

3. **Find Hardcoded Paths**
   - Patterns: `/Users/[name]/`, `/home/[name]/`, `C:\Users\`, `/opt/local/`
   - Output: Files + line numbers
   - Question: "Can this be changed to relative path?"

4. **Scan Git History**
   - Search git log for credential patterns (same as codebase scan)
   - If found: Document when it was committed + suggest remediation
   - Remediation: `git filter-branch --tree-filter 'rm -f [file]' -- --all`

5. **Check File Permissions**
   - Private keys: Should be 600 (owner-only)
   - Scripts: Should be 755 (executable)
   - Config: Should be 644 (readable but not writable by others)

6. **Generate Report**
   - TOON format (structured)
   - Actionable findings (not just "found 5 issues")
   - Remediation steps for each issue

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER expose secrets while auditing** — If audit finds secrets, log as `[REDACTED-type]` not the real value. Why: Audit report might be shared.

2. **NEVER run audit on production systems without owner approval** — Git history scan can be slow. Why: Resource-intensive, should be scheduled.

3. **NEVER delete files without confirmation** — Remediation must be manual. Why: Accidental file deletion is worse than a security issue.

4. **NEVER assume all dangerous file access is a bug** — Some skills legitimately need ~/.ssh access (e.g., deployment skills). Why: False positives discourage re-auditing.

5. **NEVER skip git history** — Old commits can leak secrets. Why: Deleting from code but leaving in git is useless.

**Can Do:**
- Automate detection (grep, git log)
- Generate detailed reports
- Suggest remediation (don't execute)
- Re-audit after remediation
- Schedule quarterly reviews

---

## Audit Commands (Copy-Paste Ready)

### Scan All Skills for Secrets

```bash
# Quick scan: current state only
grep -r --include="*.py" --include="*.js" --include="*.sh" --include="*.md" \
  -E 'api[_-]?key|secret|password|Bearer [A-Za-z0-9]|AKIA[0-9A-Z]{16}' \
  /Users/oliver/OliverRepo/skills/ \
  --exclude-dir=node_modules --exclude-dir=.git

# Full scan: git history + current state
cd /Users/oliver/OliverRepo
git log --all --source --remotes --full-history \
  -p -S 'api_key\|secret\|password\|Bearer' \
  -- skills/
```

### Scan for Hardcoded Paths

```bash
# Find /Users/oliver paths
grep -r --include="*.py" --include="*.js" --include="*.sh" \
  '/Users/[^/]*/' \
  /Users/oliver/OliverRepo/skills/

# Find /home paths (Linux)
grep -r --include="*.py" --include="*.js" \
  '/home/[^/]*/' \
  /Users/oliver/OliverRepo/skills/
```

### Scan for Dangerous File Access

```bash
# Look for ~/.ssh, ~/.aws, ~/.config access
grep -r --include="*.py" --include="*.js" \
  -E '~/(\.ssh|\.aws|\.config)' \
  /Users/oliver/OliverRepo/skills/

# Or check for home directory expansion
grep -r --include="*.py" --include="*.js" \
  -E 'os\.path\.expanduser|Path\.home' \
  /Users/oliver/OliverRepo/skills/ \
  | grep -v 'secret-portal\|api-security'  # Expected legitimate uses
```

### Check File Permissions

```bash
# Find files with overly permissive modes
find /Users/oliver/OliverRepo/skills/ \
  -type f \( -perm -077 -o -perm -007 \) \
  ! -path '*node_modules*' ! -path '*.git*' \
  -exec ls -l {} \;
```

---

## Example Audit Results

### Scenario 1: Clean Skill (api-security)

```toon
audit_result{skill_name,secrets_found,dangerous_files,hardcoded_paths,git_history_issues,overall_status,remediation_needed}:
 api-security,"0 (uses env vars only)","0 (none accessed)","0 (all relative)","0 (clean)","PASSED","None"
```

### Scenario 2: Vulnerable Skill (needs remediation)

```toon
audit_result{skill_name,secrets_found,dangerous_files,hardcoded_paths,git_history_issues,overall_status,remediation_needed}:
 sample-skill,"2 found (line 42, 87 in config.py)","1 found (line 15 in setup.py accesses ~/.ssh)","3 found (lines 5, 12, 34 in utils.js)","1 found (commit abc123d dated 2026-02-01)","FAILED","URGENT: secrets in current code; Remove and rotate credentials. Fix paths to relative. git filter-branch for history."
```

### Scenario 3: Legitimate Access (expected pattern)

```
Dangerous file access found: ~/.aws in deploy.py line 23
❓ Is this intentional? (deployment skills legitimately access ~/.aws)
✅ Verified: deploy skill owns aws-cli wrapper, access is documented
Status: ALLOWED (documented + justified)
```

---

## Related Skills

- **api-security/** — Reference for credential handling patterns (should be PASSED in audit)
- **code-enforcement/** — Pre-commit hooks prevent new secrets from being added
- **git/** — Git history scanning (part of audit workflow)

---

## Audit Template (Reusable)

```markdown
# Security Audit Report: [Skill Name]

**Date:** 2026-03-06
**Auditor:** Claude Code
**Scope:** All files in skills/[name]/

## Findings

### Secrets (Credential Leaks)
- [✅ PASS | ❌ FAIL]: No hardcoded credentials found
- Details: Scanned .py, .js, .sh, .md files using [pattern list]

### File Access (Permissions)
- [✅ PASS | ❌ FAIL]: No unauthorized file access
- Details: No ~/.ssh, ~/.aws, ~/.config access detected

### Hardcoded Paths
- [✅ PASS | ❌ FAIL]: No absolute paths hardcoded
- Details: All paths are relative or use environment variables

### Git History
- [✅ PASS | ❌ FAIL]: No secrets in git history
- Details: Scanned all commits for credential patterns

## Overall Status
- **PASSED** (No action needed)
- **FAILED** (See remediation below)

## Remediation (if failed)
1. Remove [file] line [N]: [what to do]
2. Rotate [credential] (see api-security/SKILL.md)
3. Update git history: `git filter-branch --tree-filter 'rm -f [file]' -- --all`
4. Force push and notify all collaborators

---
```

---

## Token Budget (Per Operation Type)

| Operation | Estimated Tokens | Notes |
|-----------|------------------|-------|
| Single skill audit | 200–400 | Grep + analysis |
| All skills audit (20+ skills) | 1000–1500 | Bulk scanning + report generation |
| Git history scan | 300–600 | Depends on repo size |
| Remediation + re-audit | 400–800 | Fix + verify |

---

## Verification Checklist (Before Completing Audit)

- [ ] All files scanned (no exclusions except standard: .git, node_modules, dist)
- [ ] Secret patterns comprehensive (API keys, tokens, passwords, AWS formats)
- [ ] Dangerous file access validated (legitimate accesses documented)
- [ ] Hardcoded paths found and catalogued (all absolute paths logged)
- [ ] Git history checked for old commits with secrets
- [ ] File permissions reviewed (no 777 or overly permissive)
- [ ] Report in TOON format (structured, actionable)
- [ ] Remediation steps clear (if failures found)

---

## FAQ

**Q: Should we run this every time we commit?**
A: No. Run as part of pre-publish checks and quarterly security review. Too expensive to run on every commit.

**Q: What if the audit finds secrets in git history?**
A: Use `git filter-branch` to remove them, rotate the credentials (api-security skill), and force push.

**Q: Can we automate this with GitHub Actions?**
A: Yes. Set up workflow to run audit on PRs, block merge if audit fails.

**Q: What about false positives?**
A: Document them. If skill legitimately accesses ~/.aws, add comment "# Intentional: deployment skill" so audit knows to skip it.

---

## Quality Standards Applied

✅ **Agent-agnostic Level 1:** Purpose through Workflow readable by any agent
✅ **TOON format:** Audit requests and results use TOON
✅ **Security guardrails:** 5 explicit NEVER rules (no exposed secrets in reports, no unauthorized scanning, no auto-deletion, validate dangerous access, scan git history)
✅ **Team-specific subsections:** Claude Code (auditor), OpenClaw (verifier)
✅ **Copy-paste prompts:** 4 ready-to-use audit commands (secrets, paths, file access, permissions)
✅ **Related skills:** References api-security, code-enforcement, git
✅ **Token budget:** Estimates per operation (200–1500 tokens)
✅ **Trigger words:** 5 activation phrases

---

*Last updated: 2026-03-06 by Claude Code*
