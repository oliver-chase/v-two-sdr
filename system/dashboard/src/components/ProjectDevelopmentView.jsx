import './ProjectDevelopmentView.css'

function formatDate(timestamp) {
  if (!timestamp) return 'unknown'
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ProjectDevelopmentView({ project }) {
  const {
    name,
    progress = 0,
    startTime,
    lastActivity,
    roadmap = [],
    blockers = [],
    issues = [],
    files = [],
    paused = false,
    tokenUsage = {},
    activityPatterns = {},
  } = project

  return (
    <div className="development-view">
      {/* Progress and Status */}
      <div className="view-section">
        <h3 className="section-label">PROGRESS</h3>
        <div className="stat-card">
          <span className="stat-label">PROGRESS</span>
          <span className="stat-value">{progress}%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {paused && (
          <div className="status-banner paused">
            Project is currently paused
          </div>
        )}
      </div>

      {/* Roadmap */}
      <div className="view-section">
        <h3 className="section-label">ROADMAP</h3>
        <div className="roadmap-list">
          {roadmap.length > 0 ? (
            roadmap.map((item, idx) => (
              <div key={idx} className="roadmap-item">
                <span className="roadmap-number">{idx + 1}</span>
                <span className="roadmap-text">{item}</span>
              </div>
            ))
          ) : (
            <p className="empty-text">No roadmap items defined</p>
          )}
        </div>
      </div>

      {/* Blockers */}
      <div className="view-section">
        <h3 className="section-label">BLOCKERS</h3>
        <div className="blockers-list">
          {blockers.length > 0 ? (
            blockers.map((blocker, idx) => (
              <div key={idx} className="blocker-item">
                <span className="blocker-icon">⚠</span>
                <span className="blocker-text">{blocker}</span>
              </div>
            ))
          ) : (
            <p className="empty-text">No blockers reported</p>
          )}
        </div>
      </div>

      {/* Known Issues */}
      {issues.length > 0 && (
        <div className="view-section">
          <h3 className="section-label">KNOWN ISSUES</h3>
          <div className="issues-list">
            {issues.map((issue) => (
              <div key={issue.id} className={`issue-item severity-${issue.severity}`}>
                <span className="issue-title">{issue.title}</span>
                <span className={`issue-severity badge-${issue.severity}`}>
                  {issue.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Associated Files */}
      {files.length > 0 && (
        <div className="view-section">
          <h3 className="section-label">ASSOCIATED FILES</h3>
          <div className="files-list">
            {files.map((file, idx) => (
              <div key={idx} className="file-item">
                <span className="file-icon">📄</span>
                <span className="file-name">{file}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token Usage */}
      {tokenUsage && tokenUsage.total > 0 && (
        <div className="view-section">
          <h3 className="section-label">TOKEN USAGE</h3>
          <div className="stat-card">
            <span className="stat-label">TOTAL TOKENS</span>
            <span className="stat-value">{tokenUsage.total.toLocaleString()}</span>
          </div>

          {tokenUsage.byModel && Object.keys(tokenUsage.byModel).length > 0 && (
            <div className="model-breakdown">
              {Object.entries(tokenUsage.byModel).map(([model, count]) => (
                <div key={model} className="model-row">
                  <span className="model-name">{model}</span>
                  <span className="model-count">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Patterns */}
      {activityPatterns && (
        <div className="view-section">
          <h3 className="section-label">ACTIVITY</h3>
          <div className="activity-stats">
            {activityPatterns.lastDay !== undefined && (
              <div className="activity-stat">
                <span className="activity-label">Last 24h</span>
                <span className="activity-value">{activityPatterns.lastDay}</span>
              </div>
            )}
            {activityPatterns.lastWeek !== undefined && (
              <div className="activity-stat">
                <span className="activity-label">Last 7d</span>
                <span className="activity-value">{activityPatterns.lastWeek}</span>
              </div>
            )}
            {activityPatterns.lastMonth !== undefined && (
              <div className="activity-stat">
                <span className="activity-label">Last 30d</span>
                <span className="activity-value">{activityPatterns.lastMonth}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="view-section metadata-section">
        <h3 className="section-label">METADATA</h3>
        <div className="metadata-row">
          <span className="metadata-label">Started</span>
          <span className="metadata-value">{formatDate(startTime)}</span>
        </div>
        <div className="metadata-row">
          <span className="metadata-label">Last Activity</span>
          <span className="metadata-value">{formatDate(lastActivity)}</span>
        </div>
      </div>
    </div>
  )
}
