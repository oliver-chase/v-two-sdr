import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectsList from '../../src/components/ProjectsList'

// Mock useFetchData hook
jest.mock('../../src/hooks/useFetchData', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const useFetchDataMock = require('../../src/hooks/useFetchData').default

describe('ProjectsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading skeleton while fetching projects', () => {
    useFetchDataMock.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    })

    render(<ProjectsList />)
    const skeletons = screen.getAllByTestId('project-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders error state when fetch fails', async () => {
    useFetchDataMock.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
    })

    render(<ProjectsList />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders empty state when no projects found', async () => {
    useFetchDataMock.mockReturnValue({
      data: { projects: [] },
      loading: false,
      error: null,
    })

    render(<ProjectsList />)
    const emptyMsg = screen.getByText(
      /no projects found in the workspaces directory/i
    )
    expect(emptyMsg).toBeInTheDocument()
  })

  it('renders project list with project data', async () => {
    const mockProjects = {
      projects: [
        {
          id: 'fallow',
          name: 'Fallow',
          lifecycle: 'development',
          lastActivity: '2026-03-11T14:30:00Z',
          errorCount: 2,
          warningCount: 1,
        },
        {
          id: 'oliver-dashboard',
          name: 'Oliver Dashboard',
          lifecycle: 'execution',
          lastActivity: '2026-03-11T13:00:00Z',
          errorCount: 0,
          warningCount: 0,
        },
      ],
    }

    useFetchDataMock.mockReturnValue({
      data: mockProjects,
      loading: false,
      error: null,
    })

    render(<ProjectsList />)
    expect(screen.getByText('Fallow')).toBeInTheDocument()
    expect(screen.getByText('Oliver Dashboard')).toBeInTheDocument()
    expect(screen.getByText('DEVELOPMENT')).toBeInTheDocument()
    expect(screen.getByText('EXECUTION')).toBeInTheDocument()
  })

  it('displays error count badges', async () => {
    const mockProjects = {
      projects: [
        {
          id: 'fallow',
          name: 'Fallow',
          lifecycle: 'development',
          lastActivity: '2026-03-11T14:30:00Z',
          errorCount: 2,
          warningCount: 1,
        },
      ],
    }

    useFetchDataMock.mockReturnValue({
      data: mockProjects,
      loading: false,
      error: null,
    })

    render(<ProjectsList />)
    expect(screen.getByText('2')).toBeInTheDocument() // error count
    expect(screen.getByText('1')).toBeInTheDocument() // warning count
  })

  it('calls onClick handler when project is clicked', async () => {
    const mockOnSelectProject = jest.fn()
    const mockProjects = {
      projects: [
        {
          id: 'fallow',
          name: 'Fallow',
          lifecycle: 'development',
          lastActivity: '2026-03-11T14:30:00Z',
          errorCount: 0,
          warningCount: 0,
        },
      ],
    }

    useFetchDataMock.mockReturnValue({
      data: mockProjects,
      loading: false,
      error: null,
    })

    render(<ProjectsList onSelectProject={mockOnSelectProject} />)
    const projectButton = screen.getByText('Fallow')
    await userEvent.click(projectButton)
    expect(mockOnSelectProject).toHaveBeenCalledWith('fallow')
  })

  it('formats last activity timestamp correctly', async () => {
    const mockProjects = {
      projects: [
        {
          id: 'fallow',
          name: 'Fallow',
          lifecycle: 'development',
          lastActivity: '2026-03-11T14:30:00Z',
          errorCount: 0,
          warningCount: 0,
        },
      ],
    }

    useFetchDataMock.mockReturnValue({
      data: mockProjects,
      loading: false,
      error: null,
    })

    render(<ProjectsList />)
    // Should show relative time like "2 hours ago"
    expect(screen.getByText(/ago/i)).toBeInTheDocument()
  })

  it('applies lifecycle badge styling', async () => {
    const mockProjects = {
      projects: [
        {
          id: 'fallow',
          name: 'Fallow',
          lifecycle: 'development',
          lastActivity: '2026-03-11T14:30:00Z',
          errorCount: 0,
          warningCount: 0,
        },
        {
          id: 'oliver',
          name: 'Oliver Dashboard',
          lifecycle: 'execution',
          lastActivity: '2026-03-11T13:00:00Z',
          errorCount: 0,
          warningCount: 0,
        },
      ],
    }

    useFetchDataMock.mockReturnValue({
      data: mockProjects,
      loading: false,
      error: null,
    })

    render(<ProjectsList />)
    const devBadge = screen.getByText('DEVELOPMENT')
    const execBadge = screen.getByText('EXECUTION')

    expect(devBadge.className).toContain('badge')
    expect(execBadge.className).toContain('badge')
  })
})
