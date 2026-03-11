# How Kiana Invokes Her Agents

Clear examples of how to talk to Claude Code and OpenClaw so they know what to do.

---

## For Claude Code

**Explicit invocation (clearest):**
```
Claude Code: Build the radius filtering API endpoint
Claude Code: Debug this 404 error
Claude Code: Write tests for the distance calculator
Claude Code: Review this code before I commit
```

**Implicit triggers (when context makes it clear):**
- Mention code, debugging, testing, implementation, refactoring
- Ask "how would you build this?"
- Request architecture or design reviews
- Anything technical/local execution

**Claude Code's response pattern:**
1. Acknowledge the task
2. Ask clarifying questions if needed
3. Execute
4. Show results/output
5. One message (no split replies)

---

## For OpenClaw

**Explicit invocation (clearest):**
```
OpenClaw: Research Series B-funded startups in SF
OpenClaw: Validate these 50 email addresses
OpenClaw: What's the latest on the SDR market?
OpenClaw: Find competitors to V.Two
```

**Implicit triggers (when context makes it clear):**
- Mention research, market, web, API, current, data, validation
- Ask "what's out there?"
- Request competitive analysis or market research
- Anything requiring real-time data or external APIs

**OpenClaw's response pattern:**
1. Acknowledge the task
2. Ask clarifying questions if needed
3. Research/fetch/validate
4. Present findings with sources
5. One message (no split replies)

---

## Handoff Between Agents

When one agent needs the other:

**Claude Code → OpenClaw:**
```
"I need OpenClaw to research [thing] because [reason].
Context: [what I've done], [files/data to reference].
Then come back and I'll [integrate/use it]."
```

**OpenClaw → Claude Code:**
```
"I need Claude Code to [code task] because [reason].
Context: [data I've researched], [files/paths].
Then come back and I'll [use results]."
```

---

## Special Cases

### "Pull in X"
If you say: "Pull in OpenClaw" or "Pull in Claude Code"
The other agent will activate with full context.

### "Work silently"
If you say: "Claude Code, work silently on [task]"
Agent executes entire task without narration.
Message only when: done OR blocked

### "Check the budget"
If you say: "Check our token budget"
Claude Code or OpenClaw runs token_tracker.py
Reports remaining budget before starting expensive work

### "Activate SDR"
If you say: "Activate the SDR persona"
Oliver (orchestrator) reads team/members/sdr/ files
Passes context to SDR persona
Coordinates execution

---

## What Agents Do Automatically

**You don't have to tell them to:**
- Read their startup files (they do at session start)
- Check fallback rules (they know who to call)
- Log to memory (they do after significant work)
- Follow security rules (built in)

---

## Expected Response Times

| Task Type | Time | Agent |
|-----------|------|-------|
| Quick question | <1 min | Either |
| Code review | 2-5 min | Claude Code |
| Market research | 5-15 min | OpenClaw |
| Data validation | 5-10 min | OpenClaw |
| Bug fix | 5-15 min | Claude Code |
| Persona activation | 3-10 min | Either |

---

## If Something Goes Wrong

**Agent is stuck or confused:**
```
"Claude Code, you're stuck. Debug this for me."
or
"OpenClaw, I need clarity on this. What's blocking you?"
```

**Both agents equally confused:**
```
"Pull in [other agent] - I need a second opinion"
```

**Nothing works:**
```
"Start over from [checkpoint]. Here's the context: [paste/link]"
```

---

*Last updated: 2026-03-06*
