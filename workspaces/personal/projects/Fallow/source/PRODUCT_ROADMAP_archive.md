# FALLOW — Product Ownership Roadmap

**Status:** Phase 3 complete. Ready for redesign + feature buildout.  
**Session:** 2026-03-01  
**Scope:** Full product assessment + prioritized feature roadmap  

---

## 1. CURRENT STATE AUDIT

### ✅ What's Built

**Backend (Production-Ready)**
- Express server (3000 lines)
- 6 free APIs integrated (Meetup, Eventbrite, city calendars, RA, DJ.com, etc.)
- Automated dedup (Levenshtein 70-point threshold)
- Weekly monitoring scheduler
- Canonical event schema (100+ CO/NY events)
- Email service stub (ready for production)

**Frontend (Functional but Unstyled)**
- React UI (browse, search, filter tabs)
- Event cards (shows event details + sources)
- Filter panel (city, type, source, date range)
- Review queue stub (UI ready, backend not connected)
- Sweep status (shows metrics, trigger button)

**Data**
- 100+ canonical events (CO/NY metro)
- 5+ years historical data
- Source attribution on each event
- Monitoring URLs + last-checked timestamps

### ❌ What's Missing or Broken

**Data Layer**
- [ ] Cost data NOT in canonical schema → need to add
- [ ] Venue details minimal (name + city only) → need address, lat/lng, website
- [ ] Event images/descriptions sparse
- [ ] Recurring event patterns not fully modeled
- [ ] User favorites/watchlist not persisted

**Backend API**
- [ ] `/api/events/all` endpoint broken (404 error in UI)
- [ ] `/api/venues` endpoint missing (needed for autocomplete)
- [ ] `/api/submit` endpoint missing (user venue submission)
- [ ] `/api/suggest` endpoint missing (autocomplete + "not found" flow)
- [ ] `/api/favorites` endpoints missing
- [ ] Cost filter not in API query params

**Frontend/UX**
- [ ] Dropdowns not accessible (need proper select components)
- [ ] Date range is broken dropdown → need calendar picker
- [ ] Search has no autocomplete → need Downshift or Combobox
- [ ] "Not found" prompt missing → should trigger "Add Venue" modal
- [ ] No venue submission flow at all
- [ ] Source filter unhelpful to users → should remove
- [ ] Cost filter missing entirely
- [ ] Mobile-first responsive broken
- [ ] No visual hierarchy, poor typography
- [ ] No whitespace, feels cramped
- [ ] No thin-line iconography, uses emoji (❌)

**Design**
- [ ] Color palette muted/wrong (sage too dark)
- [ ] Fonts generic (no serif, no warmth)
- [ ] Spacing inconsistent
- [ ] No card hover states
- [ ] No loading states, empty states
- [ ] No error messaging design
- [ ] Buttons not styled correctly
- [ ] Input fields basic/ugly

---

## 2. FEATURE PRIORITY MATRIX

### Tier 1 (Critical — Week 1)

| Feature | Impact | Effort | Owner | Notes |
|---------|--------|--------|-------|-------|
| **Fix API endpoints** | 🔴 Blocks UI | 1h | Backend | `/api/events/all` 404 + missing `/venues` |
| **Design system rewrite** | 🔴 UX blocker | 4h | Frontend | Pinks + greens, serif, whitespace, thin lines |
| **Search autocomplete** | 🟡 Core UX | 3h | Frontend | Combobox dropdown (no emoji) |
| **Add Venue flow** | 🟢 Discovery enabler | 4h | Full-stack | Modal → submit → auto-confirm |
| **Calendar date picker** | 🟡 UX polish | 2h | Frontend | Replace broken dropdown |
| **Cost filter** | 🟡 Segmentation | 2h | Full-stack | Schema + API + UI |
| **Venue data enrichment** | 🟡 Quality | 3h | Backend | Add address, lat/lng, website to canonical |

**Subtotal: 19 hours (~1 day)**

### Tier 2 (Important — Week 2)

| Feature | Impact | Effort | Owner | Notes |
|---------|--------|--------|-------|-------|
| **Favorites/watchlist** | 🟢 Engagement | 5h | Full-stack | Persist to localStorage, show badge |
| **Event details page** | 🟢 Discovery | 3h | Frontend | Full event view, venue context |
| **Email notifications** | 🟢 Retention | 4h | Backend | Daily digest on favorites |
| **Review queue backend** | 🟡 Admin | 3h | Backend | Connect UI to merge/reject logic |
| **Map view (optional)** | 🔵 Nice-to-have | 6h | Frontend | Show events by location |
| **Export to iCal** | 🟡 Utility | 2h | Backend | Button on event card |
| **User accounts** | 🔵 Phase 4 | 8h | Full-stack | Auth + favorites sync |

**Subtotal: 31 hours (~2 days)**

### Tier 3 (Nice-to-Have — Post-Launch)

| Feature | Impact | Effort | Owner | Notes |
|---------|--------|--------|-------|-------|
| **Notifications (push)** | 🔵 Engagement | 4h | Backend | Browser/mobile push |
| **Analytics dashboard** | 🔵 Insights | 5h | Backend | Event popularity, search trends |
| **Community curation** | 🔵 Trust | 4h | Backend | User upvote/downvote system |
| **Personalized recommendations** | 🔵 Growth | 6h | Backend | ML-lite matching on user pref |

---

## 3. DATA MODEL GAPS

### Current Canonical Event Schema
```json
{
  "id": "co-001",
  "name": "Denver Comic Con",
  "city": "Denver",
  "state": "CO",
  "type": "Festival",
  "date": "2026-05-14",
  "venue": "Colorado Convention Center",
  "sources": ["meetup", "eventbrite"]
}
```

### Needed Additions
```json
{
  // Existing
  "id": "co-001",
  "name": "Denver Comic Con",
  "city": "Denver",
  "state": "CO",
  "type": "Festival",
  "date": "2026-05-14",
  "time_start": "10:00",
  "time_end": "18:00",
  "timezone": "America/Denver",

  // VENUE ENRICHMENT (NEW)
  "venue": {
    "name": "Colorado Convention Center",
    "address": "700 14th St, Denver, CO 80202",
    "lat": 39.7392,
    "lng": -104.9903,
    "website": "https://www.denverconvention.com",
    "phone": "(303) 228-8000"
  },

  // COST (NEW)
  "cost": {
    "type": "free",  // "free" | "paid" | "tiered"
    "min": 0,
    "max": 0,
    "currency": "USD"
  },

  // DESCRIPTION (NEW)
  "description": "Annual comic book and pop culture convention",
  "image_url": "https://...",
  "url": "https://denvercomiccon.com",

  // RECURRENCE (NEW)
  "recurrence": {
    "pattern": "annual",  // "one-off" | "weekly" | "monthly" | "annual"
    "frequency": 1,
    "next_date": "2027-05-21"
  },

  // METADATA
  "sources": ["meetup", "eventbrite"],
  "source_urls": {
    "meetup": "https://meetup.com/...",
    "eventbrite": "https://eventbrite.com/..."
  },
  "last_verified": "2026-02-28T22:45:00Z",
  "confidence_score": 0.95
}
```

### Migration Path
1. Week 1: Add `cost` + `venue.address` + `venue.lat/lng`
2. Week 2: Add descriptions + images (from APIs)
3. Week 3: Add recurrence patterns (from historical data)

---

## 4. UX FLOWS

### A. Browse + Search + Find

**Current:** Broken. `/api/events/all` 404.

**New Flow:**
1. User lands → App loads all events (100+)
2. User types in search box
3. Autocomplete dropdown shows:
   - Matching venues/events
   - "Add [venue name]?" option if no match
4. User selects → card highlights, scrolls to view
5. User clicks card → detail page opens
6. User clicks heart → adds to favorites (saved)

**Code Path:**
- `GET /api/venues?q=denver` → autocomplete list
- `GET /api/events?venue_id=123` → filter by venue
- `POST /api/venues` → new venue submission

---

### B. Add a Venue (Submission Flow)

**Trigger:** User searches for "Lakewood Pottery" → not found → clicks "Add Lakewood Pottery?"

**Modal Opens:**
- Venue name (pre-filled from search)
- Location (city + state dropdowns)
- Website URL
- Contact info (optional)
- Event type (multi-select: classes, workshops, gallery, etc.)

**Submit:**
- Validate URL (reachable?)
- Auto-dedup (exact name + city match?)
- Create venue in database
- Send confirmation email
- Show "Now tracking — we'll check weekly"

**Backend:**
```
POST /api/venues
{
  "name": "Lakewood Pottery Studio",
  "city": "Lakewood",
  "state": "CO",
  "url": "https://lakewoodarts.com/classes",
  "email": "user@example.com",
  "event_types": ["class", "workshop"]
}
```

**Response:**
```json
{
  "id": "venue-123",
  "status": "pending",
  "message": "Venue submitted! We'll start checking it weekly.",
  "events": []
}
```

---

### C. Filter + Explore

**Available Filters:**
1. **City** (Denver, Boulder, Arvada, Fort Collins, etc.) — Multi-select
2. **Type** (Festival, Concert, Market, Workshop, Sports, etc.) — Multi-select
3. **Cost** (Free, $1-25, $25-50, $50+) — Single select OR slider
4. **Date Range** (This week, This month, Next 3 months) — Calendar picker
5. **Recurrence** (One-time, Weekly, Monthly, Annual) — Multi-select

**Remove:** Source filter (user-hostile)

**Apply:** All filters combine with AND logic

---

### D. Event Detail Page

**On Card Click:**
- Event name (serif, large)
- Hero image (if available)
- Date + time (formatted)
- Venue (clickable → venue page)
- Description (if available)
- Cost (badge: Free / $ / $$ / $$$)
- Recurrence info (e.g., "Every Saturday, 10 AM")
- Buttons:
  - ❤️ Add to Favorites
  - 📅 Add to Calendar (iCal export)
  - 🔗 Visit Website
- Source badges (Where we found it)

---

### E. Favorites/Watchlist

**On Heart Click:**
- Heart fills (red/pink color)
- Saved to localStorage (for now)
- Show count in header
- Favorites tab shows all saved events

---

## 5. DESIGN SYSTEM (FINAL)

### Color Palette
```css
/* Primaries */
--color-sage: #B8A88C;        /* Warm earthy sage */
--color-pink: #D9908F;        /* Soft terracotta pink */
--color-green: #6B8E6F;       /* Deep forest green */

/* Neutrals */
--color-cream: #F9F7F4;       /* Off-white background */
--color-white: #FFFFFF;       /* Cards, overlays */
--color-gray-light: #E8E5E0;  /* Borders, dividers */
--color-gray-dark: #6B6B6B;   /* Body text */
--color-gray-darker: #3D3D3D; /* Headers */

/* Semantic */
--color-success: #7CB342;     /* Green for positive */
--color-error: #E74C3C;       /* Red for errors */
--color-warning: #F9A825;     /* Amber for warnings */
--color-cost-free: #7CB342;   /* Green */
--color-cost-paid: #F9A825;   /* Amber */
```

### Typography

**Serif (Headlines):**
- Font: Merriweather or Lora (Google Fonts)
- Sizes: 48px (H1), 32px (H2), 24px (H3), 20px (H4)
- Weight: Bold (700) for impact, Regular (400) for body serif

**Sans (Body):**
- Font: Inter or Source Sans Pro (Google Fonts)
- Sizes: 16px (body), 14px (small), 12px (tiny)
- Weight: Regular (400), Medium (500), Semi-bold (600)
- Line height: 1.6 (generous)

### Components

**Cards:**
- Background: White (#FFFFFF)
- Border: None (shadow only)
- Shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Padding: 1.5rem
- Border-left: 4px solid Sage (#B8A88C)
- Hover: `0 8px 24px rgba(0,0,0,0.12)` + `translateY(-2px)`

**Buttons:**
- Primary: Sage background, white text, 6px radius, 16px padding
- Secondary: Cream background, Sage text, 2px border
- Tertiary: Transparent, Sage text on hover
- Hover: 10% darker background

**Inputs:**
- Border: 2px solid Gray-light
- Focus: Border Sage, shadow `0 0 0 3px rgba(184,168,140,0.1)`
- Placeholder: Gray-dark (60% opacity)

**Badge (Cost):**
- `Free`: Green background, white text, 4px padding, 4px radius, small font
- `$`: Amber background, white text
- `$$`: Pink background, white text
- `$$$`: Green background, white text

### Imagery
- **Thin line drawings only** (max 1-2 per page)
- No emoji, no icons (except heart, calendar, link)
- Hand-drawn botanical optional (very minimal)
- Event photos allowed on detail page (user-provided)

### Spacing
- Base unit: 8px
- Gutters: 16px (mobile), 24px (desktop)
- Card padding: 24px
- Section margins: 48px
- Line height: 1.6

### Responsive Breakpoints
- Mobile: <640px
- Tablet: 640px-1024px
- Desktop: >1024px

---

## 6. BUILD PRIORITY (THIS WEEK)

### Session 1 (Today — 3 hours)

**Deliverable:** Functional product with new design

1. **Fix Backend** (30 min)
   - Endpoint `/api/events/all` → load from `canonical_events.json`
   - Add `/api/venues` → search + list
   - Add `/api/venues/suggest` → autocomplete

2. **Design System** (90 min)
   - Create `design-system.css` with all tokens
   - Update all component styles (cards, buttons, inputs)
   - Implement serif fonts + warm colors
   - Whitespace + clean layout

3. **Rebuild UI** (60 min)
   - SearchBar → Combobox (autocomplete)
   - FilterPanel → Calendar date picker + cost filter
   - Remove source filter
   - EventList → improved cards (left border, better spacing)
   - Add empty state, loading state, error state

### Session 2 (Next — 4 hours)

**Deliverable:** Venue submission + favorites

1. **Add Venue Modal** (90 min)
   - Form: name, city, state, url, event types
   - Validation
   - POST to `/api/venues`
   - Confirmation flow

2. **Favorites System** (60 min)
   - Heart button on cards
   - localStorage persistence
   - Favorites tab in nav
   - Visual indicator

3. **Event Detail Page** (90 min)
   - Click card → full view
   - Venue context
   - iCal export button
   - Related events from same venue

---

## 7. DECISION MATRIX

| Decision | Option A | Option B | Choice | Reason |
|----------|----------|----------|--------|--------|
| **Date filter** | Dropdown menu | Calendar picker | Calendar | Better UX, visual |
| **Cost levels** | Slider | Predefined ranges | Ranges ($0, $1-25, etc) | Simpler for users |
| **Venue data** | Start minimal | Load full data now | Minimal first | Data quality issues; enrich over time |
| **Favorites** | localStorage | Backend DB | localStorage (now) | MVP speed; backend later |
| **Images** | Force upload | Scrape from sources | Scrape | Lower friction, auto-populate |
| **Cost removal** | Remove source filter | Keep but hidden | Remove | User-hostile, unhelpful |

---

## 8. TESTING CHECKLIST

**Before Launch (Tier 1):**
- [ ] All 4 filters work in combination
- [ ] Search autocomplete shows venues + "Add venue?" option
- [ ] Add venue form validates + submits
- [ ] Events load without 404 error
- [ ] Mobile responsive (tested on phone)
- [ ] No console errors

**Before Tier 2:**
- [ ] Favorites persist after refresh
- [ ] Event detail page loads
- [ ] iCal export creates valid calendar file
- [ ] Email digest test works
- [ ] No memory leaks (React DevTools)

---

## 9. DEPLOYMENT

**Local Testing:**
```bash
# Terminal 1: Backend
cd phase-2-tier-2 && npm start

# Terminal 2: Frontend
cd phase-1-tier-1/ui && npm run dev
```

**Production (Later):**
- Build: `npm run build` in ui/
- Deploy to: Vercel (frontend) + Render/Railway (backend)
- Database: Migrate JSON → Postgres (Phase 2)

---

## 10. OPEN QUESTIONS

1. **Geographic scope:** CO + NY only? Or national from start?
2. **User accounts:** Basic email preference? Full auth?
3. **API rate limits:** Free tier limits? Implement queuing?
4. **Monetization:** Always free? Freemium later? Ads?
5. **Venue approval workflow:** Auto-approve submissions? Manual review?

---

## SUCCESS CRITERIA

✅ **Week 1 (Tier 1):**
- Product is visually cohesive (design system applied)
- All core filters work
- Autocomplete + venue submission functional
- Zero 404 errors
- Mobile responsive

✅ **Week 2 (Tier 2):**
- Favorites persist across sessions
- Email notifications working
- Event detail page complete
- 95%+ Lighthouse score

✅ **Pre-Launch:**
- 0 bugs in critical path (browse → filter → favorite → export)
- Data quality 90%+ (venue info complete)
- Load time <2 sec on 3G
- Tested on 3+ devices

---

**Ready to build?**

Session 1: Design system + fix endpoints + rebuild UI (3h)  
Session 2: Venue submission + favorites (4h)  
Total: ~1 day to launch.
