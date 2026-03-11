import { useState } from 'react'
import useFetchData from '../hooks/useFetchData'
import SearchInput from './Shared/SearchInput'
import { fuzzySearch } from '../utils/filterHelpers'

export default function SkillsPanel() {
  const [search, setSearch] = useState('')
  const { data: skills, loading, error } = useFetchData('/api/skills')

  const filtered = fuzzySearch(skills || [], search, ['name', 'description'])

  return (
    <div className="panel card">
      <h2>Skills & Capabilities</h2>
      <p className="panel-subtitle">Specialized tools and domains available to agents</p>

      {error ? (
        <p className="panel-error">Could not load skills: {error.message}</p>
      ) : (
        <>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search skills..."
            loading={loading}
          />

          <div className="skills-grid">
            {loading ? (
              <p className="loading-text">Loading skills...</p>
            ) : filtered.length > 0 ? (
              filtered.map((skill, idx) => (
                <div key={skill.name || idx} className="skill-card">
                  <h4 className="skill-name">{skill.name}</h4>
                  <p className="skill-description">{skill.description}</p>
                </div>
              ))
            ) : (skills || []).length === 0 ? (
              <p className="no-results">No skills available</p>
            ) : (
              <p className="no-results">No skills match "{search}"</p>
            )}
          </div>

          <p className="panel-footer">
            {(skills || []).length} total skills available — click on a skill to learn more
          </p>
        </>
      )}
    </div>
  )
}
