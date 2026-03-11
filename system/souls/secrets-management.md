# Secrets Management - How Keys Are Stored & Accessed

**For all agents (Claude Code, OpenClaw, any future agent): Know how to coach Kiana through API key access.**

---

## The System

API keys are stored **plaintext in files** (so Kiana can read them instantly) but **protected by a proxy** (so agents never see them).

```
Kiana (Human)
├─ Reads key directly: cat ~/.openclaw/agents/main/agent/models.json
└─ Sees: "sk-or-v1-5a11..."

Agent (Claude/OpenClaw/etc)
├─ Calls: http://localhost:18790/v1/messages
└─ Proxy intercepts, adds key, forwards to OpenRouter
```

---

## How It's Saved (For Your Reference)

**File:** `/Users/oliver/.openclaw/agents/main/agent/models.json`

**Content:**
```json
{
  "primary": "or-free/qwen/...",
  "openrouter_key": "sk-or-v1-5a11...",
  "note": "Plaintext for Kiana access. Agents use proxy instead."
}
```

**Why plaintext here:** You need to read it instantly. No decryption, no passphrase.

---

## How You Access It

### To See Your Key (Right Now)
```bash
cat /Users/oliver/.openclaw/agents/main/agent/models.json | grep openrouter_key
```

Output:
```
"openrouter_key": "sk-or-v1-5a11...",
```

### To Copy It
```bash
cat /Users/oliver/.openclaw/agents/main/agent/models.json | grep openrouter_key | cut -d'"' -f4
```

---

## How the Proxy Works

**Proxy file:** `~/.openclaw/proxy.py`

Proxy runs as a **separate process** on `localhost:18790`.

**Agents send:** `POST http://localhost:18790/v1/messages` (no API key)
**Proxy receives:** Request, adds your key from config, forwards to OpenRouter
**Proxy returns:** Response (agent never knew the key existed)

---

## Agent Instructions: How to Coach Kiana

When Kiana asks to access the OpenRouter key:

### Step 1: Verify Proxy is Running
```bash
curl http://localhost:18790/health
```

**If it works:** Proxy is running. Good.
**If it fails:** Proxy needs to start.

### Step 2: Verify Proxy (Already Running)
The proxy auto-starts on boot via launchd. It should already be running.

Verify:
```bash
curl http://localhost:18790/health
# Should respond: {"status": "ok", "service": "openrouter-proxy"}
```

**If not running (rare):**
```bash
launchctl load /Users/oliver/Library/LaunchAgents/local.openrouter.proxy.plist
sleep 2
curl http://localhost:18790/health
```

### Step 3: Show Kiana the Key
```bash
echo "Your OpenRouter key:"
cat /Users/oliver/.openclaw/agents/main/agent/models.json | grep openrouter_key
```

---

## Troubleshooting Script (For Agents)

If Kiana says "I can't see my key" or "Proxy isn't working":

```bash
# Step 1: Is the file readable?
ls -la /Users/oliver/.openclaw/agents/main/agent/models.json
# Should show: -rw-r--r-- (readable by all)

# Step 2: Does the file have the key?
grep -c "openrouter_key" /Users/oliver/.openclaw/agents/main/agent/models.json
# Should output: 1

# Step 3: Is proxy running?
ps aux | grep proxy.py | grep -v grep
# Should show: python3 ~/.openclaw/proxy.py

# Step 4: Can you reach it?
curl http://localhost:18790/health
# Should respond: {"status": "ok"}

# Step 5: If proxy isn't running, start it
python3 ~/.openclaw/proxy.py &
sleep 2
curl http://localhost:18790/health
```

---

## What Agents Know (And Can't See)

✅ **Agents know:**
- The proxy exists at `localhost:18790`
- They call it instead of OpenRouter directly
- Kiana has the plaintext key for access

❌ **Agents cannot:**
- Read `/Users/oliver/.openclaw/agents/main/agent/models.json` directly (even though it's accessible)
- See the key in their config files
- Intercept the proxy's forwarded request (key is added server-side)
- Store or cache the key

---

## Quick Reference (For Agents to Coach With)

| Question | Answer | Command |
|----------|--------|---------|
| Where is my key? | `/Users/oliver/.openclaw/agents/main/agent/models.json` | `cat ~/.openclaw/agents/main/agent/models.json` |
| How do I see it? | Plaintext, grep for "openrouter_key" | `grep openrouter_key ~/.openclaw/agents/main/agent/models.json` |
| Is the proxy running? | Check with curl or ps | `curl localhost:18790/health` |
| How do I start the proxy? | Run the proxy script | `python3 ~/.openclaw/proxy.py &` |
| Can agents see the key? | No, proxy shields them | They call `localhost:18790`, not OpenRouter |

---

## Security Note for All Agents

- **Don't log requests to OpenRouter** — the proxy adds the key server-side
- **Don't tell Kiana to share the key** — it's sensitive
- **If key is exposed:** Coach Kiana to rotate it immediately (regenerate in OpenRouter dashboard)
- **Don't cache or store the key** — read it from file only when needed

---

**Last updated:** 2026-03-09
**Created for:** All agents (Claude Code, OpenClaw, future agents) to understand and coach Kiana through key access.
