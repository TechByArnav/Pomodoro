# Focus Sanctuary — Design & Architecture Reference

> Crimson spark on gunmetal — a single hot-red ember cutting through near-total darkness, with every surface stripped of color until the moment something matters.

**Theme:** dark  
**Default Accent:** Crimson (`#dc143c`)  
**Base Surface:** Void Black (`#0a0a0a` / `#111111`)

---

## 1. Overview & Core Philosophy

This application is an aesthetic, high-craft digital focus sanctuary inspired by **Flocus**, **ThreeTools**, and classical cognitive psychology. It unites a bold, distraction-free matte-black canvas with real-time interactive fluid/gas dynamics, personalized greetings, and multi-framework productivity models.

The entire interface is built with zero external dependencies, making it 100% compatible with GitHub Pages out of the box.

---

## 2. Productivity Frameworks

The system supports 6 proven productivity methodologies. **Classic Pomodoro remains the default**, with instant switching and complete duration customization for every method.

### 1. Classic Pomodoro (Default)
- **Rhythm:** 25 min focus / 5 min short break / 15 min long break / 4 cycles
- **Philosophy:** Developed by Francesco Cirillo in the late 1980s. Breaks work into bite-sized sprints where the brain feels no resistance to starting, because relief is always just minutes away.
- **Customizable:** Work length, short break, long break, and cycle count.

### 2. Super-Pomodoro (The 3 Stages)
Instead of repeating the exact same 25-minute loop all day, your schedule matches your brain's natural cognitive peaks and valleys:
- **Phase 1: The Ignition Block (Beating Procrastination)**
  - *Timer:* 20 minutes work / 5 minutes break
  - *Goal:* Overcome the initial friction barrier. Low pressure, do the easiest subtask first to build kinetic momentum.
- **Phase 2: The Deep Flow Block (The Ultradian Surge)**
  - *Timer:* **Stopwatch mode (counting UP)** with a target cap of 60 to 90 minutes.
  - *Goal:* Ride the momentum into deep, uninterrupted flow state.
  - *The Flowtime Break Rule (Proportional Rest):* Automatically tracks elapsed time and calculates rest on a **5:1 ratio** (1 minute of break earned for every 5 minutes worked). If interrupted early, you still get proportional recovery.
- **Phase 3: The Animedoro Reward Block (The Recharge)**
  - *Timer:* 50 minutes work / 20–25 minutes break
  - *Goal:* Finish strong without burning out, rewarded with a high-value guilt-free break (one episode of an anime/show or a walk).
- **The Reset Trigger:** After completing Phase 3, take a 30-minute restorative long break, then loop back to Phase 1.

### 3. The 52 / 17 Method (The Sprint Rule)
- **Rhythm:** 52 minutes intense focus / 17 minutes total disconnect break
- **Origin:** Discovered by DeskTime in 2014 by analyzing the top 10% most productive knowledge workers. High performers work like 100m sprinters: complete focus followed by stepping completely away from screens.

### 4. Ultradian Rhythm (90 / 20 Method)
- **Rhythm:** 90 minutes deep work / 20 minutes biological rest
- **Origin:** Based on Dr. Nathaniel Kleitman’s Basic Rest-Activity Cycle (BRAC). Human attention cycles in roughly 90-minute waves before cognitive neurotransmitters deplete, demanding 20 minutes of recovery.

### 5. Animedoro
- **Rhythm:** 50 minutes deep focus / 20 minutes entertainment reward
- **Origin:** Popularized by creative and student communities. The 20-minute break matches the exact runtime of one anime episode or short sitcom without commercials.

### 6. DeskTime 112 / 26 Method (The Deep Sprint)
- **Rhythm:** 112 minutes immersion / 26 minutes recovery walk
- **Origin:** DeskTime's updated 2021 post-pandemic study revealing that remote workers thrive on ~1.5x longer immersion blocks for complex engineering, writing, and analytical work.

---

## 3. Visual Background Simulations

The background runs via a modular canvas engine (`fluid.js`) with 4 selectable atmospheres:

| Mode | Technology | Description |
|------|------------|-------------|
| **Fluid Dynamics (Smoke)** | WebGL / Navier-Stokes | Real-time GPU fluid equations with advection, Jacobi pressure solve, curl, vorticity confinement, ambient swirls, and mouse velocity tracking. *(Default)* |
| **Harmonic Waves** | Canvas 2D / Trigonometric | Multi-layered sinusoidal laminar waves with cursor ripple interference. |
| **Cosmic Embers** | Particle Physics | Floating luminous embers and stardust drifting upward in negative space with gentle gravitational cursor pull. |
| **Static Void (Off)** | Pure `#0a0a0a` | Complete blackout for distraction-free work and zero CPU/GPU battery consumption. |

---

## 4. Name Directory & Philosophical Heritage

Users can personalize the application's header logo and title from a curated roster of classical Sanskrit, Greek, and Roman names representing time, focus, and mindfulness:

| Name | Heritage | Meaning & Etymology |
|------|----------|---------------------|
| **POMODORO** | Italian | *(Default)* The classic icon of intentional timeboxing, named after the tomato timer. |
| **KAIROS** | Greek (`καιρός`) | The supreme, opportune moment. Ancient Greeks distinguished between *Chronos* (sequential seconds) and *Kairos* (the qualitative, decisive moment of flow). |
| **DHYĀNA** | Sanskrit (`ध्यान`) | Profound meditative absorption. An unbroken, continuous stream of awareness centered solely on the object of focus without mental wandering. |
| **EKĀGRA** | Sanskrit (`एकाग्र`) | Single-pointed concentration. The state of absolute mental stillness where secondary distractions dissolve into a single focal point. |
| **ATARAXIA** | Greek (`ἀταραξία`) | Untroubled, lucid peace of mind. A state of unflappable cognitive serenity amidst surrounding chaos. |
| **TEMPUS** | Roman / Latin | Time in its purest rhythmic sense: the disciplined, purposeful cadence of hours and seasons. |
| **AION** | Greek (`Αἰών`) | Timeless eternity and boundless flow. The perception of time standing still when deeply immersed in craft. |
| **SAMĀDHI** | Sanskrit (`समाधि`) | The highest pinnacle of unified consciousness, where the worker, the tool, and the work become one seamless entity. |

---

## 5. Design Tokens

### Color Tokens
```css
:root {
  /* Dynamic Primary Accent (Default: Crimson) */
  --crimson:        #dc143c;
  --crimson-glow:   rgba(220, 20, 60, 0.12);
  --crimson-soft:   rgba(220, 20, 60, 0.32);

  /* Monochrome Void Palette */
  --void:           #0a0a0a;
  --obsidian:       #141414;
  --obsidian-card:  #181818;
  --charcoal:       #222222;
  --graphite:       #303030;
  --steel:          #555555;
  --ash:            #888888;
  --silver:         #bbbbbb;
  --pure-white:     #ffffff;
}
```

### Preset Accents
- **Crimson Ember:** `#dc143c` (Default)
- **Molten Orange:** `#ff4300` (Three style)
- **Amethyst Violet:** `#8b5cf6`
- **Electric Cyan:** `#06b6d4`
- **Emerald Neon:** `#10b981`
- **Rose Quartz:** `#f43f5e`
- **Solar Gold:** `#eab308`
- **+ Custom Hex Color Picker**

---

## 6. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| <kbd>Space</kbd> | Start / Pause active timer or stopwatch |
| <kbd>R</kbd> | Reset current session |
| <kbd>K</kbd> | Skip to next session or break |
| <kbd>S</kbd> | Open / Close Settings modal |
| <kbd>Esc</kbd> | Dismiss Settings modal |

---

## 7. GitHub Pages Deployment

The project is pure client-side HTML, CSS, and vanilla JavaScript:
1. Initialize repository with `git init` (or add via GitHub Desktop).
2. Commit and push to GitHub.
3. Enable **GitHub Pages** from repository **Settings > Pages > Branch: `main` / `root`**.
4. The site deploys instantly with full offline and mobile touch compatibility.
