/**
 * SDR Lead Lifecycle State Machine
 * Enforces legal state transitions, logs violations, persists to JSON and Google Sheets
 *
 * State Graph:
 * new → email_discovered → draft_generated → awaiting_approval → email_sent → replied → closed_positive/negative
 *                                                ↓
 *                                         draft_generated (rejection/regen)
 *                          any state → closed_negative (opt-out/manual)
 */

const fs = require('fs');
const path = require('path');

const LEAD_POOL_THRESHOLD = 30;

class StateMachine {
  // Static definitions for valid states and transitions
  static VALID_STATES = [
    'new',
    'email_discovered',
    'draft_generated',
    'awaiting_approval',
    'email_sent',
    'replied',
    'closed_positive',
    'closed_negative'
  ];

  static VALID_TRANSITIONS = {
    'new': ['email_discovered'],
    'email_discovered': ['draft_generated'],
    'draft_generated': ['awaiting_approval', 'draft_generated'],
    'awaiting_approval': ['email_sent', 'draft_generated'],
    'email_sent': ['replied', 'closed_positive', 'closed_negative'],
    'replied': ['closed_positive', 'closed_negative'],
    'closed_positive': [],
    'closed_negative': []
  };

  /**
   * Initialize state machine
   * @param {string} stateFile - Path to persist state JSON
   * @param {function} alertCallback - Optional callback for alerts (violations, pool warnings)
   */
  constructor(stateFile, alertCallback = null) {
    this.stateFile = stateFile;
    this.alertCallback = alertCallback;
    this.state = null;

    // Load state from file if it exists
    if (fs.existsSync(stateFile)) {
      try {
        const content = fs.readFileSync(stateFile, 'utf8');
        this.state = JSON.parse(content);
      } catch (e) {
        console.warn(`Failed to load state file in constructor: ${e.message}`);
      }
    }
  }

  /**
   * Initialize state from file or create new state structure
   * @param {Array} prospects - Initial prospect list (TOON format)
   * @param {boolean} force - Force reinitialize even if file exists
   */
  initializeState(prospects = [], force = false) {
    // Try to load from file if no state yet and not forcing
    if (!this.state && !force && fs.existsSync(this.stateFile)) {
      try {
        const content = fs.readFileSync(this.stateFile, 'utf8');
        this.state = JSON.parse(content);
        // Still check pool with current alertCallback
        this._checkLeadPool();
        return this.state;
      } catch (e) {
        console.warn(`Failed to load state file: ${e.message}. Initializing fresh.`);
      }
    }

    // If state already loaded and prospects provided match, just check pool and return
    if (this.state && !force && prospects.length === 0) {
      this._checkLeadPool();
      return this.state;
    }

    // Create new state
    this.state = {
      prospects: prospects.map(p => ({
        ...p,
        st: p.st || 'new'
      })),
      transitions: [],
      violations: [],
      lastUpdated: new Date().toISOString()
    };

    // Check lead pool on initialization
    this._checkLeadPool();

    this._persistState();

    return this.state;
  }

  /**
   * Get current state (for testing/inspection)
   * @returns {Object} Current state object
   */
  getState() {
    return this.state;
  }

  /**
   * Validate if a transition is legal based on current prospect state
   * @param {Object} prospect - Prospect object with 'st' field
   * @param {string} newState - Desired new state
   * @returns {boolean} True if transition is legal
   */
  isLegalTransition(prospect, newState) {
    const currentState = prospect.st;

    // Validate newState is valid
    if (!StateMachine.VALID_STATES.includes(newState)) {
      return false;
    }

    // Allow any state to transition to closed_negative (opt-out)
    if (newState === 'closed_negative') {
      return true;
    }

    // Check transition rules
    const allowedTransitions = StateMachine.VALID_TRANSITIONS[currentState];
    if (!allowedTransitions) {
      return false;
    }

    return allowedTransitions.includes(newState);
  }

  /**
   * Execute state transition with validation and logging
   * @param {string} prospectId - ID of prospect to transition
   * @param {string} newState - Target state
   * @param {string} reason - Reason for transition
   * @returns {Object} Result with success, newState, error, or violation details
   */
  transitionState(prospectId, newState, reason = '') {
    // Validation
    if (!newState || typeof newState !== 'string') {
      return {
        success: false,
        error: 'newState must be a non-empty string',
        prospectId
      };
    }

    const newStateNormalized = newState.trim();

    // Find prospect
    const prospectIndex = this.state.prospects.findIndex(p => p.id === prospectId);
    if (prospectIndex === -1) {
      return {
        success: false,
        error: `Prospect ${prospectId} not found`,
        prospectId
      };
    }

    const prospect = this.state.prospects[prospectIndex];
    const currentState = prospect.st;

    // Check legality
    if (!this.isLegalTransition(prospect, newStateNormalized)) {
      const violation = {
        prospectId,
        from: currentState,
        to: newStateNormalized,
        timestamp: new Date().toISOString(),
        reason: reason || 'Attempted illegal state transition'
      };

      this.state.violations.push(violation);
      this._persistState();

      // Alert
      if (this.alertCallback) {
        this.alertCallback({
          type: 'violation',
          ...violation
        });
      }

      return {
        success: false,
        violation,
        prospectId,
        fromState: currentState,
        toState: newStateNormalized
      };
    }

    // Execute transition
    prospect.st = newStateNormalized;
    prospect.lc = new Date().toISOString(); // Last changed timestamp

    // Log transition
    const transition = {
      prospectId,
      from: currentState,
      to: newStateNormalized,
      timestamp: new Date().toISOString(),
      reason: reason || ''
    };
    this.state.transitions.push(transition);

    // Update lastUpdated
    this.state.lastUpdated = new Date().toISOString();

    // Persist
    this._persistState();

    // Check lead pool after transition
    this._checkLeadPool();

    return {
      success: true,
      newState: newStateNormalized,
      oldState: currentState,
      prospectId,
      transition
    };
  }

  /**
   * Query: Get prospects in specific state
   * @param {string} state - Target state
   * @returns {Array} Prospects in that state
   */
  getProspectsByState(state) {
    if (!StateMachine.VALID_STATES.includes(state)) {
      return [];
    }
    return this.state.prospects.filter(p => p.st === state);
  }

  /**
   * Query: Get prospects with specific track
   * @param {string} track - Track name (ai-enablement, product-maker, pace-car)
   * @returns {Array} Prospects in that track
   */
  getProspectsByTrack(track) {
    return this.state.prospects.filter(p => p.tr === track);
  }

  /**
   * Query: Get prospects matching state AND track
   * @param {string} state - Target state
   * @param {string} track - Target track
   * @returns {Array} Matching prospects
   */
  getProspectsByStateAndTrack(state, track) {
    return this.state.prospects.filter(p => p.st === state && p.tr === track);
  }

  /**
   * Query: Count distribution of prospects by state
   * @returns {Object} {state: count, ...}
   */
  getStateDistribution() {
    const distribution = {};
    StateMachine.VALID_STATES.forEach(state => {
      distribution[state] = this.state.prospects.filter(p => p.st === state).length;
    });
    return distribution;
  }

  /**
   * Query: Count distribution of prospects by track
   * @returns {Object} {track: count, ...}
   */
  getTrackDistribution() {
    const distribution = {};
    this.state.prospects.forEach(p => {
      if (p.tr) {
        distribution[p.tr] = (distribution[p.tr] || 0) + 1;
      }
    });
    return distribution;
  }

  /**
   * Query: Get all prospects in active pipeline (not closed)
   * @returns {Array} Active prospects
   */
  getActivePipeline() {
    const activeStates = ['new', 'email_discovered', 'draft_generated', 'awaiting_approval', 'email_sent', 'replied'];
    return this.state.prospects.filter(p => activeStates.includes(p.st));
  }

  /**
   * Query: Get all closed prospects
   * @returns {Array} Closed prospects (positive + negative)
   */
  getClosedProspects() {
    const closedStates = ['closed_positive', 'closed_negative'];
    return this.state.prospects.filter(p => closedStates.includes(p.st));
  }

  /**
   * Get payload for Google Sheets write-back
   * Called by Chunk 2 (Google Sheets Integration) to sync state changes
   * @param {string} prospectId - Prospect to export
   * @returns {Object} Sheets-compatible payload
   */
  getSheetsUpdatePayload(prospectId) {
    const prospect = this.state.prospects.find(p => p.id === prospectId);
    if (!prospect) {
      return null;
    }

    // Find most recent transition for this prospect
    const recentTransition = this.state.transitions
      .filter(t => t.prospectId === prospectId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    return {
      prospectId,
      newState: prospect.st,
      lastModified: prospect.lc || new Date().toISOString(),
      reason: recentTransition?.reason || '',
      transitionCount: this.state.transitions.filter(t => t.prospectId === prospectId).length
    };
  }

  /**
   * Private: Persist state to JSON file
   */
  _persistState() {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error(`Failed to persist state: ${e.message}`);
    }
  }

  /**
   * Private: Check lead pool size and alert if below threshold
   */
  _checkLeadPool() {
    const activePipeline = this.getActivePipeline();
    const activeCount = activePipeline.length;
    const closedCount = this.getClosedProspects().length;
    const totalCount = this.state.prospects.length;

    if (activeCount < LEAD_POOL_THRESHOLD) {
      if (this.alertCallback) {
        this.alertCallback({
          type: 'pool_warning',
          activeCount,
          threshold: LEAD_POOL_THRESHOLD,
          closedCount,
          totalCount,
          message: `⚠️  Lead pool low: ${activeCount} active prospects (threshold: ${LEAD_POOL_THRESHOLD}). Need ${LEAD_POOL_THRESHOLD - activeCount} more.`
        });
      }
    }
  }
}

module.exports = StateMachine;
