import { useState } from 'react'
import useFetchData from '../hooks/useFetchData'
import AgentList from './AgentList'
import AgentDetail from './AgentDetail'
import LoadingState from './Shared/LoadingState'
import ErrorBanner from './Shared/ErrorBanner'
import './AgentExplorer.css'

export default function AgentExplorer() {
  const { data, loading, error } = useFetchData('/api/agents')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [selectedPersona, setSelectedPersona] = useState(null)

  const handleSelectAgent = (agentId) => {
    setSelectedAgent(agentId)
    setSelectedPersona(null)
  }

  const handleSelectPersona = (personaName) => {
    setSelectedPersona(personaName)
  }

  const handleCloseDetail = () => {
    setSelectedAgent(null)
    setSelectedPersona(null)
  }

  if (error) {
    return (
      <div className="card agent-explorer-panel">
        <h2>Agents & Personas</h2>
        <ErrorBanner
          message="Could not load agent data. Check server."
          onDismiss={() => {}}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card agent-explorer-panel">
        <h2>Agents & Personas</h2>
        <div className="agent-explorer-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="agent-skeleton" data-testid="agent-skeleton">
              <div className="skeleton-row">
                <div className="skeleton skeleton-title"></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton skeleton-badge"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const agents = data?.agents || []

  if (agents.length === 0) {
    return (
      <div className="card agent-explorer-panel">
        <h2>Agents & Personas</h2>
        <div className="empty-state">
          No agents found in the system.
        </div>
      </div>
    )
  }

  // Determine what to show in detail view
  const detailType = selectedPersona ? 'persona' : selectedAgent ? 'agent' : null
  const selectedAgentObj = agents.find(a => agentIdFromName(a.nm) === selectedAgent)
  const detailData = selectedPersona ? selectedPersona : selectedAgentObj

  function agentIdFromName(name) {
    return name.toLowerCase().replace(/\s+/g, '-')
  }

  return (
    <div className="card agent-explorer-container" data-testid="agent-explorer-container">
      <h2>Agents & Personas</h2>

      <div className="agent-explorer-layout">
        {/* Left Panel: Master List */}
        <div className="agent-explorer-master" data-testid="agent-list-panel">
          <AgentList
            agents={agents}
            selectedAgent={selectedAgent}
            selectedPersona={selectedPersona}
            onSelectAgent={handleSelectAgent}
            onSelectPersona={handleSelectPersona}
          />
        </div>

        {/* Right Panel: Detail View */}
        <div className="agent-explorer-detail" data-testid="agent-detail-panel">
          {detailType && detailData ? (
            <AgentDetail
              agent={detailData}
              parentAgent={selectedAgent ? agents.find(a => a.nm === selectedAgent) : null}
              type={detailType}
              onClose={handleCloseDetail}
            />
          ) : (
            <div className="detail-empty-state">
              <p>Select an agent or persona to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
