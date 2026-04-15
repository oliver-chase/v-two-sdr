# SDR Approval Worker

Cloudflare Worker that receives approval/rejection clicks from the daily email and triggers the GitHub Actions workflow.

## How it works

The daily approval email contains links like:
```
https://sdr-approval.workers.dev/?draft_id=20260327-p-000001&action=approve&token=YOUR_SDR_TOKEN
```

Clicking the link hits this Worker, which:
1. Validates the token against `SDR_TOKEN` env var
2. Calls GitHub API to trigger `approval-handler.yml` with the draft_id and action
3. Returns a result page: "Approved — email will send shortly" or "Rejected"

## Deploy

```bash
cd cloudflare/
npx wrangler deploy
```

First-time setup requires `npx wrangler login` to authenticate with Cloudflare.

## Environment Variables

Set these in the Cloudflare dashboard:
**Workers & Pages → sdr-approval → Settings → Environment Variables**

| Variable | Value | Notes |
|---|---|---|
| `SDR_TOKEN` | (generate a random string) | Must match GitHub Secret `SDR_TOKEN` exactly |
| `GITHUB_PAT` | `ghp_...` | GitHub Personal Access Token, `actions:write` scope only |
| `GITHUB_REPO` | `oliver-chase/v-two-sdr` | The target repository |

**Important:** Mark `SDR_TOKEN` and `GITHUB_PAT` as **Encrypted** (toggle in the dashboard).

## GitHub Secrets

Also add to GitHub → oliver-chase/v-two-sdr → Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `SDR_TOKEN` | Same random string as the Cloudflare `SDR_TOKEN` var |
| `WORKER_URL` | `https://sdr-approval.workers.dev` (or your custom domain) |

## Test Manually

```bash
# Should return 401
curl "https://sdr-approval.workers.dev/?draft_id=test&action=approve&token=wrongtoken"

# Should return success page (use your actual token)
curl "https://sdr-approval.workers.dev/?draft_id=test-123&action=approve&token=YOUR_SDR_TOKEN"
```

## Rotating the Token

1. Generate a new random string (e.g. `openssl rand -hex 32`)
2. Update `SDR_TOKEN` in Cloudflare dashboard
3. Update `SDR_TOKEN` in GitHub Secrets
4. No redeploy needed — the Worker reads the env var at request time
