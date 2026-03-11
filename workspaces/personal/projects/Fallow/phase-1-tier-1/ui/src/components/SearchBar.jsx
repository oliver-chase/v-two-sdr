import React, { useState, useEffect, useRef } from 'react';
import '../styles/search-bar.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SearchBar({ onVenueSelect, onAddVenue }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch suggestions as user types
  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE}/api/venues/suggest?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVenue = (venue) => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onVenueSelect(venue);
  };

  const handleAddVenue = () => {
    onAddVenue(query);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar-wrapper" ref={dropdownRef}>
      <div className="search-bar">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search venues..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="search-input"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        {query && (
          <button
            className="clear-button"
            onClick={handleClear}
            title="Clear search"
            aria-label="Clear search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-dropdown">
          {loading && (
            <div className="dropdown-item loading">
              <div className="spinner-small"></div>
              Loading...
            </div>
          )}

          {!loading && suggestions.length === 0 && query.trim() && (
            <div className="dropdown-item add-venue-action" onClick={handleAddVenue}>
              <span className="add-icon">+</span>
              <div>
                <div className="add-venue-label">Add "{query}" as New Venue</div>
                <div className="add-venue-hint">We'll start monitoring it weekly</div>
              </div>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              {suggestions.map((venue) => (
                <div
                  key={venue.id}
                  className="dropdown-item venue-item"
                  onClick={() => handleSelectVenue(venue)}
                >
                  <div className="venue-info">
                    <div className="venue-name">{venue.name}</div>
                    <div className="venue-location">
                      {venue.city}, {venue.state}
                    </div>
                  </div>
                  {venue.eventCount > 0 && (
                    <div className="venue-event-count">{venue.eventCount} events</div>
                  )}
                </div>
              ))}

              <div
                className="dropdown-item add-venue-action"
                onClick={handleAddVenue}
              >
                <span className="add-icon">+</span>
                <div>
                  <div className="add-venue-label">Add "{query}" as New Venue</div>
                  <div className="add-venue-hint">We'll start monitoring it weekly</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
