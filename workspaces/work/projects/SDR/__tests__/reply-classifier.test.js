/**
 * Reply Classifier Tests
 * TDD: classification types, priority ordering, confidence scoring, status mapping
 */

const { classifyReply, getStatusUpdate } = require('../scripts/reply-classifier');

// ============================================================================
// classifyReply — Bounce
// ============================================================================

describe('classifyReply — bounce', () => {
  test('detects "delivery failed"', () => {
    const result = classifyReply('Delivery failed. This message could not be delivered.', '');
    expect(result.classification).toBe('bounce');
    expect(result.confidence).toBeGreaterThanOrEqual(0.3);
  });

  test('detects "mailer-daemon" in sender', () => {
    const result = classifyReply('Message from mailer-daemon: permanent failure.', '');
    expect(result.classification).toBe('bounce');
  });

  test('detects "does not exist"', () => {
    const result = classifyReply('The email address you entered does not exist.', '');
    expect(result.classification).toBe('bounce');
  });

  test('detects "no such user"', () => {
    const result = classifyReply('No such user here.', '');
    expect(result.classification).toBe('bounce');
  });

  test('detects "undeliverable"', () => {
    const result = classifyReply('Your message is undeliverable.', '');
    expect(result.classification).toBe('bounce');
  });

  test('detects "address not found"', () => {
    const result = classifyReply('The address was not found. Check the email address.', '');
    expect(result.classification).toBe('bounce');
  });

  test('returns signals array', () => {
    const result = classifyReply('Delivery failed permanently.', '');
    expect(Array.isArray(result.signals)).toBe(true);
    expect(result.signals.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// classifyReply — Opt Out
// ============================================================================

describe('classifyReply — opt_out', () => {
  test('detects "unsubscribe"', () => {
    const result = classifyReply('Please unsubscribe me from your list.', '');
    expect(result.classification).toBe('opt_out');
  });

  test('detects "remove me"', () => {
    const result = classifyReply('Please remove me from your emails.', '');
    expect(result.classification).toBe('opt_out');
  });

  test('detects "opt out"', () => {
    const result = classifyReply('I would like to opt out of these communications.', '');
    expect(result.classification).toBe('opt_out');
  });

  test('detects "stop emailing"', () => {
    const result = classifyReply('Stop emailing me immediately.', '');
    expect(result.classification).toBe('opt_out');
  });

  test('detects "please remove"', () => {
    const result = classifyReply('Please remove my address from your database.', '');
    expect(result.classification).toBe('opt_out');
  });

  test('detects "take me off"', () => {
    const result = classifyReply('Take me off this mailing list.', '');
    expect(result.classification).toBe('opt_out');
  });
});

// ============================================================================
// classifyReply — Auto Reply
// ============================================================================

describe('classifyReply — auto_reply', () => {
  test('detects "out of office"', () => {
    const result = classifyReply('I am out of office until next Monday.', '');
    expect(result.classification).toBe('auto_reply');
  });

  test('detects "on vacation"', () => {
    const result = classifyReply('I am on vacation this week. I will respond when I return.', '');
    expect(result.classification).toBe('auto_reply');
  });

  test('detects "automatic reply" in subject', () => {
    const result = classifyReply('', 'Automatic reply: Re: Quick question');
    expect(result.classification).toBe('auto_reply');
  });

  test('detects "auto-reply"', () => {
    const result = classifyReply('This is an auto-reply from my mail system.', '');
    expect(result.classification).toBe('auto_reply');
  });

  test('detects "will be back"', () => {
    const result = classifyReply('I will be back on March 20th.', '');
    expect(result.classification).toBe('auto_reply');
  });

  test('detects "on leave"', () => {
    const result = classifyReply('I am currently on leave and will return next week.', '');
    expect(result.classification).toBe('auto_reply');
  });
});

// ============================================================================
// classifyReply — Positive
// ============================================================================

describe('classifyReply — positive', () => {
  test('detects "interested"', () => {
    const result = classifyReply('Hi Oliver, I am definitely interested in learning more.', '');
    expect(result.classification).toBe('positive');
  });

  test('detects "sounds good"', () => {
    const result = classifyReply('Sounds good! When are you free?', '');
    expect(result.classification).toBe('positive');
  });

  test('detects "would love"', () => {
    const result = classifyReply("I would love to connect and hear more about V.Two.", '');
    expect(result.classification).toBe('positive');
  });

  test("detects \"let's chat\"", () => {
    const result = classifyReply("Sure, let's chat this week.", '');
    expect(result.classification).toBe('positive');
  });

  test('detects "open to"', () => {
    const result = classifyReply('I am open to a quick call to explore this further.', '');
    expect(result.classification).toBe('positive');
  });

  test('detects "schedule"', () => {
    const result = classifyReply('Can we schedule a 30 minute call next week?', '');
    expect(result.classification).toBe('positive');
  });

  test('detects "meeting"', () => {
    const result = classifyReply('Happy to set up a meeting. How does Thursday look?', '');
    expect(result.classification).toBe('positive');
  });

  test('detects "yes"', () => {
    const result = classifyReply('Yes, this looks relevant to what we are doing.', '');
    expect(result.classification).toBe('positive');
  });
});

// ============================================================================
// classifyReply — Negative
// ============================================================================

describe('classifyReply — negative', () => {
  test('detects "not interested"', () => {
    const result = classifyReply('Thanks but I am not interested at this time.', '');
    expect(result.classification).toBe('negative');
  });

  test('detects "no thanks"', () => {
    const result = classifyReply('No thanks, we already have a solution in place.', '');
    expect(result.classification).toBe('negative');
  });

  test('detects "not the right time"', () => {
    const result = classifyReply('This is not the right time for us.', '');
    expect(result.classification).toBe('negative');
  });

  test('detects "not relevant"', () => {
    const result = classifyReply('This is not relevant to our business.', '');
    expect(result.classification).toBe('negative');
  });

  test('detects "not a fit"', () => {
    const result = classifyReply("This is not a fit for our current needs.", '');
    expect(result.classification).toBe('negative');
  });

  test('detects "pass"', () => {
    const result = classifyReply('I will pass on this one. Thanks.', '');
    expect(result.classification).toBe('negative');
  });

  test('detects "decline"', () => {
    const result = classifyReply('I have to decline. Good luck with your outreach.', '');
    expect(result.classification).toBe('negative');
  });
});

// ============================================================================
// classifyReply — Unknown
// ============================================================================

describe('classifyReply — unknown', () => {
  test('classifies unrecognized text as unknown', () => {
    const result = classifyReply('Got your message. Will circle back eventually.', '');
    expect(result.classification).toBe('unknown');
  });

  test('classifies empty text as unknown', () => {
    const result = classifyReply('', '');
    expect(result.classification).toBe('unknown');
  });

  test('unknown has null or low confidence', () => {
    const result = classifyReply('', '');
    expect(result.confidence).toBe(0);
  });
});

// ============================================================================
// Priority Ordering
// ============================================================================

describe('classifyReply — priority ordering', () => {
  test('opt_out takes priority over positive when both signals present', () => {
    // Contains "interested" (positive) AND "unsubscribe" (opt_out)
    const result = classifyReply(
      'While I am interested in general, please unsubscribe me from this list.',
      ''
    );
    expect(result.classification).toBe('opt_out');
  });

  test('bounce takes priority over opt_out', () => {
    // Contains bounce signals AND opt_out signals
    const result = classifyReply(
      'Delivery failed. Address not found. Please remove me.',
      ''
    );
    expect(result.classification).toBe('bounce');
  });

  test('bounce takes priority over positive', () => {
    const result = classifyReply(
      'Yes, interested! (delivery failed — this is a test)',
      ''
    );
    expect(result.classification).toBe('bounce');
  });

  test('opt_out takes priority over negative', () => {
    const result = classifyReply(
      'Not interested. Please remove me from your list.',
      ''
    );
    expect(result.classification).toBe('opt_out');
  });
});

// ============================================================================
// Confidence Scoring
// ============================================================================

describe('classifyReply — confidence scoring', () => {
  test('confidence is between 0 and 1', () => {
    const result = classifyReply('I am definitely interested and would love to schedule a meeting.', '');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1.0);
  });

  test('minimum confidence 0.3 for any match', () => {
    const result = classifyReply('Delivery failed.', '');
    expect(result.confidence).toBeGreaterThanOrEqual(0.3);
  });

  test('multiple signals yield higher confidence than single signal', () => {
    const single = classifyReply('Yes.', '');
    const multiple = classifyReply('Yes, sounds good. Happy to schedule a call or meeting.', '');
    expect(multiple.confidence).toBeGreaterThanOrEqual(single.confidence);
  });

  test('confidence capped at 1.0', () => {
    const result = classifyReply(
      'Yes definitely interested sounds good would love to schedule a call meeting connect happy to open to.',
      ''
    );
    expect(result.confidence).toBeLessThanOrEqual(1.0);
  });
});

// ============================================================================
// getStatusUpdate
// ============================================================================

describe('getStatusUpdate', () => {
  test('bounce → bounced', () => {
    expect(getStatusUpdate('bounce')).toBe('bounced');
  });

  test('opt_out → opted_out', () => {
    expect(getStatusUpdate('opt_out')).toBe('opted_out');
  });

  test('positive → replied', () => {
    expect(getStatusUpdate('positive')).toBe('replied');
  });

  test('negative → replied', () => {
    expect(getStatusUpdate('negative')).toBe('replied');
  });

  test('auto_reply → null (no status change)', () => {
    expect(getStatusUpdate('auto_reply')).toBeNull();
  });

  test('unknown → null (no status change)', () => {
    expect(getStatusUpdate('unknown')).toBeNull();
  });

  test('unrecognized classification → null', () => {
    expect(getStatusUpdate('something_else')).toBeNull();
  });
});
