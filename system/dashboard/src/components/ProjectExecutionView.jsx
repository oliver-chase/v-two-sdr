import { useState } from 'react'
import './ProjectExecutionView.css'

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

export default function ProjectExecutionView({ project }) {
  const {
    name,
    startTime,
    lastActivity,
    metrics = {},
    customMetrics = [],
  } = project

  const [timeFilter, setTimeFilter] = useState('full')

  const {
    uptime = 0,
    avgResponseTime = 0,
    requestCount = 0,
    errorRate = 0,
  } = metrics

  return (
    <div className="execution-view">
      {/* Time Filtering */}
      <div className="view-section time-filter-section">
        <h3 className="section-label">TIME RANGE</h3>
        <div className="time-filter-buttons">
          <button
            className={`time-btn ${timeFilter === 'today' ? 'active' : ''}`}
            onClick={() => setTimeFilter('today')}
          >
            Today
          </button>
          <button
            className={`time-btn ${timeFilter === 'custom' ? 'active' : ''}`}
            onClick={() => setTimeFilter('custom')}
          >
            Custom
          </button>
          <button
            className={`time-btn ${timeFilter === 'full' ? 'active' : ''}`}
            onClick={() => setTimeFilter('full')}
          >
            Full History
          </button>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="view-section">
        <h3 className="section-label">OPERATIONAL METRICS</h3>
        <div className="metrics-grid">
          <div className="stat-card">
            <span className="stat-label">UPTIME</span>
            <span className="stat-value">{uptime}%</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">AVG RESPONSE TIME</span>
            <span className="stat-value">{avgResponseTime}ms</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">REQUESTS</span>
            <span className="stat-value">{requestCount.toLocaleString()}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">ERROR RATE</span>
            <span className="stat-value">{errorRate}%</span>
          </div>
        </div>
      </div>

      {/* Custom Metrics */}
      {customMetrics && customMetrics.length > 0 && (
        <div className="view-section">
          <h3 className="section-label">PROJECT METRICS</h3>
          <div className="custom-metrics-list">
            {customMetrics.map((metric, idx) => (
              <div key={idx} className="metric-item">
                <div className="metric-header">
                  <span className="metric-name">{metric.name}</span>
                  <span className="metric-unit">{metric.unit}</span>
                </div>
                <span className="metric-value">{metric.value}</span>
                {metric.timestamp && (
                  <span className="metric-timestamp">
                    as of {new Date(metric.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
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
