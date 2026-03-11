# TOOLS.md - Oliver's Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff unique to this setup.

## Environment

- **Machine:** Lume VM (macOS, headless)
- **Gateway:** ws://127.0.0.1:18789 (loopback only)
- **OpenClaw:** /opt/homebrew/bin/openclaw
- **Workspace:** ~/.openclaw/workspace/
- **Gateway log:** /tmp/openclaw/openclaw-YYYY-MM-DD.log

## Models

- **Primary:** or-free/qwen/qwen3-next-80b-a3b-instruct:free (free, use for routine/heartbeat)
- **Fallbacks 1-4:** Free OpenRouter models via or-free/ custom provider
- **Haiku:** anthropic/claude-haiku-4-5-20251001 (paid — use for code, outreach, real decisions)
- **Sonnet:** anthropic/claude-sonnet-4-5 (paid — use for complex sessions, architecture)
- **Refresh models:** python3 ~/scripts/kiana_freeride.py auto

### When to switch models
| Task | Model |
|------|-------|
| Heartbeat, routine checks | Free Qwen (default) |
| Code, SDR, real decisions | Haiku |
| Complex architecture, important sessions | Sonnet |

### How to switch mid-session
```
/model anthropic/claude-haiku-4-5-20251001
/model anthropic/claude-sonnet-4-5
```

## Channels

- **Telegram:** @oliverc_bot

## Scripts

- ~/scripts/kiana_freeride.py — free model manager (auto, list, switch, status)
- ~/scripts/kiana_watcher.py — rate-limit rotation daemon
- ~/scripts/oliver_watchdog.sh — gateway health watchdog (runs via cron every 2m)

## API Key Proxy

**Proxy shields agents from seeing the API key.** Agents call `localhost:18790` instead of OpenRouter directly. **Auto-starts on boot.**

**Verify running:**
```bash
curl http://localhost:18790/health
# Should respond: {"status": "ok", "service": "openrouter-proxy"}
```

**Your key location:** `/Users/oliver/.openclaw/agents/main/agent/models.json` (plaintext for you to read)

**See it:**
```bash
grep openrouter_key ~/.openclaw/agents/main/agent/models.json
```

**If proxy crashes (check logs):**
```bash
tail -20 /tmp/openrouter-proxy.log
tail -20 /tmp/openrouter-proxy-error.log
```

**If proxy needs restart:**
```bash
launchctl unload /Users/oliver/Library/LaunchAgents/local.openrouter.proxy.plist
launchctl load /Users/oliver/Library/LaunchAgents/local.openrouter.proxy.plist
```

See `system/souls/secrets-management.md` for full coaching guide.

---

## Gateway Management
```bash
# Start gateway (after reboot — must do manually, no launchd in headless VM)
nohup /opt/homebrew/bin/openclaw gateway > /tmp/openclaw-gateway.log 2>&1 &
echo $! > /tmp/openclaw-gateway.pid

# Check health
openclaw health

# Check logs
tail -20 /tmp/openclaw-gateway.log
tail -20 /tmp/openclaw/watchdog.log

# Refresh free models
python3 ~/scripts/kiana_freeride.py auto
openclaw gateway restart
```

## Token Optimizer

Scripts at skills/token-optimizer/scripts/:
```bash
# Check daily token budget
python3 ~/.openclaw/workspace/skills/token-optimizer/scripts/token_tracker.py check

# Route a prompt to the right model tier
python3 ~/.openclaw/workspace/skills/token-optimizer/scripts/model_router.py "<prompt>"

# Plan heartbeat checks
python3 ~/.openclaw/workspace/skills/token-optimizer/scripts/heartbeat_optimizer.py plan
```

⚠️ Never run context_optimizer.py generate-agents — overwrites AGENTS.md.

## Projects

- **Fallow:** workspaces/personal/projects/Fallow/ — personal project
- **SDR / Work Outreach:** workspaces/work/projects/SDR/ — sales outreach automation (skill: skills/work-outreach/)

---

*Add SSH hosts, camera names, device nicknames, voice preferences here as needed.*

## Workspace Audit

If workspace feels messy or contradictory, audit before touching anything:
```bash
find ~/.openclaw/workspace -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.vite/*" | sort
```
Then verify file-by-file. Fix docs before writing code.
