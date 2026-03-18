/**
 * SDR State Machine Configuration
 * Defines states, transitions, thresholds, and monitoring rules
 */

module.exports = {
  /**
   * Lead Lifecycle States (8 total)
   * Ordered by progression through pipeline
   */
  states: {
    // Discovery phase
    'new': {
      label: 'New Lead',
      description: 'Prospect added to database, no enrichment yet',
      order: 1,
      active: true,
      closedState: false
    },
    'email_discovered': {
      label: 'Email Discovered',
      description: 'Valid email found and validated via pattern/MX check',
      order: 2,
      active: true,
      closedState: false
    },

    // Drafting phase
    'draft_generated': {
      label: 'Draft Generated',
      description: 'Email draft created, awaiting approval',
      order: 3,
      active: true,
      closedState: false
    },
    'awaiting_approval': {
      label: 'Awaiting Approval',
      description: 'Draft queued for SDR review and approval',
      order: 4,
      active: true,
      closedState: false
    },

    // Execution phase
    'email_sent': {
      label: 'Email Sent',
      description: 'Email delivered to prospect, awaiting reply',
      order: 5,
      active: true,
      closedState: false
    },
    'replied': {
      label: 'Replied',
      description: 'Prospect sent reply, awaiting classification',
      order: 6,
      active: true,
      closedState: false
    },

    // Closure states
    'closed_positive': {
      label: 'Closed (Positive)',
      description: 'Positive reply or meeting booked',
      order: 7,
      active: false,
      closedState: true
    },
    'closed_negative': {
      label: 'Closed (Negative)',
      description: 'No reply, opt-out, or explicit negative response',
      order: 8,
      active: false,
      closedState: true
    }
  },

  /**
   * Legal transitions
   * Defines which states can transition to which other states
   */
  transitions: {
    'new': ['email_discovered'],
    'email_discovered': ['draft_generated'],
    'draft_generated': ['awaiting_approval', 'draft_generated'], // Allow regeneration
    'awaiting_approval': ['email_sent', 'draft_generated'], // Allow rejection/rewrite
    'email_sent': ['replied', 'closed_positive', 'closed_negative'],
    'replied': ['closed_positive', 'closed_negative'],
    'closed_positive': [], // Final state
    'closed_negative': [] // Final state (special: any state can transition here for opt-outs)
  },

  /**
   * Minimum lead pool threshold
   * Alerts triggered when active pipeline < threshold
   */
  leadPool: {
    minThreshold: 30,
    warningLevel: 50, // Secondary warning at this level
    recommendedRamp: 100, // Target for scaling
    alerts: {
      enabled: true,
      channels: ['telegram', 'log'],
      messageTemplate: (count, threshold) =>
        `⚠️  Lead pool warning: Only ${count} active prospects (need ${threshold}). Ramp research ASAP.`
    }
  },

  /**
   * State query helpers
   */
  stateGroups: {
    active: ['new', 'email_discovered', 'draft_generated', 'awaiting_approval', 'email_sent', 'replied'],
    closed: ['closed_positive', 'closed_negative'],
    draft: ['draft_generated', 'awaiting_approval'],
    sent: ['email_sent', 'replied', 'closed_positive', 'closed_negative']
  },

  /**
   * Transition tracking
   * What information to capture for each transition
   */
  transitionLog: {
    captureFields: [
      'prospectId',
      'from',
      'to',
      'timestamp',
      'reason',
      'duration' // Time in previous state
    ],
    defaultReason: 'Automatic state transition'
  },

  /**
   * Violation tracking
   * Logs and alerts for illegal transition attempts
   */
  violationTracking: {
    logToFile: true,
    alertUser: true,
    captureContext: true, // Include prospect details in violation log
    severityLevels: {
      'new->draft_generated': 'high', // Skipping required step
      'draft_generated->email_sent': 'high', // Missing approval
      'awaiting_approval->replied': 'medium', // Possible race condition
      'closed->*': 'critical' // Trying to reopen closed lead
    }
  },

  /**
   * Integration points
   */
  integrations: {
    googleSheets: {
      enabled: true,
      updateField: 'st', // TOON format: 'st' for state
      trackingFields: ['st', 'lc', 'nf'], // state, last_changed, next_followup
      writeFrequency: 'immediate' // Write immediately or batch
    },
    telegram: {
      enabled: true,
      alertTypes: ['pool_warning', 'violation_critical', 'violation_high']
    },
    logging: {
      directory: './workspaces/work/projects/SDR',
      stateFile: 'SDR_STATE.json',
      violationFile: 'violation-log.jsonl'
    }
  },

  /**
   * Monitoring rules
   */
  monitoring: {
    checkInterval: 3600000, // Check every hour
    emailThreshold: {
      dailyMax: 25, // Max emails per day during scale
      dailyRamp: 15 // Emails per day during ramp
    },
    replyRateTarget: {
      minimum: 0.05, // 5% minimum reply rate
      expected: 0.10, // 10% expected
      excellent: 0.15 // 15%+
    }
  },

  /**
   * Timeout/SLA rules
   */
  sla: {
    followupDays: 3, // Follow up after N days if no reply
    closureDays: 7, // Close lead after N days if no reply (after followup)
    appraisal: {
      draftToApprovalMax: 2, // Hours before escalating draft
      approvalToSendMax: 1 // Hours before escalating approval
    }
  }
};
