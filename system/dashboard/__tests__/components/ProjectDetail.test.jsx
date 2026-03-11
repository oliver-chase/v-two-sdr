import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectDetail from '../../src/components/ProjectDetail'

// Mock useFetchData hook
jest.mock('../../src/hooks/useFetchData', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock child components
jest.mock('../../src/components/ProjectDevelopmentView', () => {
  return function MockDev({ project }) {
    return <div data-testid="dev-view">Development View for {project.name}</div>
  }
})

jest.mock('../../src/components/ProjectExecutionView', () => {
  return function MockExec({ project }) {
    return <div data-testid="exec-view">Execution View for {project.name}</div>
  }
})

const useFetchDataMock = require('../../src/hooks/useFetchData').default

describe('ProjectDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state while fetching project', () => {
    useFetchDataMock.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    })

    render(<ProjectDetail projectId="fallow" />)
    const loadingState = screen.getByTestId('project-detail-loading')
    expect(loadingState).toBeInTheDocument()
  })

  it('renders error state when fetch fails', async () => {
    useFetchDataMock.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
    })

    render(<ProjectDetail projectId="fallow" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders development view for development state', async () => {
    const mockProject = {
      id: 'fallow',
      name: 'Fallow',
      lifecycle: 'development',
      startTime: '2026-01-15T10:00:00Z',
      lastActivity: '2026-03-11T14:30:00Z',
      progress: 45,
      roadmap: ['Phase 1', 'Phase 2', 'Phase 3'],
      blockers: ['API integration', 'Testing'],
      issues: [{ id: 1, title: 'Bug in auth', severity: 'high' }],
      files: [],
      paused: false,
    }

    useFetchDataMock.mockReturnValue({
      data: mockProject,
      loading: false,
      error: null,
    })

    render(<ProjectDetail projectId="fallow" />)
    expect(screen.getByTestId('dev-view')).toBeInTheDocument()
  })

  it('renders execution view for execution state', async () => {
    const mockProject = {
      id: 'oliver-dashboard',
      name: 'Oliver Dashboard',
      lifecycle: 'execution',
      startTime: '2026-02-01T10:00:00Z',
      lastActivity: '2026-03-11T14:30:00Z',
      metrics: {
        uptime: 99.9,
        avgResponseTime: 145,
        requestCount: 5000,
      },
    }

    useFetchDataMock.mockReturnValue({
      data: mockProject,
      loading: false,
      error: null,
    })

    render(<ProjectDetail projectId="oliver-dashboard" />)
    expect(screen.getByTestId('exec-view')).toBeInTheDocument()
  })

  it('displays project name in header', async () => {
    const mockProject = {
      id: 'fallow',
      name: 'Fallow',
      lifecycle: 'development',
      startTime: '2026-01-15T10:00:00Z',
      lastActivity: '2026-03-11T14:30:00Z',
    }

    useFetchDataMock.mockReturnValue({
      data: mockProject,
      loading: false,
      error: null,
    })

    render(<ProjectDetail projectId="fallow" />)
    expect(screen.getByText('Fallow')).toBeInTheDocument()
  })

  it('shows close button', async () => {
    const mockProject = {
      id: 'fallow',
      name: 'Fallow',
      lifecycle: 'development',
      startTime: '2026-01-15T10:00:00Z',
      lastActivity: '2026-03-11T14:30:00Z',
    }

    const mockOnClose = jest.fn()

    useFetchDataMock.mockReturnValue({
      data: mockProject,
      loading: false,
      error: null,
    })

    render(<ProjectDetail projectId="fallow" onClose={mockOnClose} />)
    const closeBtn = screen.getByRole('button', { name: /close/i })
    expect(closeBtn).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const mockProject = {
      id: 'fallow',
      name: 'Fallow',
      lifecycle: 'development',
      startTime: '2026-01-15T10:00:00Z',
      lastActivity: '2026-03-11T14:30:00Z',
    }

    const mockOnClose = jest.fn()

    useFetchDataMock.mockReturnValue({
      data: mockProject,
      loading: false,
      error: null,
    })

    render(<ProjectDetail projectId="fallow" onClose={mockOnClose} />)
    const closeBtn = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeBtn)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('displays lifecycle badge', async () => {
    const mockProject = {
      id: 'fallow',
      name: 'Fallow',
      lifecycle: 'development',
      startTime: '2026-01-15T10:00:00Z',
      lastActivity: '2026-03-11T14:30:00Z',
    }

    useFetchDataMock.mockReturnValue({
      data: mockProject,
      loading: false,
      error: null,
    })

    render(<ProjectDetail projectId="fallow" />)
    expect(screen.getByText('DEVELOPMENT')).toBeInTheDocument()
  })

  it('refetches when projectId changes', async () => {
    const mockProject1 = {
      id: 'project1',
      name: 'Project 1',
      lifecycle: 'development',
      startTime: '2026-01-15T10:00:00Z',
      lastActivity: '2026-03-11T14:30:00Z',
    }

    useFetchDataMock.mockReturnValue({
      data: mockProject1,
      loading: false,
      error: null,
    })

    const { rerender } = render(<ProjectDetail projectId="project1" />)
    expect(screen.getByText('Project 1')).toBeInTheDocument()

    const mockProject2 = {
      id: 'project2',
      name: 'Project 2',
      lifecycle: 'execution',
      startTime: '2026-02-15T10:00:00Z',
      lastActivity: '2026-03-11T14:30:00Z',
    }

    useFetchDataMock.mockReturnValue({
      data: mockProject2,
      loading: false,
      error: null,
    })

    rerender(<ProjectDetail projectId="project2" />)
    expect(screen.getByText('Project 2')).toBeInTheDocument()
  })
})
