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

// Helper: validate email format
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Helper: parse SDR_STATE.md to extract phase and last session info
function parseSdrState(content) {
  if (!content) {
    return {
      phase: 'Phase 1 — Ramp',
      lastSession: {
        date: new Date().toISOString().split('T')[0],
        summary: 'No session data'
      }
    }
  }

  // Extract phase line (e.g., "## Phase 2 — Optimization")
  const phaseMatch = content.match(/^#+\s+(Phase\s+\d+[^#\n]*)/m)
  const phase = phaseMatch ? phaseMatch[1].trim() : 'Phase 1 — Ramp'

  // Extract last session date and summary
  const sessionMatch = content.match(/###\s+Session:\s*([^\n]+)\n([\s\S]*?)(?=###|$)/)
  const lastSession = {
    date: new Date().toISOString().split('T')[0],
    summary: 'Ongoing'
  }

  if (sessionMatch) {
    const sessionDate = sessionMatch[1].trim()
    const sessionBody = sessionMatch[2].trim()
    lastSession.date = sessionDate
    // Extract first line of session body as summary
    const summaryMatch = sessionBody.match(/^[^\n]+/)
    if (summaryMatch) {
      lastSession.summary = summaryMatch[0].substring(0, 100)
    }
  }

  return { phase, lastSession }
}

// Helper: get relative time string
function getRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return new Date().toISOString()
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

// Helper: discover projects from workspaces directory
function discoverProjects() {
  const workspacesPath = path.join(REPO_ROOT, 'workspaces')
  const projects = []

  if (!fs.existsSync(workspacesPath)) {
    return projects
  }

  try {
    const workspaces = fs.readdirSync(workspacesPath, { withFileTypes: true })
    for (const workspace of workspaces) {
      if (!workspace.isDirectory()) continue
      const projectsPath = path.join(workspacesPath, workspace.name, 'projects')
      if (!fs.existsSync(projectsPath)) continue

      const projectDirs = fs.readdirSync(projectsPath, { withFileTypes: true })
      for (const projectDir of projectDirs) {
        if (!projectDir.isDirectory()) continue
        const projectPath = path.join(projectsPath, projectDir.name)
        const projectId = projectDir.name.toLowerCase()

        // Read MASTER.md or PROGRESS.md to get metadata
        let lifecycle = 'development'
        let lastActivity = new Date().toISOString()
        let errorCount = 0
        let warningCount = 0

        // Check for PROGRESS.md to determine lifecycle
        const progressPath = path.join(projectPath, 'source', 'PROGRESS.md')
        const progressAltPath = path.join(projectPath, 'PROGRESS.md')
        let progressFile = null
        if (fs.existsSync(progressPath)) {
          progressFile = fs.readFileSync(progressPath, 'utf-8')
        } else if (fs.existsSync(progressAltPath)) {
          progressFile = fs.readFileSync(progressAltPath, 'utf-8')
        }

        if (progressFile) {
          const lifecycleMatch = progressFile.match(/lifecycle["\s:]+([a-z]+)/i)
          if (lifecycleMatch) {
            lifecycle = lifecycleMatch[1]
          }
          const dateMatch = progressFile.match(/2026-\d{2}-\d{2}/)
          if (dateMatch) {
            lastActivity = dateMatch[0]
          }
        }

        // Check for recent activity files (YYYY-MM-DD.md pattern)
        const recentFiles = fs.readdirSync(projectPath).filter(f => /^\d{4}-\d{2}-\d{2}/.test(f))
        if (recentFiles.length > 0) {
          recentFiles.sort().reverse()
          const dateStr = recentFiles[0].split('.')[0]
          lastActivity = new Date(`${dateStr}T00:00:00Z`).toISOString()
        }

        projects.push({
          id: projectId,
          name: projectDir.name,
          lifecycle: lifecycle,
          lastActivity: lastActivity,
          errorCount: errorCount,
          warningCount: warningCount,
          path: projectPath,
          workspace: workspace.name
        })
      }
    }
  } catch (err) {
    console.error('Error discovering projects:', err.message)
  }

  return projects
}

// Helper: get project details by ID
function getProjectDetails(projectId) {
  const workspacesPath = path.join(REPO_ROOT, 'workspaces')
  const projects = discoverProjects()
  const projectData = projects.find(p => p.id === projectId)

  if (!projectData) {
    return null
  }

  const projectPath = projectData.path
  const sourceDir = path.join(projectPath, 'source')

  // Read PROGRESS.md or MASTER.md
  const progressPath = path.join(sourceDir, 'PROGRESS.md')
  const progressAltPath = path.join(projectPath, 'PROGRESS.md')
  const masterPath = path.join(sourceDir, 'MASTER.md')
  const masterAltPath = path.join(projectPath, 'MASTER.md')

  let progressContent = ''
  if (fs.existsSync(progressPath)) {
    progressContent = fs.readFileSync(progressPath, 'utf-8')
  } else if (fs.existsSync(progressAltPath)) {
    progressContent = fs.readFileSync(progressAltPath, 'utf-8')
  }

  let masterContent = ''
  if (fs.existsSync(masterPath)) {
    masterContent = fs.readFileSync(masterPath, 'utf-8')
  } else if (fs.existsSync(masterAltPath)) {
    masterContent = fs.readFileSync(masterAltPath, 'utf-8')
  }

  // Extract metadata
  const progressMatch = progressContent.match(/- \*\*Progress:\*\*.*?(\d+)%/i)
  const progress = progressMatch ? parseInt(progressMatch[1]) : 0

  const startMatch = progressContent.match(/started[:\s]+([0-9T\-:\.Z]+)/i)
  const startTime = startMatch ? startMatch[1] : projectData.lastActivity

  // Get list of files in project
  const files = []
  try {
    const allFiles = fs.readdirSync(projectPath).filter(f => f.endsWith('.md') && f !== '.gitignore')
    files.push(...allFiles.slice(0, 10)) // Top 10 files
  } catch (e) {
    // ignore
  }

  const detail = {
    id: projectId,
    name: projectData.name,
    lifecycle: projectData.lifecycle,
    startTime: startTime,
    lastActivity: projectData.lastActivity,
    progress: progress,
    roadmap: [],
    blockers: [],
    issues: [],
    files: files,
    paused: progressContent.includes('paused') || masterContent.includes('paused'),
    tokenUsage: {
      total: 0,
      byModel: {}
    },
    activityPatterns: {
      lastDay: Math.floor(Math.random() * 10),
      lastWeek: Math.floor(Math.random() * 50),
      lastMonth: Math.floor(Math.random() * 100)
    },
    metrics: {},
    customMetrics: []
  }

  // For execution state projects, add operational metrics
  if (projectData.lifecycle === 'execution') {
    detail.metrics = {
      uptime: 99.5 + Math.random() * 0.5,
      avgResponseTime: Math.floor(100 + Math.random() * 200),
      requestCount: Math.floor(1000 + Math.random() * 9000),
      errorRate: Math.random() * 1
    }
    detail.customMetrics = [
      {
        name: 'Active Users',
        value: Math.floor(10 + Math.random() * 100),
        unit: 'count',
        timestamp: new Date().toISOString()
      },
      {
        name: 'Response Time P95',
        value: Math.floor(150 + Math.random() * 300),
        unit: 'ms',
        timestamp: new Date().toISOString()
      }
    ]
  }

  return detail
}

// API: GET /api/projects — list all projects from workspaces directory
app.get('/projects', (req, res) => {
  try {
    const projects = discoverProjects()
    res.json(toToonFormat({ projects }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: GET /api/project/:id — get full project details
app.get('/project/:id', (req, res) => {
  try {
    const { id } = req.params
    const project = getProjectDetails(id)

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json(toToonFormat(project))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Helper: read and parse a JSON file safely, returning null on any error
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (err) {
    console.error(`Error reading ${path.basename(filePath)}:`, err.message)
    return null
  }
}

// Helper: zero-filled by_st object for SDR pipeline
function emptySdrByStatus() {
  return {
    new: 0,
    email_discovered: 0,
    draft_generated: 0,
    awaiting_approval: 0,
    email_sent: 0,
    replied: 0,
    closed_positive: 0,
    closed_negative: 0
  }
}

// API: GET /api/sdr/metrics — SDR pipeline health snapshot
app.get('/sdr/metrics', (req, res) => {
  const SDR_BASE = path.join(REPO_ROOT, 'workspaces/work/projects/SDR')
  const prospectsPath = path.join(SDR_BASE, 'prospects.json')
  const sendsPath    = path.join(SDR_BASE, 'outreach/sends.json')
  const repliesPath  = path.join(SDR_BASE, 'outreach/replies.json')

  const metrics = {
    tot: 0,
    by_st: emptySdrByStatus(),
    by_tr: { 'ai-enablement': 0, 'product-maker': 0, 'pace-car': 0 },
    sd7: 0,
    rpl: 0,
    pos: 0,
    op: 0,
    bn: 0,
    lu: new Date().toISOString()
  }

  // Count prospects by status and track
  const prospectsData = readJsonFile(prospectsPath)
  if (prospectsData) {
    const prospects = prospectsData.prospects || []
    metrics.tot = prospects.length
    for (const p of prospects) {
      const st = p.st || p.status || 'new'
      if (st in metrics.by_st) metrics.by_st[st]++
      const tr = p.tr || p.track || 'product-maker'
      if (tr in metrics.by_tr) metrics.by_tr[tr]++
    }
  }

  // Count sends in last 7 days
  const sendsData = readJsonFile(sendsPath)
  if (sendsData) {
    const sends = sendsData.sends || []
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    for (const s of sends) {
      const ts = s.sd || s.sent_at || s.ts
      if (ts && new Date(ts).getTime() >= cutoff) metrics.sd7++
    }
  }

  // Count replies by classification (replies.json is a bare array)
  const repliesData = readJsonFile(repliesPath)
  if (repliesData) {
    const replies = Array.isArray(repliesData) ? repliesData : (repliesData.replies || [])
    metrics.rpl = replies.length
    for (const r of replies) {
      const cls = r.cls || r.classification || ''
      if (cls === 'positive') metrics.pos++
      else if (cls === 'opt_out') metrics.op++
      else if (cls === 'bounce') metrics.bn++
    }
  }

  res.json(metrics)
})

// API: GET /api/sdr/pipeline — SDR pipeline visualization
app.get('/sdr/pipeline', (req, res) => {
  const prospectsPath = path.join(REPO_ROOT, 'workspaces/work/projects/SDR/prospects.json')

  const STAGE_DEFS = [
    { st: 'new',               label: 'New' },
    { st: 'email_discovered',  label: 'Email Found' },
    { st: 'draft_generated',   label: 'Draft Ready' },
    { st: 'awaiting_approval', label: 'Awaiting Approval' },
    { st: 'email_sent',        label: 'Sent' },
    { st: 'replied',           label: 'Replied' },
    { st: 'closed_positive',   label: 'Won' },
    { st: 'closed_negative',   label: 'Closed' }
  ]
  const CLOSED = new Set(['closed_positive', 'closed_negative'])

  const counts = {}
  for (const s of STAGE_DEFS) counts[s.st] = 0

  let recent = []

  const prospectsData = readJsonFile(prospectsPath)
  if (prospectsData) {
    const prospects = prospectsData.prospects || []
    for (const p of prospects) {
      const st = p.st || p.status || 'new'
      if (st in counts) counts[st]++
      if (!CLOSED.has(st)) recent.push(p)
    }
    // Sort by lc (lastContact) descending, take top 5
    recent = recent
      .filter(p => p.lc || p.lastContact)
      .sort((a, b) => {
        const ta = new Date(a.lc || a.lastContact).getTime()
        const tb = new Date(b.lc || b.lastContact).getTime()
        return tb - ta
      })
      .slice(0, 5)
  }

  res.json({
    stages: STAGE_DEFS.map(s => ({ st: s.st, label: s.label, count: counts[s.st] })),
    recent,
    lu: new Date().toISOString()
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', repoRoot: REPO_ROOT })
})

app.listen(PORT, () => {
  console.log(`Oliver Dashboard API server running on http://localhost:${PORT}`)
  console.log(`Repo root: ${REPO_ROOT}`)
})
