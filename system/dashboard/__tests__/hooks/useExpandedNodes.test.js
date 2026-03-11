import { renderHook, act } from '@testing-library/react';
import useExpandedNodes from '../../src/hooks/useExpandedNodes';

describe('useExpandedNodes Hook', () => {
  test('should initialize with provided nodes expanded', () => {
    const initialIds = ['node-1', 'node-2', 'node-3'];
    const { result } = renderHook(() => useExpandedNodes(initialIds));

    expect(result.current.expandedNodes).toBeInstanceOf(Set);
    expect(result.current.expandedNodes.size).toBe(3);
    expect(result.current.isExpanded('node-1')).toBe(true);
    expect(result.current.isExpanded('node-2')).toBe(true);
    expect(result.current.isExpanded('node-3')).toBe(true);
  });

  test('should toggle node expansion', () => {
    const { result } = renderHook(() => useExpandedNodes([]));

    expect(result.current.isExpanded('node-1')).toBe(false);

    act(() => {
      result.current.toggleNode('node-1');
    });

    expect(result.current.isExpanded('node-1')).toBe(true);
    expect(result.current.expandedNodes.size).toBe(1);

    act(() => {
      result.current.toggleNode('node-1');
    });

    expect(result.current.isExpanded('node-1')).toBe(false);
    expect(result.current.expandedNodes.size).toBe(0);
  });

  test('should expand all nodes', () => {
    const { result } = renderHook(() => useExpandedNodes([]));

    const allIds = ['node-1', 'node-2', 'node-3', 'node-4'];

    act(() => {
      result.current.expandAll(allIds);
    });

    expect(result.current.expandedNodes.size).toBe(4);
    allIds.forEach(id => {
      expect(result.current.isExpanded(id)).toBe(true);
    });
  });

  test('should collapse all nodes', () => {
    const initialIds = ['node-1', 'node-2', 'node-3'];
    const { result } = renderHook(() => useExpandedNodes(initialIds));

    expect(result.current.expandedNodes.size).toBe(3);

    act(() => {
      result.current.collapseAll();
    });

    expect(result.current.expandedNodes.size).toBe(0);
    expect(result.current.isExpanded('node-1')).toBe(false);
  });

  test('should check if node is expanded', () => {
    const { result } = renderHook(() => useExpandedNodes(['expanded-node']));

    expect(result.current.isExpanded('expanded-node')).toBe(true);
    expect(result.current.isExpanded('collapsed-node')).toBe(false);
    expect(result.current.isExpanded('another-node')).toBe(false);
  });
});
