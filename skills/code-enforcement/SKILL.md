# Skill: Code Enforcement (Git Hooks)

**Category:** Development
**Status:** Active
**Primary User(s):** Claude Code (setup + maintenance)
**Last Updated:** 2026-03-06

---

## Purpose

Enforce project rules via automated Git hooks. "Rules in markdown are suggestions. Code hooks are laws."

---

## Who Uses This Skill

**Agent-Agnostic (Level 1)**

Automated enforcement prevents:
1. **Secrets in commits** — Hardcoded API keys, tokens, passwords blocked by pre-commit
2. **Hardcoded paths** — /Users/oliver, /home/, C:\Users blocked
3. **Failing tests** — No commits if tests fail
4. **Dangerous files** — Pre-creation checks prevent reimplementation

**Claude Code**
- **When:** Setting up project hooks, troubleshooting hook failures
- **Example:** "Install pre-commit-secrets hook to prevent API keys being committed"
- **Tools available:** exec (install hooks, test), read (hook templates)

---

## When to Activate This Skill

**Trigger words:**
- "Prevent secrets from being committed"
- "Set up Git hooks"
- "Failed to commit (hook failed)"
- "Pre-commit enforcement"

**Use cases:**
- New project setup
- Improving project security
- After credential leak incident

---

## Hook Templates (Ready to Use)

**Location:** `/Users/oliver/OliverRepo/skills/code-enforcement/hooks/`

Available hooks:
1. **pre-commit-secrets** — Block hardcoded API keys, tokens, passwords
2. **pre-commit-paths** — Block hardcoded /Users/name paths
3. **pre-commit-tests** — Block commits when tests fail

### Installation (All Projects)

```bash
# Copy all hooks into project
cp /Users/oliver/OliverRepo/skills/code-enforcement/hooks/* .git/hooks/
chmod +x .git/hooks/pre-commit*

# Verify installation
ls -la .git/hooks/pre-commit*

# Test: Try to commit a secret (should fail)
echo 'API_KEY=secret123' > test.env
git add test.env
git commit -m "test"  # Should be blocked ✅
git reset HEAD test.env && rm test.env
```

### Selective Installation

If you only want ONE hook:

```bash
# Just prevent secrets
cp /Users/oliver/OliverRepo/skills/code-enforcement/hooks/pre-commit-secrets .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## Hook Details

**TOON: Hook Specifications**

```toon
hook_spec{hook_name,purpose,blocks_pattern,severity,override_allowed}:
 pre-commit-secrets,"Prevent credential exposure","api_key, secret, Bearer, AKIA","CRITICAL","--no-verify (not recommended)"
 pre-commit-paths,"Prevent hardcoded machine paths","/Users/*, /home/*, C:\\Users\\","HIGH","--no-verify"
 pre-commit-tests,"Prevent broken code commits","test failure exit code","MEDIUM","--no-verify"
```

**When Hooks Block (and How to Override):**

```bash
# Hook blocked your commit (e.g., test failed)
# Option 1: Fix the issue (recommended)
npm test  # Fix failing tests
git commit -m "..."  # Try again

# Option 2: Override hook (NOT RECOMMENDED, you're on your own)
git commit --no-verify -m "..."  # Bypasses ALL hooks
```

---

## Security & Workflow

**Explicit Guardrails (NEVER rules):**

1. **NEVER `git commit --no-verify` to bypass secrets hook** — Why: Defeating security automation defeats the purpose
2. **NEVER share git hooks outside .git/hooks/** — Why: Can be overwritten maliciously
3. **NEVER make hooks writable by other users** — chmod 755 only for executable, never 777
4. **NEVER ignore hook failures** — Why: They're catching real issues (secrets, failing tests)
5. **NEVER forget to reinstall hooks after git clone** — Why: Cloning doesn't copy hooks

---

## Related Skills

- **git/** — Pre-commit checklist + hook enforcement (complements this skill)
- **api-security/** — Credential patterns used by secrets hook
- **skill-security-audit/** — Audits that hooks are installed correctly

---

## Workflow: First Time Setup

**For new project:**

```bash
# 1. Create project structure
git init
# ... create files ...
git add .
git commit -m "Initial commit"

# 2. Install hooks (IMMEDIATELY)
cp /Users/oliver/OliverRepo/skills/code-enforcement/hooks/* .git/hooks/
chmod +x .git/hooks/pre-commit*

# 3. Test hooks
echo 'SECRET=abc123' > .env && git add .env && git commit -m "test" || true
rm .env && git reset HEAD .env

# 4. Add .gitignore to prevent future accidents
echo ".env
.env.local
*.key
credentials.json" >> .gitignore
git add .gitignore
git commit -m "chore: add gitignore"

# 5. You're protected now!
```

---

## Troubleshooting

**"Permission denied" when committing:**
```bash
# Hooks not executable
chmod +x .git/hooks/pre-commit*
```

**"Hook not found" error:**
```bash
# Hooks copied but in wrong location
ls -la .git/hooks/  # Verify they're here
cp /Users/oliver/OliverRepo/skills/code-enforcement/hooks/* .git/hooks/
chmod +x .git/hooks/pre-commit*
```

**"Hook failed but I'm sure it's safe":**
```bash
# Override (use sparingly)
git commit --no-verify -m "..."
# But know what you're bypassing!
```

---

## Token Budget

| Operation | Tokens |
|-----------|--------|
| Install hooks | 50–100 |
| Troubleshoot hook failure | 100–200 |
| Override hook (investigate) | 100–300 |

---

*Last updated: 2026-03-06 by Claude Code*
