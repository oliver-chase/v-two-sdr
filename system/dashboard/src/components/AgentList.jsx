import { useState } from 'react'
import './AgentList.css'

export default function AgentList({
  agents,
  selectedAgent,
  selectedPersona,
  onSelectAgent,
  onSelectPersona,
}) {
  const [expandedAgents, setExpandedAgents] = useState({})

  if (!agents || agents.length === 0) {
    return (
      <div className="agent-list">
        <div className="empty-state">No agents available</div>
      </div>
    )
  }

  const toggleAgentExpanded = (agentId) => {
    setExpandedAgents((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }))
  }

  const agentIdFromName = (name) => name.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="agent-list">
      {agents.map((agent) => {
        const agentId = agentIdFromName(agent.nm)
        const isExpanded = expandedAgents[agentId]
        const hasPersonas = agent.ps && agent.ps.length > 0

        return (
          <div key={agentId} className="agent-item">
            {/* Agent Header */}
            <div className="agent-header">
              {hasPersonas && (
                <button
                  className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleAgentExpanded(agentId)}
                  aria-expanded={isExpanded ? 'true' : 'false'}
                  data-testid={`agent-expand-btn-${agentId}`}
                  aria-label={`Toggle ${agent.nm} personas`}
                >
                  ▶
                </button>
              )}
              {!hasPersonas && <span className="expand-placeholder"></span>}

              <button
                className={`agent-btn ${selectedAgent === agentId ? 'selected' : ''}`}
                onClick={() => onSelectAgent(agentId)}
                data-testid={`agent-btn-${agentId}`}
                aria-label={`Select ${agent.nm}`}
              >
                <span className="agent-name">{agent.nm}</span>
              </button>
            </div>

            {/* Personas List */}
            {hasPersonas && isExpanded && (
              <div
                className="agent-personas"
                data-testid={`personas-${agentId}`}
              >
                {agent.ps.map((persona) => {
                  const personaId = persona.toLowerCase().replace(/\s+/g, '-')
                  return (
                    <button
                      key={persona}
                      className={`persona-btn ${selectedPersona === persona ? 'selected' : ''}`}
                      onClick={() => onSelectPersona(persona)}
                      data-testid={`persona-btn-${personaId}`}
                      aria-label={`Select ${persona} persona`}
                    >
                      <span className="persona-name">{persona}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
