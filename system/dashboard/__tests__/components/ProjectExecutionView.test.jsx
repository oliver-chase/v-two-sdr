import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectExecutionView from '../../src/components/ProjectExecutionView'

describe('ProjectExecutionView', () => {
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
      errorRate: 0.1,
    },
    customMetrics: [
      {
        name: 'Active Users',
        value: 42,
        unit: 'count',
        timestamp: '2026-03-11T14:30:00Z',
      },
      {
        name: 'Response Time P95',
        value: 280,
        unit: 'ms',
        timestamp: '2026-03-11T14:30:00Z',
      },
    ],
  }

  it('displays operational metrics as stat blocks', () => {
    render(<ProjectExecutionView project={mockProject} />)
    const uptimeLabels = screen.getAllByText(/UPTIME/i)
    expect(uptimeLabels.length).toBeGreaterThan(0)
    expect(screen.getByText('99.9%')).toBeInTheDocument()
  })

  it('shows average response time', () => {
    render(<ProjectExecutionView project={mockProject} />)
    const rtLabels = screen.getAllByText(/AVG RESPONSE TIME/i)
    expect(rtLabels.length).toBeGreaterThan(0)
    expect(screen.getByText(/145ms/)).toBeInTheDocument()
  })

  it('displays request count', () => {
    render(<ProjectExecutionView project={mockProject} />)
    const requestLabels = screen.getAllByText(/REQUESTS/i)
    expect(requestLabels.length).toBeGreaterThan(0)
    expect(screen.getByText('5,000')).toBeInTheDocument()
  })

  it('shows error rate', () => {
    render(<ProjectExecutionView project={mockProject} />)
    const errorLabels = screen.getAllByText(/ERROR RATE/i)
    expect(errorLabels.length).toBeGreaterThan(0)
    expect(screen.getByText('0.1%')).toBeInTheDocument()
  })

  it('displays custom metrics', () => {
    render(<ProjectExecutionView project={mockProject} />)
    expect(screen.getByText('Active Users')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Response Time P95')).toBeInTheDocument()
    expect(screen.getByText('280')).toBeInTheDocument()
  })

  it('provides time filtering options', () => {
    render(<ProjectExecutionView project={mockProject} />)
    expect(screen.getByRole('button', { name: /show metrics for today/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom date range/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /available metrics history/i })).toBeInTheDocument()
  })

  it('shows uptime stat block with percentage', () => {
    render(<ProjectExecutionView project={mockProject} />)
    const uptimeStat = screen.getByText(/uptime/i).closest('.stat-card')
    expect(uptimeStat).toHaveTextContent('99.9%')
  })

  it('handles zero error rate', () => {
    const noErrorProject = {
      ...mockProject,
      metrics: { ...mockProject.metrics, errorRate: 0 },
    }
    render(<ProjectExecutionView project={noErrorProject} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('handles missing custom metrics gracefully', () => {
    const projectNoCustom = { ...mockProject, customMetrics: [] }
    render(<ProjectExecutionView project={projectNoCustom} />)
    // Should not crash and still display time filter
    const timeFilters = screen.getAllByRole('button')
    expect(timeFilters.length).toBeGreaterThan(0)
  })

  it('handles missing metrics gracefully', () => {
    const minimalProject = {
      id: 'minimal',
      name: 'Minimal',
      lifecycle: 'execution',
      startTime: '2026-03-11T00:00:00Z',
      lastActivity: '2026-03-11T14:30:00Z',
    }
    render(<ProjectExecutionView project={minimalProject} />)
    // Should render without errors
    const timeFilters = screen.getAllByRole('button')
    expect(timeFilters.length).toBeGreaterThan(0)
  })

  it('shows project start time', () => {
    render(<ProjectExecutionView project={mockProject} />)
    expect(screen.getByText(/started/i)).toBeInTheDocument()
  })

  it('displays metrics section header', () => {
    render(<ProjectExecutionView project={mockProject} />)
    const metricsHeaders = screen.getAllByText(/OPERATIONAL METRICS/i)
    expect(metricsHeaders.length).toBeGreaterThan(0)
  })

  it('renders custom metrics with units', () => {
    render(<ProjectExecutionView project={mockProject} />)
    expect(screen.getByText('count')).toBeInTheDocument()
    // Check for 'ms' in metric unit badge specifically
    const msElements = screen.getAllByText(/ms/i)
    expect(msElements.length).toBeGreaterThan(0)
  })
})
