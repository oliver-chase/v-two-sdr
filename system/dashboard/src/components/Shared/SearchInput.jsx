import React, { useState, useEffect } from 'react';
import '../Shared/SearchInput.css';

const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  loading = false,
  debounceMs = 100,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Sync external value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);

    setDebounceTimer(timer);
  };

  const handleClear = () => {
    setDisplayValue('');
    onChange('');
  };

  return (
    <div className="search-input-wrapper">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        disabled={loading}
        aria-label={placeholder}
        role="textbox"
      />
      {displayValue && !loading && (
        <button
          className="search-clear"
          onClick={handleClear}
          aria-label="Clear search"
          title="Clear search"
        >
          Clear
        </button>
      )}
      {loading && <div className="search-spinner" />}
    </div>
  );
};

export default SearchInput;
