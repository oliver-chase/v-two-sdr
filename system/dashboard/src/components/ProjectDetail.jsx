import useFetchData from '../hooks/useFetchData'
import ProjectDevelopmentView from './ProjectDevelopmentView'
import ProjectExecutionView from './ProjectExecutionView'
import LoadingState from './Shared/LoadingState'
import ErrorBanner from './Shared/ErrorBanner'
import './ProjectDetail.css'

export default function ProjectDetail({ projectId, onClose }) {
  const { data: project, loading, error } = useFetchData(
    projectId ? `/api/project/${projectId}` : null
  )

  if (!projectId) {
    return null
  }

  if (loading) {
    return (
      <div className="card project-detail-panel">
        <div className="project-detail-header">
          <h2>Loading Project</h2>
          <button
            className="btn btn-close"
            onClick={onClose}
            aria-label="Close project detail"
          >
            ✕
          </button>
        </div>
        <div data-testid="project-detail-loading">
          <LoadingState message="Loading project details..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card project-detail-panel">
        <div className="project-detail-header">
          <h2>Project Detail</h2>
          <button
            className="btn btn-close"
            onClick={onClose}
            aria-label="Close project detail"
          >
            ✕
          </button>
        </div>
        <ErrorBanner
          message="Failed to load project details. Please try again."
          onDismiss={() => {}}
        />
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="card project-detail-panel">
      <div className="project-detail-header">
        <div className="project-detail-title">
          <h2>{project.name}</h2>
          <span className={`badge badge-${project.lifecycle}`}>
            {project.lifecycle.toUpperCase()}
          </span>
        </div>
        <button
          className="btn btn-close"
          onClick={onClose}
          aria-label="Close project detail"
        >
          ✕
        </button>
      </div>

      {project.lifecycle === 'development' ? (
        <ProjectDevelopmentView project={project} />
      ) : (
        <ProjectExecutionView project={project} />
      )}
    </div>
  )
}
