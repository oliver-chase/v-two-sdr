import { useState, useCallback } from 'react';

/**
 * Custom hook for managing expanded/collapsed state of tree nodes
 * Uses a Set for O(1) lookup performance
 *
 * @param {string[]} initialIds - Initial IDs of expanded nodes
 * @returns {Object} { expandedNodes, toggleNode, expandAll, collapseAll, isExpanded }
 */
const useExpandedNodes = (initialIds = []) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(initialIds));

  const toggleNode = useCallback((id) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback((ids) => {
    setExpandedNodes(new Set(ids));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const isExpanded = useCallback((id) => {
    return expandedNodes.has(id);
  }, [expandedNodes]);

  return {
    expandedNodes,
    toggleNode,
    expandAll,
    collapseAll,
    isExpanded
  };
};

export default useExpandedNodes;
