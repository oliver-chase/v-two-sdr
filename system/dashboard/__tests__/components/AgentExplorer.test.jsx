import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentExplorer from '../../src/components/AgentExplorer'

// Mock useFetchData hook
jest.mock('../../src/hooks/useFetchData', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const useFetchDataMock = require('../../src/hooks/useFetchData').default

describe('AgentExplorer', () => {
  const mockAgentsData = {
    agents: [
      {
        nm: 'Claude Code',
        t: 'agent',
        ps: ['architect', 'developer'],
        r: 'Lead agent for system design',
      },
      {
        nm: 'OpenClaw',
        t: 'agent',
        ps: ['analyzer', 'researcher'],
        r: 'Secondary analysis agent',
      },
    ],
  }

  const mockSoulsData = {
    souls: [
      { nm: 'architect', p: 'path/architect_soul.md' },
      { nm: 'developer', p: 'path/developer_soul.md' },
      { nm: 'analyzer', p: 'path/analyzer_soul.md' },
      { nm: 'researcher', p: 'path/researcher_soul.md' },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useFetchDataMock.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    })
  })

  describe('Master/Detail Layout', () => {
    it('renders main container with left and right panels', () => {
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)
      const container = screen.getByTestId('agent-explorer-container')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('agent-explorer-container')
    })

    it('renders left panel (master list) with agents', () => {
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)
      const leftPanel = screen.getByTestId('agent-list-panel')
      expect(leftPanel).toBeInTheDocument()
      expect(screen.getByText('Claude Code')).toBeInTheDocument()
      expect(screen.getByText('OpenClaw')).toBeInTheDocument()
    })

    it('renders right panel (detail view) with empty state initially', () => {
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)
      const rightPanel = screen.getByTestId('agent-detail-panel')
      expect(rightPanel).toBeInTheDocument()
      expect(screen.getByText(/Select an agent or persona/)).toBeInTheDocument()
    })
  })

  describe('Loading & Error States', () => {
    it('renders loading skeleton while fetching agents', () => {
      useFetchDataMock.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      })

      render(<AgentExplorer />)
      const skeletons = screen.getAllByTestId('agent-skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders error banner when fetch fails', () => {
      useFetchDataMock.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Failed to fetch'),
      })

      render(<AgentExplorer />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Could not load agent data/)).toBeInTheDocument()
    })

    it('renders empty state when no agents found', () => {
      useFetchDataMock.mockReturnValue({
        data: { agents: [] },
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)
      expect(screen.getByText(/No agents found/)).toBeInTheDocument()
    })
  })

  describe('Expandable Agent Groups', () => {
    it('renders agents with expand/collapse buttons for personas', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const expandButtons = screen.getAllByTestId(/agent-expand-btn/)
      expect(expandButtons.length).toBeGreaterThan(0)

      const firstExpandBtn = expandButtons[0]
      await user.click(firstExpandBtn)

      // After expand, personas should be visible
      expect(screen.getByText('architect')).toBeInTheDocument()
      expect(screen.getByText('developer')).toBeInTheDocument()
    })

    it('toggles persona visibility on expand/collapse click', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const expandBtn = screen.getByTestId('agent-expand-btn-claude-code')
      expect(expandBtn).toHaveAttribute('aria-expanded', 'false')

      await user.click(expandBtn)
      expect(expandBtn).toHaveAttribute('aria-expanded', 'true')

      const personaList = screen.getByTestId('personas-claude-code')
      expect(personaList).toBeVisible()

      await user.click(expandBtn)
      expect(expandBtn).toHaveAttribute('aria-expanded', 'false')
      expect(personaList).not.toBeVisible()
    })
  })

  describe('Agent Selection', () => {
    it('highlights selected agent in master list', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      await user.click(claudeCodeBtn)

      expect(claudeCodeBtn).toHaveClass('selected')
    })

    it('shows agent details in right panel when selected', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      await user.click(claudeCodeBtn)

      expect(screen.getByTestId('detail-title')).toHaveTextContent('Claude Code')
      expect(screen.getByTestId('detail-role')).toHaveTextContent('Lead agent for system design')
    })

    it('switches agent selection when clicking different agents', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      const openClawBtn = screen.getByTestId('agent-btn-openclaw')

      await user.click(claudeCodeBtn)
      expect(claudeCodeBtn).toHaveClass('selected')

      await user.click(openClawBtn)
      expect(openClawBtn).toHaveClass('selected')
      expect(claudeCodeBtn).not.toHaveClass('selected')
    })
  })

  describe('Persona Selection', () => {
    it('selects persona when clicking in expanded agent list', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const expandBtn = screen.getByTestId('agent-expand-btn-claude-code')
      await user.click(expandBtn)

      const architectBtn = screen.getByTestId('persona-btn-architect')
      await user.click(architectBtn)

      expect(architectBtn).toHaveClass('selected')
      expect(screen.getByTestId('detail-title')).toHaveTextContent('architect')
    })

    it('highlights selected persona in detail view', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const expandBtn = screen.getByTestId('agent-expand-btn-claude-code')
      await user.click(expandBtn)

      const architectBtn = screen.getByTestId('persona-btn-architect')
      await user.click(architectBtn)

      expect(architectBtn).toHaveClass('selected')
    })
  })

  describe('Detail View Content', () => {
    it('displays agent name and role in detail panel', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      await user.click(claudeCodeBtn)

      expect(screen.getByTestId('detail-title')).toHaveTextContent('Claude Code')
      expect(screen.getByTestId('detail-role')).toHaveTextContent(
        'Lead agent for system design'
      )
    })

    it('shows skills badge in detail view', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      await user.click(claudeCodeBtn)

      const skillsBadge = screen.getByTestId('skills-badge')
      expect(skillsBadge).toBeInTheDocument()
      expect(skillsBadge).toHaveTextContent('2 Personas')
    })

    it('displays startup protocol info in detail view', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      await user.click(claudeCodeBtn)

      expect(screen.getByTestId('startup-protocol')).toBeInTheDocument()
    })
  })

  describe('Documentation Links', () => {
    it('renders link to agent instructions', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      await user.click(claudeCodeBtn)

      const docLink = screen.getByTestId('agent-instructions-link')
      expect(docLink).toBeInTheDocument()
    })

    it('renders links for persona soul files', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const expandBtn = screen.getByTestId('agent-expand-btn-claude-code')
      await user.click(expandBtn)

      const architectBtn = screen.getByTestId('persona-btn-architect')
      await user.click(architectBtn)

      const soulLink = screen.getByTestId('persona-soul-link')
      expect(soulLink).toBeInTheDocument()
    })
  })

  describe('Relationships & Handoff', () => {
    it('displays handoff relationships between agents', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      await user.click(claudeCodeBtn)

      expect(screen.getByTestId('relationships-section')).toBeInTheDocument()
    })
  })

  describe('Empty Detail View', () => {
    it('shows empty state message when no agent selected', () => {
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      expect(screen.getByText(/Select an agent or persona/)).toBeInTheDocument()
    })

    it('clears detail view when clicking deselect button', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: mockAgentsData,
        loading: false,
        error: null,
      })

      render(<AgentExplorer />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      await user.click(claudeCodeBtn)

      expect(screen.queryByText(/Select an agent or persona/)).not.toBeInTheDocument()

      const closeBtn = screen.getByTestId('detail-close-btn')
      await user.click(closeBtn)

      expect(screen.getByText(/Select an agent or persona/)).toBeInTheDocument()
    })
  })
})
