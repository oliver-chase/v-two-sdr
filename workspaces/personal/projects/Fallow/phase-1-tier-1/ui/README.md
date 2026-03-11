# FALLOW UI - React Frontend

**Phase 3:** Web interface for event discovery, filtering, and review.

## Features

- **Browse** — Search and filter all canonical events
- **Filter** — By city, type, source, date range
- **Review Queue** — Manual review of ambiguous matches (60-84% confidence)
- **Sweep Status** — View sweep metrics and trigger new sweeps
- **Source Attribution** — See which APIs/sources contributed to each event

## Architecture

```
├── components/
│   ├── App.jsx              (main container)
│   ├── EventList.jsx        (list view)
│   ├── EventCard.jsx        (individual event)
│   ├── SearchBar.jsx        (search input)
│   ├── FilterPanel.jsx      (filters)
│   ├── ReviewQueue.jsx      (manual review)
│   └── SweepStatus.jsx      (sweep metrics)
│
├── styles/
│   ├── app.css              (global)
│   ├── event-card.css
│   ├── event-list.css
│   ├── search-bar.css
│   ├── filter-panel.css
│   ├── review-queue.css
│   └── sweep-status.css
│
├── utils/
│   └── date.js              (date/time formatting)
│
├── index.html               (entry point)
├── main.jsx                 (React root)
├── vite.config.js           (Vite config)
├── package.json
└── README.md (this file)
```

## Setup

```bash
cd ui
npm install
npm run dev
```

Runs on http://localhost:5173 (proxies /api to http://localhost:3000)

## Build

```bash
npm run build
npm run preview
```

## API Endpoints Used

- **GET /api/events/all** — Fetch all canonical events
- **GET /api/sweep/latest** — Get latest sweep results
- **POST /api/sweep** — Trigger a new sweep

## Design System

**Colors:**
- Primary: Sage green (#2d9c48)
- Secondary: Amber (#f59e0b)
- Danger: Red (#ef4444)
- Success: Emerald (#10b981)

**Typography:**
- System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- Responsive sizing

**Components:**
- Clean cards with shadows
- Inline filters
- Badge-based source attribution
- Mobile-responsive grid

## User Flows

### 1. Browse & Search
1. User loads app
2. Events load from `/api/events/all`
3. User searches by name/venue/city
4. Results filter in real-time

### 2. Filter
1. User adjusts city, type, source, or date range
2. Events filter dynamically
3. Result count updates

### 3. Review Ambiguous Matches
1. User navigates to "Review Queue" tab
2. Displays items with 60-84% confidence
3. User merges or rejects
4. API updates canonical list

### 4. Trigger Sweep
1. User navigates to "Status" tab
2. Clicks "Run Sweep Now"
3. Calls `POST /api/sweep`
4. Displays results (Tier 1 count, Tier 2 count, dedup metrics)

## Responsive Design

- Desktop (1200px+): Full layout
- Tablet (768px-1199px): 2-column grid
- Mobile (<768px): Single column, stacked navigation

## Performance

- Event list renders 100+ items efficiently
- Filter operations are instant (client-side)
- API calls are cached/debounced
- Minimal re-renders using React hooks

## Future Enhancements

- Export to iCal
- Export to CSV
- Calendar view
- Map view (location-based)
- Notifications
- User preferences (saved filters)
- Event submission form
