import { useState, useEffect } from 'react'
import AliasPanel from './components/AliasPanel'
import UsageTips from './components/UsageTips'
import OrgChart from './components/OrgChart'
import SkillsPanel from './components/SkillsPanel'
import DocsBrowser from './components/DocsBrowser'
import { normalizeResponse } from './utils/responseNormalizer'

const NAV_SECTIONS = [
  { id: 'org', label: 'Org Chart' },
  { id: 'skills', label: 'Skills' },
  { id: 'docs', label: 'Documentation' },
  { id: 'aliases', label: 'Aliases' },
  { id: 'guide', label: 'Usage Guide' },
]

function App() {
  const [activeSection, setActiveSection] = useState('org')
  const [data, setData] = useState({
    memory: [],
    team: null,
    skills: [],
    lastUpdated: new Date()
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [memory, team, skills] = await Promise.all([
        fetch('/api/memory').then(async r => {
          if (!r.ok) throw new Error(`/api/memory failed: ${r.status}`)
          return r.json()
        }),
        fetch('/api/team').then(async r => {
          if (!r.ok) throw new Error(`/api/team failed: ${r.status}`)
          return r.json()
        }),
        fetch('/api/skills').then(async r => {
          if (!r.ok) throw new Error(`/api/skills failed: ${r.status}`)
          return r.json()
        })
      ])

      setData({
        memory,
        team: normalizeResponse(team),
        skills: normalizeResponse(skills),
        lastUpdated: new Date()
      })
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const renderActivePanel = () => {
    if (loading) {
      return (
        <div className="content-loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )
    }

    switch (activeSection) {
      case 'org':
        return data.team ? <OrgChart team={data.team} /> : <p className="content-empty">No team data available</p>
      case 'skills':
        return <SkillsPanel />
      case 'docs':
        return <DocsBrowser />
      case 'aliases':
        return <AliasPanel />
      case 'guide':
        return <UsageTips />
      default:
        return null
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Oliver</h1>
          <p className="sidebar-subtitle">Agent Command Center</p>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-timestamp">
            Updated {formatTime(data.lastUpdated)}
          </p>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="content-header">
          <h2 className="content-title">
            {NAV_SECTIONS.find(s => s.id === activeSection)?.label}
          </h2>
        </div>

        {error && (
          <div className="error-banner">
            <div className="error-content">
              <p className="error-title">Connection Error</p>
              <p className="error-message">{error}</p>
            </div>
            <button className="btn-retry" onClick={fetchData}>
              Retry
            </button>
          </div>
        )}

        <div className="content-body">
          {renderActivePanel()}
        </div>
      </main>
    </div>
  )
}

export default App
