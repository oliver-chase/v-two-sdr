import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentDetail from '../../src/components/AgentDetail'

// Mock useFetchData hook
jest.mock('../../src/hooks/useFetchData', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const useFetchDataMock = require('../../src/hooks/useFetchData').default

describe('AgentDetail', () => {
  const mockCallbacks = {
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Agent Detail View', () => {
    it('renders loading state while fetching agent instructions', () => {
      useFetchDataMock.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      expect(screen.getByText(/Loading details/)).toBeInTheDocument()
    })

    it('renders error state when fetch fails', () => {
      useFetchDataMock.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Failed to fetch'),
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders agent name and role', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      expect(screen.getByTestId('detail-title')).toHaveTextContent(
        'Claude Code'
      )
      expect(screen.getByTestId('detail-role')).toHaveTextContent('Lead agent')
    })

    it('renders agent type badge', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      const badge = screen.getByTestId('agent-type-badge')
      expect(badge).toHaveTextContent('AGENT')
    })

    it('renders close button', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      const closeBtn = screen.getByTestId('detail-close-btn')
      expect(closeBtn).toBeInTheDocument()
    })

    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup()
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      const closeBtn = screen.getByTestId('detail-close-btn')
      await user.click(closeBtn)

      expect(mockCallbacks.onClose).toHaveBeenCalled()
    })
  })

  describe('Persona Detail View', () => {
    it('renders persona name and type', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Persona content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'architect',
            t: 'persona',
            r: 'System architecture specialist',
          }}
          type="persona"
          {...mockCallbacks}
        />
      )

      expect(screen.getByTestId('detail-title')).toHaveTextContent('architect')
      expect(screen.getByTestId('detail-role')).toHaveTextContent(
        'System architecture specialist'
      )
    })

    it('renders persona type badge', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Persona content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'developer',
            t: 'persona',
          }}
          type="persona"
          {...mockCallbacks}
        />
      )

      const badge = screen.getByTestId('agent-type-badge')
      expect(badge).toHaveTextContent('PERSONA')
    })
  })

  describe('Content Sections', () => {
    it('renders startup protocol section', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      expect(screen.getByTestId('startup-protocol')).toBeInTheDocument()
    })

    it('renders relationships section', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      expect(screen.getByTestId('relationships-section')).toBeInTheDocument()
    })

    it('renders documentation link section', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      expect(screen.getByTestId('doc-links-section')).toBeInTheDocument()
    })
  })

  describe('Documentation Links', () => {
    it('displays instructions link for agents', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      const docLink = screen.getByTestId('agent-instructions-link')
      expect(docLink).toBeInTheDocument()
      expect(docLink).toHaveTextContent(/Agent Instructions|View Instructions/)
    })

    it('displays soul link for personas', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Persona content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'architect',
            t: 'persona',
          }}
          type="persona"
          {...mockCallbacks}
        />
      )

      const soulLink = screen.getByTestId('persona-soul-link')
      expect(soulLink).toBeInTheDocument()
    })
  })

  describe('Skills Display', () => {
    it('renders skills badge for agents with personas', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            ps: ['architect', 'developer', 'tester'],
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      const badge = screen.getByTestId('skills-badge')
      expect(badge).toHaveTextContent('3 Personas')
    })

    it('does not render skills badge when no personas', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            ps: [],
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      expect(screen.queryByTestId('skills-badge')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('renders nothing when agent is null', () => {
      render(
        <AgentDetail agent={null} type="agent" {...mockCallbacks} />
      )

      expect(screen.queryByTestId('detail-title')).not.toBeInTheDocument()
    })

    it('renders nothing when type is not provided', () => {
      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
          }}
          {...mockCallbacks}
        />
      )

      expect(screen.queryByTestId('detail-title')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('Claude Code')
    })

    it('close button has aria-label', () => {
      useFetchDataMock.mockReturnValue({
        data: { c: 'Agent content' },
        loading: false,
        error: null,
      })

      render(
        <AgentDetail
          agent={{
            nm: 'Claude Code',
            t: 'agent',
            r: 'Lead agent',
          }}
          type="agent"
          {...mockCallbacks}
        />
      )

      const closeBtn = screen.getByTestId('detail-close-btn')
      expect(closeBtn).toHaveAttribute('aria-label')
    })
  })
})
