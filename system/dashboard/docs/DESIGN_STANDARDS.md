# Oliver Dashboard — Design Standards

**Status:** CANONICAL — All components must follow this spec.

---

## Philosophy

Avoid generic "AI slop" aesthetics through precision, not decoration.
Typography and spacing are the only hierarchy tools.
No icons. No emoji. No icon libraries. No gradients.

If you are about to import an icon library, stop — use a text label instead.

---

## Fonts

IBM Plex Sans (headings + body) + IBM Plex Mono (data, code, timestamps).
Load both from Google Fonts. No other fonts.

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
```

---

## Type Scale

Use only these values. Weight: 400 (body) and 600 (emphasis/headings) only.

| Size | Use |
|------|-----|
| 11px | Labels, badges, timestamps, chart axis |
| 13px | Secondary metadata, captions |
| 15px | Body text |
| 20px | Section headings, chart titles |
| 28px | Page headings |
| 40px | Primary metric display |

Weight and size contrast is the only hierarchy tool.
A 40px/600 metric next to 13px/400 metadata reads more clearly than any icon or badge.

---

## Color Palette

Use only these CSS variables. No custom values outside this set.

```css
/* Pink accent system — warm, clean pinks only (no rose/mauve/purple-pink) */
--pink-100: #FFF0F6   /* card backgrounds, hover states */
--pink-200: #FFD6E8   /* chart fill lightest, bg tints */
--pink-300: #FFB3D1   /* secondary chart bars, tags */
--pink-400: #FF80B0   /* chart bars, active nav item bg */
--pink-500: #FF4D90   /* primary chart bars, active badges */
--pink-600: #E6006E   /* primary CTA, critical alerts, chart accent */
--pink-700: #9B1B5A   /* section headers, dark labels on pink bg */

/* Neutrals */
--bg:             #FAFAFA
--surface:        #FFFFFF
--border:         #E5E5E5
--text-primary:   #111111
--text-secondary: #6B6B6B

/* Status */
--error:   #DC2626
--warning: #D97706
--success: #16A34A
```

Usage rules:
- Charts: `--pink-300` through `--pink-600` for bar/line fills in order
- Card borders: `--pink-200` (default), `--pink-400` (active/selected)
- Section label text: `--pink-700`
- Stat block accent line (3px left border): `--pink-500`
- Nav active item: background `--pink-100`, left border `--pink-600`
- Badges: background `--pink-100`, text `--pink-700`, border `--pink-300`

---

## Spacing Scale

4px base. All values are multiples: 4, 8, 12, 16, 24, 32, 48, 64, 96.
No custom values.

---

## Component Rules

- Border radius: 4px for cards and inputs, 2px for badges
- Max shadow: `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
- No gradients anywhere
- No decorative dividers — use whitespace

---

## Every Component: Three States

All components must handle:
1. **Loaded** — normal content
2. **Loading** — CSS skeleton animation (no spinner icons)
3. **Empty** — centered text only, no illustrations

Example empty state text:
> "No token data for this period. Events will appear here once instrumentation is active."

---

## Status Communication

Text badges only. No icons.

```
"ACTIVE" / "PAUSED" / "ERROR" / "OK"
11px / 600 / uppercase
background from palette (accent-light, error, warning, success as appropriate)
```

---

## Avoid

- Any icon library (Lucide, Heroicons, FontAwesome — none)
- Emoji anywhere in the UI
- Shadows heavier than `0 1px 3px rgba(0,0,0,0.08)`
- Purple or gradient anything
- Generic SaaS dashboard layouts
- Fonts: Inter, Roboto, Arial, Space Grotesk, system fonts

---

## Self-Review Checklist

Before shipping any component, verify:

- Spacing follows the 4px scale — no custom values
- Only IBM Plex Sans and IBM Plex Mono are used
- No icons or decorative elements anywhere
- No shadow heavier than `0 1px 3px rgba(0,0,0,0.08)`
- No colors outside the defined palette
- All three states (loaded, loading, empty) are implemented

---

## Visual Design Rules (Non-Negotiable)

- One light theme only — no dark mode, ever
- Last refresh time and timezone always visible on every view
- Manual refresh trigger always available on every view — not buried in settings
- Auto-refresh on page load
