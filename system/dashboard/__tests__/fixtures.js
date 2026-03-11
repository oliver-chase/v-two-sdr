/**
 * Mock team structure with lead, agents, and personas
 */
const mockTeam = {
  lead: {
    id: 'kiana',
    name: 'Kiana',
    type: 'human',
    emoji: '👑',
    role: 'Lead',
    status: 'active',
  },
  agents: [
    {
      id: 'claude-code',
      name: 'Claude Code',
      type: 'agent',
      emoji: '💻',
      role: 'Dashboard Developer',
      status: 'active',
      model: 'claude-haiku-4.5',
    },
    {
      id: 'openclaw',
      name: 'OpenClaw',
      type: 'agent',
      emoji: '🐾',
      role: 'Research Agent',
      status: 'active',
      model: 'gpt-4',
    },
  ],
  personas: [
    {
      id: 'dev',
      name: 'Developer',
      type: 'persona',
      emoji: '👨‍💻',
      description: 'System developer role',
      skills: ['git', 'javascript', 'testing'],
    },
    {
      id: 'fe-designer',
      name: 'Frontend Designer',
      type: 'persona',
      emoji: '🎨',
      description: 'Frontend design and UX role',
      skills: ['react', 'css', 'accessibility'],
    },
  ],
};

/**
 * Mock skills with descriptions and paths
 */
const mockSkills = [
  {
    name: 'git',
    description: 'Version control and git operations',
    path: '/Users/oliver/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.0/skills/git',
    category: 'development',
    tags: ['version-control', 'vcs'],
  },
  {
    name: 'javascript',
    description: 'JavaScript development and tooling',
    path: '/Users/oliver/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.0/skills/javascript',
    category: 'development',
    tags: ['language', 'runtime'],
  },
  {
    name: 'testing',
    description: 'Unit and integration testing frameworks',
    path: '/Users/oliver/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.0/skills/testing',
    category: 'development',
    tags: ['qa', 'jest', 'testing-library'],
  },
  {
    name: 'react',
    description: 'React library and component development',
    path: '/Users/oliver/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.0/skills/react',
    category: 'frontend',
    tags: ['framework', 'ui'],
  },
  {
    name: 'css',
    description: 'Cascading stylesheets and styling',
    path: '/Users/oliver/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.0/skills/css',
    category: 'frontend',
    tags: ['styling', 'design'],
  },
  {
    name: 'accessibility',
    description: 'Web accessibility and WCAG compliance',
    path: '/Users/oliver/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.0/skills/accessibility',
    category: 'frontend',
    tags: ['wcag', 'a11y', 'inclusive-design'],
  },
];

/**
 * Mock token usage memory data
 */
const mockMemory = [
  {
    date: '2026-03-10',
    tokens: 42000,
    cost: 33.60,
    agent: 'claude-code',
    tasks: 8,
    efficiency: 0.95,
  },
  {
    date: '2026-03-09',
    tokens: 38500,
    cost: 30.80,
    agent: 'openclaw',
    tasks: 5,
    efficiency: 0.92,
  },
  {
    date: '2026-03-08',
    tokens: 51200,
    cost: 40.96,
    agent: 'claude-code',
    tasks: 12,
    efficiency: 0.88,
  },
  {
    date: '2026-03-07',
    tokens: 35800,
    cost: 28.64,
    agent: 'openclaw',
    tasks: 4,
    efficiency: 0.94,
  },
];

/**
 * Mock audit log entries
 */
const mockAuditLog = [
  {
    id: 'audit-001',
    timestamp: '2026-03-10T15:32:45Z',
    agent: 'claude-code',
    action: 'config-change',
    resource: 'jest.config.js',
    details: {
      change: 'created',
      path: '/Users/oliver/OliverRepo/system/dashboard/jest.config.js',
    },
    success: true,
    duration: 125,
  },
  {
    id: 'audit-002',
    timestamp: '2026-03-10T15:31:20Z',
    agent: 'openclaw',
    action: 'file-read',
    resource: 'package.json',
    details: {
      lines: 23,
      size: 472,
    },
    success: true,
    duration: 45,
  },
  {
    id: 'audit-003',
    timestamp: '2026-03-10T15:30:10Z',
    agent: 'claude-code',
    action: 'test-run',
    resource: 'jest',
    details: {
      testCount: 0,
      passed: 0,
      failed: 0,
    },
    success: true,
    duration: 1200,
  },
  {
    id: 'audit-004',
    timestamp: '2026-03-10T15:25:55Z',
    agent: 'openclaw',
    action: 'dependency-install',
    resource: 'npm',
    details: {
      packageCount: 455,
    },
    success: true,
    duration: 13000,
  },
];

/**
 * Mock documentation tree structure
 */
const mockDocTree = {
  id: 'root',
  name: 'Documentation',
  type: 'dir',
  children: [
    {
      id: 'prd',
      name: 'PRD.md',
      type: 'file',
      size: 4096,
      path: '/Users/oliver/OliverRepo/system/dashboard/docs/PRD.md',
    },
    {
      id: 'roadmap',
      name: 'ROADMAP.md',
      type: 'file',
      size: 5120,
      path: '/Users/oliver/OliverRepo/system/dashboard/docs/ROADMAP.md',
    },
    {
      id: 'phase1',
      name: 'PHASE1_COMPLETE.md',
      type: 'file',
      size: 6144,
      path: '/Users/oliver/OliverRepo/system/dashboard/docs/PHASE1_COMPLETE.md',
    },
  ],
};

/**
 * Mock API aliases/command shortcuts
 */
const mockAliases = [
  {
    alias: 'git-status',
    command: 'git status',
    description: 'Show working tree status',
    category: 'git',
  },
  {
    alias: 'npm-test',
    command: 'npm test',
    description: 'Run test suite',
    category: 'npm',
  },
  {
    alias: 'build',
    command: 'npm run build',
    description: 'Build production bundle',
    category: 'npm',
  },
  {
    alias: 'dev',
    command: 'npm run dev',
    description: 'Start development server',
    category: 'npm',
  },
];

/**
 * Mock health check response
 */
const mockHealthCheck = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: 3600,
  endpoints: {
    '/api/team': 'ok',
    '/api/skills': 'ok',
    '/api/aliases': 'ok',
    '/api/docs': 'ok',
    '/api/file': 'ok',
    '/api/memory': 'ok',
    '/api/health': 'ok',
  },
};

module.exports = {
  mockTeam,
  mockSkills,
  mockMemory,
  mockAuditLog,
  mockDocTree,
  mockAliases,
  mockHealthCheck,
};
