# Apple Design — Compiled UI Skill

> A single, self-contained UI/UX design skill synthesized from the **Apple Design family** (9 skills) at [`s1gmamale1/apple-design-skills`](https://github.com/s1gmamale1/apple-design-skills/tree/main/skills): `apple-design` (hub), `apple-design-backend`, `apple-design-foundations`, `apple-design-interaction`, `apple-design-materials`, `apple-design-motion`, `apple-design-os`, `apple-design-tactics`, and `apple-design-web`. Plus the key reference files: `restraint-and-antislop`, `scrollytelling-techniques`, `motion-animation`, `materials-liquid-glass`, `layout-grid-spacing`, and `living-glass-backdrop`.

Use this when designing, building, restyling, or critiquing any interface to make it feel **Apple-grade** — premium, Cupertino-quality, deferent to content, and built on Human Interface Guidelines principles (clarity, deference, depth) and the 2025 **Liquid Glass** design language.

---

## Table of Contents

1. [When to use](#when-to-use)
2. [Universal Apple rules](#universal-apple-rules)
3. [Restraint & anti-slop (read before effects)](#restraint--anti-slop)
4. [Surface axis — motion budget by surface type](#surface-axis)
5. [Foundations — color, typography, layout](#foundations)
6. [Materials — glass, Liquid Glass, icons](#materials)
7. [Motion — springs, gestures, haptics](#motion)
8. [Interaction logic — navigation, state, input](#interaction-logic)
9. [OS surfaces & components](#os-surfaces)
10. [Tactics — accessibility + marketing](#tactics)
11. [Web — apple.com language, scrollytelling, engineering](#web)
12. [Delivery & backend (observed + inferred)](#delivery-backend)
13. [Copy-paste recipes](#recipes)
14. [Source & confidence](#source)

---

## When to use

- "Make it feel Apple / premium / Cupertino-quality."
- You need **Apple's design philosophy** (HIG: clarity, deference, depth).
- You want the **2025 Liquid Glass** design language (iOS 26 / macOS Tahoe / visionOS).
- You're choosing color, typography, layout, motion, interaction, or components.
- You need to decide **which sub-skill applies** — start here, then route.

**Routable sub-concerns** (each section below maps to the original skill):

| Need | Section |
|------|---------|
| Layout/grid/spacing/typography/color | [Foundations](#foundations) |
| Interaction logic — navigation, states, input, focus | [Interaction logic](#interaction-logic) |
| Animation/springs/timing/choreography/gestures/haptics | [Motion](#motion) |
| iOS/iPadOS/macOS/visionOS/watchOS surfaces & components | [OS surfaces](#os-surfaces) |
| Glass/vibrancy/Liquid Glass, app icons, SF Symbols | [Materials](#materials) |
| apple.com marketing pages, scrollytelling, front-end engineering | [Web](#web) |
| CDN/image/video delivery + inferred backend architecture | [Delivery & backend](#delivery-backend) |
| Accessibility (WCAG 2.2 AA) + marketing/brand/persuasion | [Tactics](#tactics) |
| Philosophy, restraint, cross-cutting rules | [Universal rules](#universal-apple-rules) |

---

## Universal Apple rules (apply everywhere)

Apple's whole system rests on three HIG themes:

- **Clarity** — legibility at every size, precise icons, deference of decoration to function.
- **Deference** — fluid motion and crisp, mostly-translucent UI that lets **content lead**; chrome recedes.
- **Depth** — distinct layers and realistic motion convey hierarchy and a sense of place.

**Light is the default; dark is the exception.** Do **not** default to a dark hero. Dark sections are deliberate, occasional moments (a product film, one dramatic feature), not the page's baseline.

**Show the real product.** Always. A real screenshot inside a real device frame. Placeholder rectangles, abstract SVG "UI diagrams," and lorem blocks are a failure, not a stand-in.

**One accent color**, lots of neutral + whitespace. **Type + space** carry hierarchy — not boxes, borders, or glow.

**Glass = chrome only** (nav / sheets / sidebars), not every card.

**Motion is spring-based, interruptible, and respects `prefers-reduced-motion`.**

**Minimum 44pt touch target**; layouts must **reflow** for Dynamic Type, never truncate.

**Materials must degrade gracefully** under Reduce Transparency / Increase Contrast.

**Restraint is two-sided.** For every effect ask: *"Remove it — does the design lose meaning, or just decoration?"* If decoration, **remove it.** But restraint cuts gratuitous **decoration**, not necessary **motion** — a flagship page with only static fades is a dead template.

---

## Restraint & anti-slop (read before reaching for effects)

Apple's identity is **deference** — it *withholds* far more than it applies. Most "make it Apple" failures are **too many effects**, not too few.

### Apple's real marketing defaults

| # | Rule | Source |
|---|------|--------|
| 1 | Light is the default; dark is the exception | [observed — apple.com] |
| 2 | Show the real product; never placeholders | [documented HIG + observed] |
| 3 | One accent, lots of neutral | [observed] |
| 4 | Whitespace is the feature — big empty space is confidence | [documented HIG] |
| 5 | Type does the work, not chrome | [observed] |

### AI-slop traps (each is a real failure mode)

| Trap | Why it's wrong | Do instead |
|------|---------------|------------|
| Dark-by-default hero | Apple defaults light; dark-everywhere = generic dark-SaaS | Light hero; reserve dark for ≤1 purposeful section |
| Glass on everything | Apple uses glass on *chrome* (nav/sheets/sidebars), not every card | Glass for floating chrome; **solid/quiet** surfaces for content cards |
| Gradient text on every heading | Apple uses it on *one* accent phrase, rarely | At most one accent word, one place — or none |
| Bento because you can | Bento is for a *feature highlights* moment, not the whole page | Use bento once, where it earns it |
| Placeholder abstractions | Apple never ships "abstract UI" | Real product in a real device frame |
| Effect-stacking (glass + gradient + blur + shadow + spring) | Reads busy/synthetic | Pick the *one* effect the moment needs |
| Over-saturation / glow | Apple is restrained, cool, calm | Mute it; lower opacity; remove the glow |

### The restraint pass (run before declaring "Apple-grade")

- [ ] Is the page **light by default**, with dark only where it's purposeful?
- [ ] Is a **real product** shown (device frame / real screenshot), not a placeholder?
- [ ] Is there **exactly one** accent color doing the pointing?
- [ ] Could a **plain solid card** replace this glass card with no loss? (then do it)
- [ ] Is gradient-text used **0–1 times**, not on every heading?
- [ ] Does **type + whitespace** carry the hierarchy (not boxes/borders/glow)?
- [ ] Have I **removed** at least one effect since the first draft?

### Under-animation (the dead template)

Restraint cuts gratuitous decoration — it does **not** mean "no motion." A flagship/marketing/product page with only static one-shot fades, no continuous scroll-linked motion, and no pinned or scrubbed scenes is **also an Apple failure.** It reads as a dead template.

**Surface axis — opposite motion budgets:**

| Surface | Motion budget | Right call |
|---------|--------------|------------|
| **Utility** — app screen, dashboard, settings, form, content card | **Restrained, near-invisible.** Springs ≤300ms. No scroll-jacking. Ambient/cinematic OFF. State transitions only. | Motion should accelerate the task, not comment on it. |
| **Flagship marketing / product** — hero, landing page, feature showcase | **Motion IS the substance.** Commit to cinematic scroll choreography: scrubbed/pinned scenes, continuous damped scroll-progress, theme morph, ambient float. Under-animating here is the failure. | The page must feel alive — static = dead = unconvincing. |

**One line:** same restraint discipline, opposite motion budget — pick the budget from the surface type.

---

## Foundations — color, typography, layout

### Color
- **Semantic over literal.** Use system roles (`label`, `systemBackground`, `systemBlue`); never hardcode hex that can't adapt to light/dark/contrast.
- **Dark mode = dimming, not inverting.** Elevated surfaces get *lighter*, not pure-inverted. True-black only where it serves OLED.
- **One accent color.** Apple gray palette: `#f5f5f7` (light section bg), `#ffffff` (card bg), `#1d1d1f` (primary text), `#6e6e73` (secondary text).
- **P3 wide gamut** supported on modern displays; semantic colors adapt.

### Typography
- **System font stack:** `font-family: -apple-system, system-ui, "SF Pro", ...` — SF Pro is **not** licensed as an arbitrary webfont; rely on the stack.
- **Optical sizes:** SF Text < ~20pt, SF Display ≥ ~20pt. New York serif for display/marketing headlines.
- **Tracking:** Don't over-track body text; tight-tracked headlines are fine.
- **Dynamic Type must reflow.** Layouts grow/wrap; never truncate body text at large sizes.

### Layout & spacing — 8pt grid

Base unit: **8pt**. Half-step: **4pt** (icon-to-label, tight gaps).

| Token | Value | Use |
|-------|-------|-----|
| `space-2xs` | 2pt | Hairline / optical only |
| `space-xs` | 4pt | Icon-to-label, badge offsets |
| `space-sm` | 8pt | Between related inline elements |
| `space-md` | 12pt | Between sibling list rows (soft grid) |
| `space-base` | 16pt | Standard side margin (phones); form field gaps |
| `space-lg` | 24pt | Between content blocks; card interior padding |
| `space-xl` | 32pt | Between major sections (phone) |
| `space-2xl` | 40pt | Component padding on large components |
| `space-3xl` | 48pt | Section spacing on iPad |
| `space-4xl` | 64pt | Hero/banner breathing room |

**Minimum tap target: 44×44pt.** Primary actions in the thumb zone (bottom on iPhone).

**iOS layout margins:** phone portrait 16pt side; iPad 20pt+ side; readable content guide ~672pt max (iPad landscape), ~87 chars per line.

**Component heights:** nav bar 44pt, tab bar 49pt, standard list cell 44pt, subtitle cell 60pt, search bar 36pt, toolbar 44pt, SF Symbol inline icon 22pt.

### Responsive / adaptive logic
- **Size classes drive layout, not device names:** `.compact` vs `.regular` horizontal size class. iPhone portrait = compact regular; iPad full-screen = regular regular.
- **HStack → VStack reflow:** HStack when `.regular`, VStack when compact.
- **Sidebar vs. tab bar convergence:** Build the sidebar first; let it morph into a tab bar when width collapses. Same navigation model at different widths.
- **Container queries > media queries** for components that live in multiple contexts. Media queries for page-level structure.
- **`clamp()` for fluid type/space** when there's a large min↔max range with no intermediate meaning. Keep bounds in `rem` so user font-size preferences still scale.
- **Content-driven breakpoints:** break where the content needs it (readable measure ~66–75ch), not where a device exists.
- **Never leave a column empty** — collapse to fewer columns if one would be empty.
- **Readable measure limiter:** `.prose { max-width: 66ch; }`

---

## Materials — glass, Liquid Glass, icons

### Glass principles
- **Glass is a layer, not a paint.** It samples + blurs what's behind, then tints with vibrant labels. Web approximation: `backdrop-filter: blur() saturate()` + translucent fill + light top-edge highlight.
- **Never stack glass on glass**, and never put low-contrast text on a busy translucent area. Always provide a `prefers-reduced-transparency` opaque fallback.
- **Glass = chrome only** (nav / sheets / sidebars), not every card.

### Liquid Glass (iOS/iPadOS/macOS/watchOS 26+, WWDC25)
Three conceptual render layers: **lensing/refraction** (bends background pixels), **specular/highlight** (geometry-responsive highlight), **shadow/grounding** (opacity adapts to underlying content).

| Variant | Behavior | Use |
|---------|----------|-----|
| `.regular` (default) | All adaptive behaviors active; auto light↔dark flip for small elements | Navigation: toolbars, tab bars, sidebars, buttons, menus |
| `.clear` | Permanently more transparent; no adaptive behavior; needs dimming layer | Only over media-rich content with dimming overlay + bold bright foreground |
| `.identity` | Disables glass | Conditional toggling / accessibility fallback |

**Interaction:** Touch illuminates from within — glow starts at fingertip and spreads. `.glassEffect(.regular.interactive())`. Elements can **morph fluidly** between states using `glassEffectID(_:in:)` + `@Namespace`.

**Accessibility:** Reduce Transparency → frostier/more opaque; Increase Contrast → black/white with contrasting border ring; Reduce Motion → disabled spring properties.

**CSS best-effort glass** (static frosted approximation):
```css
.glass-panel {
  position: relative;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(20px) saturate(180%) brightness(105%);
  -webkit-backdrop-filter: blur(20px) saturate(180%) brightness(105%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
  overflow: hidden;
}
@media (prefers-reduced-transparency: reduce) {
  .glass-panel {
    background: rgba(245, 245, 247, 0.96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-color: rgba(0,0,0,0.12);
  }
}
```

**Living backdrop required:** `backdrop-filter` needs colorful, spatially varied pixels behind it (wallpaper, photography, or a living color-mesh gradient). A solid white page makes glass collapse to a flat wash.

### Icons
- **Squircle is G2 continuous-curvature** (reverse-engineered Bézier), not `border-radius`. Use `clip-path`/SVG, or `corner-shape: squircle` (Chrome 139+, not yet Safari/Firefox).
- **SF Symbols** match font weight + optical size; pick one rendering mode (monochrome / hierarchical / palette / multicolor) deliberately. Don't multicolor everything.

---

## Motion — springs, gestures, haptics

### Springs over fixed easing
Apple animates with **damped harmonic oscillator physics** (mass/stiffness/damping), parameterized as `response` + `dampingFraction` (or `duration` + `bounce`).

**Key properties:**
- **Instant launch:** springs start at peak velocity (no slow ease-in lag).
- **Interruptible + velocity handoff:** respond on `pointerdown`; release velocity feeds the spring; mid-flight redirection allowed.
- **Animate `transform`/`opacity` only** (GPU-composited); never `width`/`top`/`height`.
- **Honor `prefers-reduced-motion`**: provide a fade/instant alternative.

### SwiftUI spring presets
| Preset | Character | Use |
|--------|-----------|-----|
| `.smooth` | No bounce (critically damped) | Modal dismiss, background transitions |
| `.snappy` | Small bounce (~15%) | Button press, chip select, quick toggles |
| `.bouncy` | Medium bounce (~30%+) | App icon press, notification banner |

**Examples:**
```swift
.withAnimation(.spring(response: 0.4, dampingFraction: 0.8))
.withAnimation(.spring(response: 0.25, dampingFraction: 0.85))  // micro-interaction
.interpolatingSpring(stiffness: 200, damping: 20, initialVelocity: v)
```

### CSS `linear()` spring approximation
```css
:root {
  --spring-smooth-easing: linear(
    0, 0.0037, 0.0142, 0.031, 0.0534, 0.0804, 0.1108, 0.1438, 0.1784, 0.2135,
    0.2484, 0.3145, 0.3746, 0.4283, 0.4755, 0.5562, 0.6215, 0.6726, 0.7112,
    0.7735, 0.8196, 0.854, 0.8793, 0.9185, 0.9458, 0.9647, 0.9779, 0.9921, 1
  );
  --spring-smooth-duration: 500ms;
}
@media (prefers-reduced-motion: reduce) {
  :root { --spring-smooth-duration: 0ms; }
}
```

### Gesture velocity handoff (JS)
```javascript
class Spring {
  constructor({ stiffness=200, damping=20, mass=1, initialValue=0 } = {}) {
    this.k=stiffness; this.c=damping; this.m=mass;
    this.value=initialValue; this.target=initialValue; this.velocity=0;
  }
  setVelocity(v){ this.velocity=v; }
  tick(dt=1/60){
    const force=-this.k*(this.value-this.target);
    const damping=-this.c*this.velocity;
    const accel=(force+damping)/this.m;
    this.velocity+=accel*dt; this.value+=this.velocity*dt;
    return this.value;
  }
  get settled(){ return Math.abs(this.velocity)<0.01 && Math.abs(this.value-this.target)<0.01; }
}
```

### Scroll-driven motion (the aliveness primitive)
Bind motion to **continuous scroll progress** (0→1), damped via `mapRange` + rAF lerp (`α ≈ 0.08–0.12`). Smooth the *read*, never hijack scroll. **Never scroll-jack** (no `preventDefault` on wheel/touchmove, no fake-scroll `overflow:hidden`, no page-level vertical snap).

---

## Interaction logic — navigation, state, input

### Navigation model (match to information hierarchy)
| Pattern | Use |
|---------|-----|
| **Push** | Drilling into a hierarchy |
| **Sheet/modal** | Self-contained sub-task that returns |
| **Tab** | Peer top-level sections |
| **Split view** | Master/detail on wide screens |
| **Full-screen cover** | Immersive/focused mode |

Back must be obvious & predictable; **preserve and restore state** on return.

### State & feedback behavior
- **Respond in <100 ms, always.** Instant visual feedback on touch.
- **Optimistic UI** for likely-success actions; spinners only for >1s; **skeletons** for content-shaped waits. Never block input behind a spinner.
- **Design every state:** loading, empty (with path forward), error (with recovery), disabled (with reason), success.
- **Targets ≥44 pt**, primary actions in thumb zone, visible focus, full keyboard operability; every gesture has a visible fallback.

### Scroll as input (decision tree)
- **Helps** on flagship/marketing/product/onboarding surfaces — commit fully or skip entirely.
- **Hurts** on utility/productivity surfaces (lists, dashboards, forms, settings) — keep scroll plain and fast.
- **Absolute: never scroll-jack.**

---

## OS surfaces & components

- **Anchor primary controls in reach** — bottom on iPhone (tab bar 49pt + safe area).
- **Sheets use detents** (medium/large/custom) with a grabber.
- **Match platform input model:** touch (44pt) on iOS; pointer + menu bar on macOS; gaze (60pt) + eye/pinch on visionOS; Digital Crown + glanceability on watchOS.
- **Button hierarchy:** `borderedProminent` → `bordered` → `borderless`. List styles: plain / grouped / insetGrouped. Always design **empty states**.
- **iOS 26 / macOS Tahoe:** controls restyled in Liquid Glass (floating, translucent).

---

## Tactics — accessibility + marketing

### Accessibility (WCAG 2.2 AA)
- **Accessibility is the default, not a retrofit.** Many Apple rules exist *because of* a11y (Dynamic Type → reflow; Reduce Transparency → opaque fallbacks; Reduce Motion → fade alternatives).
- **POUR / WCAG 2.2 AA:** semantic HTML + ARIA, accessible names, never color alone, 4.5:1 text contrast, visible `:focus-visible` ring, respect `prefers-reduced-motion`/`prefers-contrast`/`prefers-reduced-transparency`.
- **44pt targets**; layouts reflow for Dynamic Type.

### Marketing & brand
- **Feeling before feature, then features as proof.** One idea per section; restraint and whitespace signal premium.
- **Product as hero** on seamless white/black with soft shadow + subtle glow; quiet, monochrome brand.
- **Copy voice:** short, confident, benefit-led, Title Case headlines, concrete numbers ("The most powerful iPhone ever."). Pricing leads premium → anchors → monthly framing.

---

## Web — apple.com language, scrollytelling, engineering

### Page formula
**Slim sticky translucent nav** (~44–48px, blur, chapter-adaptive color) → **big centered product hero** (name + one tagline + "Learn more ›"/"Buy ›") → **alternating full-bleed feature sections, one idea each** → **bento feature grid** → tech specs → **fat multi-column footer.**

**Light-first.** apple.com is predominantly light (`#f5f5f7`/white).

### Interaction inventory (flagship pages — commit to motion)

| Rank | Behavior | Tier |
|------|----------|------|
| 1 | Continuous damped scroll-progress transforms (opacity/translateY/scale/blur/clip-path bound to lerped shadow scroll) | CORE |
| 2 | Sticky-pinned choreographed scenes | CORE |
| 3 | Scroll-scrubbed hero (image-sequence flipbook or `video.currentTime`) | CORE |
| 4 | Cross-section theme/background morph (light↔dark) | CORE |
| 5 | Ambient/idle float (6–12px, 4–7s, alternate) | CORE |
| 6 | Clip-path text wipe | optional flourish |
| 7 | Parallax depth layering | optional flourish |
| 8 | Horizontal snap gallery | optional flourish |
| 9 | Pointer-reactive motion (desktop only) | optional flourish |

### Apple-specifics absent on apple.com (absence is also Apple-grade)
No `scroll-behavior: smooth` on `<html>`, no vertical page-level `scroll-snap`, no `perspective`/`rotateX` on the scroll axis, no scroll-jacking, no blanket `will-change`, no spring/overshoot on scroll reveals.

### Engineering
apple.com is **progressive-enhanced HTML/CSS/vanilla JS** (not a heavy SPA). Responsive `<picture>`/`srcset`, `loading="lazy"`, content-hashed immutable assets, deferred JS.

---

## Delivery & backend (observed + inferred)

> ⚠️ **Reverse-engineered, not official.** Delivery is mostly `[observed]`; backend architecture is largely `[inferred]`/`[speculative]`.

- **Delivery:** multi-CDN edge; image-transform service (mzstatic `{W}x{H}{modifier}-{quality}.{fmt}`); `<picture>`/`srcset` per device; content-hashed immutable assets with long `Cache-Control`; HLS multi-bitrate video; HTTP/2-3, Brotli.
- **Public services:** CloudKit, APNs (HTTP/2 + JWT), Sign in with Apple (OIDC), StoreKit 2 (JWS receipts), Private Cloud Compute (stateless, verifiable, OHTTP-routed).
- **Privacy-by-architecture:** on-device first, end-to-end encryption, server never trusts client claims, data residency.

---

## Copy-paste recipes

### Recipe A — Canvas image-sequence scroll scrubber
Preload frames; map `scrollTop/maxScrollTop` → frame index; `requestAnimationFrame`-throttled; `passive: true` scroll listener; hide under `prefers-reduced-motion`.

### Recipe B — Sticky pinned scene
`.chapter { height: 400vh; position: relative; } .chapter__scene { position: sticky; top: 0; height: 100vh; }` Animate children via scroll progress sub-thresholds.

### Recipe C — IntersectionObserver reveal (+ word stagger)
`IO { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }` adds `.is-visible`; word spans stagger `i * 45ms`.

### Recipe D — CSS scroll-driven animation
`@supports (animation-timeline: scroll())` for progress bar; `@supports (animation-timeline: view())` for element reveals; gate with `@media not (prefers-reduced-motion: reduce)`.

### Recipe E — Cross-section theme/background morph
IO center-line band (`rootMargin: '-50% 0 -50% 0%'`, `threshold: 0`) sets `data-theme`; CSS transition 400ms morphs bg/text. **Do NOT use `threshold: 0.5`** — pinned chapters taller than viewport never reach 50% visible.

### Recipe F — Sticky-stacked cards (chaptered pinning)
Cards with staggered `position: sticky; top: calc(16px + var(--i)*14px)`; JS recedes buried cards via `scale`/`opacity` in read-then-write rAF batch. **iOS Safari caveat:** no `overflow: hidden/clip/auto/scroll` on any ancestor of sticky cards.

### Recipe G — Living glass backdrop
Multi-layer radial-gradient color mesh (fixed, z-index 0) behind glass panels. Slow keyframe drift (`transform: translate`, ≥30s). Freeze under `prefers-reduced-motion`. Do NOT animate `background-position` (CPU re-composite).

### Recipe H — Materialize entry (new content appearing)
Scale from 0.92 + opacity 0 → 1, bouncy spring, brief glow that settles. Reduced motion: opacity crossfade only.

### Recipe I — Progress connector / journey transition
Connector fill via `transform: scaleY(0→1)` or SVG `stroke-dashoffset`; connector fills first (~500ms), destination node materializes ~150ms after.

---

## Source & confidence

Compiled from [`s1gmamale1/apple-design-skills`](https://github.com/s1gmamale1/apple-design-skills/tree/main/skills) — 9 skills covering the full Apple design system, plus key reference files on restraint, scrollytelling, motion, materials, layout, and Liquid Glass backends.

**Confidence:** High on philosophy, restraint, foundations, interaction logic, materials concepts, motion principles, accessibility, and web engineering. Moderate-to-high on specific pixel values (blur radii, spring constants, grid gaps) which are inferred from community reverse-engineering and observed page structure. Moderate on Liquid Glass internal rendering details (refraction algorithm, GPU pipeline) which Apple has not fully disclosed.

**Important:** This skill synthesizes public observations and documented HIG principles. It does not reproduce proprietary Apple source code. Where Apple's backend architecture is discussed, it is reverse-engineered inference — treat as analysis, never ground truth.
