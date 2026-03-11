# Skill: PM-Visualizer

**Category:** System
**Status:** Active
**Last Updated:** 2026-03-06

---

## Purpose

Convert unstructured product thoughts (Why/What/How) into visual Excalidraw diagrams. Both agents can create diagrams; Claude Code builds infrastructure, OpenClaw provides research context.

---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes
- **When:**
  - Building diagram generation tools
  - Integrating with project workflows
  - Automating diagram creation from data
  - Testing/validating diagram scripts
- **Tools available:** exec (run Python scripts), read/write (JSON configs)
- **Example:** "Create a Python pipeline to auto-generate diagrams from Fallow specs"

### OpenClaw
- **Can use:** Yes
- **When:**
  - Extracting user research into Why/What/How structure
  - Creating diagrams from market research
  - Visualizing competitive positioning
  - Generating diagrams from API data/external sources
- **Tools available:** web_fetch (get reference data), write (prepare JSON for diagram)
- **Example:** "Research SDR positioning, convert to Why/What/How diagram"

### Collaboration Pattern
- **OpenClaw gathers/structures** context (Why/What/How/Journey)
- **Claude Code generates** Excalidraw diagram
- **Both reference** completed diagrams for project planning

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Visualize..."
- "Create a diagram for..."
- "Map out..."
- "Excalidraw"
- Kiana asking for feature specs visualized

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** Initial setup
**Risk Level:** Low
**Key Findings:**
- Script writes to workspaces/ only
- Excalidraw files are JSON (safe, editable)
- No network calls
- No credential exposure
- Outputs are human-editable

---

## How Both Agents Use This Skill

### Step 1: Extract Context (Both Agents)

From Kiana's request or project specs, identify:

**Why** (Problem / Business Goals)
- User pain point
- Business goal
- Market opportunity

**What** (Solution / Features)
- Feature or requirement
- Data structure
- Expected output

**How** (Technical Implementation)
- API endpoint
- Database schema
- Algorithm or process

**Journey** (Optional: Step-by-step flow)
- Sequential user steps
- Process stages

### Step 2: Structure as JSON

**Claude Code or OpenClaw** creates `/tmp/pm_input.json`:

```json
{
  "title": "Feature or Product Name",
  "why": [
    "User pain point 1",
    "Business goal 2"
  ],
  "what": [
    "Feature 1",
    "Feature 2"
  ],
  "how": [
    "Technical approach 1",
    "API/database detail"
  ],
  "journey": [
    "Step 1: User opens app",
    "Step 2: Selects radius",
    "Step 3: Results update"
  ]
}
```

### Step 3: Generate Diagram

**Claude Code runs:**

```bash
python3 /Users/oliver/OliverRepo/skills/pm-visualizer/scripts/layout_diagram.py \
  /tmp/pm_input.json \
  /Users/oliver/OliverRepo/workspaces/<project>/diagrams/DIAGRAM_NAME.excalidraw
```

**Output:** Excalidraw file ready to view/edit

---

## Diagram Features

**Layout:** Columns for Why (yellow) / What (green) / How (blue) + Journey (pink)

**Color Coding:**
- 🟨 Yellow: Why (business/motivation)
- 🟩 Green: What (features/specs)
- 🟦 Blue: How (technical)
- 🟥 Pink: Journey (user flow)

**Grouped Elements:** Text bound to containers, move together

---

## Practical Examples

### Example 1: Fallow Location Filtering

**Kiana:** "Visualize the location filtering feature"

**OpenClaw** extracts from Fallow specs:
```json
{
  "title": "Fallow — Radius Filtering",
  "why": [
    "Users don't want events 2+ hours away",
    "Relevance = proximity"
  ],
  "what": [
    "Radius slider on search",
    "Filter results by distance"
  ],
  "how": [
    "Haversine formula (distance calc)",
    "Lat/lng on each venue",
    "Query filter on backend"
  ],
  "journey": [
    "User opens search",
    "Sets radius to 10 miles",
    "Results update",
    "User taps event"
  ]
}
```

**Claude Code** generates:
```bash
python3 ... /tmp/pm_input.json \
  /Users/oliver/OliverRepo/workspaces/personal/projects/Fallow/diagrams/radius_filtering.excalidraw
```

**Output:** `workspaces/personal/projects/Fallow/diagrams/radius_filtering.excalidraw`

---

### Example 2: SDR Outreach System

**Kiana:** "Map out the SDR outreach workflow"

**OpenClaw** structures from work-outreach SKILL.md:
```json
{
  "title": "V.Two SDR Outreach System",
  "why": [
    "Need to scale B2B sales",
    "Manual outreach doesn't scale"
  ],
  "what": [
    "Cold email campaigns",
    "Prospect list management",
    "Reply tracking",
    "Opt-out management"
  ],
  "how": [
    "Email API integration",
    "Send/opt-out JSON logs",
    "Approval workflow",
    "Weekly reporting"
  ],
  "journey": [
    "Prepare prospect list",
    "Get Kiana approval",
    "Send emails",
    "Track replies",
    "Report weekly"
  ]
}
```

**Claude Code** generates diagram

---

## Viewing Diagrams

**After generation:**

1. **Download and open locally:**
   ```bash
   # File is at: workspaces/<project>/diagrams/NAME.excalidraw
   # Open at: excalidraw.com → File → Open
   ```

2. **Or open in VS Code:**
   - Install: Excalidraw extension
   - Open file: CMD+P → search filename

3. **Share with Kiana:**
   - File is editable (Kiana can modify)
   - Easy to embed in docs
   - Exportable to PNG/SVG

---

## Customization

Both agents can:
- **Modify JSON** before generation (add/remove items)
- **Change titles** to be more specific
- **Reorder journey steps** for clarity
- **Combine multiple diagrams** (Why/What/How × multiple features)

---

## Token Budget

~300–800 tokens per diagram (JSON creation + script execution)

---

## Related Skills

- **planning/** — diagrams help phase planning
- **personas/** — diagrams for persona workflows

---

*Last updated: 2026-03-06*
