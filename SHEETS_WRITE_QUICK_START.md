# Google Sheets Write Access — Quick Start Guide

## Setup (5 minutes)

### 1. Create Service Account in Google Cloud Console
```bash
# In Google Cloud Console:
1. Go to: Service Accounts (APIs & Services)
2. Click: Create Service Account
3. Name: "SDR Writer"
4. Grant: Basic > Editor (for spreadsheet access)
5. Create key: JSON format
6. Download the key file
```

### 2. Extract Credentials
```bash
# From the downloaded JSON file, get:
GOOGLE_SERVICE_ACCOUNT_EMAIL=sdr-writer@my-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...==\n-----END PRIVATE KEY-----\n
```

### 3. Add to `.env`
```bash
# Existing
GOOGLE_SHEET_ID=1abc...xyz
GOOGLE_SHEET_NAME=Leads
GOOGLE_API_KEY=AIza...  # Keep for read-only operations

# New (write mode)
GOOGLE_SERVICE_ACCOUNT_EMAIL=sdr-writer@my-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

### 4. Add Service Account to Google Sheet
```bash
# In Google Sheets:
1. Click: Share button
2. Add: sdr-writer@my-project.iam.gserviceaccount.com
3. Role: Editor
4. Send: (no email needed, service account)
```

### 5. Test
```bash
# Run enrichment with write enabled
node scripts/daily-run.js --step=enrich

# Expected output:
# ✓ Enriched 3 prospects, 2 high-confidence emails (Sheets updated: 3)
```

---

## Usage Examples

### Write Enriched Data
```javascript
const { SheetsWriter } = require('./scripts/sheets-writer');

const writer = new SheetsWriter();
await writer.authenticate();

// Update prospect after enrichment
const result = await writer.updateEnrichedProspect('john@example.com', {
  Timezone: 'EST',
  LinkedIn: 'https://linkedin.com/in/john',
  Signal: 'Recently funded',
  Notes: 'Found via RocketReach'
});

console.log(result);
// { updated: true, email: 'john@example.com', fieldsUpdated: 4 }
```

### Update Status
```javascript
const writer = new SheetsWriter();
await writer.authenticate();

// Change prospect status
await writer.updateProspectStatus('jane@example.com', 'email_discovered');
// → Status column changes to 'email_discovered'
```

### Track Follow-ups
```javascript
const writer = new SheetsWriter();
await writer.authenticate();

// Update follow-up fields
await writer.updateFollowUpTracking('bob@example.com', {
  LastContact: '2026-03-17',
  FollowUpCount: 2,
  NextFollowUp: '2026-03-20',
  Notes: 'Interested, will call Monday'
});
```

### Batch Update
```javascript
const writer = new SheetsWriter();
await writer.authenticate();

const result = await writer.batchUpdateProspects([
  { email: 'john@example.com', data: { Timezone: 'EST' } },
  { email: 'jane@example.com', data: { Timezone: 'PST', Signal: 'Hiring' } }
]);

console.log(result);
// { total: 2, succeeded: 2, failed: 0, errors: [] }
```

---

## What Gets Updated Automatically

When you run `node scripts/daily-run.js --step=enrich`:

1. **Email** column: Populated from enrichment
2. **Status** column: Changes from 'new' to 'email_discovered'
3. **Notes** column: Shows enrichment confidence level
4. **Timezone** (optional): If detected from email domain
5. **Location** (optional): If found in company context
6. **Signal** (optional): If web enrichment found signals

**Never overwritten (protected):**
- Name
- Company
- Title
- DateAdded
- FirstContact

---

## Troubleshooting

### "Service account authentication failed"
**Check:**
1. ✅ Service account email is correct
2. ✅ Private key is valid (paste entire key with \n)
3. ✅ Service account has Editor access to the Sheet
4. ✅ ENV vars are set: `echo $GOOGLE_SERVICE_ACCOUNT_EMAIL`

### "Row not found"
**Cause:** Prospect's email changed or doesn't match Sheet
**Fix:** Check that Email column in Sheet matches the enriched email

### "Cannot update protected field: Name"
**This is intentional!** Protected fields prevent accidental overwrites
**Fix:** Never try to update Name, Email, Company, Title, DateAdded, FirstContact

### Rate limited
**If seeing 429 errors:**
1. Wait 1 minute (rate limit resets)
2. Retry operation
3. Automatic retry happens 3x with exponential backoff

---

## Monitoring

### Check API call count
```javascript
const writer = new SheetsWriter();
await writer.authenticate();
const count = writer.connector.getApiCallCount();
console.log(`API calls used: ${count}/300 per minute`);
```

### View Google Sheet audit trail
- Check "Version history" (File > Version history)
- See when rows were last modified
- Identify updates made by service account

---

## Integration Points

### Already Integrated ✅
- **daily-run.js → stepEnrich()** — Writes enriched data automatically

### Ready to Integrate 🔲
- **approve-drafts.js** — Update Status to 'awaiting_approval'
- **send-approved.js** — Update Status to 'email_sent'
- **inbox-monitor.js** — Update LastContact, FollowUpCount, Status

---

## Rate Limits

| Operation | Limit | Notes |
|-----------|-------|-------|
| API calls | 300/min | Both read & write count |
| Sheet rows | 10M | Practical limit ~1M rows |
| Batch size | 100 rows | Per append/update call |
| Retry attempts | 3 | With exponential backoff |

---

## Security Best Practices

✅ **DO:**
- Use environment variables for credentials (never hardcode)
- Add service account to GitHub Secrets (not public repo)
- Keep private key restricted (don't paste in logs)
- Review who has access to Google Sheet

❌ **DON'T:**
- Check credentials into version control
- Log or print private keys
- Share service account key files
- Use read-only API key for write operations

---

## Next Steps

1. **Test:** Run daily-run.js with one prospect
2. **Monitor:** Check Google Sheet for updates
3. **Integrate:** Gradually add to approval/send workflows
4. **Scale:** Run daily via GitHub Actions (8am ET weekdays)

---

## Support

For issues or questions:
1. Check `SHEETS_WRITE_IMPLEMENTATION.md` (full technical details)
2. Review `scripts/sheets-writer.js` (method documentation)
3. Check Google Sheets API errors in console output
4. Enable debug logging: Set `DEBUG=*` env var
