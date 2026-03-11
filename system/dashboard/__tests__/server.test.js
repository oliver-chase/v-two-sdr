import request from 'supertest'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, '../../..')

// Import server setup (we'll need to modularize server.js)
// For now, we'll replicate the key functions
const KEY_MAP = {
  'name': 'nm', 'description': 'ds', 'content': 'c', 'path': 'p',
  'type': 't', 'emoji': 'e', 'isDir': 'd', 'children': 'ch',
  'enabled': 'en', 'version': 'v', 'title': 'tl', 'command': 'cmd',
  'action': 'a', 'success': 's', 'error': 'er', 'timestamp': 'ts',
  'agent': 'ag', 'date': 'dt', 'tokens': 'tok',
  'lead': 'ld', 'agents': 'ags', 'personas': 'ps', 'skills': 'sks',
  'aliases': 'als', 'plugins': 'plgs', 'instructions': 'instr',
  'tokenBudget': 'tb', 'model': 'mdl'
}

function toToonFormat(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toToonFormat)
  }
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  const toon = {}
  for (const [key, value] of Object.entries(obj)) {
    const shortKey = KEY_MAP[key] || key
    toon[shortKey] = typeof value === 'object' ? toToonFormat(value) : value
  }
  return toon
}

function readFileContent(filePath) {
  try {
    if (!filePath.startsWith(REPO_ROOT)) return null
    if (!fs.existsSync(filePath)) return null
    const stats = fs.statSync(filePath)
    if (!stats.isFile()) return null
    return fs.readFileSync(filePath, 'utf-8')
  } catch (err) {
    return null
  }
}

function readDirStructure(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    return entries
      .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
      .map(e => {
        const fullPath = path.join(dir, e.name)
        return {
          name: e.name,
          path: fullPath,
          isDir: e.isDirectory(),
          children: e.isDirectory() ? readDirStructure(fullPath, maxDepth, currentDepth + 1) : []
        }
      })
  } catch (err) {
    return []
  }
}

// Create test app with all endpoints
const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', repoRoot: REPO_ROOT })
})

// Team endpoint
app.get('/team', (req, res) => {
  try {
    const teamDir = path.join(REPO_ROOT, 'team/members')
    const personas = !fs.existsSync(teamDir) ? [] :
      fs.readdirSync(teamDir)
        .filter(f => {
          const fullPath = path.join(teamDir, f)
          try { return fs.statSync(fullPath).isDirectory() } catch { return false }
        })
        .map(persona => {
          const soulPath = path.join(teamDir, persona, 'persona_soul.md')
          const content = readFileContent(soulPath)
          const nameMatch = content ? content.match(/^# Persona Soul: (.+)$/m) : null
          const title = nameMatch ? nameMatch[1] : persona
          return { name: persona, title, path: soulPath, type: 'persona', emoji: '🎭' }
        })

    const teamData = {
      lead: { name: 'Kiana', type: 'human', emoji: '👑' },
      agents: [
        { name: 'Claude Code', type: 'agent', emoji: '💻' },
        { name: 'OpenClaw', type: 'agent', emoji: '🦅' }
      ],
      personas
    }
    res.json(toToonFormat(teamData))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Skills endpoint
app.get('/skills', (req, res) => {
  try {
    const skillsDir = path.join(REPO_ROOT, 'skills')
    const skills = !fs.existsSync(skillsDir) ? [] :
      fs.readdirSync(skillsDir)
        .filter(f => {
          const fullPath = path.join(skillsDir, f)
          try { return fs.statSync(fullPath).isDirectory() } catch { return false }
        })
        .map(skill => {
          const skillMdPath = path.join(skillsDir, skill, 'SKILL.md')
          const content = readFileContent(skillMdPath)
          const match = content ? content.match(/^# (.+)$/m) : null
          const rawDescription = match ? match[1] : skill
          const description = rawDescription.replace(/^Skill:\s*/i, '')
          return { name: skill, description, path: skillMdPath }
        })
        .sort((a, b) => a.name.localeCompare(b.name))

    res.json(toToonFormat(skills))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Aliases endpoint
app.get('/aliases', (req, res) => {
  try {
    const skillsDir = path.join(REPO_ROOT, 'skills')
    if (!fs.existsSync(skillsDir)) {
      return res.json([])
    }

    const aliases = []
    const skillCommands = {
      'git': '/commit',
      'self-improvement': '/simplify',
      'token-optimizer': '/tokens',
      'debugging': '/debug',
      'code-enforcement': '/review'
    }

    const baseCommands = [
      { command: '/help', description: 'Get help with Claude Code features and commands' },
      { command: '/fast', description: 'Toggle fast mode for quicker output' },
      { command: '/loop', description: 'Run a prompt on recurring interval (default 10m)' }
    ]

    Object.entries(skillCommands).forEach(([skill, cmd]) => {
      const skillPath = path.join(skillsDir, skill, 'SKILL.md')
      const content = readFileContent(skillPath)
      if (content) {
        const match = content.match(/^# (.+)$/m)
        const description = match ? match[1] : skill
        aliases.push({
          command: cmd,
          description: `Access ${description.toLowerCase()}`
        })
      }
    })

    aliases.push(...baseCommands)
    aliases.sort((a, b) => a.command.localeCompare(b.command))

    res.json(toToonFormat(aliases))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Docs endpoint
app.get('/docs', (req, res) => {
  try {
    const dirs = [
      path.join(REPO_ROOT, 'agents'),
      path.join(REPO_ROOT, 'system/docs'),
      path.join(REPO_ROOT, 'team')
    ]

    const allStructure = {
      name: 'Documentation',
      path: REPO_ROOT,
      children: dirs.flatMap(dir => {
        try {
          return fs.existsSync(dir) ? readDirStructure(dir, 2) : []
        } catch { return [] }
      })
    }

    res.json(toToonFormat(allStructure))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// File endpoint with pagination
app.get('/file', (req, res) => {
  try {
    const queryPath = req.query.path
    const maxLines = parseInt(req.query.maxLines) || 100
    const startLine = parseInt(req.query.startLine) || 0

    if (!queryPath) {
      return res.status(400).json({ error: 'Missing path parameter' })
    }

    const filePath = path.join(REPO_ROOT, queryPath)

    if (!filePath.startsWith(REPO_ROOT)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const content = readFileContent(filePath)
    if (content === null) {
      return res.status(404).json({ error: 'File not found or not accessible' })
    }

    const lines = content.split('\n')
    const totalLines = lines.length
    const paginatedLines = lines.slice(startLine, startLine + maxLines)
    const paginatedContent = paginatedLines.join('\n')

    res.json({
      content: paginatedContent,
      path: filePath,
      totalLines,
      startLine,
      endLine: Math.min(startLine + maxLines, totalLines),
      maxLines
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Memory endpoint
app.get('/memory', (req, res) => {
  try {
    const memoryDir = path.join(REPO_ROOT, 'system/memory')
    if (!fs.existsSync(memoryDir)) {
      return res.json([])
    }

    const files = fs.readdirSync(memoryDir).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))

    const data = files.map(file => {
      const filePath = path.join(memoryDir, file)
      const stats = fs.statSync(filePath)
      return {
        date: file.replace('.md', ''),
        size: stats.size,
        tokens: 0
      }
    }).sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json(toToonFormat(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Claude config endpoint
app.get('/claude-config', (req, res) => {
  try {
    const claudeInstructionsPath = path.join(REPO_ROOT, 'agents/claude/INSTRUCTIONS.md')
    const claudeConfig = {
      model: 'claude-haiku-4-5-20251001',
      tokenBudget: 'Haiku default',
      instructions: fs.existsSync(claudeInstructionsPath) ? readFileContent(claudeInstructionsPath) : '',
      skills: [],
      aliases: ['/commit', '/debug', '/review', '/tokens', '/simplify']
    }
    res.json(toToonFormat(claudeConfig))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Plugins endpoint
app.get('/plugins', (req, res) => {
  try {
    const pluginsDir = path.join(process.env.HOME || '/root', '.claude/plugins/cache/claude-plugins-official')
    if (!fs.existsSync(pluginsDir)) {
      return res.json([])
    }

    const plugins = fs.readdirSync(pluginsDir)
      .filter(name => {
        const fullPath = path.join(pluginsDir, name)
        try {
          return fs.statSync(fullPath).isDirectory()
        } catch {
          return false
        }
      })
      .map(name => ({
        name,
        version: '1.0.0',
        enabled: true,
        path: path.join(pluginsDir, name),
        description: 'Claude plugin'
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    res.json(toToonFormat(plugins))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Plugin management endpoint
app.post('/plugins/:name', (req, res) => {
  try {
    const { action } = req.body
    const pluginName = req.params.name

    if (!['enable', 'disable', 'install', 'uninstall'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be: enable, disable, install, or uninstall' })
    }

    res.json(toToonFormat({
      success: true,
      plugin: pluginName,
      action,
      result: { from: action === 'enable' || action === 'install' ? false : true, to: action === 'enable' || action === 'install' }
    }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Audit log endpoint
app.get('/audit-log', (req, res) => {
  try {
    const auditLog = [
      { timestamp: new Date().toISOString(), agent: 'claude-code', action: 'dashboard-init', success: true },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), agent: 'claude-code', action: 'config-update', success: true }
    ]

    res.json(toToonFormat(auditLog))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Config endpoint
app.post('/config', (req, res) => {
  try {
    const { key, value } = req.body

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Missing key or value parameters' })
    }

    res.json(toToonFormat({
      success: true,
      message: 'Configuration updated',
      change: { key, value }
    }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Test suite
describe('Oliver Dashboard API Server', () => {
  // Health Check Tests
  describe('GET /health', () => {
    test('should return health status', async () => {
      const res = await request(app).get('/health')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'ok')
      expect(res.body).toHaveProperty('repoRoot')
    })
  })

  // Team Endpoint Tests
  describe('GET /team', () => {
    test('should return team structure with TOON format', async () => {
      const res = await request(app).get('/team')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('ld') // lead abbreviated
      expect(res.body).toHaveProperty('ags') // agents abbreviated
    })

    test('should have TOON keys for team objects', async () => {
      const res = await request(app).get('/team')
      const lead = res.body.ld
      expect(lead).toHaveProperty('nm') // name abbreviated
      expect(lead).toHaveProperty('t') // type abbreviated
      expect(lead).toHaveProperty('e') // emoji abbreviated
    })

    test('should contain Kiana and at least two agents', async () => {
      const res = await request(app).get('/team')
      expect(res.body.ld.nm).toBe('Kiana')
      expect(res.body.ags.length).toBeGreaterThanOrEqual(2)
    })
  })

  // Skills Endpoint Tests
  describe('GET /skills', () => {
    test('should return skills array with TOON format', async () => {
      const res = await request(app).get('/skills')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    test('should have TOON keys in skills', async () => {
      const res = await request(app).get('/skills')
      if (res.body.length > 0) {
        const skill = res.body[0]
        expect(skill).toHaveProperty('nm') // name
        expect(skill).toHaveProperty('ds') // description
        expect(skill).toHaveProperty('p') // path
      }
    })

    test('should be sorted alphabetically by name', async () => {
      const res = await request(app).get('/skills')
      if (res.body.length > 1) {
        const names = res.body.map(s => s.nm)
        const sorted = [...names].sort()
        expect(names).toEqual(sorted)
      }
    })
  })

  // Aliases Endpoint Tests
  describe('GET /aliases', () => {
    test('should return aliases array with TOON format', async () => {
      const res = await request(app).get('/aliases')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    test('should have TOON keys in aliases', async () => {
      const res = await request(app).get('/aliases')
      if (res.body.length > 0) {
        const alias = res.body[0]
        expect(alias).toHaveProperty('cmd') // command abbreviated
        expect(alias).toHaveProperty('ds') // description abbreviated
      }
    })

    test('should include base commands', async () => {
      const res = await request(app).get('/aliases')
      const commands = res.body.map(a => a.cmd)
      expect(commands).toContain('/help')
      expect(commands).toContain('/fast')
    })
  })

  // Docs Endpoint Tests
  describe('GET /docs', () => {
    test('should return docs structure with TOON format', async () => {
      const res = await request(app).get('/docs')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('nm') // name
      expect(res.body).toHaveProperty('p') // path
      expect(res.body).toHaveProperty('ch') // children abbreviated
    })

    test('should have TOON keys in directory structure', async () => {
      const res = await request(app).get('/docs')
      if (res.body.ch && res.body.ch.length > 0) {
        const child = res.body.ch[0]
        expect(child).toHaveProperty('nm')
        expect(child).toHaveProperty('d') // isDir abbreviated
      }
    })
  })

  // File Endpoint Tests
  describe('GET /file', () => {
    test('should return 400 when path is missing', async () => {
      const res = await request(app).get('/file')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    test('should return 403 for path traversal attempts', async () => {
      const res = await request(app).get('/file?path=../../etc/passwd')
      expect(res.status).toBe(403)
      expect(res.body.error).toBe('Access denied')
    })

    test('should return 404 for non-existent files', async () => {
      const res = await request(app).get('/file?path=nonexistent.txt')
      expect(res.status).toBe(404)
    })

    test('should support pagination with maxLines and startLine', async () => {
      // Test with a known file
      const res = await request(app).get('/file?path=FILE_STRUCTURE.md&maxLines=10&startLine=0')
      if (res.status === 200) {
        expect(res.body).toHaveProperty('content')
        expect(res.body).toHaveProperty('totalLines')
        expect(res.body).toHaveProperty('startLine', 0)
        expect(res.body).toHaveProperty('endLine')
        expect(res.body).toHaveProperty('maxLines', 10)
      }
    })

    test('should default pagination parameters', async () => {
      const res = await request(app).get('/file?path=FILE_STRUCTURE.md')
      if (res.status === 200) {
        expect(res.body).toHaveProperty('maxLines', 100)
        expect(res.body).toHaveProperty('startLine', 0)
      }
    })
  })

  // Memory Endpoint Tests
  describe('GET /memory', () => {
    test('should return memory data with TOON format', async () => {
      const res = await request(app).get('/memory')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    test('should have TOON keys in memory entries', async () => {
      const res = await request(app).get('/memory')
      if (res.body.length > 0) {
        const entry = res.body[0]
        expect(entry).toHaveProperty('dt') // date abbreviated
        expect(entry).toHaveProperty('sz') // size (or whatever)
        expect(entry).toHaveProperty('tok') // tokens abbreviated
      }
    })
  })

  // Claude Config Endpoint Tests
  describe('GET /claude-config', () => {
    test('should return claude configuration with TOON format', async () => {
      const res = await request(app).get('/claude-config')
      expect(res.status).toBe(200)
      // Check for abbreviated keys
      const jsonStr = JSON.stringify(res.body)
      expect(jsonStr).toContain('mdl')
    })

    test('should contain model and token budget', async () => {
      const res = await request(app).get('/claude-config')
      // Check for either full or abbreviated keys
      const jsonStr = JSON.stringify(res.body)
      expect(jsonStr).toContain('claude-haiku')
    })

    test('should include slash command aliases', async () => {
      const res = await request(app).get('/claude-config')
      // Check in structure - might be abbreviated
      const jsonStr = JSON.stringify(res.body)
      expect(jsonStr).toContain('commit')
    })
  })

  // Plugins Endpoint Tests
  describe('GET /plugins', () => {
    test('should return plugins array', async () => {
      const res = await request(app).get('/plugins')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    test('should have TOON keys in plugin entries', async () => {
      const res = await request(app).get('/plugins')
      if (res.body.length > 0) {
        const plugin = res.body[0]
        expect(plugin).toHaveProperty('nm') // name
        expect(plugin).toHaveProperty('v') // version
        expect(plugin).toHaveProperty('en') // enabled
      }
    })
  })

  // Plugin Management Endpoint Tests
  describe('POST /plugins/:name', () => {
    test('should reject invalid actions', async () => {
      const res = await request(app).post('/plugins/test').send({ action: 'invalid' })
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    test('should accept enable action', async () => {
      const res = await request(app).post('/plugins/test').send({ action: 'enable' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('s') // success abbreviated
    })

    test('should accept disable action', async () => {
      const res = await request(app).post('/plugins/test').send({ action: 'disable' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('s')
    })

    test('should accept install action', async () => {
      const res = await request(app).post('/plugins/test').send({ action: 'install' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('s')
    })

    test('should accept uninstall action', async () => {
      const res = await request(app).post('/plugins/test').send({ action: 'uninstall' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('s')
    })
  })

  // Audit Log Endpoint Tests
  describe('GET /audit-log', () => {
    test('should return audit log array', async () => {
      const res = await request(app).get('/audit-log')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    test('should have TOON keys in audit entries', async () => {
      const res = await request(app).get('/audit-log')
      if (res.body.length > 0) {
        const entry = res.body[0]
        expect(entry).toHaveProperty('ts') // timestamp
        expect(entry).toHaveProperty('ag') // agent
        expect(entry).toHaveProperty('a') // action
        expect(entry).toHaveProperty('s') // success
      }
    })
  })

  // Config Endpoint Tests
  describe('POST /config', () => {
    test('should return 400 when key is missing', async () => {
      const res = await request(app).post('/config').send({ value: 'test' })
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    test('should return 400 when value is missing', async () => {
      const res = await request(app).post('/config').send({ key: 'test' })
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    test('should accept valid config update', async () => {
      const res = await request(app).post('/config').send({ key: 'theme', value: 'dark' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('s') // success abbreviated
    })
  })

  // Security Tests
  describe('Security', () => {
    test('should prevent directory traversal in /file', async () => {
      const attempts = [
        '/file?path=../../../../etc/passwd',
        '/file?path=../../../.env',
        '/file?path=../../secrets.json'
      ]

      for (const attempt of attempts) {
        const res = await request(app).get(attempt)
        expect([403, 404]).toContain(res.status)
      }
    })
  })

  // TOON Format Verification Tests
  describe('TOON Format Verification', () => {
    test('should abbreviate common keys across all endpoints', async () => {
      const endpoints = ['/team', '/skills', '/aliases', '/docs', '/plugins', '/audit-log']

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint)
        expect(res.status).toBe(200)
        const jsonStr = JSON.stringify(res.body)
        // At least some common keys should be abbreviated
        // Different endpoints use different abbreviations
        const hasAbbreviations = ['nm', 'ds', 'p', 't', 'e', 'ld', 'ags', 'ps', 'lds', 'sks', 'ts', 'ag', 'a', 's', 'instr', 'tb', 'mdl'].some(key => jsonStr.includes(`"${key}":`))
        if (!Array.isArray(res.body) || res.body.length > 0) {
          expect(hasAbbreviations).toBe(true)
        }
      }
    })

    test('should not expose unabbreviated keys in responses', async () => {
      const res = await request(app).get('/team')
      const body = JSON.stringify(res.body)
      // Should not have "name" or "type" at top level (should be abbreviated)
      expect(body).not.toMatch(/"name":\s*"Kiana"/)
    })
  })
})
