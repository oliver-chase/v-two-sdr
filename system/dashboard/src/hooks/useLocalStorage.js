import { useState } from 'react';

/**
 * Custom hook for managing persistent state via localStorage
 * Follows React hooks pattern: [value, setValue]
 *
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key not in storage
 * @returns {[any, Function]} [storedValue, setValue]
 */
const useLocalStorage = (key, defaultValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

export default useLocalStorage;
