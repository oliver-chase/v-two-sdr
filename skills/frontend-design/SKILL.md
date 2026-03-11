# Skill: Frontend Design System

Load this before writing any UI component, view, or layout change.
Baseline skill — applies to all projects unless a project-level design
file explicitly overrides a specific rule.

---

## Non-Negotiables

One light theme only. No dark mode. Ever.
No icon libraries. No emoji. No decorative elements.
Typography, spacing, and color carry all hierarchy.
Every piece of content lives inside a container.
Nothing floats on a bare background.

---

## Font

IBM Plex Sans — headings, labels, body
IBM Plex Mono — data, timestamps, code, token counts
Load both from Google Fonts. No other fonts. No system font fallback.

---

## Type Scale

Use only these values. Nothing in between.

| Size | Weight | Use |
|------|--------|-----|
| 11px | 400 | metadata, secondary labels, timestamps |
| 11px | 600 | uppercase section labels (letter-spacing: 0.06em) |
| 13px | 400 | body text, list items, supporting copy |
| 13px | 600 | emphasized body, table headers |
| 15px | 400 | primary readable content |
| 20px | 600 | card titles, view subheadings |
| 28px | 600 | page-level headings |
| 40px | 600 | hero stats, big numbers |

---

## Color — Neutrals

```
--bg:             #FAFAFA   page background
--surface:        #FFFFFF   card and panel background
--border:         #E5E5E5   default borders
--text-primary:   #111111
--text-secondary: #6B6B6B
--text-disabled:  #AAAAAA
--error:          #DC2626
--warning:        #D97706
--success:        #16A34A
```

---

## Color — Accent Spectrum

Unless the operator specifies a different color, use the default pink spectrum.
If the operator names a different color, derive the same 7-stop spectrum for that hue.

All accent CSS variables are named `--accent-*` regardless of chosen hue.
Component code never changes when the color changes — only token values change.

```
--accent-100  hover backgrounds, card bg tints
--accent-200  subtle fills, chart backgrounds
--accent-300  secondary chart bars, tags
--accent-400  active nav bg, mid-weight chart bars
--accent-500  primary chart fills, stat block accents
--accent-600  primary CTA, critical alerts
--accent-700  section headers, labels on light bg
```

Default (warm pink — used when no color specified):
```
--accent-100: #FFF0F6
--accent-200: #FFD6E8
--accent-300: #FFB3D1
--accent-400: #FF80B0
--accent-500: #FF4D90
--accent-600: #E6006E
--accent-700: #9B1B5A
```

No rose. No mauve. No purple-pink. Warm pinks only.

---

## Spacing Scale

Base unit: 4px. Only use these values:
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
No custom values. No 10px, 15px, 20px, or 25px.

---

## Layout

Sidebar: 200px fixed, background #F5F5F5, border-right 1px solid var(--border)
Top bar: 48px tall, border-bottom 1px solid var(--border)
  Left: page title (20px/600)
  Right: "Updated [date] at [time] [tz]" (11px/400/--text-secondary) + Refresh button
Main content: padding 32px

---

## Card Component

Every content section is a card. No exceptions.

```css
background:    var(--surface)
border:        1px solid var(--accent-200)
border-radius: 6px
padding:       24px
margin-bottom: 16px
```

Card section header (inside card, above content):
```css
font:           11px / 600 / uppercase
letter-spacing: 0.06em
color:          var(--accent-700)
padding-bottom: 8px
margin-bottom:  16px
border-bottom:  1px solid var(--accent-200)
```

---

## Stat Block

Use for labeled metrics and key values. Not plain bullet lists.

```
container:  card with 3px solid left border in var(--accent-500)
padding:    16px 16px 16px 20px
label:      11px / 600 / uppercase / var(--accent-700)
value:      20px / 600 / var(--text-primary)
supporting: 13px / 400 / var(--text-secondary)
```

---

## Badges and Status Pills

```css
background:    var(--accent-100)
color:         var(--accent-700)
border:        1px solid var(--accent-300)
border-radius: 2px
padding:       2px 8px
font:          11px / 600 / uppercase
```

Semantic overrides (these override accent for status):
```
ERROR:   background #FEF2F2, color #DC2626, border #FCA5A5
WARNING: background #FFFBEB, color #D97706, border #FCD34D
OK:      background #F0FDF4, color #16A34A, border #86EFAC
```

---

## Charts and Data Viz

Bar and line charts only. No pie charts.
No gridlines except a single baseline.
Fills use accent spectrum: --accent-300 → --accent-400 → --accent-500 → --accent-600
All chart labels: IBM Plex Mono 11px/400
Chart title: IBM Plex Sans 20px/600
No legend icons — text labels only.

---

## Shadows

One value only: `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
Never heavier. No colored shadows.

---

## Edge States (Required on Every Component)

Loading: CSS skeleton shimmer, background var(--accent-100)
Empty:   Centered text only — 15px/400/var(--text-secondary). Plain human sentence.
Error:   13px/400/var(--error), inside a card with 3px left border in var(--error)

---

## What Never Goes in UI

- No icon libraries (Lucide, Heroicons, FontAwesome, any other)
- No emoji
- No gradients
- No shadows heavier than defined above
- No Inter, Roboto, Arial, or Space Grotesk
- No purple, rose, or mauve in default theme
- No inline styles — CSS variables only
- No spacing values outside the defined scale
- No dark mode

---

## Self-Review Before Shipping

Fix any:
- Spacing not on 4px scale
- Font not IBM Plex Sans or IBM Plex Mono
- Icons or decorative elements
- Shadow heavier than 0 1px 3px rgba(0,0,0,0.08)
- Color outside defined palette
Make the fixes. Do not explain them — just apply them.
