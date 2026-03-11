import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentList from '../../src/components/AgentList'

describe('AgentList', () => {
  const mockAgents = [
    {
      nm: 'Claude Code',
      t: 'agent',
      ps: ['architect', 'developer'],
      r: 'Lead agent',
    },
    {
      nm: 'OpenClaw',
      t: 'agent',
      ps: ['analyzer'],
      r: 'Analysis agent',
    },
  ]

  const mockCallbacks = {
    onSelectAgent: jest.fn(),
    onSelectPersona: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders list of agents', () => {
      render(<AgentList agents={mockAgents} {...mockCallbacks} />)
      expect(screen.getByText('Claude Code')).toBeInTheDocument()
      expect(screen.getByText('OpenClaw')).toBeInTheDocument()
    })

    it('renders agent with expand button when personas present', () => {
      render(<AgentList agents={mockAgents} {...mockCallbacks} />)
      const expandBtns = screen.getAllByTestId(/agent-expand-btn/)
      expect(expandBtns.length).toBeGreaterThan(0)
    })

    it('does not render expand button for agent without personas', () => {
      const agentWithoutPersonas = [
        {
          nm: 'Solo Agent',
          t: 'agent',
          ps: [],
          r: 'Standalone agent',
        },
      ]

      render(<AgentList agents={agentWithoutPersonas} {...mockCallbacks} />)
      const expandBtns = screen.queryAllByTestId(/agent-expand-btn/)
      expect(expandBtns.length).toBe(0)
    })
  })

  describe('Agent Selection', () => {
    it('calls onSelectAgent when agent button clicked', async () => {
      const user = userEvent.setup()
      render(<AgentList agents={mockAgents} {...mockCallbacks} />)

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      await user.click(claudeCodeBtn)

      expect(mockCallbacks.onSelectAgent).toHaveBeenCalledWith('claude-code')
    })

    it('highlights selected agent', async () => {
      const user = userEvent.setup()
      render(
        <AgentList
          agents={mockAgents}
          selectedAgent="claude-code"
          {...mockCallbacks}
        />
      )

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      expect(claudeCodeBtn).toHaveClass('selected')
    })

    it('updates selected class when selection changes', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <AgentList agents={mockAgents} {...mockCallbacks} />
      )

      let claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      expect(claudeCodeBtn).not.toHaveClass('selected')

      rerender(
        <AgentList
          agents={mockAgents}
          selectedAgent="claude-code"
          {...mockCallbacks}
        />
      )

      claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      expect(claudeCodeBtn).toHaveClass('selected')
    })
  })

  describe('Persona Expansion', () => {
    it('expands agent to show personas on button click', async () => {
      const user = userEvent.setup()
      render(<AgentList agents={mockAgents} {...mockCallbacks} />)

      const expandBtn = screen.getByTestId('agent-expand-btn-claude-code')
      expect(expandBtn).toHaveAttribute('aria-expanded', 'false')

      await user.click(expandBtn)

      expect(expandBtn).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByTestId('personas-claude-code')).toBeInTheDocument()
      expect(screen.getByText('architect')).toBeInTheDocument()
      expect(screen.getByText('developer')).toBeInTheDocument()
    })

    it('collapses agent to hide personas', async () => {
      const user = userEvent.setup()
      render(<AgentList agents={mockAgents} {...mockCallbacks} />)

      const expandBtn = screen.getByTestId('agent-expand-btn-claude-code')
      await user.click(expandBtn)
      await user.click(expandBtn)

      expect(expandBtn).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByTestId('personas-claude-code')).not.toBeInTheDocument()
    })

    it('independently toggles expansion for different agents', async () => {
      const user = userEvent.setup()
      render(<AgentList agents={mockAgents} {...mockCallbacks} />)

      const claudeExpandBtn = screen.getByTestId(
        'agent-expand-btn-claude-code'
      )
      const openClawExpandBtn = screen.getByTestId('agent-expand-btn-openclaw')

      await user.click(claudeExpandBtn)
      expect(screen.getByTestId('personas-claude-code')).toBeInTheDocument()
      expect(screen.queryByTestId('personas-openclaw')).not.toBeInTheDocument()

      await user.click(openClawExpandBtn)
      expect(screen.getByTestId('personas-claude-code')).toBeInTheDocument()
      expect(screen.getByTestId('personas-openclaw')).toBeInTheDocument()
    })
  })

  describe('Persona Selection', () => {
    it('calls onSelectPersona when persona clicked', async () => {
      const user = userEvent.setup()
      render(<AgentList agents={mockAgents} {...mockCallbacks} />)

      const expandBtn = screen.getByTestId('agent-expand-btn-claude-code')
      await user.click(expandBtn)

      const architectBtn = screen.getByTestId('persona-btn-architect')
      await user.click(architectBtn)

      expect(mockCallbacks.onSelectPersona).toHaveBeenCalledWith('architect')
    })

    it('highlights selected persona', async () => {
      const user = userEvent.setup()
      render(
        <AgentList
          agents={mockAgents}
          selectedPersona="architect"
          {...mockCallbacks}
        />
      )

      const expandBtn = screen.getByTestId('agent-expand-btn-claude-code')
      await user.click(expandBtn)

      const architectBtn = screen.getByTestId('persona-btn-architect')
      expect(architectBtn).toHaveClass('selected')
    })

    it('maintains agent selection while selecting persona', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <AgentList
          agents={mockAgents}
          selectedAgent="claude-code"
          {...mockCallbacks}
        />
      )

      const claudeCodeBtn = screen.getByTestId('agent-btn-claude-code')
      expect(claudeCodeBtn).toHaveClass('selected')

      const expandBtn = screen.getByTestId('agent-expand-btn-claude-code')
      await user.click(expandBtn)

      const architectBtn = screen.getByTestId('persona-btn-architect')
      await user.click(architectBtn)

      // Rerender with selectedPersona set to simulate parent update
      rerender(
        <AgentList
          agents={mockAgents}
          selectedAgent="claude-code"
          selectedPersona="architect"
          {...mockCallbacks}
        />
      )

      expect(claudeCodeBtn).toHaveClass('selected')
      expect(architectBtn).toHaveClass('selected')
    })
  })

  describe('Empty States', () => {
    it('renders empty list when agents array is empty', () => {
      render(<AgentList agents={[]} {...mockCallbacks} />)
      expect(screen.getByText(/No agents available/)).toBeInTheDocument()
    })

    it('renders empty list when agents is null', () => {
      render(<AgentList agents={null} {...mockCallbacks} />)
      expect(screen.getByText(/No agents available/)).toBeInTheDocument()
    })
  })

  describe('Persona Display', () => {
    it('renders all personas for agent when expanded', async () => {
      const user = userEvent.setup()
      const agentWithMultiplePersonas = [
        {
          nm: 'Multi Agent',
          t: 'agent',
          ps: ['role1', 'role2', 'role3'],
          r: 'Agent with many personas',
        },
      ]

      render(
        <AgentList
          agents={agentWithMultiplePersonas}
          {...mockCallbacks}
        />
      )

      const expandBtn = screen.getByTestId('agent-expand-btn-multi-agent')
      await user.click(expandBtn)

      expect(screen.getByText('role1')).toBeInTheDocument()
      expect(screen.getByText('role2')).toBeInTheDocument()
      expect(screen.getByText('role3')).toBeInTheDocument()
    })
  })
})
