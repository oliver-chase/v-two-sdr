import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfigEditor from './ConfigEditor';
import PluginsManager from './PluginsManager';
import AuditTrail from './AuditTrail';
import './ControlPanel.css';

const TABS = [
  { id: 'config', label: 'Configuration' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'audit', label: 'Audit Trail' },
];

function LoadingSkeleton() {
  return (
    <div className="control-panel-loading" aria-label="Loading control panel">
      <div className="skeleton control-panel-skeleton-heading" />
      <div className="control-panel-skeleton-tablist">
        {TABS.map((tab) => (
          <div key={tab.id} className="skeleton control-panel-skeleton-tab" />
        ))}
      </div>
      <div className="skeleton control-panel-skeleton-content" />
    </div>
  );
}

export default function ControlPanel({ loading = false }) {
  const [storedTab, setStoredTab] = useLocalStorage('controlpanel-tab', 'config');
  const [activeTab, setActiveTab] = useState(storedTab || 'config');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setStoredTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.replaceState(null, '', url.toString());
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="control-panel fade-in">
      <h1 className="control-panel-heading">Control Panel</h1>

      <div
        role="tablist"
        className="control-panel-tablist"
        aria-label="Control panel tabs"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className="control-panel-tab"
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="control-panel-tabpanel" role="tabpanel">
        {activeTab === 'config' && <ConfigEditor />}
        {activeTab === 'plugins' && <PluginsManager />}
        {activeTab === 'audit' && <AuditTrail />}
      </div>
    </div>
  );
}
