import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlPanel from '../../src/components/ControlPanel';

// Mock useLocalStorage hook
jest.mock('../../src/hooks/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useLocalStorage from '../../src/hooks/useLocalStorage';

// Mock child components to avoid complex renders
jest.mock('../../src/components/ConfigEditor', () => () => (
  <div data-testid="config-editor">ConfigEditor</div>
));

jest.mock('../../src/components/PluginsManager', () => () => (
  <div data-testid="plugins-manager">PluginsManager</div>
));

jest.mock('../../src/components/AuditTrail', () => () => (
  <div data-testid="audit-trail">AuditTrail</div>
));

jest.mock('../../src/components/Shared/ErrorBanner', () => ({ message, onRetry }) => (
  <div data-testid="error-banner">{message}</div>
));

jest.mock('../../src/components/Shared/LoadingState', () => ({ message }) => (
  <div data-testid="loading-state">{message}</div>
));

// Helper to set up localStorage mock with a given tab value
function setupLocalStorage(tab = 'config') {
  let storedTab = tab;
  const setTab = jest.fn((val) => { storedTab = val; });
  useLocalStorage.mockReturnValue([storedTab, setTab]);
  return { getTab: () => storedTab, setTab };
}

// Mock window.history.replaceState
const replaceStateSpy = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});

describe('ControlPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    replaceStateSpy.mockClear();
    // Default: loaded state with 'config' tab
    setupLocalStorage('config');
  });

  // 1. Renders "Control Panel" heading (28px/600)
  it('renders "Control Panel" heading', () => {
    render(<ControlPanel />);
    expect(screen.getByText('Control Panel')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Control Panel' });
    expect(heading).toBeInTheDocument();
  });

  // 2. Renders three tab buttons: "Configuration", "Plugins", "Audit Trail"
  it('renders three tab buttons: Configuration, Plugins, Audit Trail', () => {
    render(<ControlPanel />);
    expect(screen.getByRole('tab', { name: 'Configuration' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Plugins' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Audit Trail' })).toBeInTheDocument();
  });

  // 3. Default active tab is "Configuration" (reads from localStorage or defaults to config)
  it('default active tab is Configuration when localStorage returns config', () => {
    setupLocalStorage('config');
    render(<ControlPanel />);
    expect(screen.getByTestId('config-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('plugins-manager')).not.toBeInTheDocument();
    expect(screen.queryByTestId('audit-trail')).not.toBeInTheDocument();
  });

  // 4. Clicking "Plugins" tab shows PluginsManager
  it('clicking Plugins tab shows PluginsManager', () => {
    setupLocalStorage('config');
    render(<ControlPanel />);
    fireEvent.click(screen.getByRole('tab', { name: 'Plugins' }));
    expect(screen.getByTestId('plugins-manager')).toBeInTheDocument();
    expect(screen.queryByTestId('config-editor')).not.toBeInTheDocument();
    expect(screen.queryByTestId('audit-trail')).not.toBeInTheDocument();
  });

  // 5. Clicking "Audit Trail" tab shows AuditTrail
  it('clicking Audit Trail tab shows AuditTrail', () => {
    setupLocalStorage('config');
    render(<ControlPanel />);
    fireEvent.click(screen.getByRole('tab', { name: 'Audit Trail' }));
    expect(screen.getByTestId('audit-trail')).toBeInTheDocument();
    expect(screen.queryByTestId('config-editor')).not.toBeInTheDocument();
    expect(screen.queryByTestId('plugins-manager')).not.toBeInTheDocument();
  });

  // 6. Active tab has aria-selected="true"
  it('active tab has aria-selected="true"', () => {
    setupLocalStorage('config');
    render(<ControlPanel />);
    const configTab = screen.getByRole('tab', { name: 'Configuration' });
    expect(configTab).toHaveAttribute('aria-selected', 'true');
  });

  // 7. Inactive tabs have aria-selected="false"
  it('inactive tabs have aria-selected="false"', () => {
    setupLocalStorage('config');
    render(<ControlPanel />);
    const pluginsTab = screen.getByRole('tab', { name: 'Plugins' });
    const auditTab = screen.getByRole('tab', { name: 'Audit Trail' });
    expect(pluginsTab).toHaveAttribute('aria-selected', 'false');
    expect(auditTab).toHaveAttribute('aria-selected', 'false');
  });

  // 8. Tab state persisted in localStorage when switching tabs
  it('tab state is persisted in localStorage when switching tabs', () => {
    const { setTab } = setupLocalStorage('config');
    render(<ControlPanel />);
    fireEvent.click(screen.getByRole('tab', { name: 'Plugins' }));
    expect(setTab).toHaveBeenCalledWith('plugins');
  });

  // 8b. URL param synced via replaceState when switching tabs
  it('syncs tab to URL query param on tab switch', () => {
    setupLocalStorage('config');
    render(<ControlPanel />);
    fireEvent.click(screen.getByRole('tab', { name: 'Audit Trail' }));
    expect(replaceStateSpy).toHaveBeenCalled();
    const callArgs = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1];
    // Third argument is the URL string — should contain ?tab=audit
    expect(callArgs[2]).toContain('tab=audit');
  });

  // 9. Loading state shows skeleton, no tab content
  it('loading state shows skeleton tab bar and no tab content', () => {
    setupLocalStorage('config');
    const { container } = render(<ControlPanel loading={true} />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByTestId('config-editor')).not.toBeInTheDocument();
    expect(screen.queryByTestId('plugins-manager')).not.toBeInTheDocument();
    expect(screen.queryByTestId('audit-trail')).not.toBeInTheDocument();
  });

  // 10. No icons rendered (no svg, no img)
  it('renders no svg or img elements', () => {
    setupLocalStorage('config');
    const { container } = render(<ControlPanel />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  // Tablist accessibility
  it('tab bar has role="tablist"', () => {
    setupLocalStorage('config');
    render(<ControlPanel />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  // Plugins tab active shows aria-selected="true"
  it('switching to Plugins tab makes it aria-selected="true"', () => {
    setupLocalStorage('config');
    render(<ControlPanel />);
    fireEvent.click(screen.getByRole('tab', { name: 'Plugins' }));
    const pluginsTab = screen.getByRole('tab', { name: 'Plugins' });
    expect(pluginsTab).toHaveAttribute('aria-selected', 'true');
    const configTab = screen.getByRole('tab', { name: 'Configuration' });
    expect(configTab).toHaveAttribute('aria-selected', 'false');
  });

  // When localStorage returns 'plugins', PluginsManager is shown by default
  it('reads initial tab from localStorage — shows PluginsManager when stored tab is plugins', () => {
    setupLocalStorage('plugins');
    render(<ControlPanel />);
    expect(screen.getByTestId('plugins-manager')).toBeInTheDocument();
    expect(screen.queryByTestId('config-editor')).not.toBeInTheDocument();
  });

  // When localStorage returns 'audit', AuditTrail is shown by default
  it('reads initial tab from localStorage — shows AuditTrail when stored tab is audit', () => {
    setupLocalStorage('audit');
    render(<ControlPanel />);
    expect(screen.getByTestId('audit-trail')).toBeInTheDocument();
    expect(screen.queryByTestId('config-editor')).not.toBeInTheDocument();
  });
});
