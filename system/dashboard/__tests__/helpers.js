import { render } from '@testing-library/react';

/**
 * Render a React component with default test providers and options
 * @param {JSX.Element} component - The component to render
 * @param {Object} options - Optional render options
 * @returns {Object} - render result object
 */
export function renderComponent(component, options = {}) {
  return render(component, {
    ...options,
  });
}

/**
 * Mock global fetch to return a specific response
 * @param {Object|Array} response - The JSON response to return
 * @param {number} status - HTTP status code (default: 200)
 * @param {Object} options - Additional options (e.g., headers)
 */
export function mockFetch(response, status = 200, options = {}) {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    blob: jest.fn(),
    arrayBuffer: jest.fn(),
    clone: jest.fn(),
    ...options,
  };
  global.fetch.mockResolvedValueOnce(mockResponse);
  return mockResponse;
}

/**
 * Poll a callback until it returns truthy or timeout is reached
 * Useful for waiting for async state updates
 * @param {Function} callback - Function that returns true when condition is met
 * @param {number} timeout - Maximum time to wait in ms (default: 3000)
 * @param {number} interval - Poll interval in ms (default: 50)
 * @returns {Promise} - Resolves when callback returns true
 */
export async function waitForElement(callback, timeout = 3000, interval = 50) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = callback();
      if (result) {
        return result;
      }
    } catch (error) {
      // Ignore errors during polling
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`waitForElement timed out after ${timeout}ms`);
}

/**
 * Create a mock API response envelope
 * @param {any} data - The data payload
 * @param {boolean} success - Whether the response is successful (default: true)
 * @returns {Object} - Response envelope
 */
export function createMockResponse(data, success = true) {
  return {
    success,
    data,
    timestamp: new Date().toISOString(),
  };
}
