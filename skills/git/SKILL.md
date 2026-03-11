# Skill: Git

**Category:** Development
**Status:** Active
**Last Updated:** 2026-03-06

---

## Purpose

Version control for code projects. Commit conventions, branching strategy, and recovery commands.

---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes (primary user)
- **When:**
  - Committing code changes
  - Branching for features
  - Merging and resolving conflicts
  - Recovery (undo, revert, bisect)
- **Tools available:** exec (git commands)
- **Example:** "After feature complete, commit with `git commit -m 'feat: location filtering'`"

### OpenClaw
- **Can use:** Yes (read-only + coordination)
- **When:**
  - Understanding codebase structure/history
  - Checking what's been deployed
  - Coordinating with Claude Code on releases
  - Reading commit messages for context
- **Tools available:** exec (read-only: git log, git status, git diff)
- **Cannot:** Push, commit, or merge (needs Claude Code)
- **Example:** "Before calling Claude Code to fix a bug, check git log to understand what changed recently"

### Collaboration Pattern
- **OpenClaw checks git state** → reports to Claude Code/Kiana ("Last change was 3 hours ago, file X modified")
- **Claude Code does all writes** (commits, merges, pushes)
- **Both coordinate on deployments** (check tests pass, then Claude Code merges)

---

## When to Activate This Skill

**Trigger words/phrases (Claude Code):**
- "Commit this"
- "Create a branch"
- "Merge X into Y"
- "Something broke — find when"

**Trigger words/phrases (OpenClaw):**
- "What's been deployed?"
- "Who changed X?"
- "When did Y break?"
- "Is the repo clean?"

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** Initial setup
**Risk Level:** Low (with enforcement)
**Key Findings:**
- No credential exposure (pre-push check enforced)
- All commits audited for secrets before push
- Force push forbidden without human approval (prevents accidental leaks)
- .env files must be in .gitignore and never committed

**Security-First Rules:**
- NEVER commit .env, .secrets, credentials.json, or API keys
- ALWAYS run pre-push check before pushing (grep for secrets)
- ALWAYS verify .env in .gitignore before first commit
- NEVER use --force push without Kiana approval (prevents recovery disasters)

---

## How Both Agents Use This Skill

### Commit Conventions (Claude Code Only)

```
type: short description (50 chars max)

Types: feat | fix | docs | style | refactor | test | chore
```

**Examples:**
- `feat: add location filtering to event search`
- `fix: correct canonical_events path in server.js`
- `docs: update SKILL.md for Phase 3 completion`
- `chore: archive stale phase docs`
- `test: add tests for distance calculation`

**Rules:**
- Commit after **every meaningful unit of work** (not just end of session)
- Never commit: `node_modules/`, `.env`, `.secrets`, credentials
- Always commit before starting a refactor

---

## Branch Strategy (Claude Code)

```
main          — stable, always works
dev           — active development
feature/name  — new features (branch from dev)
fix/name      — bug fixes (branch from main)
```

**For Fallow solo work:** `main` + `dev` is enough. Keep it simple.

**For multi-agent work:** Use feature branches, coordinate with Kiana on merges.

---

## Pre-Push Checklist (Claude Code) 🔒 SECURITY CRITICAL

**Before running `git push`, verify:**

```
Pre-Push Security Checklist:
☑ [ ] No hardcoded API keys or secrets in commits
☑ [ ] Run: git diff main..HEAD | grep -i 'api_key\|secret\|password\|token' — should return NOTHING
☑ [ ] .env file is in .gitignore (not committed)
☑ [ ] Run: git log --name-only -1 | grep '.env' — should return nothing
☑ [ ] No credentials in commit messages (check: git log --oneline -5)
☑ [ ] All tests pass locally (npm test or test suite)
☑ [ ] No console.log or debug statements left (grep -r 'console.log' src/)
☑ [ ] Commit messages are clear (read last 3 with git log --oneline -3)
☑ [ ] Ready for code review? (Is code clean enough for peers?)

NEVER use `git push --force` without explicit approval from Kiana.
If forced push is needed, message Kiana first: "I need to force push [branch] because [reason]"
```

**Command to validate before push:**

```bash
# Check for common secrets patterns
git diff main..HEAD | grep -E 'api[_-]?key|secret|password|aws_|stripe_|bearer' && echo "❌ FOUND SECRETS" || echo "✅ No secrets detected"

# Verify .env not committed
git log --name-only --diff-filter=A | grep '\.env' && echo "⚠️ .env may be committed" || echo "✅ .env not in history"

# Run tests
npm test
```

---

## Feature Branch Workflow Decision Tree (Claude Code)

```
START: Need to make a change?

├─ Bug fix (small, < 2 hours)
│  ├─ Branch from: main
│  ├─ Branch name: fix/brief-description (e.g., fix/canonical-events-path)
│  ├─ Commit: fix: [description]
│  ├─ PR: Optional (if code review helpful) or direct merge (if low-risk)
│  └─ Merge to: main → deploy immediately
│
├─ Feature (new functionality, > 2 hours or uncertain scope)
│  ├─ Branch from: dev
│  ├─ Branch name: feature/detailed-description (e.g., feature/location-filtering)
│  ├─ Commit: feat: [description]
│  ├─ PR: Required (code review gate)
│  ├─ Review checklist:
│  │  ├─ Tests added/updated
│  │  ├─ No breaking changes
│  │  ├─ Documentation updated
│  │  └─ Security audit (api-security skill)
│  └─ Merge to: dev → qa/staging → main → deploy
│
├─ Refactor (code cleanup, same behavior)
│  ├─ Branch from: dev
│  ├─ Branch name: refactor/what-changed (e.g., refactor/distance-calculation-clarity)
│  ├─ Commit: refactor: [description]
│  ├─ PR: Required (verify behavior unchanged)
│  ├─ Tests: Ensure all pass (same tests, better code)
│  └─ Merge to: dev → main
│
└─ Docs/Chore (documentation, config, housekeeping)
   ├─ Branch from: main
   ├─ Branch name: docs/or-chore/description
   ├─ Commit: docs: or chore: [description]
   ├─ PR: Optional (low-risk)
   └─ Merge to: main → deploy immediately
```

---

## Standard Workflow (Claude Code)

### Start of Session

```bash
# Check status
git status

# Sync with remote
git pull

# Create feature branch if needed (use decision tree above to choose branch)
git checkout -b feature/new-feature  # for new features
# OR
git checkout -b fix/bug-name         # for bug fixes
```

### During Work

```bash
# Stage by patch (review before committing)
git add -p

# Commit often, not at end
git commit -m "type: description"

# Keep commits atomic — one logical change per commit
```

### End of Session: Pre-Push Verification

```bash
# Run pre-push checklist (above)
git diff main..HEAD | grep -E 'api_key|secret|password' && echo "❌ ABORT" || echo "✅ Safe to push"

# Verify tests pass
npm test

# Check commit messages are clear
git log --oneline -3  # Review your last 3 commits

# Final status
git status
```

### Push to Remote

```bash
# First time on branch
git push -u origin feature/new-feature

# Subsequent pushes
git push
```

**FORBIDDEN:**
```bash
# ❌ NEVER DO THIS (unless Kiana approves)
git push --force
git push --force-with-lease
git reset --hard origin/main  # discarding local changes

# If you need to force push, message Kiana first
```

---

## Pull Request Preparation (Claude Code)

When PR review is required (features, refactors, major changes):

### PR Template Checklist

```markdown
## What Changed?
[Brief description of feature/fix]

## Why?
[Context: what problem does this solve?]

## How Tested?
- [ ] Unit tests added/updated
- [ ] Integration tests passed
- [ ] Manual testing on staging (if applicable)
- [ ] No breaking changes

## Security Check
- [ ] No hardcoded secrets
- [ ] No credentials in commit history
- [ ] API security review (if new APIs added)

## Merge Strategy
- [ ] Rebasing / squashing (prefer for feature branches)
- [ ] No merge commits (unless coordinating with other PRs)

## Related Tasks
- Links to planning docs or issue tracking
```

### PR Process

1. **Create PR on GitHub** (or git hosting platform)
2. **Add description** using template above
3. **Link to related work** (planning docs, SKILL.md updates)
4. **Request review** from: Claude Code (if OpenClaw involved) or Kiana (if major change)
5. **Address feedback** — commit fixes, don't force push
6. **Get approval** — reviewer approves before merge
7. **Merge** — use "Squash and merge" for features (cleaner history)
8. **Delete branch** — remove feature branch after merge (`git push origin -d feature/name`)

---

## Commit Log Summary (TOON Format)

Document all commits for a session or feature:

```toon
commit_summary{branch,commits_count,feature_area,test_coverage,security_check,ready_to_merge}:
 feature/location-filtering,"5 commits","Core feature (distance calc, API endpoint, tests)","✅ 85% coverage","✅ No secrets found","YES"
 fix/canonical-events-path,"1 commit","Bug fix (data loading)","✅ All tests pass","✅ No risk","YES"
```

**Usage:**
```bash
# Generate commit log
git log --oneline main..HEAD > /tmp/commits.txt

# Example output:
feat: add location filtering to event search
test: add tests for distance calculation
fix: handle edge cases for pole coordinates
refactor: clean up distance calculation logic
docs: update SKILL.md with location feature

# Convert to TOON (summary)
commit_summary{...}:
 feature/location-filtering,"4 commits","Location filtering feature","✅ 82% coverage","✅ Pre-push check passed","YES"
```

---

## Code Enforcement via Git Hooks

**Philosophy:** "Rules in markdown are suggestions. Code hooks are laws."

**Available Hooks (From code-enforcement skill):**

Location: `/Users/oliver/OliverRepo/skills/code-enforcement/hooks/`

1. **pre-commit-secrets** — Block hardcoded API keys, tokens, passwords
2. **pre-commit-paths** — Block hardcoded /Users/name paths
3. **pre-commit-tests** — Block commits when tests fail

**Install All Hooks:**

```bash
cp /Users/oliver/OliverRepo/skills/code-enforcement/hooks/* .git/hooks/
chmod +x .git/hooks/pre-commit*
```

**Install Specific Hook:**

```bash
# Just secrets prevention
cp /Users/oliver/OliverRepo/skills/code-enforcement/hooks/pre-commit-secrets .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**When Hooks Block (How to Override):**

```bash
# Hook blocked your commit (e.g., test failed)
# Option 1: Fix the issue (RECOMMENDED)
npm test  # Fix failing tests
git commit -m "..."  # Try again

# Option 2: Override hook (NOT RECOMMENDED)
git commit --no-verify -m "..."  # Bypasses ALL hooks at own risk
```

**Integration with planning/SKILL.md:**
- Hooks are ENFORCEMENT (automatic, not manual)
- Pre-commit checklist (git/SKILL.md) is VERIFICATION (manual, before committing)
- Both work together: checklist → commit attempt → hooks verify → success or block

---

## Status Check (Both Agents)

```bash
# What's the current state?
git status

# What changed in the last commit?
git diff HEAD~1

# Recent commits
git log --oneline -10

# Branches
git branch -a
```

---

## Recovery Commands (Claude Code)

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard unstaged changes to a file
git checkout -- filename

# See exactly what changed
git diff                   # unstaged changes
git diff --cached          # staged changes
git log --oneline -10      # recent commits

# Find when something broke (binary search)
git bisect start
git bisect bad             # current commit is broken
git bisect good <hash>     # last known good commit
# Git will narrow down the broken commit automatically
```

---

## What NOT to Commit (Security-Critical)

**NEVER commit these files:**

```
# Environment variables (CRITICAL)
.env
.env.local
.env.production
.env.*.local

# Credentials (CRITICAL)
credentials.json
*.key
*.pem
*.p12

# IDE/OS (non-critical)
node_modules/
*.log
.DS_Store

# Build artifacts
dist/
build/
.next/
.venv/

# Local learnings (non-critical)
.learnings/
.local/
```

**CRITICAL: Add to .gitignore at project start:**

```bash
# In repo root, create/update .gitignore
echo ".env
.env.local
credentials.json
*.key" >> .gitignore

# Verify .env is not already committed
git log --all --full-history -- ".env" && echo "⚠️ WARNING: .env may be in history" || echo "✅ .env not in git history"

# If .env is in history, you MUST rotate all secrets (use api-security skill)
```

**If you accidentally commit a secret:**
1. **Immediately** rotate the credential (api-security skill)
2. **Remove from git** using: `git filter-branch --tree-filter 'rm -f .env' -- --all` (Claude Code)
3. **Force push** (with Kiana approval) to remove from history
4. **Log incident** in system/memory/ for audit trail

---

## Workspace Backup (OpenClaw Coordination)

The workspace (system/memory/, etc.) is a git repo. Commit after major cleanup/changes:

```bash
cd /Users/oliver/OliverRepo
git add -A
git commit -m "chore: workspace cleanup 2026-03-06"
git push
```

---

## Merge / Pull Requests

**Only when multi-agent coordination needed:**

1. Claude Code creates feature branch
2. OpenClaw reviews (if applicable)
3. Kiana approves
4. Claude Code merges to dev/main

**Command (Claude Code):**
```bash
# Merge feature into dev
git checkout dev
git pull
git merge feature/new-feature
git push

# Clean up
git branch -d feature/new-feature
git push origin -d feature/new-feature
```

---

## Token Budget

~200–500 tokens (quick git operations and status checks)

---

## Related Skills

- **planning/** — plan before you commit
- **debugging/** — use git bisect to find where bugs started

---

*Last updated: 2026-03-06*
