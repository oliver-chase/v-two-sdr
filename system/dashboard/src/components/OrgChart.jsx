import { useState } from 'react'
import useExpandedNodes from '../hooks/useExpandedNodes'
import { INITIAL_EXPANDED_NODES } from '../utils/constants'
import './OrgChart.css'

export default function OrgChart({ team }) {
  const { expandedNodes, toggleNode } = useExpandedNodes(INITIAL_EXPANDED_NODES)
  const [selectedMember, setSelectedMember] = useState(null)

  if (!team) return null

  const OrgNode = ({ id, name, type, path, children }) => {
    const isExpanded = expandedNodes.has(id)

    return (
      <div className="org-node">
        <div className="org-node-header">
          {children && children.length > 0 && (
            <button
              className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleNode(id)}
              aria-label={`Toggle ${name}`}
            >
              ▶
            </button>
          )}
          {!children && <span className="expand-placeholder"></span>}

          <button
            className={`org-node-btn ${type} ${selectedMember?.id === id ? 'selected' : ''}`}
            onClick={() => setSelectedMember({ id, name, type, path })}
          >
            <span className="node-name">{name}</span>
          </button>
        </div>

        {isExpanded && children && children.length > 0 && (
          <div className="org-children">
            {children.map((child) => (
              <OrgNode key={child.id} {...child} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="panel card org-chart-panel">
      <h2>Team Org Chart</h2>
      <p className="panel-subtitle">Click nodes to view details</p>

      <div className="org-chart-wrapper">
        <div className="org-tree">
          <OrgNode
            id="kiana"
            name="Kiana"
            type={team.lead.type}
            children={[
              {
                id: 'agents',
                name: 'Agents',
                type: 'group',
                children: (team.agents || []).map(a => ({
                  id: a.name.toLowerCase().replace(' ', '-'),
                  name: a.name,
                  type: a.type
                }))
              },
              {
                id: 'personas',
                name: 'Personas',
                type: 'group',
                children: (team.personas || []).map(p => ({
                  id: p.name,
                  name: p.title || p.name,
                  type: p.type,
                  path: p.path
                }))
              }
            ]}
          />
        </div>

        {selectedMember && (
          <div className="org-detail-panel">
            <div className="detail-header">
              <div>
                <h3>{selectedMember.name}</h3>
                <p className="detail-type">{selectedMember.type}</p>
              </div>
              <button
                className="detail-close"
                onClick={() => setSelectedMember(null)}
                aria-label="Close"
              >
                Close
              </button>
            </div>

            {selectedMember.path && (
              <div className="detail-actions">
                <button
                  className="btn secondary"
                  onClick={() => window.open(`file://${selectedMember.path}`)}
                >
                  View File
                </button>
              </div>
            )}

            <p className="detail-info">
              {selectedMember.type === 'human' && 'Kiana runs the system'}
              {selectedMember.type === 'agent' && 'AI agent in the multi-agent system'}
              {selectedMember.type === 'persona' && 'Specialized team member persona'}
              {selectedMember.type === 'group' && 'Collection of team members'}
            </p>
          </div>
        )}
      </div>

      <p className="panel-footer">
        Expand nodes to see team structure, click members for details
      </p>
    </div>
  )
}
