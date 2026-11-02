# Pomodoro — Design Reference

> Crimson spark on gunmetal — a single hot-red ember cutting through near-total darkness, with every surface stripped of color until the moment something matters.

**Theme:** dark

## Overview

The Pomodoro timer is a matte-black canvas lit by a single crimson spark. The interface is overwhelmingly achromatic — near-black surfaces, white text, gray hairline borders — and the only chromatic element is a vivid `#dc143c` reserved exclusively for the timer ring, primary action surfaces, and the active mode indicator. Typography is aggressively bold: the system font is set at weight 700 across every size from 10px badges to 56px timer displays, with tight negative tracking. Components are softly rounded. The design system is minimal, monochromatic, and lets the crimson carry 100% of the chromatic narrative — a single warm point in a sea of graphite.

---

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Crimson | `#dc143c` | `--color-crimson` | Primary accent — timer ring, active mode label, filled action buttons, session dots |
| Crimson Glow | `rgba(220,20,60,0.12)` | `--color-crimson-glow` | Ambient background glow, subtle hover halos |
| Crimson Dim | `rgba(220,20,60,0.35)` | `--color-crimson-dim` | Drop-shadow on ring, active dot box-shadow |
| Void Black | `#111111` | `--color-void-black` | Page canvas, deepest background layer |
| Obsidian | `#181818` | `--color-obsidian` | Elevated card surface, section backgrounds |
| Charcoal | `#2b2a2a` | `--color-charcoal` | Footer surface, secondary button hover, tertiary panel |
| Graphite | `#343434` | `--color-graphite` | Ring track, card borders, secondary button fills, hairline dividers |
| Steel | `#666666` | `--color-steel` | Muted labels, keyboard-hint text, quote author |
| Fog | `#8d8d8d` | `--color-fog` | Tertiary heading text, less-prominent labels |
| Ash | `#999999` | `--color-ash` | Quote body text, secondary borders, icon strokes |
| Silver | `#cacaca` | `--color-silver` | Secondary button text, dominant hairline borders |
| Pure White | `#ffffff` | `--color-pure-white` | Timer display, headlines, primary button text |
| Bone | `#e9e6e6` | `--color-bone` | Off-white highlights (reserved) |

---

## Tokens — Typography

### System Font Stack — Weight 700 Only

The exclusive boldness is a signature choice. No 300/400/500/600 weights appear anywhere. Hierarchy comes purely from size and color, not weight variation.

**Family:** `-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`
**Substitute:** Inter (700 only), or any geometric sans with a strong 700 cut
**Weight:** 700

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| body | 14px | 1.25 | -0.14px | `--text-body` |
| body-lg | 16px | 1.25 | -0.24px | `--text-body-lg` |
| subheading | 20px | 1.25 | -0.3px | `--text-subheading` |
| heading-sm | 24px | 1.25 | -0.36px | `--text-heading-sm` |
| heading | 46px | 1 | -1.15px | `--text-heading` |
| display | 68px | 1 | -3.8px | `--text-display` |
| timer (custom) | 56px | 1 | -2.5px | — |

---

## Tokens — Spacing & Shapes

**Base unit:** 4px · **Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |

### Border Radius

| Element | Value |
|---------|-------|
| Cards | 20–25px |
| Buttons | 15px |
| Pills / Badges | 999px / 7px |

---

## Surfaces & Elevation

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Void Canvas | `#111111` | Base page background |
| 1 | Obsidian Card | `#181818` | Elevated card / section backgrounds |
| 2 | Charcoal Panel | `#2b2a2a` | Footer, tertiary panels |
| 3 | Graphite Border | `#343434` | Borders, ring track, dividers |

Elevation is communicated **exclusively** through surface tone shifts. No drop shadows — the matte-black aesthetic would be broken by any light bloom or shadow cast.

---

## Components

### Timer Ring
- SVG circle, `r=148`, `viewBox 320×320`, rotated `-90deg` to start at 12 o'clock
- Track: `stroke: #343434`, `stroke-width: 3`, `opacity: 0.6`
- Progress: `stroke: #dc143c`, `stroke-width: 4`, `stroke-linecap: round`
- Glow: `drop-shadow(0 0 6px rgba(220,20,60,0.35))`
- Depletes clockwise as time elapses
- Subtle pulse animation when timer is running

### Timer Display
- Centered inside the ring
- 56px, weight 700, tabular-nums, `letter-spacing: -2.5px`
- Color: `#ffffff`
- Flashes crimson on session completion

### Mode Label
- Above the timer ring
- 16px, weight 700, `letter-spacing: 0.2em`, uppercase
- Color: `#dc143c`
- Shows: FOCUS / SHORT BREAK / LONG BREAK
- Fade+slide animation on mode transitions

### Session Dots (×4)
- 10px circles with 12px gap
- Inactive: `#343434`
- Active (current): `#dc143c` with pulse animation
- Completed: `#dc143c` with glow, scale-pop on completion

### Primary Action Button (Start/Pause)
- Background: `#dc143c`, text: `#ffffff`, weight 700
- Border-radius: 15px, padding: 12px 24px, min-width: 120px
- Hover: `brightness(1.15)` + crimson glow shadow
- Active: `scale(0.95)`

### Secondary Buttons (Reset, Skip)
- Background: `#343434`, text: `#cacaca`
- Hover: `#2b2a2a` background, `#ffffff` text

### Quote Section
- Max-width: 440px, centered
- Quote text: 16px italic, `#999999`
- Author: 14px, `#666666`
- Crossfade animation on quote change (600ms)
- Work mode: motivational quotes · Break mode: relaxation quotes

### Ambient Background Glow
- Fixed-position radial gradient centered behind the timer
- `radial-gradient(circle, rgba(220,20,60,0.12) 0%, transparent 65%)`
- Subtle breathing animation (scale + opacity) when timer runs

### Keyboard Hints
- 11px, `#666666`, opacity 0.6
- Key badges: 10px, bordered with `#343434`, rounded 4px

---

## Animations

| Animation | Duration | Easing | Purpose |
|-----------|----------|--------|---------|
| `ringPulse` | 3s infinite | ease-in-out | Subtle glow pulse on running ring |
| `dotPulse` | 2.4s infinite | ease-in-out | Active session dot breathing |
| `dotComplete` | 0.5s once | expo-out | Scale pop when session completes |
| `completionFlash` | 1.2s once | ease | Timer display crimson flash |
| `modeFade` | 0.8s once | expo-out | Mode label fade + slide |
| `sectionSwitch` | 1s once | expo-out | Full section fade during mode change |
| `ambientBreathe` | 4s infinite | ease-in-out | Background glow breathing |
| Quote crossfade | 600ms | expo-out | Quote text swap with fade |

**Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for all transitions.

---

## Pomodoro Technique

### How It Works
1. **Work** for 25 minutes (one "pomodoro")
2. Take a **short break** of 5 minutes
3. Repeat steps 1–2
4. After **4 pomodoros**, take a **long break** of 15 minutes
5. Reset the cycle and repeat

### Key Principles
- During a work session, focus on a single task with no distractions
- If you think of something unrelated, write it down and return to your task
- Breaks are mandatory — they prevent burnout and maintain focus quality
- The long break every 4 sessions allows for deeper rest and reflection

---

## Do's and Don'ts

### Do
- Use `#dc143c` exclusively for the timer ring, primary action fills, active session dots, and the mode label
- Set all text at weight 700; rely on size and color for hierarchy
- Apply border-radius 15px to buttons, 20–25px to cards
- Use the surface stack `#111 → #181 → #2b2 → #343` for elevation via tone
- Apply tight negative letter-spacing at larger sizes
- Let the void canvas breathe — generous whitespace around the timer

### Don't
- Never introduce a second chromatic color — the crimson must be the only spark
- Never use weight 300/400/500/600; exclusive 700 is the signature
- Never use heavy drop shadows or glow effects; elevation = surface tone only
- Never use `#000000` as a surface; the canvas is `#111111`
- Never add gradients to UI surfaces
- Never place a crimson button on another crimson element; it needs the dark void

---

## Quick Start — CSS Custom Properties

```css
:root {
  /* Colors */
  --color-crimson:       #dc143c;
  --color-crimson-glow:  rgba(220, 20, 60, 0.12);
  --color-crimson-dim:   rgba(220, 20, 60, 0.35);
  --color-void-black:    #111111;
  --color-obsidian:      #181818;
  --color-charcoal:      #2b2a2a;
  --color-graphite:      #343434;
  --color-steel:         #666666;
  --color-fog:           #8d8d8d;
  --color-ash:           #999999;
  --color-silver:        #cacaca;
  --color-pure-white:    #ffffff;
  --color-bone:          #e9e6e6;

  /* Typography */
  --font-system: -apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  --font-weight: 700;

  /* Type Scale */
  --text-body:       14px;
  --text-body-lg:    16px;
  --text-subheading: 20px;
  --text-heading-sm: 24px;
  --text-heading:    46px;
  --text-display:    68px;

  /* Spacing */
  --spacing-4:   4px;
  --spacing-8:   8px;
  --spacing-12:  12px;
  --spacing-16:  16px;
  --spacing-20:  20px;
  --spacing-24:  24px;
  --spacing-32:  32px;
  --spacing-40:  40px;
  --spacing-48:  48px;

  /* Border Radius */
  --radius-buttons: 15px;
  --radius-cards:   20px;
  --radius-pills:   999px;
  --radius-badges:  7px;

  /* Transitions */
  --ease-out-expo:     cubic-bezier(0.16, 1, 0.3, 1);
  --transition-fast:   180ms ease;
  --transition-normal: 400ms cubic-bezier(0.16, 1, 0.3, 1);
  --transition-slow:   600ms cubic-bezier(0.16, 1, 0.3, 1);

  /* Ring */
  --ring-circumference: 980.18;
}
```

---

## Flocus-Inspired Dashboard Architecture

The interface adopts **Flocus's sanctuary-style focus dashboard**:
1. **Idle State:** Displays a greeting that adapts to the time of day (e.g., *"Good afternoon."*, *"Late night. Stay focused."*) paired with a bold, minimal clock face, quote, and start trigger.
2. **Active State:** Seamlessly transitions the centered block into the circular Pomodoro progress ring, depleting clockwise with live timer countdown.
3. **Continuous Atmosphere:** The quote rotates smoothly with quotes suited to deep work or mindful relaxation.

---

## WebGL Fluid / Gas Dynamics Background

Beneath the achromatic interface lies a real-time GPU-accelerated Navier-Stokes fluid simulation (`fluid.js`):
- **Aesthetic:** Drifting crimson smoke and ember sparks across void `#0a0a0a`.
- **Interactivity:** Fluid velocity and dye respond in real time to mouse moves and mobile touch drags with inertia.
- **Ambient Life:** Autonomous swirling and periodic gentle billows keep the background breathing even when idle.
- **Performance:** Ping-pong FBOs, Jacobi pressure solver, vorticity confinement, low-resolution computation with bilinear display interpolation, and an automatic lightweight 2D canvas fallback.

