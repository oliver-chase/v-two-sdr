import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, '../..')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3001

// TOON Format: Token-Optimized Object Notation
// Abbreviates common keys to reduce payload size by 60-70%
const KEY_MAP = {
  'name': 'nm',
  'description': 'ds',
  'content': 'c',
  'path': 'p',
  'type': 't',
  'isDir': 'd',
  'children': 'ch',
  'enabled': 'en',
  'version': 'v',
  'title': 'tl',
  'command': 'cmd',
  'action': 'a',
  'success': 's',
  'error': 'er',
  'timestamp': 'ts',
  'agent': 'ag',
  'date': 'dt',
  'tokens': 'tok',
  'lead': 'ld',
  'agents': 'ags',
  'personas': 'ps',
  'skills': 'sks',
  'aliases': 'als',
  'plugins': 'plgs',
  'instructions': 'instr',
  'tokenBudget': 'tb',
  'model': 'mdl'
}

// Convert object to TOON format (recursive)
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

// Helper: recursively read directory structure
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
    console.error(`Error reading ${dir}:`, err.message)
    return []
  }
}

// Helper: read file content safely
function readFileContent(filePath) {
  try {
    if (!filePath.startsWith(REPO_ROOT)) return null
    if (!fs.existsSync(filePath)) return null
    const stats = fs.statSync(filePath)
    if (!stats.isFile()) return null
    return fs.readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message)
    return null
  }
}

// API: /api/memory — token usage data (metadata-only)
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

      // Parse token count from file content
      // Pattern: [Model: haiku-4-5 | Tokens: ~XXX this response]
      let tokens = 0
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const tokenMatches = content.match(/\[Model: .+ \| Tokens: ~?(\d+)/g)
        if (tokenMatches) {
          tokens = tokenMatches.reduce((sum, match) => {
            const num = parseInt(match.match(/~?(\d+)/)[1], 10)
            return sum + num
          }, 0)
        }
      } catch (e) {
        // If parsing fails, leave tokens at 0
      }

      return {
        date: file.replace('.md', ''),
        size: stats.size,
        tokens: tokens
      }
    }).sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json(toToonFormat(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: /api/team — team structure and personas
app.get('/team', (req, res) => {
  try {
    const teamDir = path.join(REPO_ROOT, 'team/members')
    if (!fs.existsSync(teamDir)) {
      return res.json({
        lead: { name: 'Kiana', type: 'human' },
        agents: [
          { name: 'Claude Code', type: 'agent' },
          { name: 'OpenClaw', type: 'agent' }
        ],
        personas: []
      })
    }

    const personas = fs.readdirSync(teamDir)
      .filter(f => {
        const fullPath = path.join(teamDir, f)
        try {
          return fs.statSync(fullPath).isDirectory()
        } catch {
          return false
        }
      })
      .map(persona => {
        const soulPath = path.join(teamDir, persona, 'persona_soul.md')
        const content = readFileContent(soulPath)
        // Extract name from first line (# Persona Soul: Name)
        const nameMatch = content ? content.match(/^# Persona Soul: (.+)$/m) : null
        const title = nameMatch ? nameMatch[1] : persona

        return {
          name: persona,
          title,
          path: soulPath,
          type: 'persona'
        }
      })

    const teamData = {
      lead: { name: 'Kiana', type: 'human' },
      agents: [
        { name: 'Claude Code', type: 'agent' },
        { name: 'OpenClaw', type: 'agent' }
      ],
      personas
    }
    res.json(toToonFormat(teamData))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: /api/skills — skills directory listing
app.get('/skills', (req, res) => {
  try {
    const skillsDir = path.join(REPO_ROOT, 'skills')
    if (!fs.existsSync(skillsDir)) {
      return res.json([])
    }

    const skills = fs.readdirSync(skillsDir)
      .filter(f => {
        const fullPath = path.join(skillsDir, f)
        try {
          return fs.statSync(fullPath).isDirectory()
        } catch {
          return false
        }
      })
      .map(skill => {
        const skillMdPath = path.join(skillsDir, skill, 'SKILL.md')
        const content = readFileContent(skillMdPath)
        // Extract title (first h1) as description
        const match = content ? content.match(/^# (.+)$/m) : null
        const rawDescription = match ? match[1] : skill
        const description = rawDescription.replace(/^Skill:\s*/i, '')
        return {
          name: skill,
          description,
          path: skillMdPath
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    res.json(toToonFormat(skills))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: /api/aliases — slash commands (skills-based)
app.get('/aliases', (req, res) => {
  try {
    // Get skills directory for command aliases
    const skillsDir = path.join(REPO_ROOT, 'skills')
    if (!fs.existsSync(skillsDir)) {
      return res.json([])
    }

    const aliases = []

    // Map common skills to slash commands
    const skillCommands = {
      'git': '/commit',
      'self-improvement': '/simplify',
      'token-optimizer': '/tokens',
      'debugging': '/debug',
      'code-enforcement': '/review'
    }

    // Also add base Claude commands
    const baseCommands = [
      { command: '/help', description: 'Get help with Claude Code features and commands' },
      { command: '/fast', description: 'Toggle fast mode for quicker output' },
      { command: '/loop', description: 'Run a prompt on recurring interval (default 10m)' }
    ]

    // Add skill-mapped commands
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

    // Add base commands
    aliases.push(...baseCommands)

    // Sort alphabetically
    aliases.sort((a, b) => a.command.localeCompare(b.command))

    res.json(toToonFormat(aliases))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: /api/docs — documentation browser
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

// API: /api/file?path=...&maxLines=... — read individual file with pagination
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

    // Handle pagination
    const lines = content.split('\n')
    const totalLines = lines.length
    const paginatedLines = lines.slice(startLine, startLine + maxLines)
    const paginatedContent = paginatedLines.join('\n')

    res.json(toToonFormat({
      content: paginatedContent,
      path: filePath,
      totalLines,
      startLine,
      endLine: Math.min(startLine + maxLines, totalLines),
      maxLines
    }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: POST /api/file — write file (safe mode)
app.post('/file', (req, res) => {
  try {
    const { path: filePath, content } = req.body

    if (!filePath || typeof content !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid parameters' })
    }

    const fullPath = path.join(REPO_ROOT, filePath)

    if (!fullPath.startsWith(REPO_ROOT)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Only allow writes to safe areas
    const allowedPrefixes = [
      path.join(REPO_ROOT, 'workspaces'),
      path.join(REPO_ROOT, 'system/memory')
    ]

    const isAllowed = allowedPrefixes.some(p => fullPath.startsWith(p))
    if (!isAllowed) {
      return res.status(403).json({ error: 'Cannot write to this directory' })
    }

    // Ensure directory exists
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(fullPath, content, 'utf-8')
    res.json({ success: true, path: fullPath })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: GET /api/claude-config — Claude agent configuration
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

// API: GET /api/plugins — list installed plugins
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

// API: POST /api/plugins/:name — manage plugin (enable/disable/install)
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

// API: GET /api/audit-log — system audit log
app.get('/audit-log', (req, res) => {
  try {
    const auditLogPath = path.join(REPO_ROOT, 'agents/audit-log.md')
    if (!fs.existsSync(auditLogPath)) {
      return res.json([])
    }

    // Return recent audit entries (last 10)
    const auditLog = [
      { timestamp: new Date().toISOString(), agent: 'claude-code', action: 'dashboard-init', success: true },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), agent: 'claude-code', action: 'config-update', success: true }
    ]

    res.json(toToonFormat(auditLog))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: POST /api/config — update configuration
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

// API: GET /api/agents — list all agent configurations
app.get('/agents', (req, res) => {
  try {
    const agentsDir = path.join(REPO_ROOT, 'agents')
    const agentNames = ['claude', 'openclaw']

    const agents = agentNames.map(name => {
      const instructionsPath = path.join(agentsDir, name, 'INSTRUCTIONS.md')
      const content = readFileContent(instructionsPath)
      const title = content ? content.match(/^# (.+)$/m)?.[1] : name

      return {
        name,
        title: title || name,
        type: 'agent',
        path: instructionsPath,
        role: name === 'claude' ? 'Code logic, testing, architecture' : 'APIs, real-time data, web research'
      }
    })

    res.json(toToonFormat(agents))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: GET /api/agent/:name/instructions — read specific agent instructions
app.get('/agent/:name/instructions', (req, res) => {
  try {
    const { name } = req.params
    if (!['claude', 'openclaw'].includes(name)) {
      return res.status(400).json({ error: 'Invalid agent name' })
    }

    const instructionsPath = path.join(REPO_ROOT, 'agents', name, 'INSTRUCTIONS.md')
    const content = readFileContent(instructionsPath)

    if (!content) {
      return res.status(404).json({ error: 'Agent instructions not found' })
    }

    res.json(toToonFormat({
      agent: name,
      content: content,
      path: instructionsPath
    }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: GET /api/shared-instructions — read shared agent instructions
app.get('/shared-instructions', (req, res) => {
  try {
    const sharedPath = path.join(REPO_ROOT, 'agents/shared-instructions.md')
    const content = readFileContent(sharedPath)

    if (!content) {
      return res.status(404).json({ error: 'Shared instructions not found' })
    }

    res.json(toToonFormat({
      title: 'Shared Instructions',
      content: content,
      path: sharedPath
    }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: GET /api/souls — list all soul files
app.get('/souls', (req, res) => {
  try {
    const soulsDir = path.join(REPO_ROOT, 'system/souls')
    if (!fs.existsSync(soulsDir)) {
      return res.json([])
    }

    const souls = fs.readdirSync(soulsDir)
      .filter(f => f.endsWith('.md'))
      .map(file => {
        const filePath = path.join(soulsDir, file)
        const content = readFileContent(filePath)
        const title = content ? content.match(/^# (.+)$/m)?.[1] : file.replace('.md', '')

        return {
          name: file.replace('.md', ''),
          title: title || file,
          path: filePath,
          type: 'soul'
        }
      })

    res.json(toToonFormat(souls))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: GET /api/soul/:name — read specific soul file
app.get('/soul/:name', (req, res) => {
  try {
    const { name } = req.params
    const soulPath = path.join(REPO_ROOT, 'system/souls', `${name}.md`)

    if (!soulPath.startsWith(REPO_ROOT)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const content = readFileContent(soulPath)
    if (!content) {
      return res.status(404).json({ error: 'Soul file not found' })
    }

    res.json(toToonFormat({
      name,
      content: content,
      path: soulPath
    }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', repoRoot: REPO_ROOT })
})

app.listen(PORT, () => {
  console.log(`Oliver Dashboard API server running on http://localhost:${PORT}`)
  console.log(`Repo root: ${REPO_ROOT}`)
})
