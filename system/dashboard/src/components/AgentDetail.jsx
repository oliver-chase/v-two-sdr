import useFetchData from '../hooks/useFetchData'
import LoadingState from './Shared/LoadingState'
import ErrorBanner from './Shared/ErrorBanner'
import SkillLink from './SkillLink'
import './AgentDetail.css'

export default function AgentDetail({
  agent,
  parentAgent,
  type,
  onClose,
}) {
  if (!agent || !type) {
    return null
  }

  // Determine which API endpoint to call
  const agentName = typeof agent === 'object' ? agent.nm : agent
  const apiUrl = type === 'agent'
    ? `/api/agent/${agentName}/instructions`
    : `/api/soul/${agentName}`

  const { data: instructions, loading, error } = useFetchData(apiUrl)

  if (loading) {
    return (
      <div className="agent-detail">
        <div className="detail-header">
          <h3>Loading Agent Details</h3>
          <button
            className="btn btn-close"
            onClick={onClose}
            aria-label="Close details"
            data-testid="detail-close-btn"
          >
            Close
          </button>
        </div>
        <LoadingState message="Loading details..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="agent-detail">
        <div className="detail-header">
          <h3>{type === 'agent' ? agent.nm : agent}</h3>
          <button
            className="btn btn-close"
            onClick={onClose}
            aria-label="Close details"
            data-testid="detail-close-btn"
          >
            Close
          </button>
        </div>
        <ErrorBanner
          message="Failed to load details. Please try again."
          onDismiss={() => {}}
        />
      </div>
    )
  }

  const displayName = type === 'agent' ? agent.nm : agentName
  const role = typeof agent === 'object' ? (agent.r || '') : ''
  const personas = type === 'agent' ? (agent.ps || []) : []

  return (
    <div className="agent-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-title-section">
          <h3 data-testid="detail-title">{displayName}</h3>
          <span
            className={`badge badge-${type}`}
            data-testid="agent-type-badge"
          >
            {type.toUpperCase()}
          </span>
        </div>
        <button
          className="btn btn-close"
          onClick={onClose}
          aria-label="Close details"
          data-testid="detail-close-btn"
        >
          Close
        </button>
      </div>

      {/* Role/Description */}
      {role && (
        <p className="detail-role" data-testid="detail-role">
          {role}
        </p>
      )}

      {/* Skills/Personas Count */}
      {type === 'agent' && personas.length > 0 && (
        <div className="skills-badge" data-testid="skills-badge">
          {personas.length} Persona{personas.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Content Cards */}
      <div className="detail-content">
        {/* Startup Protocol */}
        <div className="detail-card">
          <div className="card-section-header">STARTUP PROTOCOL</div>
          <div className="startup-protocol" data-testid="startup-protocol">
            {type === 'agent' ? (
              <p>
                This agent is initialized through the shared startup sequence defined in
                {' '}
                <code>agents/shared-instructions.md</code>
                . It follows the multi-agent handoff protocol.
              </p>
            ) : (
              <p>
                This persona is activated when its parent agent enters this role.
                Check the soul file for activation criteria.
              </p>
            )}
          </div>
        </div>

        {/* Relationships */}
        {type === 'agent' && (
          <div className="detail-card">
            <div className="card-section-header">RELATIONSHIPS</div>
            <div className="relationships-section" data-testid="relationships-section">
              <p>
                This agent is part of the multi-agent system orchestrated by Claude Code.
                Handoff relationships are defined in the shared instructions file.
              </p>
            </div>
          </div>
        )}

        {/* Personas List */}
        {type === 'agent' && personas.length > 0 && (
          <div className="detail-card">
            <div className="card-section-header">PERSONAS</div>
            <div className="personas-list">
              {personas.map((persona) => (
                <SkillLink
                  key={persona}
                  skillName={persona}
                  onClick={() => {}}
                  title={`View ${persona} persona details`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Documentation Links */}
        <div className="detail-card">
          <div className="card-section-header">DOCUMENTATION</div>
          <div className="doc-links-section" data-testid="doc-links-section">
            {type === 'agent' ? (
              <a
                href="#"
                className="doc-link"
                data-testid="agent-instructions-link"
                onClick={(e) => {
                  e.preventDefault()
                }}
              >
                View Agent Instructions
              </a>
            ) : (
              <a
                href="#"
                className="doc-link"
                data-testid="persona-soul-link"
                onClick={(e) => {
                  e.preventDefault()
                }}
              >
                View Persona Soul File
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
