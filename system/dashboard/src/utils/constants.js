// Team IDs (matches OrgChart rendering)
export const TEAM_IDS = {
  KIANA: 'kiana',
  CLAUDE_CODE: 'claude-code',
  OPENCLAW: 'openclaw'
}

// Persona IDs
export const PERSONA_IDS = {
  DEV: 'dev',
  FE_DESIGNER: 'fe-designer',
  SDR: 'sdr',
  CMO: 'cmo',
  MARKETING: 'marketing'
}

// Initial expanded nodes (for OrgChart, DocsBrowser)
export const INITIAL_EXPANDED_NODES = ['agents', 'personas']

// Skill categories
export const SKILL_CATEGORIES = [
  'api-security', 'debugging', 'frontend-design', 'git',
  'performance-tuning', 'refactoring', 'testing', 'documentation'
]

// Token cost per model (dollars per 1M tokens)
export const TOKEN_COSTS = {
  HAIKU: 0.80,
  SONNET: 3.00,
  OPUS: 15.00
}

// Default model
export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'

// API base URL resolver
export const getApiBaseUrl = () => {
  // Use process.env for test environments, otherwise use window
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
  const port = isDev ? 3001 : (typeof window !== 'undefined' ? window.location.port : 443) || 443
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return `${protocol}//${hostname}:${port}`
}
