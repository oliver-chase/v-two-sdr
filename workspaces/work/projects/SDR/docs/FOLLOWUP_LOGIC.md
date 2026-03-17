# Follow-Up Calculation & Scheduling Logic

**Version:** 1.0
**Purpose:** Deterministic logic for calculating when prospects are due for follow-up sends and determining safe send windows

---

## Overview

The SDR system uses **deterministic follow-up spacing** relative to the first contact date:

```
Day 0:  Initial send
Day 4:  Follow-up 1 (FU1)
Day 8:  Follow-up 2 (FU2)
Day 14: Follow-up 3 (FU3)
Day 21: Follow-up 4 (FU4)
Day 30: Follow-up 5 (FU5)
```

All dates are calculated from `first_contact_date` in the Google Sheet. The system automatically calculates the next due date and schedules sends only on **Tuesday, Wednesday, or Thursday** during **9–11 AM or 1–3 PM** in the prospect's local timezone.

---

## Part 1: Follow-Up Calculation Logic

### Purpose
Given a prospect record, determine:
1. Is this prospect due for a follow-up TODAY?
2. Which follow-up number is it (1–5)?
3. When is the next contact date?

### Input
```
prospect = {
  id: "p-001234",
  first_contact_date: "2026-03-10",
  followup_1_date: "2026-03-14",
  followup_2_date: "2026-03-18",
  followup_3_date: null,
  followup_4_date: null,
  followup_5_date: null,
  next_contact_date: "2026-03-24",  // Calculated field
  status: "email_sent",              // new, email_discovered, draft_generated, awaiting_approval, email_sent, replied_positive, replied_negative, replied_neutral, replied_unclear, replied_ooo, opt_out, closed_positive, closed_negative
  replaid_date: null
}
```

### Output
```
result = {
  is_due_today: true|false,
  followup_number: 1|2|3|4|5|null,
  target_date: "2026-03-24",
  days_until_due: 0,
  sequence_stage: "followup_1|followup_2|followup_3|followup_4|followup_5|sequence_complete|paused",
  reason: "Follow-up #1 due 4 days from first contact"
}
```

### Algorithm

```pseudocode
FUNCTION calculate_followup(prospect):

  // STEP 1: Validate prospect is eligible
  if prospect.first_contact_date is NULL:
    return {
      is_due_today: false,
      followup_number: null,
      target_date: null,
      sequence_stage: "not_started",
      reason: "First contact date not set"
    }

  if prospect.status in ["opt_out", "closed_positive", "closed_negative"]:
    return {
      is_due_today: false,
      followup_number: null,
      target_date: null,
      sequence_stage: "sequence_complete",
      reason: "Prospect sequence closed"
    }

  if prospect.status in ["replied_ooo"]:
    return {
      is_due_today: false,
      followup_number: null,
      target_date: null,
      sequence_stage: "paused",
      reason: "Out-of-office. Pause until return date."
    }

  // STEP 2: Count how many follow-ups have been sent
  followups_sent = count_non_null([
    prospect.followup_1_date,
    prospect.followup_2_date,
    prospect.followup_3_date,
    prospect.followup_4_date,
    prospect.followup_5_date
  ])

  // STEP 3: Determine next follow-up number and target date
  // Spacing from first_contact_date
  spacings = {
    1: 4 days,
    2: 8 days,
    3: 14 days,
    4: 21 days,
    5: 30 days
  }

  if followups_sent == 0:
    next_fu_number = 1
    target_date = prospect.first_contact_date + spacings[1]
    sequence_stage = "followup_1"

  else if followups_sent == 1:
    next_fu_number = 2
    target_date = prospect.first_contact_date + spacings[2]
    sequence_stage = "followup_2"

  else if followups_sent == 2:
    next_fu_number = 3
    target_date = prospect.first_contact_date + spacings[3]
    sequence_stage = "followup_3"

  else if followups_sent == 3:
    next_fu_number = 4
    target_date = prospect.first_contact_date + spacings[4]
    sequence_stage = "followup_4"

  else if followups_sent == 4:
    next_fu_number = 5
    target_date = prospect.first_contact_date + spacings[5]
    sequence_stage = "followup_5"

  else:
    // All 5 follow-ups sent
    return {
      is_due_today: false,
      followup_number: null,
      target_date: null,
      sequence_stage: "sequence_complete",
      reason: "All 5 follow-ups completed. Sequence closed."
    }

  // STEP 4: Check if due TODAY
  today = TODAY()
  days_until = date_diff(target_date, today)
  is_due_today = (days_until <= 0)

  return {
    is_due_today: is_due_today,
    followup_number: next_fu_number,
    target_date: target_date,
    days_until_due: days_until,
    sequence_stage: sequence_stage,
    reason: format("Follow-up #{next_fu_number} due {days_until} days from first contact ({target_date})")
  }

END FUNCTION
```

### Examples

#### Example 1: Initial Send (No Follow-ups Yet)
```
INPUT:
  prospect.first_contact_date = "2026-03-10"
  prospect.followup_1_date = null
  prospect.followup_2_date = null
  prospect.status = "email_sent"

TODAY = "2026-03-14"

CALCULATION:
  followups_sent = 0
  next_fu_number = 1
  target_date = 2026-03-10 + 4 days = 2026-03-14
  is_due_today = (2026-03-14 <= 2026-03-14) = true
  days_until = 0

OUTPUT:
  {
    is_due_today: true,
    followup_number: 1,
    target_date: "2026-03-14",
    days_until_due: 0,
    sequence_stage: "followup_1",
    reason: "Follow-up #1 due 0 days from first contact (2026-03-14)"
  }
```

#### Example 2: Follow-Up 2 Not Yet Due
```
INPUT:
  prospect.first_contact_date = "2026-03-10"
  prospect.followup_1_date = "2026-03-14"
  prospect.followup_2_date = null
  prospect.status = "email_sent"

TODAY = "2026-03-17"

CALCULATION:
  followups_sent = 1
  next_fu_number = 2
  target_date = 2026-03-10 + 8 days = 2026-03-18
  is_due_today = (2026-03-18 <= 2026-03-17) = false
  days_until = 1

OUTPUT:
  {
    is_due_today: false,
    followup_number: 2,
    target_date: "2026-03-18",
    days_until_due: 1,
    sequence_stage: "followup_2",
    reason: "Follow-up #2 due 1 day from first contact (2026-03-18)"
  }
```

#### Example 3: Follow-Up 3 Due, But Reply Received
```
INPUT:
  prospect.first_contact_date = "2026-03-10"
  prospect.followup_1_date = "2026-03-14"
  prospect.followup_2_date = "2026-03-18"
  prospect.followup_3_date = null
  prospect.status = "replied_positive"  // Changed due to reply
  prospect.replied_date = "2026-03-19"

TODAY = "2026-03-24"

CALCULATION:
  prospect.status in ["replied_positive", ...] = false (only closed_* and opt_out stop sequence)

  BUT: Check for automatic sequence pause logic (see PAUSING RULES below)
  If prospect.status = "replied_positive", should we pause?
  → Yes: positive replies should pause sequence (manual follow-up decision)

  sequence_stage = "paused"
  is_due_today = false

OUTPUT:
  {
    is_due_today: false,
    followup_number: 3,
    target_date: "2026-03-24",
    days_until_due: 0,
    sequence_stage: "paused",
    reason: "Prospect replied positively on 2026-03-19. Pause sequence pending manual review."
  }
```

#### Example 4: All Follow-Ups Sent
```
INPUT:
  prospect.first_contact_date = "2026-03-01"
  prospect.followup_1_date = "2026-03-05"
  prospect.followup_2_date = "2026-03-09"
  prospect.followup_3_date = "2026-03-15"
  prospect.followup_4_date = "2026-03-22"
  prospect.followup_5_date = "2026-03-31"
  prospect.status = "email_sent"

TODAY = "2026-03-31"

CALCULATION:
  followups_sent = 5
  → Return sequence_complete

OUTPUT:
  {
    is_due_today: false,
    followup_number: null,
    target_date: null,
    days_until_due: null,
    sequence_stage: "sequence_complete",
    reason: "All 5 follow-ups completed. Sequence closed."
  }
```

---

## Part 2: Scheduling Logic

### Purpose
Given a prospect who is due for a follow-up, determine:
1. Should we send TODAY?
2. If not, what's the next eligible send date?
3. What send window (9–11 AM or 1–3 PM)?
4. In the prospect's local timezone

### Input
```
prospect = {
  id: "p-001234",
  timezone: "America/New_York",
  next_contact_date: "2026-03-24",  // from calculate_followup() or first contact + spacing
  status: "email_sent"
}

today = "2026-03-24"
current_time = "2026-03-24T13:30:00Z"
```

### Output
```
schedule = {
  send_today: true|false,
  scheduled_date: "2026-03-24",
  send_windows: [
    { start_hour: 9, end_hour: 11, tz: "America/New_York", label: "Morning" },
    { start_hour: 13, end_hour: 15, tz: "America/New_York", label: "Afternoon" }
  ],
  active_window: "2026-03-24T13:00:00-04:00 to 2026-03-24T15:00:00-04:00",
  reason: "Tue: eligible day. Afternoon window open. Send now."
}
```

### Algorithm

```pseudocode
FUNCTION schedule_send(prospect, today, current_time):

  // STEP 1: Check if today is an eligible day (Tue, Wed, Thu)
  day_of_week = DOW(today)  // 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
  eligible_days = [2, 3, 4]  // Tue, Wed, Thu

  if day_of_week NOT IN eligible_days:
    // Find next eligible day
    next_eligible_date = today + 1 day
    while DOW(next_eligible_date) NOT IN eligible_days:
      next_eligible_date += 1 day

    return {
      send_today: false,
      scheduled_date: next_eligible_date,
      send_windows: null,
      active_window: null,
      reason: format("Today is {DAY_NAME}. Next eligible day: {next_eligible_date} ({DAY_NAME})")
    }

  // STEP 2: Today IS eligible. Check prospect's next_contact_date
  if prospect.next_contact_date > today:
    // Prospect not yet due
    return {
      send_today: false,
      scheduled_date: prospect.next_contact_date,
      send_windows: null,
      active_window: null,
      reason: format("Prospect not due until {prospect.next_contact_date}")
    }

  // STEP 3: TODAY IS ELIGIBLE AND PROSPECT IS DUE
  // Get current time in prospect's timezone
  prospect_tz = prospect.timezone
  current_time_local = convert_to_tz(current_time, prospect_tz)
  current_hour = current_time_local.hour

  // Define send windows (in prospect's local time)
  windows = [
    { start: 9, end: 11, label: "Morning" },
    { start: 13, end: 15, label: "Afternoon" }
  ]

  // Determine which window is active or next
  active_window = null
  next_window = null

  if current_hour >= 9 and current_hour < 11:
    // In morning window
    active_window = windows[0]

  else if current_hour >= 13 and current_hour < 15:
    // In afternoon window
    active_window = windows[0]

  else if current_hour < 9:
    // Before morning window
    next_window = windows[0]
    scheduled_date = today

  else if current_hour >= 11 and current_hour < 13:
    // Between windows
    next_window = windows[1]
    scheduled_date = today

  else if current_hour >= 15:
    // After all windows for today, defer to next eligible day
    next_eligible_date = today + 1 day
    while DOW(next_eligible_date) NOT IN [2, 3, 4]:
      next_eligible_date += 1 day

    next_window = windows[0]
    scheduled_date = next_eligible_date

  // STEP 4: Build return object
  if active_window:
    active_window_start = today + "T" + format_time(active_window.start) + " " + prospect_tz
    active_window_end = today + "T" + format_time(active_window.end) + " " + prospect_tz

    return {
      send_today: true,
      scheduled_date: today,
      send_windows: windows,
      active_window: {
        start: active_window_start,
        end: active_window_end,
        label: active_window.label
      },
      reason: format("Eligible day + due prospect. {active_window.label} window open now.")
    }

  else:
    next_window_start = scheduled_date + "T" + format_time(next_window.start) + " " + prospect_tz
    next_window_end = scheduled_date + "T" + format_time(next_window.end) + " " + prospect_tz

    return {
      send_today: false,
      scheduled_date: scheduled_date,
      send_windows: windows,
      active_window: {
        start: next_window_start,
        end: next_window_end,
        label: next_window.label
      },
      reason: format("Scheduled for {scheduled_date} {next_window.label} window ({next_window.start}–{next_window.end}h {prospect_tz})")
    }

END FUNCTION
```

### Examples

#### Example 1: Tuesday, Afternoon Window Open
```
INPUT:
  prospect.timezone = "America/New_York"
  prospect.next_contact_date = "2026-03-24"
  today = "2026-03-24"  (Tuesday)
  current_time = "2026-03-24T13:30:00Z" (9:30 AM ET)

CALCULATION:
  day_of_week(2026-03-24) = 2 (Tuesday)
  eligible_days = [2, 3, 4] → yes, eligible

  prospect.next_contact_date (2026-03-24) <= today (2026-03-24) → yes, due

  current_time_local = 2026-03-24T09:30:00-04:00
  current_hour = 9

  In morning window (9–11 AM)
  active_window = windows[0]

OUTPUT:
  {
    send_today: true,
    scheduled_date: "2026-03-24",
    send_windows: [
      { start: 9, end: 11, label: "Morning" },
      { start: 13, end: 15, label: "Afternoon" }
    ],
    active_window: {
      start: "2026-03-24T09:00:00-04:00",
      end: "2026-03-24T11:00:00-04:00",
      label: "Morning"
    },
    reason: "Eligible day + due prospect. Morning window open now."
  }
```

#### Example 2: Saturday (Not Eligible Day)
```
INPUT:
  prospect.timezone = "America/Los_Angeles"
  prospect.next_contact_date = "2026-03-21"
  today = "2026-03-21"  (Saturday)
  current_time = "2026-03-21T08:00:00Z"

CALCULATION:
  day_of_week(2026-03-21) = 6 (Saturday)
  eligible_days = [2, 3, 4] → NO, not eligible

  next_eligible_date = 2026-03-22 (Sunday) → not eligible
  next_eligible_date = 2026-03-23 (Monday) → not eligible
  next_eligible_date = 2026-03-24 (Tuesday) → eligible!

OUTPUT:
  {
    send_today: false,
    scheduled_date: "2026-03-24",
    send_windows: null,
    active_window: null,
    reason: "Today is Saturday. Next eligible day: 2026-03-24 (Tuesday)"
  }
```

#### Example 3: Wednesday, After Hours
```
INPUT:
  prospect.timezone = "America/Chicago"
  prospect.next_contact_date = "2026-03-19"
  today = "2026-03-19"  (Wednesday)
  current_time = "2026-03-19T22:30:00Z" (4:30 PM CT)

CALCULATION:
  day_of_week(2026-03-19) = 3 (Wednesday)
  eligible_days = [2, 3, 4] → yes, eligible

  prospect.next_contact_date (2026-03-19) <= today (2026-03-19) → yes, due

  current_time_local = 2026-03-19T16:30:00-05:00
  current_hour = 16 (4:30 PM)

  After all windows (>15:00)
  next_window = windows[0] (morning)
  next_eligible_date = 2026-03-20 (Thursday) → eligible!

OUTPUT:
  {
    send_today: false,
    scheduled_date: "2026-03-20",
    send_windows: [
      { start: 9, end: 11, label: "Morning" },
      { start: 13, end: 15, label: "Afternoon" }
    ],
    active_window: {
      start: "2026-03-20T09:00:00-05:00",
      end: "2026-03-20T11:00:00-05:00",
      label: "Morning"
    },
    reason: "After office hours. Scheduled for 2026-03-20 (Thu) Morning window (9–11 AM CT)"
  }
```

---

## Part 3: Sequence Pausing Rules

Certain prospect states should **automatically pause** the follow-up sequence. The prospect is not closed, but no further sends should occur until manual review.

### Pausing Triggers

| Trigger | Condition | Action |
|---------|-----------|--------|
| **Positive reply** | `status == "replied_positive"` | Pause. Manual: schedule follow-up call, move to sales, or close as won |
| **Out-of-office** | `status == "replied_ooo"` | Pause. Resume on return date |
| **Unclear reply** | `status == "replied_unclear"` AND `confidence < 0.8` | Pause. Manual: classify and decide next step |
| **Opt-out** | `status == "opt_out"` | Closed. Stop all sends |
| **Negative reply** | `status == "replied_negative"` | Closed. Stop all sends |

### Pausing Logic

```pseudocode
FUNCTION should_pause_sequence(prospect):

  if prospect.status in [
    "replied_positive",
    "replied_unclear",
    "replied_ooo"
  ]:
    return true

  if prospect.status in [
    "opt_out",
    "replied_negative",
    "closed_positive",
    "closed_negative"
  ]:
    // Fully closed
    return true

  return false

END FUNCTION
```

### Resuming Paused Sequences

```pseudocode
FUNCTION resume_paused_sequence(prospect, action):

  // Manual user action to resume
  if action == "call_scheduled":
    prospect.status = "call_scheduled"
    prospect.notes += "Follow-up call scheduled. Resume sequence after call."
    return prospect

  else if action == "reschedule_followup":
    // User manually sets next follow-up date
    prospect.next_contact_date = user_input_date
    prospect.status = "email_sent"  // Back to normal sequence
    return prospect

  else if action == "close_positive":
    prospect.status = "closed_positive"
    prospect.notes += "Closed as qualified. No further sends."
    return prospect

  else if action == "close_negative":
    prospect.status = "closed_negative"
    prospect.notes += "Closed as not a fit. No further sends."
    return prospect

  else if action == "ooo_return":
    // User indicates OOO prospect has returned
    prospect.status = "email_sent"
    prospect.next_contact_date = TODAY()  // Immediately eligible for follow-up
    return prospect

END FUNCTION
```

---

## Part 4: Implementation Reference

### Google Sheet Column Mapping

| Column Name | TOON Key | Type | Purpose |
|-------------|----------|------|---------|
| First Contact Date | `fc` | DATE | When initial email was sent |
| Follow-Up 1 Date | `f1` | DATE | When FU1 was sent |
| Follow-Up 2 Date | `f2` | DATE | When FU2 was sent |
| Follow-Up 3 Date | `f3` | DATE | When FU3 was sent |
| Follow-Up 4 Date | `f4` | DATE | When FU4 was sent |
| Follow-Up 5 Date | `f5` | DATE | When FU5 was sent |
| Next Contact Date | `nc` | DATE | Calculated field: when to send next |
| Status | `st` | STRING | Prospect lifecycle state |
| Timezone | `tz` | STRING | IANA timezone for send scheduling |

### Calculating next_contact_date

```
// This is a FORMULA in the Google Sheet
// Column: "Next Contact Date" (H column, for example)

=IF(
  STATUS="opt_out" OR STATUS="closed_positive" OR STATUS="closed_negative",
  "",
  IF(
    STATUS="replied_positive" OR STATUS="replied_ooo" OR STATUS="replied_unclear",
    "MANUAL_REVIEW",
    IF(
      ISBLANK(FOLLOWUP_5_DATE),
      IF(
        ISBLANK(FOLLOWUP_4_DATE),
        IF(
          ISBLANK(FOLLOWUP_3_DATE),
          IF(
            ISBLANK(FOLLOWUP_2_DATE),
            IF(
              ISBLANK(FOLLOWUP_1_DATE),
              FIRST_CONTACT_DATE + 4,  // Initial + 4 days
              FIRST_CONTACT_DATE + 8   // +8 days from first
            ),
            FIRST_CONTACT_DATE + 14
          ),
          FIRST_CONTACT_DATE + 21
        ),
        FIRST_CONTACT_DATE + 30
      ),
      ""
    )
  )
)
```

---

## Summary

**Follow-Up Calculation:**
- Count how many follow-ups have been sent
- Calculate target date = first_contact_date + spacing[count+1]
- Return: is_due_today, followup_number, target_date

**Scheduling:**
- Check if today is Tue/Wed/Thu
- Check if prospect.next_contact_date <= today
- Return: send_today, scheduled_date, send_windows

**Pausing:**
- Positive/unclear/OOO replies → pause pending manual action
- Opt-out/negative/closed → stop all sends

All logic is **deterministic** (no LLM involved) and designed to integrate with OpenClaw's daily orchestration pipeline.

---

**Last Updated:** 2026-03-16
**Version:** 1.0 (Design Complete)
