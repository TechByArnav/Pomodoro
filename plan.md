# POMODORO FOCUS — UI/UX Revamp Plan

> Generated using all installed UI skills (apple-design-ui, prompt-motion-ui, frontend-design, ui-ux-pro-max, ui-styling, design-system) + online research of Pomodoro timer apps (Flocus, Pomofocus, Forest, Flow, Session, Toggl Track, Not Boring Timer).

---

## Current State Summary

The app is a **dark-themed, vanilla HTML/CSS/JS Pomodoro timer** with:
- 18 background animation modes (WebGL fluid, waves, embers, thermal, cotton, ripples, trees, horizon, sand, ribbon, sonar, prisms, clouds, silk, sunset, mountains, lava, none)
- 6 productivity methods (Classic, Super-Pomodoro, 52/17, Ultradian, Animedoro, DeskTime)
- Customizable clock (font, size, 12/24h, color, flip style)
- 6 timer display styles (ring, progress bar, gauge, dots, pie, none)
- Tasks panel (slide-out from right)
- Settings modal with 5 tabs (Method, Timers, Appearance, Profile, Tasks)
- Quotes in top-right corner
- Settings button (bottom-left), Tasks toggle (bottom-right)
- Electron desktop app (main.js, preload.js, package.json)
- 18 UI skills installed globally

---

## Research Findings (Best Practices from Top Pomodoro Apps)

### From Flocus (app.flocus.com):
- Light background (#f5f5f7) is default; dark is secondary
- Quote at **top-left** above greeting ("Surround yourself with positivity")
- Clock is **large and prominent** (4:46)
- Greeting is bold ("Power through, Flocus User!")
- Date as subtitle ("Tuesday's not over yet")
- Tasks on the **right side** as a panel
- Settings as a **gear icon** (top-right)
- Bottom navigation bar with icons (Home, Focus, Ambient, Themes, etc.)
- Focus stats dashboard
- Beautiful themes (animated/static backgrounds)
- Ambient sounds integrated

### From Pomofocus (pomofocus.io):
- Minimalist, clean interface
- Large timer in center
- Task list below timer
- Simple color customization
- Dark mode toggle

### From Flow (macOS/iOS):
- Minimalist design
- Simple and lets you focus on work
- Affordable, nailing the basics

### From Session (macOS/iOS):
- Customizable timer lengths
- Keyboard shortcuts
- Menu bar app
- Sync between Mac and iOS
- Calendar integration
- App/website blocking

### From Not Boring Timer (iOS):
- Beautiful typography
- Fun, interactive, easy to use
- Well-designed animations
- Great typefaces

### From Goodtime (Android, open-source):
- Minimalist design
- Configurable timer
- Pause, skip, add extra time
- Swipe gestures
- No ads, no tracking

### From Forest (iOS/Android):
- Gamification (growing trees)
- Visual rewards
- Motivating for students

### From Focus To-Do:
- Connects task directly to Pomodoro session
- Tracks resulting focus time
- Dedicated focus screen (fullscreen, timer, white noise)
- Focus Bar keeping task + timer visible

### From Sunsama:
- Focus Bar keeping current task and timer visible outside app
- Break reminders
- One idea per section

---

## Identified Issues (from user feedback + code review)

### Critical Issues

1. **Modal clipping on Appearance tab** — Content gets cut off at bottom when scrolling. The `modal-dialog` has `max-height` but content extends beyond visible area.

2. **No task-to-timer integration** — Tasks exist but don't link to Pomodoro sessions. Can't select a task to work on during a session.

3. **No focus stats/analytics** — No tracking of completed sessions, focus time, streaks.

4. **Background animations still not smooth enough** — WebGL fluid works but other modes (trees, sand, etc.) are still primitive Canvas 2D shapes.

5. **No ambient sounds** — Flocus has ambient sounds; we only have a completion chime.

6. **No keyboard shortcuts beyond basic** — Only Space, R, K, S, Esc. No task management shortcuts.

### UI/UX Issues

7. **Middle section overcrowded** — Timer ring + controls + quote all compete for attention. Flocus keeps it clean: large clock, then timer, then tasks.

8. **No task count in main view** — Task count badge exists on toggle button but not prominently displayed.

9. **Settings modal tabs don't scroll properly** — When content exceeds viewport, only part is visible.

10. **No visual indication of current session type** — Mode pill exists but could be more prominent.

11. **No break countdown overlay** — When on break, should show a different visual treatment.

12. **No keyboard accessibility** — No focus indicators, no ARIA labels on dynamic content.

13. **No responsive layout** — Fixed widths, no mobile/tablet adaptation.

14. **No empty states** — When no tasks exist, just shows "No tasks yet" text.

15. **No onboarding** — New users see a wall of settings with no guidance.

### Code/Architecture Issues

16. **Duplicate event handlers** — Already fixed (removed inline onclick + JS addEventListener conflict).

17. **No state persistence for tasks across sessions** — Tasks persist in localStorage but don't sync with timer sessions.

18. **No error handling** — Most functions don't have try-catch.

19. **No loading states** — Fluid background initializes without loading indicator.

20. **Hardcoded colors** — Some CSS still uses hardcoded hex instead of CSS variables.

---

## Proposed Changes Plan

### Phase 1: Core UI Fixes (High Priority)

#### 1.1 Fix Modal Clipping (Root Cause)
**Problem:** `.modal-dialog` max-height + `.tab-pane` flex: 1 causes content overflow.

**Fix:**
- Set `.modal-dialog` to `max-height: 90vh` (not 95vh)
- Make `.modal-header` `position: sticky; top: 0` (already done)
- Make `.tab-pane` have `overflow-y: auto` and `max-height: calc(90vh - header_height)`
- Add `scrollbar-width: thin` for cleaner scrollbars
- Test with Appearance tab (most content)

#### 1.2 Unclutter the Middle
**Problem:** Timer ring, controls, quote all compete for attention.

**Fix (inspired by Flocus):**
- Idle state: Show greeting → large clock → subtitle → controls (centered, spacious)
- Active state: Show timer (large, centered) → controls (below) → tasks (right side panel)
- Quote: Top-right corner only (already done), minimal, italic
- Mode pill: Keep but make smaller, move to top-left next to logo
- Session dots: Keep in top-center

#### 1.3 Single Settings Button
**Problem:** Two settings buttons existed (top-right + bottom-left).

**Fix (already applied):**
- Only one settings button at bottom-left (glassy, 44px, tucked away)
- Tasks toggle at bottom-right (separate from settings)
- Top-right: empty (clean)

#### 1.4 Task-to-Timer Integration
**Problem:** Tasks exist but don't link to Pomodoro sessions.

**Fix:**
- Add `activeTask` to state
- When starting timer, optionally select a task
- Show selected task name above timer
- Track focus time per task
- Display task completion in session summary

#### 1.5 Ambient Sounds
**Problem:** Only completion chime exists.

**Fix:**
- Add ambient sound options (rain, forest, cafe, etc.)
- Use Web Audio API for looping ambient sounds
- Volume control in settings
- Auto-play during focus sessions

---

### Phase 2: Visual Polish (Medium Priority)

#### 2.1 Spring-Based Animations
**Problem:** CSS transitions use `ease`/`linear` defaults.

**Fix (per Apple Design skill):**
- Use spring-based easing for all UI transitions
- CSS `linear()` spring approximations for button presses, modal open/close, card hover
- `response: 0.3s, dampingFraction: 0.8` for UI elements
- `response: 0.4s, dampingFraction: 0.7` for cards

#### 2.2 Glass Materials (Proper Implementation)
**Problem:** Current glass effects are basic `backdrop-filter` without proper layering.

**Fix (per Apple Materials skill):**
- Glass on chrome only (nav, sheets, sidebars)
- Living backdrop behind glass panels
- `prefers-reduced-transparency` fallback
- Never stack glass on glass

#### 2.3 Typography Refinement
**Problem:** Default font stack, no clear type scale.

**Fix (per Apple Foundations + Frontend Design skills):**
- Use system font stack (`-apple-system, system-ui`)
- Clear type scale: display (56px), title (24px), headline (18px), body (16px), caption (12px)
- Line lengths < 80 characters
- Seriff body text gets more line-height
- No ALL CAPS labels (use sentence case)

#### 2.4 Color System
**Problem:** Hardcoded hex colors throughout CSS.

**Fix (per Design System skill):**
- Define all colors as CSS custom properties
- Semantic color tokens (--text-primary, --text-secondary, --surface-base, etc.)
- Accent color propagates to all UI elements
- Background atmosphere derives from accent color

#### 2.5 Spacing System
**Problem:** Ad-hoc spacing values (16px, 24px, 32px, etc.) without consistent system.

**Fix (per Apple Foundations + UI/UX Pro Max):**
- 8pt grid: 8, 16, 24, 32, 48, 64px
- 4pt half-steps for tight gaps
- Consistent padding: 16px on mobile, 24px on tablet, 32px on desktop
- Safe area insets for mobile

---

### Phase 3: Feature Additions (Lower Priority)

#### 3.1 Focus Stats Dashboard
- Track daily/weekly/monthly focus time
- Show streaks
- Display session history
- Chart visualization (bar chart for daily focus)

#### 3.2 Custom Themes
- Allow custom background images
- YouTube URL for ambient background
- Theme presets (like Flocus has)

#### 3.3 Keyboard Shortcuts Expansion
- `T` - Toggle tasks panel
- `A` - Open appearance settings
- `M` - Open method settings
- `Enter` - Start/pause timer
- `Ctrl+N` - New task
- `Ctrl+D` - Delete completed tasks

#### 3.4 Responsive Layout
- Mobile: Stack vertically, larger touch targets
- Tablet: 2-column layout
- Desktop: 3-column with sidebar
- Use CSS container queries for component-level responsiveness

#### 3.5 Onboarding
- First-time user welcome
- Quick setup wizard (method, duration, accent color)
- Keyboard shortcut hints
- "Start your first session" CTA

#### 3.6 Empty States
- No tasks: Show illustration + "Add your first task" CTA
- No completed sessions: "Start focusing to see your stats"
- Empty quote: Show default quote

---

### Phase 4: Desktop App Enhancements

#### 4.1 System Tray Integration
- Show timer in system tray (Windows)
- Minimize to tray
- Tray menu with quick actions (start/pause, reset, skip)

#### 4.2 Global Keyboard Shortcuts
- `Ctrl+Shift+P` - Start/pause timer (global, works when app is in background)
- `Ctrl+Shift+S` - Skip session
- `Ctrl+Shift+R` - Reset timer

#### 4.3 Auto-Update
- Electron auto-updater for new versions
- Update notification in-app

#### 4.4 Native Notifications
- Windows toast notifications
- Custom notification sound
- Notification actions (Start next session, Dismiss)

---

## Recommended Implementation Order

1. **Fix modal clipping** (Phase 1.1) — Critical, affects usability
2. **Unclutter middle** (Phase 1.2) — High, improves focus
3. **Task-to-timer integration** (Phase 1.4) — High, core feature
4. **Ambient sounds** (Phase 1.5) — Medium, nice-to-have
5. **Spring-based animations** (Phase 2.1) — Medium, polish
6. **Typography refinement** (Phase 2.3) — Medium, polish
7. **Color system** (Phase 2.4) — Medium, maintainability
8. **Responsive layout** (Phase 3.4) — Low, future-proofing
9. **Focus stats** (Phase 3.1) — Low, nice-to-have
10. **Onboarding** (Phase 3.5) — Low, polish

---

## Quick Design Tips (from skills)

1. **Restraint is two-sided**: Remove decoration, not motion. This is a utility app — motion should be near-invisible (≤300ms springs).

2. **One accent color**: Crimson is the accent. Everything derives from it. Don't add a second accent.

3. **Type + space over chrome**: Hierarchy comes from font scale and whitespace, not boxes/borders/glow. The modal tabs could be smaller.

4. **Glass is chrome only**: Only the settings button and modal dialog use glass. Content cards are solid.

5. **Show the real product**: The timer ring and clock are the hero. Nothing abstract replaces them.

6. **Accessibility**: All elements need 44pt+ touch targets, ARIA labels, and `prefers-reduced-motion` support. The modal needs `role="dialog"` and focus trapping.

7. **Flocus inspiration**: Light background, clean typography, tasks on right, ambient sounds, beautiful themes. Our app is dark by default — consider a light/dark toggle.

8. **Avoid AI-slop**: No purple gradients, no glows, no ALL CAPS labels, no "New ✨" badges. Our app already avoids most of these.

9. **Motion that answers action**: Only animate on user action (click, hover, open). Don't animate on page load. Our backgrounds are slow ambient motion which is fine.

10. **Empty states matter**: "No tasks yet" should have a CTA and illustration, not just text.

---

## Questions for You

Before I start editing, please confirm:

1. **Dark or light theme?** Current is dark. Flocus defaults to light. Should I add a light/dark toggle?
2. **Priority order?** Should I start with Phase 1 (core fixes) or focus on a specific area?
3. **Ambient sounds?** Should I add ambient sounds (rain, forest, cafe) that play during focus sessions?
4. **Task-to-timer integration?** Should selecting a task link it to the current Pomodoro session?
5. **Focus stats?** Should I add a stats dashboard showing daily/weekly focus time?
6. **Custom themes?** Should users be able to paste a YouTube URL for a custom background (like Flocus)?

---

*This plan was generated using: apple-design-ui, prompt-motion-ui, frontend-design, ui-ux-pro-max, ui-styling, design-system skills + online research of top Pomodoro apps.*