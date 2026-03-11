import './TokenChart.css'

const SKELETON_BARS = 30

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TokenChartLoading() {
  return (
    <div className="token-chart token-chart-loading" aria-label="Loading token data">
      <div className="chart-bars">
        {Array.from({ length: SKELETON_BARS }, (_, i) => (
          <div key={i} className="bar-column">
            <div
              className="skeleton bar-skeleton"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          </div>
        ))}
      </div>
      <div className="chart-baseline" />
    </div>
  )
}

function TokenChartEmpty() {
  return (
    <div className="token-chart token-chart-empty">
      <p className="chart-title">Token Usage</p>
      <div className="chart-empty-state">
        No token data for this period. Events will appear here once
        instrumentation is active.
      </div>
    </div>
  )
}

export default function TokenChart({ data, loading, today }) {
  if (loading) return <TokenChartLoading />
  if (!data || data.length === 0) return <TokenChartEmpty />

  const max = Math.max(...data.map(d => d.tokens))

  return (
    <div className="token-chart fade-in">
      <p className="chart-title">Token Usage</p>
      <div className="chart-body">
        <div className="chart-bars">
          {data.map((d) => {
            const isToday = d.date === today
            const heightPct = max > 0 ? (d.tokens / max) * 100 : 0
            return (
              <div key={d.date} className="bar-column">
                <div
                  data-testid="token-bar"
                  data-today={String(isToday)}
                  className={`token-bar${isToday ? ' bar-today' : ''}`}
                  style={{ height: `${heightPct}%` }}
                  title={`${d.model} · ${d.tokens.toLocaleString()} tokens`}
                />
                <span className="chart-label">{formatDate(d.date)}</span>
              </div>
            )
          })}
        </div>
        <div className="chart-baseline" />
      </div>
    </div>
  )
}
