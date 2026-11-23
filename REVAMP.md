# Pomodoro Focus — Complete UI/UX Revamp Specification

> A design-led revamp proposal generated from a cross-skill review (frontend-design, design-system, ui-ux-pro-max, ui-styling, impeccable, unslop, accent-color-hierarchy, niche-design-hacks). Covers layout, typography, color, spacing, motion, components, accessibility, responsive behavior, and a phased implementation roadmap.

**Mode:** Operate (this is a tool the visitor uses to complete a task — focus sessions). Ambition shows as precision and restraint, not expression.

---

## 0. Direction (five lines)

- **Product.** A desktop/web Pomodoro + multi-framework focus timer for knowledge workers who want a calm, distraction-free single-screen workspace.
- **Character.** Calm, exact, a little warm. Not "clean, modern, minimal" — those describe every template.
- **World.** A dark study at night: graphite surfaces, warm crimson ember, soft paper-white text. The accent is the only warm light in the room.
- **Moments.** (1) The timer ring as the single bright focal point while running. (2) A rich, real-data focus chart in a future stats view. (3) The active task name rendered as a quiet, warm pill above the timer.
- **Signature.** A single warm ember dot that pulses only while a session is live — used nowhere else.

---

## 1. Anti-slop audit (current codebase)

Signs found in `index.html` / `styles.css` / `script.js`:

| # | Sign | Where | Fix |
|---|------|-------|-----|
| 1 | `--weight: 700` globally — every text is bold | `:root` | Split into 400/500/600 roles; 700 only for the timer digits |
| 2 | ALL-CAPS tracked labels everywhere | `.greeting-sub`, `.timer-label`, `.stage-badge`, `.settings-label`, `.explainer-title`, `.method-card-badge`, `.flowtime-ratio-hint`, `.timer-progress-bar-label` | Sentence case; keep uppercase only for the 11px timer phase label |
| 3 | Hardcoded hex (`#ffffff`, `rgba(255,255,255,0.06)`) mixed with tokens | throughout CSS | Migrate to 3-layer tokens (§3) |
| 4 | Accent overuse: crimson glow on ring, primary button, active cards, badges, focus rings | throughout | Cap accent to ≤10% viewport (§4) |
| 5 | `transition: all 0.2s` catch-alls | many | Named transitions only (§8) |
| 6 | `100vh` for app shell / tasks panel | `.app`, `.tasks-panel` | `100dvh` (niche hack #9) |
| 7 | Opaque hex borders (`#graphite`) instead of alpha borders | many | `rgb(255 255 255 / 0.10)` (niche hack #2) |
| 8 | Modal clipping on Appearance tab | `.modal-dialog` max-height + flex | §6.5 |
| 9 | No empty state illustration / CTA for tasks | `.tasks-empty` | §6.4 |
| 10 | Favicon uses emoji (🍅) — acceptable for favicon only | `<head>` | Keep, but never in UI chrome |
| 11 | `::selection` crimson on white — low contrast on light theme | global | Theme-aware selection |
| 12 | No `aria-live` / focus trap in modal | modal | §9 |
| 13 | `transform: rotate(20deg)` on settings hover — decorative jitter | `.topbar-icon-btn:hover` | Remove; use color/opacity only |
| 14 | Ring glow `drop-shadow` animating on a 3.5s loop even when paused | `.timer-running` only — ok, but verify class toggled | keep gated |
| 15 | Hint bar `opacity: 0.45` baseline — too faint, then jumps on hover | `.hint` | Raise to 0.65, hover 0.9 |

---

## 2. Typography

**One family for UI, one mono partner for figures/meta.** Drop the generic 700 default.

| Role | Family | Weight | Size (px) | Line-height | Tracking |
|------|--------|--------|-----------|-------------|----------|
| Display (clock) | `Inter` (or `Geist`) | 600 | clamp(56, 10vw, 96) | 1.0 | -0.04em |
| Timer digits | `Inter` tabular | 500 | clamp(48, 8.5vw, 68) | 1.0 | -0.04em |
| Title (modal) | `Inter` | 600 | 18 | 1.2 | -0.02em |
| Headline (greeting) | `Inter` | 500 | 17 | 1.3 | -0.01em |
| Body | `Inter` | 400 | 14 | 1.5 | 0 |
| Caption / meta | `Inter` | 500 | 11–12 | 1.4 | 0.02em |
| Mono meta | `JetBrains Mono` / system mono | 500 | 11 | 1.4 | 0.04em |

Rules (from unslop §5):
- Hierarchy from **size + color**, not weight. Max weight 600, only on timer digits and primary CTA.
- Sentence case everywhere. No ALL-CAPS tracked labels except the 11px phase label.
- `font-variant-numeric: tabular-nums` on clock, timer, counts, stats.
- Small text (≤13px) never gets negative tracking; use 0 or +0.02em.
- Numbers: one format across the screen (`25:00`, `03`, `4 sessions`).
- No italic for emphasis; italic reserved for the quote only.

**Font loading:** self-host `Inter` (variable, wght 400/500/600) + `JetBrains Mono` (500) with `font-display: swap`. Remove the `cfgClockFont` serif/rounded options? Keep as user preference but default to Inter; serif clock remains an opt-in.

---

## 3. Design tokens (3-layer, OKLCH)

Replace the flat `:root` with primitive → semantic → component layers. Use OKLCH for perceptual uniformity (niche hack #3).

### Primitive (raw)

```css
:root {
  /* Neutrals — tinted toward hue 250 (cool graphite) */
  --n-0:   oklch(99% 0.004 250);
  --n-50:  oklch(96% 0.006 250);
  --n-100: oklch(92% 0.008 250);
  --n-200: oklch(84% 0.010 250);
  --n-300: oklch(72% 0.012 250);
  --n-400: oklch(60% 0.014 250);
  --n-500: oklch(48% 0.016 250);
  --n-600: oklch(38% 0.018 250);
  --n-700: oklch(28% 0.020 250);
  --n-800: oklch(20% 0.020 250);
  --n-900: oklch(14% 0.018 250);
  --n-950: oklch(10% 0.016 250);
  --n-1000: oklch(6%  0.014 250);

  /* Accent — crimson ember, hue 24, high chroma, clearly separated from neutral hue 250 */
  --a-400: oklch(72% 0.19 24);
  --a-500: oklch(64% 0.21 24);
  --a-600: oklch(56% 0.22 24);
  --a-700: oklch(48% 0.20 24);

  /* Success (break/rest) — green, toned down */
  --s-500: oklch(62% 0.14 150);
  /* Warning */
  --w-500: oklch(72% 0.16 75);
  /* Danger */
  --d-500: oklch(60% 0.20 24);
}
```

### Semantic (purpose aliases)

```css
:root[data-theme="dark"] {
  /* 60% primary base (low lightness neutral) */
  --surface-base:        var(--n-950);
  --surface-raised:      var(--n-900);
  --surface-overlay:     var(--n-800);
  --surface-sunken:      var(--n-1000);

  /* 30% opposing base (high lightness text/structure) */
  --text-primary:        var(--n-50);
  --text-secondary:      var(--n-300);
  --text-muted:          var(--n-500);
  --text-disabled:       var(--n-600);

  --border-subtle:       rgb(255 255 255 / 0.08);
  --border-strong:       rgb(255 255 255 / 0.16);

  /* 10% accent */
  --accent:              var(--a-500);
  --accent-hover:        var(--a-400);
  --accent-pressed:      var(--a-600);
  --accent-soft:         oklch(64% 0.21 24 / 0.12);
  --accent-glow:         oklch(64% 0.21 24 / 0.24);
  --accent-fg:           var(--n-0);

  --success:             var(--s-500);
  --warning:             var(--w-500);
  --danger:              var(--d-500);

  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-md: 0 8px 24px rgb(0 0 0 / 0.5);
  --shadow-lg: 0 24px 60px rgb(0 0 0 / 0.6);
}

:root[data-theme="light"] {
  --surface-base:        var(--n-50);
  --surface-raised:      var(--n-0);
  --surface-overlay:     var(--n-100);
  --surface-sunken:      var(--n-200);

  --text-primary:        var(--n-900);
  --text-secondary:      var(--n-600);
  --text-muted:          var(--n-500);
  --text-disabled:       var(--n-400);

  --border-subtle:       rgb(0 0 0 / 0.08);
  --border-strong:       rgb(0 0 0 / 0.16);

  --accent:              var(--a-600);
  --accent-hover:        var(--a-500);
  --accent-pressed:      var(--a-700);
  --accent-soft:         oklch(56% 0.22 24 / 0.10);
  --accent-glow:         oklch(56% 0.22 24 / 0.20);
  --accent-fg:           var(--n-0);

  --success:             oklch(52% 0.14 150);
  --warning:             oklch(62% 0.16 75);
  --danger:              oklch(52% 0.20 24);

  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-md: 0 8px 24px rgb(0 0 0 / 0.10);
  --shadow-lg: 0 24px 60px rgb(0 0 0 / 0.16);
}
```

### Component tokens

```css
:root {
  --btn-primary-bg:     var(--accent);
  --btn-primary-fg:     var(--accent-fg);
  --btn-secondary-bg:   var(--surface-overlay);
  --btn-secondary-fg:   var(--text-secondary);
  --btn-ghost-fg:       var(--text-secondary);

  --card-bg:            var(--surface-raised);
  --card-border:        var(--border-subtle);
  --card-radius:        16px;
  --card-padding:       20px;

  --input-bg:           var(--surface-sunken);
  --input-border:       var(--border-subtle);
  --input-focus-ring:   var(--accent-soft);

  --modal-bg:           var(--surface-raised);
  --modal-radius:       20px;
  --modal-max-h:        min(90vh, 760px);

  --ring-track:         rgb(255 255 255 / 0.06);  /* dark; override in light */
  --ring-progress:      var(--accent);
}
```

### Accent audit (pre-ship)
- Squint test: eye should land on the timer ring + primary Start button only.
- Hue separation: neutral hue 250 vs accent hue 24 — distinct.
- Budget: accent ≤ 10% of viewport. Demote: active method card border (use `--border-strong` + a 2px left accent bar instead of full crimson border), session dots (use `--text-secondary` for completed, accent only for the *current* dot), modal tab active (use `--text-primary` + 2px underline in accent).

---

## 4. Color & accent hierarchy (60 / 30 / 10)

- **60%** primary base = `--surface-base` (the canvas).
- **30%** opposing base = text + structural containers (`--text-*`, `--surface-raised` cards).
- **10%** accent = primary CTA, active session dot, focus ring, timer progress, selected tab underline. Nothing else.
- Surfaces never take a hue. The world's warmth lives in the accent and the ember dot, not in backgrounds (unslop §2).
- Break mode: swap accent role to `--success` (green) for the ring + label, so focus vs rest is distinguishable by color *and* shape (label text changes too — color is never the only indicator).

---

## 5. Spacing & layout grid

- **4px base grid.** All margins/padding/gaps/heights are multiples of 4 (2px nudges allowed inside small controls).
- Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
- Density: compact panels/sidebars 16, cards 20–24, page edges 24–32.
- Navigation (topbar) is the densest: 36px rows, 4px gaps, icons in one column.
- Grouping: inner gap < outer gap (e.g. 8 inside a card group, 24 between groups).
- Nested radii (niche hack #1): `R_inner = R_outer - padding`. Card 16 / padding 6 → inner 10.
- Alpha borders (niche hack #2): `rgb(255 255 255 / 0.10)` dark, `rgb(0 0 0 / 0.10)` light.
- Surface elevation in dark mode via lightness steps, not shadows (niche hack #8).

---

## 6. Layout revamp

### 6.1 Idle state (no active session)

```
┌─────────────────────────────────────────────────────┐
│  POMODORO          ●●○○              (quote top-R)  │  topbar
│                                                     │
│                                                     │
│              Good afternoon, Alex.                  │  greeting (17px, secondary)
│                                                     │
│                 4:20 PM                             │  clock (clamp 56–96, 600)
│                                                     │
│          Classic Pomodoro · 25m Focus / 5m Break     │  sub (12px, muted, sentence case)
│                                                     │
│                  (  ▶  )                            │  primary CTA only
│                                                     │
│  ⚙ (bottom-left)                      ☰ tasks (BR) │
└─────────────────────────────────────────────────────┘
```

- Centered, spacious, single CTA. Remove the secondary reset/skip buttons from idle (they do nothing yet). Reset/skip appear once a session is active.
- Greeting uses the user's name if set; falls back to time-of-day greeting.
- Clock is the hero. `text-shadow` glow removed (slop); rely on size + weight.

### 6.2 Active state (session running)

```
┌─────────────────────────────────────────────────────┐
│  POMODORO          ●●○○              (quote top-R)  │
│                                                     │
│              Phase 1: Ignition Block                 │  stage badge (only super mode)
│                                                     │
│                  ┌──────────┐                      │
│                  │  24:31   │                      │  timer ring, 310px
│                  │  focus   │                      │
│                  └──────────┘                      │
│                                                     │
│            ⏮   ▶/⏸   ⏭                            │  controls
│                                                     │
│            "Write the spec"  (active task)          │  quiet pill, optional
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Timer ring stays the hero. Ring stroke 4px, track 3.5px. Progress color = accent (focus) / success (break).
- Controls: primary 58px center, secondaries 44px flanking with 16px gap. Secondaries use `--btn-secondary-bg` (glass on chrome only).
- Active task pill above controls: `--surface-overlay`, 12px radius, 11px muted text + task name in `--text-primary`. Clicking opens task picker.
- Flowtime earned rest badge moves inside the ring (bottom), not below it, to reduce vertical sprawl.

### 6.3 Break state

- Ring color → `--success`. Label → "break" (sentence case) or "rest".
- Background atmosphere dims 20% (canvas opacity 0.6) to signal recovery.
- Primary button label changes to "Skip break" affordance stays on skip button.

### 6.4 Tasks panel

- Slide-in from right, 360px (was 340), `100dvh`.
- Empty state: centered illustration (simple SVG of a checklist with one checked item) + "Add your first task" + input auto-focused. No "No tasks yet" plain text.
- Task item: checkbox (circle, accent when checked with blur-transition icon swap — niche hack #7), text, delete (appears on hover/focus).
- Active task indicator: a 3px accent left bar on the selected task + "Working on" caption.
- Counts in header as quiet mono muted text: "3 open · 2 done".

### 6.5 Settings modal

- Fix clipping: `max-height: min(90vh, 760px)`; `.tab-pane` `overflow-y: auto` with `scrollbar-width: thin`; sticky header + tabs.
- Tabs: scroll horizontally on small screens; reduce to icon+label on mobile.
- Groups: 24px vertical gap, section headers 15px/600.
- Inputs: 44px height, 12px radius, focus ring `0 0 0 3px var(--accent-soft)`.
- Method cards: border `--border-subtle`; active = `--border-strong` + 2px accent left bar (not full crimson border + glow).
- Fluid modes grid: 2 columns on mobile, 3 on tablet+.
- Footer: sticky bottom with `--surface-raised` + top border.

### 6.6 Responsive breakpoints

| Breakpoint | Layout |
|------------|--------|
| ≤375 (small phone) | Single column, timer 220px, controls 44/40, hint bar hidden, tasks panel full-width sheet |
| 376–600 (phone) | As above, timer 250px |
| 601–1024 (tablet) | Timer 280px, tasks panel 360px overlay |
| ≥1025 (desktop) | Timer 310px, optional right-side task rail (280px) instead of overlay |
| ≥1440 (wide) | Cap content at 1440, center; canvas full-bleed |

- Use CSS container queries for the tasks panel and modal components.
- Touch targets ≥44pt (48dp Android). Expand hit areas on icon-only buttons.

---

## 7. Components (state matrix)

| Component | Default | Hover | Active/Pressed | Focus | Disabled |
|-----------|---------|-------|----------------|-------|----------|
| Primary btn | accent bg, white fg, 58px circle | brightness 1.08 | scale 0.94 | 3px accent-soft ring | opacity 0.4, no pointer |
| Secondary btn | surface-overlay, secondary fg, 44px | surface-raised | scale 0.94 | 2px border-strong | opacity 0.4 |
| Card | surface-raised, border-subtle, 16px | border-strong | — | 2px accent ring | opacity 0.5 |
| Input | surface-sunken, border-subtle | border-strong | — | 3px accent-soft ring + accent border | opacity 0.5 |
| Method card | surface-sunken, border-subtle | surface-raised, border-strong | accent left bar + border-strong | 2px accent ring | — |
| Switch | graphite track, white thumb | — | accent track, thumb +20px | 2px accent ring | opacity 0.4 |
| Tab (modal) | muted fg, transparent underline | primary fg | accent fg + 2px accent underline | 2px accent ring | — |

Rules:
- Pressed states use color/opacity/scale only — no layout shift (unslop §9).
- Focus rings always visible for keyboard; never `outline: none` without replacement.
- Disabled uses `disabled` semantics, not just styling.

---

## 8. Motion

- **Easing:** one curve `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for enters; `cubic-bezier(0.4, 0, 0.2, 1)` for state changes.
- **Durations:** feedback 120ms, state 200ms, enter 300ms, modal 350ms.
- **Named transitions only** — never `transition: all`. Animate `color, background-color, border-color, opacity, transform`.
- **Never animate** width, height, top, left, margins, large blurs (jank on weak devices).
- **One entrance on load:** greeting fades + rises 8px over 400ms. Timer ring fades in. No per-card stagger.
- **Micro-interactions:** icon swap (play↔pause) uses blur 4px + opacity + scale 0.85 (niche hack #7). Button press scale 0.94.
- **Looping motion only when live:** ring glow, dot pulse, session dot. Gate behind `.timer-running` / `.active` classes; respect `prefers-reduced-motion`.
- **Reduced motion:** disable all non-essential animation; keep instant state changes.

---

## 9. Accessibility

- Semantic HTML: `<main>`, `<header>`, `<footer>`, `<dialog>` (or role="dialog") with `aria-modal="true"`, `aria-labelledby`.
- Focus trap in modal; restore focus to trigger on close. `Esc` closes.
- `aria-live="polite"` region announcing timer milestones (e.g. "5 minutes remaining", "Session complete").
- All icon-only buttons: `aria-label`. Decorative icons: `aria-hidden="true"`.
- Form inputs: associated `<label>`, `aria-describedby` for hints, `aria-invalid` + error text on validation failure.
- Color contrast: text ≥4.5:1, large text/UI ≥3:1. Verify both themes independently.
- `prefers-reduced-motion`, `prefers-reduced-transparency` (fallback solid surfaces), `prefers-color-scheme` (initial theme).
- Keyboard: Space play/pause, R reset, K skip, S settings, T tasks, Esc close, Tab order matches visual order.
- Touch targets ≥44pt; expand hit areas.

---

## 10. Iconography

- One set: **Lucide** (or Phosphor) — consistent 16px, 1.5px stroke, `currentColor`.
- Stroke weight matches adjacent text weight (niche hack #5): 400 text → 1.5, 600 text → 2.0.
- Icons take the color of their text role (secondary/muted); never their own color. Categories that need color use a small status dot.
- Drop decorative icons (emoji in card titles, before section labels).
- Icon box same width in every row; fixed 8–10px gap to label.

---

## 11. Copy / UX writing

- Headlines say what the product does for whom, in plain words. No hype ("supercharge", "seamless", "unlock", "magic").
- No exclamation marks in UI text; no "Welcome back, Alex! 👋" — use "Good afternoon, Alex." or just the page context.
- Short labels: "Search", not "Search anything...".
- Changes state their comparison: "+12% vs last week", "3 fewer vs last month".
- Headlines/labels/buttons/captions: no trailing period. Only multi-sentence paragraphs keep periods.
- Sentence case everywhere (reinforces §2).
- Mock data looks real (plausible names/numbers), never `[X]` or `123,456`.
- Badges (`PRO`, `New ✨`, `Beta 🚀`) removed unless essential; then quiet text.
- Empty states: invitation to act — "Add your first task" + input, not "No tasks yet."

---

## 12. Dark / light theme

- Default: **dark** (current). Add a toggle in Appearance tab ("Theme: System / Dark / Light").
- `data-theme` on `<html>`; persist to localStorage; respect `prefers-color-scheme` when "System".
- Light theme: surfaces flip to `--n-50`/`--n-0`, text to `--n-900`; accent darkens to `--a-600` for contrast.
- Canvas backgrounds: in light mode reduce opacity to 0.35 and desaturate, or offer "Clean Void" default.
- Test both themes for contrast independently (don't assume light values work).

---

## 13. Background atmospheres

- Keep the 18 modes but fix the primitive ones (trees, sand, horizon, mountains, lava) — currently basic Canvas 2D shapes. Either upgrade to layered SVG/Canvas with parallax or remove until polished. Half-finished modes erode trust.
- Add `prefers-reduced-motion` → force "Clean Void" or static frame.
- Add a "Performance" toggle: disable canvas on battery / low-power.
- Fluid (smoke) stays default; it's the one genuinely high-craft mode.

---

## 14. Feature gaps to close (from plan.md, prioritized)

1. **Task ↔ timer integration.** `activeTask` in state; show selected task above timer; track focus minutes per task; "Working on X" pill.
2. **Focus stats.** Daily/weekly focus minutes, streak, session count. One hero chart (line, accent on current day) + compact stat row. No mini-charts in stat cards.
3. **Ambient sounds.** Web Audio API loops (rain, forest, café, white noise) with volume; auto-play during focus; fade on break.
4. **Onboarding.** First-run: pick method → durations → accent → "Start your first session" CTA. 3 steps max.
5. **Keyboard expansion.** T tasks, A appearance, M method, Enter start/pause, Ctrl+N new task, Ctrl+D clear done.
6. **Desktop (Electron).** System tray timer, global shortcuts, native notifications with actions, auto-update.

---

## 15. Implementation roadmap

### Phase 1 — Foundations (1–2 days)
- [ ] Migrate `:root` to 3-layer OKLCH tokens (§3). Replace all hardcoded hex/rgba.
- [ ] Fix modal clipping (§6.5).
- [ ] Add `100dvh`, alpha borders, nested radii.
- [ ] Remove slop signs (§1 table).
- [ ] Typography: drop global 700; apply scale (§2).

### Phase 2 — Layout & components (2–3 days)
- [ ] Idle/active/break layouts (§6.1–6.3).
- [ ] Accent budget audit (§4) — demote secondary usages.
- [ ] Tasks panel empty state + active task (§6.4).
- [ ] Settings modal polish (§6.5).
- [ ] Component state matrix (§7).
- [ ] Motion pass (§8).

### Phase 3 — Accessibility & responsive (1–2 days)
- [ ] ARIA, focus trap, live regions (§9).
- [ ] Breakpoints + container queries (§6.6).
- [ ] Touch targets, reduced motion/transparency.

### Phase 4 — Features (3–5 days)
- [ ] Task ↔ timer integration.
- [ ] Focus stats dashboard.
- [ ] Ambient sounds.
- [ ] Onboarding.
- [ ] Keyboard expansion.

### Phase 5 — Desktop & polish (2–3 days)
- [ ] Electron tray/notifications/shortcuts.
- [ ] Upgrade or remove primitive background modes.
- [ ] Light theme + theme toggle.

---

## 16. Success criteria (how we know it worked)

- Squint test: eye lands on timer ring + Start button only.
- No ALL-CAPS tracked labels except the 11px phase label.
- No hardcoded hex in component CSS (all via tokens).
- Accent ≤ 10% of viewport in idle + active states.
- Modal scrolls fully on Appearance tab at 375px width.
- Lighthouse accessibility ≥ 95.
- `prefers-reduced-motion` disables all loops.
- Both themes pass 4.5:1 text contrast.

---

## 17. What NOT to do (anti-patterns to avoid)

- No purple/blue gradients, no glows, no gradient text, no "New ✨" badges.
- No bento grids, glassmorphism on content cards, or neon borders.
- No emoji as structural icons (favicon exempt).
- No `transition: all`.
- No `100vh` for full-height sections.
- No second accent color. Crimson is the only accent; success green is semantic, not an accent.
- Don't invent features/data/claims. Confirm any marketing number with the user.

---

*Generated from: frontend-design, design-system, ui-ux-pro-max, ui-styling, impeccable, unslop, accent-color-hierarchy, niche-design-hacks. Companion to existing `plan.md` (which remains the historical record).*
