# Post-Completion: Simplify & Harden

After writing code on any project, review it using this checklist before marking done.

**Applies to:** Non-trivial code changes (10+ lines, or any auth/validation/data logic)
**Skip for:** Docs-only, config-only, or planning work
**Scope:** Only files you modified in this task. Don't touch adjacent code.
**Budget:** Additional cleanup changes must not exceed 20% of original diff.

---

## Pass 1: Simplify

**Default action:** Cleanup only. Remove dead code, unused imports, unclear names, unnecessary nesting.
**Apply directly** — these are cosmetic changes.

**Do NOT default to refactoring.** Only propose a refactor when:
- The current state is genuinely wrong
- The improvement is substantial

If you propose a refactor: describe it, explain why current state is problematic, then wait for Kiana's explicit approval. One at a time, never batched.

### Checklist
- [ ] Remove dead code (unreachable branches, unused variables)
- [ ] Remove unused imports
- [ ] Clarify variable/function names (be explicit, not clever)
- [ ] Remove unnecessary nesting (flatten where possible)
- [ ] Simplify logic (ternary → if/else if clearer)

---

## Pass 2: Harden (Security)

Check for:
- Unvalidated inputs
- Injection vectors (SQL, command, code)
- Missing auth checks
- Hardcoded secrets or keys
- Error messages leaking internals
- Missing rate limiting
- Unsafe deserialization

**Apply simple patches directly.**

For any structural security change: describe severity + attack vector, wait for Kiana's approval.

### Checklist
- [ ] All external inputs are validated
- [ ] No shell execution of user input
- [ ] No SQL injection vectors
- [ ] Secrets are in env vars, not hardcoded
- [ ] Error messages don't leak internals
- [ ] Auth checks are in place where needed
- [ ] Rate limits or abuse protections exist

---

## Pass 3: Document

Add up to 5 single-line comments on non-obvious decisions.
Focus on **why**, not **what**.

Especially important for:
- Workarounds (why is this necessary?)
- Performance choices (why this approach?)
- Anything that looks wrong but is intentional

### Checklist
- [ ] Non-obvious logic has comments
- [ ] Complex sections have a "why" explanation
- [ ] Workarounds are documented
- [ ] Performance-sensitive code explains the choice

---

## Output

Summarize what you did:
```
Simplify:
- Removed X dead code blocks
- Clarified Y variable names
- Flattened Z nested conditions

Harden:
- Added input validation for Z parameter
- Flagged: [Any security concerns that need approval]

Document:
- Added comments on performance choice in X function
- Documented workaround in Y

Left alone and why:
- [If anything looks wrong but isn't, explain why]
```

---

## Common Cleanup Patterns

### Dead Code
```python
# BEFORE
def process(data):
    if validate(data):
        result = do_work(data)
        return result
    # This is unreachable
    return None

# AFTER
def process(data):
    if not validate(data):
        return None
    return do_work(data)
```

### Unused Imports
```python
# BEFORE
import os
import json
from datetime import datetime, timedelta  # timedelta not used

# AFTER
import json
from datetime import datetime
```

### Unclear Names
```python
# BEFORE
def x(y):
    z = y.split(',')
    return [v.strip() for v in z]

# AFTER
def parse_csv_values(csv_string):
    raw_values = csv_string.split(',')
    return [value.strip() for value in raw_values]
```

### Unnecessary Nesting
```javascript
// BEFORE
if (user) {
    if (user.active) {
        if (user.verified) {
            doThing();
        }
    }
}

// AFTER
if (!user || !user.active || !user.verified) return;
doThing();
```

---

## When to Reject Cleanup

✋ Don't clean up if:
- You didn't write it (someone else's code)
- It's working and you don't fully understand it
- Changes would exceed 20% of original diff
- You're just being pedantic (code doesn't need to be perfect)

---

*Last updated: 2026-03-06*
