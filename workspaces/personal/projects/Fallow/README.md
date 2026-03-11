# Event Discovery Platform - Data Schema

## Architecture Overview

This event discovery platform separates **recurring event patterns** from **individual instances**.

### Core Objects

1. **Canonical Events** — The persistent "memory" of an event
   - Stores recurrence pattern (annual, seasonal, weekly, etc.)
   - Tracks last confirmed occurrence
   - Learns historical announcement windows
   - Can be archived without deletion

2. **Event Instances** — Individual occurrences
   - Linked to canonical event
   - Confirmed vs speculative
   - Tracks source (scrape, user submission, API)
   - Includes lineup, venue variations, pricing

3. **Deduplication Key** — Matches instances across sources
   - Format: `YYYY-MM-DD|VenueName|City|State`
   - Identifies same event across multiple URLs
   - Handles slight name variations

### Deduplication Strategy

**Same event, different sources:**
- "Boulder Creek Festival" on May 24 @ Central Park
- "Boulder Creek Fest" on 5/24 @ Central Park Area
- → **One canonical event, multiple instances**

**Same series, different artists:**
- Alpenglow Concert Series: Easy Jim (July 14)
- Alpenglow Concert Series: Holly Bowling (June 30)
- → **One canonical "Alpenglow" series, multiple instances with artist tags**

**Same event name, different venues/cities:**
- Arvada Farmers Market vs Cherry Creek Farmers Market
- → **Separate canonical events** (different venues)

### Recurrence Detection

Pattern matching on:
- Date consistency (same date each week/month/year)
- Venue consistency
- Series naming conventions
- Historical occurrence frequency
- Announcement timing patterns

**Confidence scoring:**
- High (0.9+): Weekly event observed 20+ times
- Medium (0.5-0.9): Seasonal pattern observed 3+ cycles
- Low (0.1-0.5): Single occurrence or uncertain pattern
- Speculative (0.0): Announced but not yet confirmed

### Archival & Revival

**Archive conditions:**
- Inactive 3+ years (customizable threshold)
- Venue closed (verified)
- Organizer ceased operations
- But NEVER deleted—metadata preserved

**Revival detection:**
- Same name resurfaces after gap
- Same venue resumes events
- Seasonal event returns after dormant period

---

## Files

- `seed_data.csv` — Initial import (1000+ events, CO/WY)
- `event_schema.json` — Data model definition
- `canonical_events.json` — Recurring event templates
- `event_instances.json` — Individual occurrences
- `deduplication_log.json` — Merged entries tracking

---

## Legal Compliance

✓ Data sourced from public URLs, city websites, Facebook, Eventbrite
✓ No user data collected beyond event submissions
✓ User submissions require explicit venue/event disclosure
✓ Respect robots.txt and API ToS
✓ No scraping of transactional (ticketing) systems
✓ Metadata only (name, date, location, public links)
