# Chunk 7: Server Optimization & New Endpoints

> **For agentic workers:** Backend refactoring follows TDD: write failing tests → implement endpoints → verify → commit.

**Goal:** Implement TOON format optimization (60-70% token reduction) + add new endpoints (configs, plugins, audit).

**Files to modify:**
- Modify: `system/dashboard/server.js` (add TOON to all endpoints, add new endpoints)
- Modify: `system/dashboard/__tests__/server.test.js` (add tests for new endpoints)

**Token targets:**
- /api/team: 500B → 200B (60%)
- /api/skills: 8KB → 3.2KB (60%)
- /api/aliases: 2KB → 800B (60%)
- /api/docs: 15KB → 3KB (80%)
- **Total:** 45.5KB → 9.2KB (80% reduction)

---

## Task 18: Update GET /api/team with TOON Format

### Current response (verbose):
```json
{ "lead": { "id": "kiana", "name": "Kiana", "type": "human", "emoji": "👑" } }
```

### TOON response (optimized):
```json
{ "lead": { "id": "kiana", "nm": "Kiana", "t": "human", "e": "👑" } }
```

**Implementation in server.js:**
```javascript
app.get('/api/team', (req, res) => {
  const team = loadTeamStructure() // Load from team/ directory
  const toonTeam = toToonFormat(team)
  res.json(toonTeam)
})

function toToonFormat(obj) {
  if (Array.isArray(obj)) return obj.map(toToonFormat)
  if (typeof obj !== 'object') return obj

  const toon = {}
  for (const [key, value] of Object.entries(obj)) {
    const shortKey = KEY_MAP[key] || key
    toon[shortKey] = typeof value === 'object' ? toToonFormat(value) : value
  }
  return toon
}

const KEY_MAP = {
  'name': 'nm', 'description': 'ds', 'content': 'c', 'path': 'p',
  'type': 't', 'emoji': 'e', 'isDir': 'd', 'children': 'ch',
  'enabled': 'en', 'version': 'v'
}
```

### Test template:
```javascript
it('should return team in TOON format', async () => {
  const response = await request(app).get('/api/team')
  expect(response.body.lead).toHaveProperty('nm') // not 'name'
  expect(response.body.lead).toHaveProperty('t') // not 'type'
})
```

---

## Task 19: Update Existing Endpoints to TOON Format

Apply TOON format to:
1. **GET /api/skills** — return TOON format
2. **GET /api/aliases** — return TOON format + use cached skill metadata
3. **GET /api/docs** — return TOON format + flatten structure (80% reduction)
4. **GET /api/memory** — return metadata-only, parse token counts from file

**For each endpoint:**
- Measure current response size: `curl http://localhost:3001/api/X | wc -c`
- Apply TOON format transformation
- Add test asserting TOON keys present
- Measure new response size
- Verify 60-70% reduction
- Commit with size comparison in message

**Example commit:**
```bash
git commit -m "feat: apply TOON format to /api/skills (8KB → 3.2KB, 60% reduction)"
```

---

## Task 20: Add New Endpoints

### GET /api/claude-config

```javascript
app.get('/api/claude-config', (req, res) => {
  const instructions = fs.readFileSync('agents/claude/INSTRUCTIONS.md', 'utf8')
  const memory = fs.readFileSync('system/memory/YYYY-MM-DD.md', 'utf8')

  res.json({
    instructions,
    memory,
    model: 'claude-haiku-4-5-20251001',
    tokenBudget: 'Haiku default',
    skills: ['git', 'debugging', ...],
    aliases: ['/commit', '/debug', ...]
  })
})
```

### GET /api/plugins

```javascript
app.get('/api/plugins', (req, res) => {
  const pluginsDir = path.join(os.homedir(), '.claude/plugins')
  const plugins = fs.readdirSync(pluginsDir).map(name => ({
    name,
    version: getVersion(name),
    enabled: isEnabled(name),
    path: path.join(pluginsDir, name),
    description: getDescription(name)
  }))
  res.json(toToonFormat(plugins))
})
```

### POST /api/plugins/:name

```javascript
app.post('/api/plugins/:name', (req, res) => {
  const { action, source } = req.body

  if (!['enable', 'disable', 'install'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' })
  }

  const result = executePluginAction(action, req.params.name, source)
  logAuditChange('plugin-toggle', result)

  res.json({ success: true, change: result })
})
```

### GET /api/audit-log

```javascript
app.get('/api/audit-log', (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const days = parseInt(req.query.days) || 30

  const auditLog = loadAuditLog(limit, days)
  res.json(toToonFormat(auditLog))
})
```

### POST /api/config

```javascript
app.post('/api/config', (req, res) => {
  const { section, changes } = req.body

  validateConfigChanges(section, changes)
  applyConfigChanges(section, changes)
  logAuditChange('config-change', { section, changes })

  res.json({ success: true, message: 'Configuration saved' })
})
```

---

## Task 21: Add Pagination to GET /api/file

```javascript
app.get('/api/file', (req, res) => {
  const { path: filePath, maxLines = 100, startLine = 0 } = req.query

  validatePath(filePath)
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const paginated = lines.slice(startLine, startLine + maxLines).join('\n')

  res.json({
    path: filePath,
    content: paginated,
    totalLines: lines.length,
    startLine,
    endLine: Math.min(startLine + maxLines, lines.length)
  })
})
```

---

## Task 22: Write Server Tests

Create `__tests__/server.test.js` covering all endpoints:

```javascript
describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return OK', async () => {
      const response = await request(app).get('/api/health')
      expect(response.status).toBe(200)
      expect(response.body.status).toBe('OK')
    })
  })

  describe('GET /api/team', () => {
    it('should return team in TOON format', async () => {
      const response = await request(app).get('/api/team')
      expect(response.body).toHaveProperty('lead')
      expect(response.body.lead).toHaveProperty('nm') // TOON key
    })
  })

  // ... tests for all endpoints
})

describe('Security', () => {
  it('should prevent path traversal on /api/file', async () => {
    const response = await request(app).get('/api/file?path=../../../../etc/passwd')
    expect(response.status).toBe(403)
  })

  it('should validate plugin names', async () => {
    const response = await request(app).post('/api/plugins/invalid-plugin').send({
      action: 'enable'
    })
    expect(response.status).toBe(400)
  })
})
```

### Run all tests:
```bash
npm test -- __tests__/server.test.js --coverage
```

Expected: 95%+ coverage of server.js

---

**Status:** Server optimized, new endpoints added, token reduction verified.
**Next:** Execute Chunk 8 (ControlPanel & Analytics)
