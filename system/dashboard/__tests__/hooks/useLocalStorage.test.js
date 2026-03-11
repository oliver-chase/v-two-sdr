import { renderHook, act, waitFor } from '@testing-library/react';
import useLocalStorage from '../../src/hooks/useLocalStorage';

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should return default value if not in storage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'));

    expect(result.current[0]).toBe('default-value');
  });

  test('should return value from storage if exists', () => {
    localStorage.setItem('storage-test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage('storage-test-key', 'default-value'));

    expect(result.current[0]).toBe('stored-value');
  });

  test('should set value and persist to storage', async () => {
    const { result } = renderHook(() => useLocalStorage('set-test-key', 'initial'));

    expect(result.current[0]).toBe('initial');

    act(() => {
      result.current[1]('updated-value');
    });

    await waitFor(() => {
      expect(result.current[0]).toBe('updated-value');
    });

    expect(localStorage.getItem('set-test-key')).toBe(JSON.stringify('updated-value'));
  });

  test('should handle objects', async () => {
    const { result } = renderHook(() => useLocalStorage('user-key', {}));
    const initialObject = { name: 'John', age: 30 };

    act(() => {
      result.current[1](initialObject);
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual(initialObject);
      expect(localStorage.getItem('user-key')).toBe(JSON.stringify(initialObject));
    });

    act(() => {
      result.current[1]({ name: 'Jane', age: 25 });
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual({ name: 'Jane', age: 25 });
    });
  });
});
