import { render, screen } from '@testing-library/react'
import ProjectDevelopmentView from '../../src/components/ProjectDevelopmentView'

describe('ProjectDevelopmentView', () => {
  const mockProject = {
    id: 'fallow',
    name: 'Fallow',
    lifecycle: 'development',
    progress: 45,
    startTime: '2026-01-15T10:00:00Z',
    lastActivity: '2026-03-11T14:30:00Z',
    roadmap: ['Phase 1: Planning', 'Phase 2: Design', 'Phase 3: Development'],
    blockers: ['API integration delayed', 'Database schema pending review'],
    issues: [
      { id: 1, title: 'Auth flow bug', severity: 'high' },
      { id: 2, title: 'CSS alignment issue', severity: 'low' },
    ],
    files: ['MASTER.md', 'PROGRESS.md', 'src/components/App.jsx'],
    paused: false,
    tokenUsage: {
      total: 15000,
      byModel: {
        haiku: 10000,
        sonnet: 5000,
      },
    },
    activityPatterns: {
      lastDay: 5,
      lastWeek: 20,
      lastMonth: 85,
    },
  }

  it('displays progress as stat block', () => {
    render(<ProjectDevelopmentView project={mockProject} />)
    const progressLabels = screen.getAllByText('PROGRESS')
    expect(progressLabels.length).toBeGreaterThan(0)
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('shows roadmap items', () => {
    render(<ProjectDevelopmentView project={mockProject} />)
    expect(screen.getByText('Phase 1: Planning')).toBeInTheDocument()
    expect(screen.getByText('Phase 2: Design')).toBeInTheDocument()
    expect(screen.getByText('Phase 3: Development')).toBeInTheDocument()
  })

  it('displays blockers section', () => {
    render(<ProjectDevelopmentView project={mockProject} />)
    const blockerHeaders = screen.getAllByText('BLOCKERS')
    expect(blockerHeaders.length).toBeGreaterThan(0)
    expect(screen.getByText('API integration delayed')).toBeInTheDocument()
    expect(screen.getByText('Database schema pending review')).toBeInTheDocument()
  })

  it('displays known issues with severity', () => {
    render(<ProjectDevelopmentView project={mockProject} />)
    expect(screen.getByText('Auth flow bug')).toBeInTheDocument()
    expect(screen.getByText('CSS alignment issue')).toBeInTheDocument()
  })

  it('shows associated files', () => {
    render(<ProjectDevelopmentView project={mockProject} />)
    const fileHeaders = screen.getAllByText(/ASSOCIATED FILES/i)
    expect(fileHeaders.length).toBeGreaterThan(0)
    expect(screen.getByText('MASTER.md')).toBeInTheDocument()
  })

  it('displays token usage', () => {
    render(<ProjectDevelopmentView project={mockProject} />)
    const tokenHeaders = screen.getAllByText(/TOKEN USAGE/i)
    expect(tokenHeaders.length).toBeGreaterThan(0)
    expect(screen.getByText('15,000')).toBeInTheDocument()
  })

  it('shows project start time', () => {
    render(<ProjectDevelopmentView project={mockProject} />)
    expect(screen.getByText(/started/i)).toBeInTheDocument()
  })

  it('displays activity patterns', () => {
    render(<ProjectDevelopmentView project={mockProject} />)
    const activityHeaders = screen.getAllByText(/ACTIVITY/i)
    expect(activityHeaders.length).toBeGreaterThan(0)
  })

  it('shows paused state when paused is true', () => {
    const pausedProject = { ...mockProject, paused: true }
    render(<ProjectDevelopmentView project={pausedProject} />)
    expect(screen.getByText(/paused/i)).toBeInTheDocument()
  })

  it('handles empty roadmap gracefully', () => {
    const projectNoRoadmap = { ...mockProject, roadmap: [] }
    render(<ProjectDevelopmentView project={projectNoRoadmap} />)
    const roadmapHeaders = screen.getAllByText(/ROADMAP/i)
    expect(roadmapHeaders.length).toBeGreaterThan(0)
  })

  it('handles empty blockers gracefully', () => {
    const projectNoBlockers = { ...mockProject, blockers: [] }
    render(<ProjectDevelopmentView project={projectNoBlockers} />)
    expect(screen.getByText(/no blockers/i)).toBeInTheDocument()
  })

  it('handles undefined optional fields', () => {
    const minimalProject = {
      id: 'minimal',
      name: 'Minimal',
      lifecycle: 'development',
      progress: 0,
      startTime: '2026-03-11T00:00:00Z',
    }
    render(<ProjectDevelopmentView project={minimalProject} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
