import React from 'react';
import '../styles/filter-panel.css';

const CITIES = ['Denver', 'Boulder', 'Arvada', 'Fort Collins', 'Colorado Springs', 'Littleton'];
const TYPES = ['Festival', 'Concert', 'Market', 'Workshop', 'Gallery', 'Sports', 'Food', 'Theater', 'Comedy', 'Class'];
const COST_OPTIONS = [
  { value: 'all', label: 'All Prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];
const DATE_RANGES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' }
];

export default function FilterPanel({ filters, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="filter-panel">
      <h3 className="filter-title">Filters</h3>

      <div className="filter-group">
        <label htmlFor="city-filter">City</label>
        <select
          id="city-filter"
          value={filters.city || 'all'}
          onChange={(e) => handleChange('city', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="type-filter">Event Type</label>
        <select
          id="type-filter"
          value={filters.type || 'all'}
          onChange={(e) => handleChange('type', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Types</option>
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Cost</label>
        <div className="filter-radio-group">
          {COST_OPTIONS.map(option => (
            <label key={option.value} className="radio-label">
              <input
                type="radio"
                name="cost"
                value={option.value}
                checked={filters.cost === option.value}
                onChange={(e) => handleChange('cost', e.target.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label>Date Range</label>
        <div className="filter-button-group">
          {DATE_RANGES.map(range => (
            <button
              key={range.value}
              className={`filter-button ${filters.dateRange === range.value ? 'active' : ''}`}
              onClick={() => handleChange('dateRange', range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <button 
        className="btn btn-secondary filter-reset"
        onClick={() => onFilterChange({
          city: 'all',
          type: 'all',
          cost: 'all',
          dateRange: 'upcoming'
        })}
      >
        Reset Filters
      </button>
    </div>
  );
}
