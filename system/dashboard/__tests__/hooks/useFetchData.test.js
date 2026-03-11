import { renderHook, act, waitFor } from '@testing-library/react';
import useFetchData from '../../src/hooks/useFetchData';

// Mock global fetch
global.fetch = jest.fn();

describe('useFetchData Hook', () => {
  beforeEach(() => {
    global.fetch.mockClear();
  });

  test('should initialize with loading state', () => {
    global.fetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      })
    );

    const { result } = renderHook(() => useFetchData('/api/test'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('should fetch data successfully', async () => {
    const mockData = { name: 'Test', items: [] };
    global.fetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    );

    const { result } = renderHook(() => useFetchData('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(global.fetch).toHaveBeenCalledWith('/api/test');
  });

  test('should handle fetch errors', async () => {
    global.fetch.mockReturnValueOnce(
      Promise.resolve({
        ok: false,
        status: 404
      })
    );

    const { result } = renderHook(() => useFetchData('/api/notfound'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBeDefined();
  });

  test('should refetch when endpoint changes', async () => {
    const mockData1 = { data: 'first' };
    const mockData2 = { data: 'second' };

    global.fetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData1)
      })
    );

    const { result, rerender } = renderHook(
      ({ endpoint }) => useFetchData(endpoint),
      { initialProps: { endpoint: '/api/test1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData1);

    global.fetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData2)
      })
    );

    rerender({ endpoint: '/api/test2' });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/test2');
    });
  });

  test('should convert TOON format to full format', async () => {
    const toonData = {
      nm: 'John Doe',
      ds: 'A test user',
      en: true
    };

    global.fetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(toonData)
      })
    );

    const { result } = renderHook(() => useFetchData('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({
      name: 'John Doe',
      description: 'A test user',
      enabled: true
    });
  });

  test('should have refetch function', async () => {
    const mockData = { data: 'test' };
    global.fetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    );

    const { result } = renderHook(() => useFetchData('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    act(() => {
      result.current.refetch();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
