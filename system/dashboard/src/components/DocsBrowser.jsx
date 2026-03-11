import { useState } from 'react'
import useFetchData from '../hooks/useFetchData'
import useExpandedNodes from '../hooks/useExpandedNodes'
import SearchInput from './Shared/SearchInput'
import { fuzzySearch } from '../utils/filterHelpers'
import { INITIAL_EXPANDED_NODES } from '../utils/constants'
import { normalizeResponse } from '../utils/responseNormalizer'
import './DocsBrowser.css'

export default function DocsBrowser() {
  const { data: tree, loading, error } = useFetchData('/api/docs')
  const { expandedNodes, toggleNode } = useExpandedNodes(INITIAL_EXPANDED_NODES)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [search, setSearch] = useState('')

  const fetchFile = async (filePath) => {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`)
      if (!res.ok) throw new Error('Failed to load file')
      const raw = await res.json()
      const data = normalizeResponse(raw)
      setFileContent(data.content)
      setSelectedFile(filePath)
    } catch (err) {
      console.error('Error loading file:', err)
      setFileContent(null)
    }
  }

  const TreeNode = ({ node, parentPath = '' }) => {
    const nodeId = `${parentPath}/${node.name}`.replace(/^\//, '')
    const isExpanded = expandedNodes.has(nodeId)
    const isDir = node.isDir || (node.children && node.children.length > 0)

    return (
      <div className="doc-node">
        <div className="doc-node-header">
          {isDir && (
            <button
              className={`doc-expand-btn ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleNode(nodeId)}
              aria-label={`Toggle ${node.name}`}
            >
              ▶
            </button>
          )}
          {!isDir && <span className="doc-expand-placeholder"></span>}

          {isDir ? (
            <span className="doc-folder-icon">Folder</span>
          ) : (
            <span className="doc-file-icon">File</span>
          )}

          {!isDir ? (
            <button
              className={`doc-item-btn ${selectedFile === node.path ? 'selected' : ''}`}
              onClick={() => fetchFile(node.path)}
            >
              {node.name}
            </button>
          ) : (
            <span className="doc-folder-name">{node.name}</span>
          )}
        </div>

        {isExpanded && node.children && node.children.length > 0 && (
          <div className="doc-children">
            {node.children.map((child) => (
              <TreeNode key={child.path || child.id || child.name} node={child} parentPath={nodeId} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="panel card docs-browser-panel">
      <h2>Documentation Browser</h2>
      <p className="panel-subtitle">Navigate all system docs, MDs, and guides</p>

      {error ? (
        <p className="panel-error">Could not load docs: {error.message}</p>
      ) : (
        <div className="docs-wrapper">
          <div className="docs-tree">
            {loading ? (
              <p className="loading-text">Loading documentation tree...</p>
            ) : tree ? (
              <TreeNode node={tree} />
            ) : (
              <p className="no-results">No documentation available</p>
            )}
          </div>

          {selectedFile && fileContent && (
            <div className="docs-viewer">
              <div className="viewer-header">
                <h3>{selectedFile.split('/').pop()}</h3>
                <button
                  className="viewer-close"
                  onClick={() => {
                    setSelectedFile(null)
                    setFileContent(null)
                  }}
                  aria-label="Close"
                >
                  Close
                </button>
              </div>
              <div className="viewer-content">
                <pre>{fileContent}</pre>
              </div>
            </div>
          )}

          {selectedFile && !fileContent && (
            <div className="docs-viewer loading">
              <div className="spinner"></div>
              <p>Loading file...</p>
            </div>
          )}

          {!selectedFile && (
            <div className="docs-viewer empty">
              <p className="empty-message">Select a file to view its contents</p>
            </div>
          )}
        </div>
      )}

      <p className="panel-footer">
        Expand folders to browse all documentation — click files to preview
      </p>
    </div>
  )
}
