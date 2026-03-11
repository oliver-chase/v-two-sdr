import { useState } from 'react'
import useFetchData from '../hooks/useFetchData'
import LoadingState from './Shared/LoadingState'
import ErrorBanner from './Shared/ErrorBanner'
import './ProjectsList.css'

function formatRelativeTime(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return then.toLocaleDateString()
}

export default function ProjectsList({ onSelectProject }) {
  const { data, loading, error } = useFetchData('/api/projects')
  const [selectedProject, setSelectedProject] = useState(null)

  if (loading) {
    return (
      <div className="card projects-list-panel">
        <h2>Projects</h2>
        <div className="projects-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="project-skeleton" data-testid="project-skeleton">
              <div className="skeleton-row">
                <div className="skeleton skeleton-title"></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton skeleton-badge"></div>
                <div className="skeleton skeleton-badge"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card projects-list-panel">
        <h2>Projects</h2>
        <ErrorBanner
          message="Failed to load projects. Please try refreshing."
          onDismiss={() => {}}
        />
      </div>
    )
  }

  const projects = data?.projects || []

  if (projects.length === 0) {
    return (
      <div className="card projects-list-panel">
        <h2>Projects</h2>
        <div className="empty-state">
          No projects found in the workspaces directory. Create a project folder
          there and Oliver will pick it up automatically.
        </div>
      </div>
    )
  }

  const handleSelectProject = (projectId) => {
    setSelectedProject(projectId)
    if (onSelectProject) {
      onSelectProject(projectId)
    }
  }

  return (
    <div className="card projects-list-panel">
      <h2>Projects</h2>
      <p className="panel-subtitle">
        {projects.length} project{projects.length !== 1 ? 's' : ''}
      </p>

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <button
              className={`project-header-btn ${selectedProject === project.id ? 'selected' : ''}`}
              onClick={() => handleSelectProject(project.id)}
              aria-label={`View ${project.name} project details`}
            >
              <span className="project-name">{project.name}</span>
            </button>

            <div className="project-meta">
              <span
                className={`badge badge-${project.lifecycle}`}
                title={`Lifecycle: ${project.lifecycle}`}
              >
                {project.lifecycle.toUpperCase()}
              </span>

              <span className="project-activity">
                {formatRelativeTime(project.lastActivity)}
              </span>
            </div>

            <div className="project-alerts">
              {project.errorCount > 0 && (
                <span
                  className="badge badge-error"
                  title={`${project.errorCount} error${project.errorCount !== 1 ? 's' : ''}`}
                >
                  {project.errorCount}
                </span>
              )}
              {project.warningCount > 0 && (
                <span
                  className="badge badge-warning"
                  title={`${project.warningCount} warning${project.warningCount !== 1 ? 's' : ''}`}
                >
                  {project.warningCount}
                </span>
              )}
              {project.errorCount === 0 && project.warningCount === 0 && (
                <span className="badge badge-ok" title="No errors or warnings">
                  OK
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
