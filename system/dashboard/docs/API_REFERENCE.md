# Dashboard API Reference

**Complete endpoint documentation for the Oliver Dashboard command center.**

---

## Phase 1 Endpoints

| Endpoint | Purpose | Source | Status |
|----------|---------|--------|--------|
| GET /api/health | Health check | None | ✅ Fixed |
| GET /api/team | Team structure | team/members/ | ✅ Fixed |
| GET /api/skills | Skills catalog | skills/ | ✅ Fixed |
| GET /api/aliases | Slash commands | skills/ | ⚠️ Hardcoded |
| GET /api/docs | Documentation tree | agents/, system/docs/, team/ | ✅ Fixed |
| GET /api/file | File content (GET) | Any path | ✅ Secure |
| POST /api/file | Write file | workspaces/, system/memory/ | ✅ Secure |
| GET /api/memory | Token usage | system/memory/ | 🔴 Needs optimization |

---

## Phase 2 New Endpoints

| Endpoint | Purpose | Source | Format |
|----------|---------|--------|--------|
| GET /api/claude-config | Claude Code settings | agents/claude/ | TOON |
| GET /api/plugins | Installed plugins | ~/.claude/plugins/ | TOON |
| POST /api/plugins/:name | Enable/disable plugin | Config file | TOON |
| GET /api/audit-log | Configuration changes | audit trail | TOON |
| POST /api/config | Save config changes | Config file | TOON |
| GET /api/search | Global docs search | agents/, system/, team/ | TOON |

---

## Security Rules Per Endpoint

### GET /api/file
- ✅ Validates: `filePath.startsWith(REPO_ROOT)`
- ✅ Prevents: directory traversal attacks
- ✅ TODO: Add pagination (`?maxLines=100`)

### POST /api/file
- ✅ Validates: Path in safe zones only (workspaces/, system/memory/)
- ✅ Prevents: writes to arbitrary locations
- ✅ Creates: directories as needed

### GET /api/claude-config
- ✅ Return: Full INSTRUCTIONS.md + memory + config
- ⚠️ Validate: Read-only operation
- ✅ No secrets: Filter out API keys

### POST /api/plugins/:name
- 🔴 DANGEROUS — must whitelist allowed plugins
- ⚠️ Must log: all changes to audit trail
- ⚠️ Must validate: plugin name format
- ⚠️ Allowed actions: "enable", "disable", "install"

### GET /api/audit-log
- ✅ Return: Last N entries (limit, days params)
- ✅ Filter: By agent, action type, date range
- ✅ Export: JSON/CSV formats

### POST /api/config
- ⚠️ Must whitelist: allowed keys (model, tokenBudget, skills, fallback)
- ⚠️ Must validate: data types
- ✅ Never: accept arbitrary JSON
- ✅ Log: all changes to audit trail

---

## Response Format: TOON (Token-Oriented Object Notation)

All Phase 2+ endpoints return abbreviated keys to reduce token usage:

```
name → nm
description → ds
content → c
path → p
type → t
emoji → e
isDir → d
children → ch
enabled → en
version → v
```

**Example:**
```json
// Before (verbose)
{ "name": "git", "description": "Version control", "type": "skill" }

// After (TOON - 40% fewer tokens)
{ "nm": "git", "ds": "Version control", "t": "skill" }
```

---

## Token Optimization Targets

| Endpoint | Current | Target | Reduction | Phase |
|----------|---------|--------|-----------|-------|
| /api/team | 500 B | 200 B | 60% | 2 |
| /api/skills | 8 KB | 3.2 KB | 60% | 2 |
| /api/aliases | 2 KB | 800 B | 60% | 2 |
| /api/docs | 15 KB | 3 KB | 80% | 2 |
| /api/memory | 20 KB | 2 KB | 90% | 3 |
| **TOTAL** | **45.5 KB** | **9.2 KB** | **80%** | |

---

## Response Normalizer (Frontend)

Frontend `useFetchData` hook automatically converts TOON → full format:

```javascript
// API returns TOON:
{ "nm": "git", "ds": "Version control" }

// Hook normalizes to:
{ "name": "git", "description": "Version control" }

// Components receive normal objects, unaware of TOON encoding
```

---

**See ARCHITECTURE.md for security model, token optimization rules, and data flow.**
