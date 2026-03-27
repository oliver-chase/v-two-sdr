/**
 * SDR Lead Lifecycle State Machine Tests
 * Comprehensive test coverage for state transitions, validation, and persistence
 */

const StateMachine = require('../state-machine');
const fs = require('fs');
const path = require('path');

// Test utilities
const createTestProspect = (overrides = {}) => ({
  id: 'p-test-001',
  fn: 'Jane',
  ln: 'Doe',
  co: 'TechCorp',
  ti: 'CTO',
  em: 'jane@techcorp.io',
  tr: 'ai-enablement',
  st: 'new',
  ad: '2026-03-11',
  ...overrides
});

const createTestState = (prospects = []) => ({
  prospects: prospects.length > 0 ? prospects : [],
  transitions: [],
  violations: [],
  lastUpdated: new Date().toISOString()
});

describe('StateMachine', () => {
  let stateMachine;
  let testProspects;
  let testStateFile;

  beforeEach(() => {
    testProspects = [createTestProspect()];
    testStateFile = path.join(__dirname, 'state-test-temp.json');
    stateMachine = new StateMachine(testStateFile);
  });

  afterEach(() => {
    if (fs.existsSync(testStateFile)) {
      fs.unlinkSync(testStateFile);
    }
  });

  describe('StateMachine initialization', () => {
    test('should initialize with valid state file path', () => {
      expect(stateMachine).toBeDefined();
      expect(stateMachine.stateFile).toBe(testStateFile);
    });

    test('should initialize state from file if exists', () => {
      const initialState = createTestState(testProspects);
      fs.writeFileSync(testStateFile, JSON.stringify(initialState, null, 2));

      const sm = new StateMachine(testStateFile);
      expect(sm.getState()).toEqual(initialState);
    });

    test('should create new state file if not exists', () => {
      expect(fs.existsSync(testStateFile)).toBeFalsy();
      stateMachine.initializeState([]);
      expect(fs.existsSync(testStateFile)).toBeTruthy();
    });
  });

  describe('State definitions', () => {
    test('should define all valid states', () => {
      const validStates = StateMachine.VALID_STATES;
      expect(validStates).toEqual([
        'new',
        'email_discovered',
        'draft_generated',
        'awaiting_approval',
        'email_sent',
        'followup_due',
        'ooo_pending',
        'replied',
        'closed_positive',
        'closed_negative',
        'closed_no_reply'
      ]);
    });

    test('should define valid transitions', () => {
      const transitions = StateMachine.VALID_TRANSITIONS;
      expect(transitions).toBeDefined();
      expect(typeof transitions).toBe('object');

      // Check key transitions exist
      expect(transitions['new']).toContain('email_discovered');
      expect(transitions['email_discovered']).toContain('draft_generated');
      expect(transitions['draft_generated']).toContain('awaiting_approval');
      expect(transitions['awaiting_approval']).toContain('email_sent');
      expect(transitions['email_sent']).toContain('replied');
      expect(transitions['replied']).toContain('closed_positive');
    });
  });

  describe('Legal transition validation', () => {
    test('should allow transition from new to email_discovered', () => {
      const prospect = createTestProspect({ st: 'new' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'email_discovered');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from email_discovered to draft_generated', () => {
      const prospect = createTestProspect({ st: 'email_discovered' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'draft_generated');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from draft_generated to awaiting_approval', () => {
      const prospect = createTestProspect({ st: 'draft_generated' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'awaiting_approval');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from draft_generated back to draft_generated (regeneration)', () => {
      const prospect = createTestProspect({ st: 'draft_generated' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'draft_generated');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from awaiting_approval to email_sent', () => {
      const prospect = createTestProspect({ st: 'awaiting_approval' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'email_sent');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from awaiting_approval back to draft_generated (rejection)', () => {
      const prospect = createTestProspect({ st: 'awaiting_approval' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'draft_generated');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from email_sent to replied', () => {
      const prospect = createTestProspect({ st: 'email_sent' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'replied');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from email_sent to closed_positive (manual)', () => {
      const prospect = createTestProspect({ st: 'email_sent' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'closed_positive');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from email_sent to closed_negative (manual)', () => {
      const prospect = createTestProspect({ st: 'email_sent' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'closed_negative');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from replied to closed_positive', () => {
      const prospect = createTestProspect({ st: 'replied' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'closed_positive');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from replied to closed_negative', () => {
      const prospect = createTestProspect({ st: 'replied' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'closed_negative');
      expect(isLegal).toBe(true);
    });

    test('should allow transition from ANY state to closed_negative (opt-out)', () => {
      const states = StateMachine.VALID_STATES;
      states.forEach(state => {
        const prospect = createTestProspect({ st: state });
        const isLegal = stateMachine.isLegalTransition(prospect, 'closed_negative');
        expect(isLegal).toBe(true);
      });
    });
  });

  describe('Illegal transition blocking', () => {
    test('should block transition from new to draft_generated (skip email_discovered)', () => {
      const prospect = createTestProspect({ st: 'new' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'draft_generated');
      expect(isLegal).toBe(false);
    });

    test('should block transition from new to awaiting_approval', () => {
      const prospect = createTestProspect({ st: 'new' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'awaiting_approval');
      expect(isLegal).toBe(false);
    });

    test('should block transition from email_discovered to awaiting_approval (skip draft_generated)', () => {
      const prospect = createTestProspect({ st: 'email_discovered' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'awaiting_approval');
      expect(isLegal).toBe(false);
    });

    test('should block transition from draft_generated to email_sent (skip awaiting_approval)', () => {
      const prospect = createTestProspect({ st: 'draft_generated' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'email_sent');
      expect(isLegal).toBe(false);
    });

    test('should block transition from awaiting_approval to replied (skip email_sent)', () => {
      const prospect = createTestProspect({ st: 'awaiting_approval' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'replied');
      expect(isLegal).toBe(false);
    });

    test('should block transition from closed_positive to any non-closed state', () => {
      const prospect = createTestProspect({ st: 'closed_positive' });
      const nonClosedStates = ['new', 'email_discovered', 'draft_generated', 'awaiting_approval', 'email_sent', 'replied'];
      nonClosedStates.forEach(state => {
        const isLegal = stateMachine.isLegalTransition(prospect, state);
        expect(isLegal).toBe(false);
      });
    });

    test('should block transition from closed_negative to any non-closed state', () => {
      const prospect = createTestProspect({ st: 'closed_negative' });
      const nonClosedStates = ['new', 'email_discovered', 'draft_generated', 'awaiting_approval', 'email_sent', 'replied'];
      nonClosedStates.forEach(state => {
        const isLegal = stateMachine.isLegalTransition(prospect, state);
        expect(isLegal).toBe(false);
      });
    });

    test('should not allow transition to invalid state', () => {
      const prospect = createTestProspect({ st: 'new' });
      const isLegal = stateMachine.isLegalTransition(prospect, 'invalid_state');
      expect(isLegal).toBe(false);
    });
  });

  describe('Transition enforcement (transitionState)', () => {
    test('should successfully transition when legal', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      const result = stateMachine.transitionState(prospect.id, 'email_discovered', 'Enrichment completed');
      expect(result.success).toBe(true);
      expect(result.newState).toBe('email_discovered');
    });

    test('should block illegal transition and log violation', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      const result = stateMachine.transitionState(prospect.id, 'draft_generated', 'Invalid attempt');
      expect(result.success).toBe(false);
      expect(result.violation).toBeDefined();
    });

    test('should log transition with reason', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      const reason = 'Email validation passed with 0.95 confidence';
      stateMachine.transitionState(prospect.id, 'email_discovered', reason);

      const state = stateMachine.getState();
      const transition = state.transitions[state.transitions.length - 1];
      expect(transition.reason).toBe(reason);
    });

    test('should update lastModified timestamp on transition', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      const beforeTime = Date.now();
      stateMachine.transitionState(prospect.id, 'email_discovered', 'Test');
      const afterTime = Date.now();

      const state = stateMachine.getState();
      const transition = state.transitions[0];
      expect(transition.timestamp).toBeDefined();
      const transitionTime = new Date(transition.timestamp).getTime();
      expect(transitionTime).toBeGreaterThanOrEqual(beforeTime);
      expect(transitionTime).toBeLessThanOrEqual(afterTime);
    });

    test('should find prospect by ID when transitioning', () => {
      const prospect1 = createTestProspect({ id: 'p-001', st: 'new' });
      const prospect2 = createTestProspect({ id: 'p-002', st: 'new' });
      stateMachine.initializeState([prospect1, prospect2]);

      const result = stateMachine.transitionState('p-002', 'email_discovered', 'Test');
      expect(result.success).toBe(true);

      const state = stateMachine.getState();
      const transitionedProspect = state.prospects.find(p => p.id === 'p-002');
      expect(transitionedProspect.st).toBe('email_discovered');
    });

    test('should fail gracefully if prospect not found', () => {
      stateMachine.initializeState([]);
      const result = stateMachine.transitionState('nonexistent-id', 'email_discovered', 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('State persistence', () => {
    test('should persist state changes to JSON file', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);
      stateMachine.transitionState(prospect.id, 'email_discovered', 'Test');

      expect(fs.existsSync(testStateFile)).toBeTruthy();
      const savedState = JSON.parse(fs.readFileSync(testStateFile, 'utf8'));
      expect(savedState.prospects[0].st).toBe('email_discovered');
    });

    test('should preserve state across instantiations', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);
      stateMachine.transitionState(prospect.id, 'email_discovered', 'Test 1');

      const sm2 = new StateMachine(testStateFile);
      const state = sm2.getState();
      expect(state.prospects[0].st).toBe('email_discovered');
      expect(state.transitions.length).toBe(1);
    });

    test('should append multiple transitions to log', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      stateMachine.transitionState(prospect.id, 'email_discovered', 'Transition 1');
      stateMachine.transitionState(prospect.id, 'draft_generated', 'Transition 2');
      stateMachine.transitionState(prospect.id, 'awaiting_approval', 'Transition 3');

      const state = stateMachine.getState();
      expect(state.transitions.length).toBe(3);
      expect(state.transitions[0].to).toBe('email_discovered');
      expect(state.transitions[1].to).toBe('draft_generated');
      expect(state.transitions[2].to).toBe('awaiting_approval');
    });
  });

  describe('Violation logging', () => {
    test('should log illegal transition attempts', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      stateMachine.transitionState(prospect.id, 'draft_generated', 'Illegal attempt');
      const state = stateMachine.getState();
      expect(state.violations.length).toBe(1);
      expect(state.violations[0].from).toBe('new');
      expect(state.violations[0].to).toBe('draft_generated');
    });

    test('should include violation details (who, when, reason)', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      stateMachine.transitionState(prospect.id, 'draft_generated', 'Manual error test');
      const state = stateMachine.getState();
      const violation = state.violations[0];

      expect(violation.prospectId).toBe(prospect.id);
      expect(violation.timestamp).toBeDefined();
      expect(violation.reason).toBe('Manual error test');
    });

    test('should alert user on violation (via callback)', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      const alertSpy = jest.fn();
      const sm = new StateMachine(testStateFile, alertSpy);
      sm.initializeState([prospect]);
      sm.transitionState(prospect.id, 'draft_generated', 'Test alert');

      expect(alertSpy).toHaveBeenCalled();
      // Find the violation alert (may be after pool warning)
      const violationAlert = alertSpy.mock.calls.find(call => call[0].type === 'violation');
      expect(violationAlert).toBeDefined();
      const alertCall = violationAlert[0];
      expect(alertCall.from).toBe('new');
      expect(alertCall.to).toBe('draft_generated');
    });
  });

  describe('Query functions', () => {
    beforeEach(() => {
      const prospects = [
        createTestProspect({ id: 'p-001', st: 'new', tr: 'ai-enablement' }),
        createTestProspect({ id: 'p-002', st: 'email_discovered', tr: 'ai-enablement' }),
        createTestProspect({ id: 'p-003', st: 'draft_generated', tr: 'product-maker' }),
        createTestProspect({ id: 'p-004', st: 'email_sent', tr: 'product-maker' }),
        createTestProspect({ id: 'p-005', st: 'replied', tr: 'pace-car' }),
        createTestProspect({ id: 'p-006', st: 'closed_positive', tr: 'ai-enablement' })
      ];
      stateMachine.initializeState(prospects);
    });

    test('should filter prospects by state', () => {
      const newProspects = stateMachine.getProspectsByState('new');
      expect(newProspects.length).toBe(1);
      expect(newProspects[0].id).toBe('p-001');
    });

    test('should filter prospects by track', () => {
      const aiProspects = stateMachine.getProspectsByTrack('ai-enablement');
      expect(aiProspects.length).toBe(3);
      expect(aiProspects.map(p => p.id)).toEqual(['p-001', 'p-002', 'p-006']);
    });

    test('should filter prospects by state AND track', () => {
      const results = stateMachine.getProspectsByStateAndTrack('email_sent', 'product-maker');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('p-004');
    });

    test('should count prospects in each state', () => {
      const counts = stateMachine.getStateDistribution();
      expect(counts['new']).toBe(1);
      expect(counts['email_discovered']).toBe(1);
      expect(counts['draft_generated']).toBe(1);
      expect(counts['email_sent']).toBe(1);
      expect(counts['replied']).toBe(1);
      expect(counts['closed_positive']).toBe(1);
      expect(counts['closed_negative']).toBe(0);
    });

    test('should count prospects in each track', () => {
      const counts = stateMachine.getTrackDistribution();
      expect(counts['ai-enablement']).toBe(3);
      expect(counts['product-maker']).toBe(2);
      expect(counts['pace-car']).toBe(1);
    });

    test('should identify active pipeline prospects', () => {
      const activePipeline = stateMachine.getActivePipeline();
      // Active = new, email_discovered, draft_generated, awaiting_approval, email_sent, replied
      expect(activePipeline.length).toBe(5);
      expect(activePipeline.map(p => p.id).sort()).toEqual(['p-001', 'p-002', 'p-003', 'p-004', 'p-005'].sort());
    });

    test('should identify closed prospects', () => {
      const closed = stateMachine.getClosedProspects();
      expect(closed.length).toBe(1);
      expect(closed[0].id).toBe('p-006');
    });
  });

  describe('Minimum lead pool monitoring', () => {
    test('should alert when active pipeline < 30 leads', () => {
      const prospects = Array.from({ length: 29 }, (_, i) =>
        createTestProspect({ id: `p-${String(i + 1).padStart(3, '0')}`, st: 'new' })
      );
      stateMachine.initializeState(prospects);

      const alertSpy = jest.fn();
      const sm = new StateMachine(testStateFile, alertSpy);
      sm.initializeState(prospects);

      expect(alertSpy).toHaveBeenCalled();
      const alert = alertSpy.mock.calls.find(call => call[0].type === 'pool_warning');
      expect(alert).toBeDefined();
      expect(alert[0].activeCount).toBe(29);
      expect(alert[0].threshold).toBe(30);
    });

    test('should not alert when active pipeline >= 30 leads', () => {
      const prospects = Array.from({ length: 30 }, (_, i) =>
        createTestProspect({ id: `p-${String(i + 1).padStart(3, '0')}`, st: 'new' })
      );
      stateMachine.initializeState(prospects);

      const alertSpy = jest.fn();
      const sm = new StateMachine(testStateFile, alertSpy);
      sm.initializeState(prospects);

      const poolAlert = alertSpy.mock.calls.find(call => call[0].type === 'pool_warning');
      expect(poolAlert).toBeUndefined();
    });

    test('should include alert metadata (pool size, threshold, closed count)', () => {
      const prospects = Array.from({ length: 25 }, (_, i) =>
        createTestProspect({ id: `p-${String(i + 1).padStart(3, '0')}`, st: 'new' })
      );
      stateMachine.initializeState(prospects);

      const alertSpy = jest.fn();
      const sm = new StateMachine(testStateFile, alertSpy);
      sm.initializeState(prospects);

      const alert = alertSpy.mock.calls.find(call => call[0].type === 'pool_warning')[0];
      expect(alert.activeCount).toBe(25);
      expect(alert.threshold).toBe(30);
      expect(alert.closedCount).toBe(0);
      expect(alert.totalCount).toBe(25);
    });
  });

  describe('Edge cases', () => {
    test('should handle state with no prospects', () => {
      stateMachine.initializeState([]);
      const state = stateMachine.getState();
      expect(state.prospects).toEqual([]);
    });

    test('should handle multiple simultaneous transitions (sequential logging)', () => {
      const prospects = [
        createTestProspect({ id: 'p-001', st: 'new' }),
        createTestProspect({ id: 'p-002', st: 'new' })
      ];
      stateMachine.initializeState(prospects);

      stateMachine.transitionState('p-001', 'email_discovered', 'First transition');
      stateMachine.transitionState('p-002', 'email_discovered', 'Second transition');

      const state = stateMachine.getState();
      expect(state.transitions.length).toBe(2);
      expect(state.transitions[0].prospectId).toBe('p-001');
      expect(state.transitions[1].prospectId).toBe('p-002');
    });

    test('should preserve prospect data during state transitions', () => {
      const prospect = createTestProspect({ id: 'p-001', st: 'new', co: 'OldCompany' });
      stateMachine.initializeState([prospect]);

      stateMachine.transitionState('p-001', 'email_discovered', 'Test');
      const state = stateMachine.getState();
      expect(state.prospects[0].co).toBe('OldCompany');
    });

    test('should handle prospect ID case sensitivity', () => {
      const prospect = createTestProspect({ id: 'P-UPPERCASE', st: 'new' });
      stateMachine.initializeState([prospect]);

      const result = stateMachine.transitionState('P-UPPERCASE', 'email_discovered', 'Test');
      expect(result.success).toBe(true);
    });

    test('should validate newState parameter is string', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      const result = stateMachine.transitionState(prospect.id, null, 'Test');
      expect(result.success).toBe(false);
    });

    test('should trim whitespace in state transitions', () => {
      const prospect = createTestProspect({ st: 'new' });
      stateMachine.initializeState([prospect]);

      const result = stateMachine.transitionState(prospect.id, '  email_discovered  ', 'Test');
      expect(result.success).toBe(true);
      expect(result.newState).toBe('email_discovered');
    });
  });

  describe('Integration with Google Sheets', () => {
    test('should prepare state update payload for Google Sheets write', () => {
      const prospect = createTestProspect({ id: 'p-001', st: 'new' });
      stateMachine.initializeState([prospect]);
      stateMachine.transitionState('p-001', 'email_discovered', 'Email found');

      const sheetsPayload = stateMachine.getSheetsUpdatePayload('p-001');
      expect(sheetsPayload).toBeDefined();
      expect(sheetsPayload.prospectId).toBe('p-001');
      expect(sheetsPayload.newState).toBe('email_discovered');
      expect(sheetsPayload.lastModified).toBeDefined();
    });

    test('should include transition reason in Sheets payload', () => {
      const prospect = createTestProspect({ id: 'p-001', st: 'new' });
      stateMachine.initializeState([prospect]);
      const reason = 'Email validated with 0.95 confidence';
      stateMachine.transitionState('p-001', 'email_discovered', reason);

      const sheetsPayload = stateMachine.getSheetsUpdatePayload('p-001');
      expect(sheetsPayload.reason).toBe(reason);
    });
  });
});
