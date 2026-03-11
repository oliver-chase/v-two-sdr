# FALLOW Hosting Guide - Self-Hosted & Free Options

## 1. Where Does Your Data Live?
- ✅ **On your own servers:** Data remains yours forever
- ✅ **On Raspberry Pi:** Complete control, no ongoing fees
- ✅ **On cloud (VPS):** You own the VM, data stays when you delete the VM

## 2. Restarting After Stopping Payments
- **Cloud (VPS/Railway):** Restart anytime using saved code + JSON data files
- **Pi:** Stays online as long as powered
- **Free hosting (Vercel/Railway trial):** May delete VMs when trial ends — keep local backup

## 3. Downloading & Saving Your Build
- **Frontend:** `git clone` your repo or copy the `ui/dist/` folder
- **Backend + data:** `cp -r phase-1-tier-1/data/ ~/backups/fallow-data/`
- **Everything:** `tar -czvf fallow-backup.tar.gz phase-1-tier-1/` saves code + data

## 4. Recommended Setup for Permanent Ownership

### Raspberry Pi (One-Time Cost)
- Buy Raspberry Pi 4 (~$50)
- Install Node.js (one-time setup)
- Deploy code (one-time)
- **$0 ongoing cost** after purchase

### DigitalOcean / Hetzner (~$5/month)
- Create VPS droplet
- Install Node.js
- Run backend + frontend behind nginx
- Set up cron for weekly refreshes

## 5. Exporting Data

Data is stored as JSON files — no database needed.

```bash
# Backup all event data
cp phase-1-tier-1/data/canonical_events.json ~/backups/canonical_events_$(date +%Y-%m-%d).json

# Export events to CSV (simple conversion)
node -e "
const data = require('./phase-1-tier-1/data/canonical_events.json');
const rows = data.map(e => [e.id, e.name, e.city, e.state, e.type, e.status].join(','));
console.log('id,name,city,state,type,status');
rows.forEach(r => console.log(r));
" > events_export.csv
```

## 6. Manual Refreshing (When Hosting Stops)

```bash
cd ~/.openclaw/workspace/fallow/phase-1-tier-1

# Trigger a sweep manually
curl -X POST http://localhost:3000/api/sweep

# Or run the scheduler directly
node scripts/scheduler-tier2.js
```

## 7. Future-Proofing
- Keep `phase-1-tier-1/data/` backed up — this is your database
- Document any custom env vars in `.env.example`
- Keep `UX.md` and `DESIGN.md` — they document product decisions
- Use Vercel (frontend) + Railway (backend) for zero-config cloud deployment

