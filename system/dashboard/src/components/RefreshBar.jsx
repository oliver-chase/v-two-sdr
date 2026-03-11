import { useState } from 'react'

export default function RefreshBar({ lastUpdated, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
  }

  return (
    <div className="refresh-bar">
      <div className="refresh-content">
        <span className="last-updated">
          Last updated: {formatTime(lastUpdated)}
        </span>
        <button
          className="btn secondary refresh-btn"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard"
        >
          {isRefreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </div>
    </div>
  )
}
