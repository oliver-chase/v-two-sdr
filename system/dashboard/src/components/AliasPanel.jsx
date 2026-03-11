import { useState } from 'react'
import useFetchData from '../hooks/useFetchData'
import SearchInput from './Shared/SearchInput'
import { fuzzySearch } from '../utils/filterHelpers'

export default function AliasPanel() {
  const [search, setSearch] = useState('')
  const { data: aliases, loading, error } = useFetchData('/api/aliases')

  const filtered = fuzzySearch(aliases || [], search, ['command', 'description'])

  return (
    <div className="panel card">
      <h2>Aliases & Shortcuts</h2>
      <p className="panel-subtitle">Quick reference for / commands available in Claude Code</p>

      {error ? (
        <p className="panel-error">Could not load aliases: {error.message}</p>
      ) : (
        <>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search aliases..."
            loading={loading}
          />

          <div className="alias-list">
            {loading ? (
              <p className="loading-text">Loading aliases...</p>
            ) : filtered.length > 0 ? (
              filtered.map((alias, idx) => (
                <div key={alias.command || idx} className="alias-item">
                  <code className="alias-command">{alias.command}</code>
                  <p className="alias-description">{alias.description}</p>
                </div>
              ))
            ) : (aliases || []).length === 0 ? (
              <p className="no-results">No aliases available</p>
            ) : (
              <p className="no-results">No aliases match "{search}"</p>
            )}
          </div>
        </>
      )}

      <p className="panel-footer">
        Type / in Claude Code to see available commands in context
      </p>
    </div>
  )
}
