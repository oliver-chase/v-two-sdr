import React, { useState } from 'react';
import useFetchData from '../hooks/useFetchData';
import { fuzzySearch } from '../utils/filterHelpers';
import SearchInput from './Shared/SearchInput';
import ErrorBanner from './Shared/ErrorBanner';
import ConfirmDialog from './Shared/ConfirmDialog';
import './PluginsManager.css';

const SKELETON_COUNT = 4;

const PluginsManager = () => {
  const { data: apiData, loading, error, refetch } = useFetchData('/api/plugins');
  const [plugins, setPlugins] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDisableAll, setConfirmDisableAll] = useState(false);

  // Sync API data into local state on first load / refetch
  const resolvedPlugins = plugins !== null ? plugins : (apiData || []);

  // If we just received fresh API data and our local state is stale, sync it
  React.useEffect(() => {
    if (apiData !== null) {
      setPlugins(apiData);
    }
  }, [apiData]);

  const visiblePlugins = searchQuery
    ? fuzzySearch(resolvedPlugins, searchQuery, ['name'])
    : resolvedPlugins;

  const handleToggle = async (pluginName) => {
    const current = resolvedPlugins.find(p => p.name === pluginName);
    if (!current) return;

    const newEnabled = !current.enabled;

    // Optimistic update
    setPlugins(prev =>
      (prev || resolvedPlugins).map(p =>
        p.name === pluginName ? { ...p, enabled: newEnabled } : p
      )
    );

    try {
      const response = await fetch(`/api/plugins/${pluginName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      // Rollback on failure
      setPlugins(prev =>
        (prev || resolvedPlugins).map(p =>
          p.name === pluginName ? { ...p, enabled: current.enabled } : p
        )
      );
    }
  };

  const handleEnableAll = async () => {
    const updated = resolvedPlugins.map(p => ({ ...p, enabled: true }));
    setPlugins(updated);

    try {
      await Promise.all(
        resolvedPlugins
          .filter(p => !p.enabled)
          .map(p =>
            fetch(`/api/plugins/${p.name}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enabled: true }),
            })
          )
      );
    } catch {
      // Revert on failure
      setPlugins(resolvedPlugins);
    }
  };

  const handleDisableAllConfirmed = async () => {
    setConfirmDisableAll(false);
    const updated = resolvedPlugins.map(p => ({ ...p, enabled: false }));
    setPlugins(updated);

    try {
      await Promise.all(
        resolvedPlugins
          .filter(p => p.enabled)
          .map(p =>
            fetch(`/api/plugins/${p.name}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enabled: false }),
            })
          )
      );
    } catch {
      // Revert on failure
      setPlugins(resolvedPlugins);
    }
  };

  if (loading) {
    return (
      <section className="plugins-manager card">
        <h2 className="plugins-heading">Plugins</h2>
        <div className="plugins-skeleton-list">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="plugins-skeleton-row">
              <div className="skeleton skeleton-name" />
              <div className="skeleton skeleton-version" />
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-btn" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="plugins-manager card">
        <h2 className="plugins-heading">Plugins</h2>
        <ErrorBanner message={error.message} onRetry={refetch} />
      </section>
    );
  }

  return (
    <section className="plugins-manager card">
      <div className="plugins-header">
        <h2 className="plugins-heading">Plugins</h2>
        <div className="plugins-bulk-actions">
          <button className="btn btn-secondary" onClick={handleEnableAll}>
            Enable All
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setConfirmDisableAll(true)}
          >
            Disable All
          </button>
        </div>
      </div>

      <div className="plugins-search">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search plugins..."
          debounceMs={0}
        />
      </div>

      {resolvedPlugins.length === 0 ? (
        <p className="plugins-empty">No plugins installed.</p>
      ) : visiblePlugins.length === 0 ? (
        <p className="plugins-empty">No plugins match your search.</p>
      ) : (
        <ul className="plugins-list">
          {visiblePlugins.map(plugin => (
            <li key={plugin.name} className="plugin-row">
              <span className="plugin-name">{plugin.name}</span>
              <span className="plugin-version">{plugin.version}</span>
              <span className={`badge ${plugin.enabled ? 'badge-active' : 'badge-paused'}`}>
                {plugin.enabled ? 'ACTIVE' : 'PAUSED'}
              </span>
              <button
                className="btn btn-secondary plugin-toggle"
                aria-label={`${plugin.enabled ? 'Disable' : 'Enable'} ${plugin.name}`}
                onClick={() => handleToggle(plugin.name)}
              >
                {plugin.enabled ? 'Disable' : 'Enable'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={confirmDisableAll}
        title="Disable All Plugins"
        message="Disable all plugins? This will pause all active plugins."
        confirmText="Disable All"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleDisableAllConfirmed}
        onCancel={() => setConfirmDisableAll(false)}
      />
    </section>
  );
};

export default PluginsManager;
