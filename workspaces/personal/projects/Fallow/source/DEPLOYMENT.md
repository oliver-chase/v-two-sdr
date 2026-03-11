# FALLOW - Deployment Guide

**Status:** Phases 1–3 complete, production ready  
**Stack:** Node.js backend (port 3000) + React/Vite frontend (port 5173)  
**Data:** JSON files — no database required  
**Cost:** $0

---

## Quick Start (Local Development)

```bash
# Terminal 1: Backend
cd ~/.openclaw/workspace/fallow/phase-1-tier-1
npm install
npm start
# API running at http://localhost:3000

# Terminal 2: Frontend
cd ~/.openclaw/workspace/fallow/phase-1-tier-1/ui
npm install
npm run dev
# UI running at http://localhost:5173
# /api requests auto-proxy to backend
```

---

## Verify It's Working

```bash
# Health check
curl http://localhost:3000/health

# Load all events
curl http://localhost:3000/api/events/all

# Submit a test venue
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Lakewood Pottery","location":"Lakewood CO","url":"https://lakewoodarts.com/classes"}'

# Trigger a sweep
curl -X POST http://localhost:3000/api/sweep

# Check sweep results
curl http://localhost:3000/api/sweep/latest
```

---

## All API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/submit` | Submit a venue |
| GET | `/api/venues` | List monitored venues |
| GET | `/api/events` | List events (city/search filters) |
| GET | `/api/events/all` | All canonical events |
| GET | `/api/search` | Search events by query |
| GET | `/api/status` | Monitoring status |
| POST | `/api/sweep` | Trigger Tier 1+2 sweep |
| GET | `/api/sweep/latest` | Latest sweep results |
| GET | `/health` | Health check |

---

## Environment Config

```bash
cd ~/.openclaw/workspace/fallow/phase-1-tier-1
cp .env.example .env
# Edit .env if needed — defaults work for local dev
```

Key vars:
- `PORT` — backend port (default: 3000)
- `NODE_ENV` — `development` or `production`
- `MEETUP_API_KEY` — optional, for Meetup API (free tier)
- `EVENTBRITE_API_KEY` — optional, for Eventbrite API (free tier)

---

## Data Backup

```bash
# Backup event database
cp ~/.openclaw/workspace/fallow/phase-1-tier-1/data/canonical_events.json \
   ~/backups/canonical_events_$(date +%Y-%m-%d).json

# Backup everything
tar -czvf fallow-backup-$(date +%Y-%m-%d).tar.gz \
  ~/.openclaw/workspace/fallow/phase-1-tier-1/data/
```

---

## Production Deployment

### Option 1: PM2 (Recommended for VPS)

```bash
npm install -g pm2

# Start backend
cd ~/.openclaw/workspace/fallow/phase-1-tier-1
pm2 start server.js --name "fallow-backend"

# Build + serve frontend
cd ui
npm run build
pm2 serve dist 5173 --name "fallow-frontend"

pm2 save
pm2 startup
```

### Option 2: Vercel (Frontend) + Railway (Backend)

```bash
# Frontend → Vercel
cd ~/.openclaw/workspace/fallow/phase-1-tier-1/ui
npm run build
vercel deploy dist/

# Backend → Railway
# Push repo to GitHub, connect Railway to repo
# Set PORT env var in Railway dashboard
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY phase-1-tier-1 .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t fallow-backend .
docker run -p 3000:3000 -v $(pwd)/data:/app/data fallow-backend
```

---

## Monitoring Scheduler

The sweep scheduler runs automatically. To set up a cron for weekly sweeps:

```bash
# Add to crontab — runs every Sunday at 2 AM
(crontab -l; echo "0 2 * * 0 cd ~/.openclaw/workspace/fallow/phase-1-tier-1 && node scripts/scheduler-tier2.js >> logs/scheduler.log 2>&1") | crontab -
```

---

## Troubleshooting

**Port already in use:**
```bash
kill $(lsof -t -i:3000)
# or use a different port:
PORT=3001 npm start
```

**Frontend can't reach backend:**
- Check `ui/vite.config.js` proxy setting points to correct backend port
- Verify backend is running: `curl http://localhost:3000/health`

**Data not saving:**
```bash
ls -la ~/.openclaw/workspace/fallow/phase-1-tier-1/data/
chmod 755 ~/.openclaw/workspace/fallow/phase-1-tier-1/data/
```

**Sweep not finding events:**
- Check API keys in `.env` (Meetup, Eventbrite optional but improve results)
- Run manually: `node scripts/scheduler-tier2.js`
- Check logs: `tail -f logs/scheduler.log`

---

## Rollback

```bash
# Stop backend
pm2 stop fallow-backend
# or: kill $(lsof -t -i:3000)

# Data in /data/ is untouched
# Restart anytime with npm start
```

---

## Reference

- Full architecture: `skills/fallow/SKILL.md`
- Product status: `PROJECT_COMPLETE.md`
- Phase 4 roadmap: `PRODUCT_ROADMAP.md` + `ROADMAP.md`

