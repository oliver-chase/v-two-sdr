import { useState, useEffect, useCallback } from 'react';
import { normalizeResponse } from '../utils/responseNormalizer';

/**
 * Custom hook for fetching data from an API endpoint
 * Handles loading states, errors, and TOON format normalization
 *
 * @param {string} endpoint - API endpoint to fetch from
 * @returns {Object} { data, loading, error, refetch }
 */
const useFetchData = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const normalized = normalizeResponse(json);
      setData(normalized);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [endpoint, fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetchData;
