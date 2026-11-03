# Prompt Motion UI

> A UI motion design skill compiled from **105 Product UI demos** on [Prompt Motion](https://prompt-motion.com/?tag=product-ui) — a collection of motion videos made with Claude Opus 5.5, with the prompts and skills behind them.

This skill teaches you how to design and build distinctive, non-templated UI motion films and interactive demos, following the patterns, principles, and technical approaches used across every Prompt Motion entry.

---

## Two Entry Types

Prompt Motion demos come in two flavors. Know which one you're working with before you start.

### 1. Prompt entries
A detailed motion-design prompt with structured sections. Each prompt tells an AI (or a human) exactly what to build, how it should look, how it moves, and how to build it.

**Sections found in structured prompts:**

| Section | Purpose |
|---------|---------|
| **Inputs** | What to ask the user before writing code (e.g. UI states, brand name, accent color, song BPM, photos, copy). Never start building without these. |
| **Direction** | Visual and aesthetic guidelines: canvas color, component style, typography, camera behavior, cursor interaction, and a **Banned** list of templated clichés. |
| **Structure** | Beat-by-beat timeline of what happens, synced to music or a clock. One event per major beat. |
| **Build** | Technical implementation steps: file format, resolution, frame rate, timing model (closed-form `seek(t)`), springs, drag handling, render pipeline. |
| **Gotchas** | Common pitfalls that break the illusion: teleporting objects, blurry text under camera scale, mismatched first/last frames for loops, overlapping text swaps. |
| **Start** | The first step: ask for inputs, show a beat map or stills, then build. |

**Example prompt skeleton** (from the Shape Morphing demo):

```
<inputs>
Ask me for: 8 to 12 UI states I want the shape to become (e.g. button, loader, player, slider, toggle, tabs, chart, command palette, toast), pure black and white or one accent color, and a royalty-free song around 120 BPM.
</inputs>

<direction>
Dribbble-level UI motion. One shape, never cut: every state is the same element morphing its size, radius and color while its content swaps with a short blur. A cursor drives every change with real clicks and drags. Light warm-gray canvas, black and white components, one clean UI font (Geist). Springs everywhere, a tiny overshoot at most. The camera zooms so each state fills the frame. The last frame is the first frame, so it loops.
Banned: bouncy easing, particle bursts, glows, gradients on UI chrome, mismatched icon strokes, dead time, anything that looks like a template.
</direction>

<structure>
120 BPM, 7 bars, something happens on every beat.
Button → loader → check → dynamic island → music player → scrub progress bar → volume slider → toggle → liquid tab indicator → chart → ⌘K → type to filter → enter → toast → back to button.
</structure>

<build>
1. One HTML file, square 1440x1440. Every style computed from time inside seek(t): no CSS transitions, no timers, no state between frames.
2. Springs are closed-form step responses.
3. Drags are direct manipulation: while held, value computed from cursor position; on release, springs back.
4. Render with Playwright: 4 subframes per frame, blended with ffmpeg tmix for motion blur at 60fps.
</build>

<gotchas>
Never put will-change on anything the camera scales. Text that swaps inside a morphing container needs its own enter/exit timing. Make the last frame identical to the first.
</gotchas>

<start>
Ask me for the inputs, then show me the state list on the beat grid before you write any code.
</start>
```

### 2. Skill entries
An installable skill package with an `npx` or `/plugin` install command and a repo link. These are reusable tools that coding agents can add to their environment to generate motion UI.

**Example skill entries observed:**

| Demo | What it does | Install command | Stack |
|------|-------------|-----------------|-------|
| TasteSkill dashboard showcase | Design skill giving coding agents art direction, real images, in-browser checks for distinctive websites/dashboards/app screens | `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"` | — |
| HTML app demo skill | Builds a live HTML product demo: Mac-style app window playing your app step by step, one clock, loop/scrub/jump/freeze | `npx skills add MengTo/Skills --skill html-demo` | React |
| Reddit marketing tool launch video | Claude Code skill that learns your design system, interviews you, builds and renders launch/landing video in Remotion | `/plugin marketplace add Rieranthony/product-film-skill /plugin install product-film@product-film-skill` | Remotion |

---

## Core Motion Principles (compiled from all demos)

### 1. One continuous world
Everything exists in a single 2D or 3D space. The camera moves through it — zooming, panning, scaling — rather than cutting between scenes. Nothing fades, blurs, or cuts; objects change shape into the next thing.

### 2. Cursor-driven interaction
A real cursor makes the opening click feel physical. The cursor drives every change with real clicks, drags, and long-presses. The cursor scales with the camera.

### 3. Springs everywhere
Use closed-form spring step responses for all motion. A value that changes target many times is the sum of one spring per change — it stays a pure function of time. Tiny overshoot at most. No bouncy easing.

### 4. Closed-form `seek(t)` timing
Every style is computed from time inside a `seek(t)` function. No CSS transitions, no timers, no state carried between frames. Any frame can be rendered independently.

### 5. Beat-synced structure
Motion happens on a beat grid (typically 120 BPM). Something happens on every beat. Analyze the song for the beat grid and start on a downbeat. Place UI sounds by measured peaks.

### 6. Direct manipulation drags
While the cursor is held, the value is computed from its position. On release it springs back from wherever it was. For tab indicators and toggle knobs, the two edges can ride different springs so the leading edge stretches ahead.

### 7. Loop seamlessly
Make the last frame identical to the first — cursor position, speed, object states, everything included — or the loop stutters.

### 8. No templated looks
**Banned across demos:** bouncy easing, particle bursts, glows, gradients on UI chrome, mismatched icon strokes, dead time, crossfades, blur-ins, brightness "developing", 3D flips, holds longer than 1s, anything that looks like a template, stock footage, disconnected transitions, excessive bouncing, blurry text during camera moves.

---

## Visual Style Patterns

### Canvas & Color
- Light warm-gray or near-black canvas
- Black and white components with **one** accent color (electric blue, crimson, gold)
- Dot grid background for dark themes
- No gradients on UI chrome

### Typography
- One clean UI font (Geist, Archivo, or similar)
- Wide tracking for wordmarks (Archivo wdth 125, weight 800)
- Sharp white text on dark, charcoal controls on light
- Never accent a single word in a headline; never use ALL CAPS labels

### Camera
- Square (1440x1440) or 16:9 (1920x1080) frame
- Camera zooms so each state fills the frame
- Screen-studio style zoom: each moment fills the square
- Log-space zoom for close-ups
- Camera follows the primary moving object (ball, shape, cursor)

### Objects
- **One shape, never cut:** every state is the same element morphing size, radius, color
- Content swaps with a short blur inside morphing containers
- Objects change shape instead of fading/cutting: text rises from a mask line, icons pop from zero on a spring, bars draw across, pages push
- Treat UI elements as solid 3D objects that tilt toward the cursor following physics

---

## Technical Implementation

### File & Render
- One HTML file (or React/Remotion component)
- Square 1440×1440 or 16:9 1920×1080
- 60fps
- Render with Playwright: 4 subframes per frame, blended with ffmpeg `tmix` for motion blur
- Render one still per beat to check pacing before full export

### Timing model
```javascript
// Pure function of time - no state between frames
function seek(t) {
  // Compute all styles from t
  // Springs: closed-form step responses
  // Springs per change: sum of springs for values that change target many times
}
```

### Stacks observed
- HTML + Playwright (most common for prompts)
- React (for skill demos)
- Remotion (for programmatic video)
- JavaScript (general)
- HyperFrames (for showreels)

---

## All 105 Product UI Demos (reference)

Compiled from the Prompt Motion `?tag=product-ui` listing. Each entry links to its prompt or skill.

1. Shape morphing through UI states — @twoclipping — Prompt — Product UI, Charts, Music
2. Photo print app launch film — @twoclipping — Prompt — Product UI, Phone, Photos, Music
3. Landing page 3D scroll — @twoclipping — Prompt
4. Enxovaly baby app promo — @gabrielbuzziv — Prompt
5. Launch video remake comparison — @notdwd — Prompt
6. Travel visa service promo — @thismacapital — Prompt
7. TasteSkill dashboard showcase — @LexnLin — Skill — Product UI, Charts
8. HTML app demo skill — @MengTo — Skill — Product UI
9. Distilbook product video — @ajith_io — Prompt
10. UGC ad generator promo — @twoclipping — Prompt
11. ViralGrow product promo — @samuel_yostt — Prompt
12. Cinetic skill launch film — @LexnLin — Skill — Product UI
13. Dub promo video — @steventey — Prompt
14. AjustaCV Pro pricing promo — @thayto_dev — Prompt
15. Reddit marketing tool launch video — @anthonyriera — Skill — Product UI, Characters
16. White ball UI motion loop — @rossaxbt — Prompt — Product UI, Music
17. Voice agent landing page — @pankajstwt — Prompt
18. SuperX feature release teaser — @robj3d3 — Prompt
19. mdfor.dev product intro video — @HO_BA — Prompt
20. Distilbook motion showreel — @itisRazak — Prompt
21. Frame by Frame launch video — @notdwd — Prompt
22. MotionSites one million visitors — @viktoroddy — Prompt
23. Email tool promo reel — @melvynx — Prompt
24. Ora 2 image model launch film — @rossaxbt — Prompt
25. Jev engineering showreel — @polydao — Prompt
26. Food craving launch film — @ultimaxbt — Prompt
27. Lism CSS 1.0 release video — @ddryo_loos — Prompt
28. Spotify product film — @brainextends — Prompt
29. DistilBook motion explainer — @sudo_kiran — Prompt
30. Pixelup Labs studio showreel — @arjunsh1607 — Prompt
31. Browser automation skill launch — @hqmank — Prompt
32. founder.page launch video — @RatheeJaisal — Prompt
33. Alan agent platform promo — @prasad_pilla — Prompt
34. Sahi trading terminal reveal — @dale_vaz — Prompt — Product UI, Phone, Charts, Particles
35. AI Arena product promo — @ezshine — Prompt
36. Stock analysis app promo — @AIStockSavvy — Prompt
37. Visual guides library launch — @techyoutbe — Prompt
38. Whiteboard skill tutorial — @lemomo_ai — Prompt
39. Tennis game launch video — @deifosv — Prompt
40. Tally product demo — @VisheshBaghell — Prompt
41. Sherwood agentic hedge fund explainer — @imthatcarlos — Prompt
42. Mascot referral program promo — @paulo_kombucha — Prompt
43. DistilBook product explainer — @sudo_kiran — Prompt
44. Morphing UI states loop — @demonugc — Prompt
45. Supademo launch video — @jhylee95 — Prompt
46. Norilu product launch video — @sachaarbonel — Prompt
47. Five scroll-based sections — @ercankeskinx — Prompt — Product UI, Photos
48. Trezio app motion reel — @agonaliu_ — Prompt
49. Taxtello bookkeeping app film — @daniel_haida — Prompt
50. Badge unlock screen animation — @BThreeAgency — Prompt — Product UI, Phone, Particles
51. Product intro synced to music — @BogdanDragomir — Prompt
52. Website analyzer product promo — @en______ra — Prompt
53. Ondefica app motion reel — @jesscaroline7 — Prompt
54. Second brain service promo — @TheViableEdge — Prompt
55. AIsa API key promo — @0xfemyn — Prompt
56. Chunku product promo — @reyzostyle — Prompt
57. Ren app launch video — @macrohou — Prompt
58. Three.js Skyraider aircraft model — @BuildFastWithAI — Prompt
59. Developer portfolio site showreel — @wani_shola — Prompt
60. FundMyCompute platform overview — @JayScambler — Prompt
61. Bold Pilot SEO promo — @utopyaszx — Prompt
62. SaaS launch video — @aschapmann — Prompt
63. Step race app promo — @marklaunches — Prompt
64. Sotto reading app explainer — @1stnoel_ — Prompt
65. Dubz Up motion showreel — @Devius_Maximus — Prompt
66. Muse connector tracker promo — @elliot_garreffa — Prompt
67. Fitters Bible app promo — @Adamdesgns — Prompt
68. Studio website showreel — @andginja — Prompt
69. PicTwin AI app ad — @l3d1c — Prompt
70. Supasito launch video — @wozu_co — Prompt
71. YouTube transcript product ad — @tstfully — Prompt
72. Bento.surf product video — @bizibeast — Prompt
73. Portfolio motion reel — @heyiammallik — Prompt
74. QuickDesign brand promo — @quickdesignio — Prompt
75. Claude self-promo spot — @slvDev — Prompt
76. DistilBook product explainer — @sudo_kiran — Prompt
77. SaaS product launch video — @xelandre__ — Prompt
78. Tented image gen product video — @justincooperman — Prompt
79. Voice agent SaaS launch — @FractaDev — Prompt
80. Matra caption app promo — @gautam_mer1 — Prompt
81. Quetzal social app reel — @miskinho_ — Prompt
82. Parenting app hype video — @francoxavier33 — Prompt
83. Motion designer showreel — @KangarooHere — Prompt
84. org2html product showreel — @kyonax_on_tech — Prompt
85. Gene Spectra promo — @madebyjmayala — Prompt
86. Prompt Motion site promo — @antonio_kodheli — Prompt
87. Photo retouch app promo — @oliahmed205 — Prompt
88. Motion designer showreel — @danilowm — Prompt
89. Email verification tool promo — @KmAsiff — Prompt
90. AllInvestView product promo — @rammanq — Prompt
91. Commotion app showreel — @Amol909S — Prompt
92. Lidlezz app promo — @cansincengiz_me — Prompt
93. Crux motion design showreel — @marouanegazouzi — Prompt
94. ocrX app launch video — @mehul4795 — Prompt
95. GenVizu product launch — @listudio — Prompt
96. sweetRegret app update reel — @thilina_a — Prompt
97. Amazon wholesale pitch video — @ceowinkz — Prompt
98. Personal skills showreel — @ibrahimwasim240 — Prompt
99. AgentHud project motion video — @Jazzen_Chen — Prompt
100. CloudJoi search showcase — @lester_tyy — Prompt
101. Brieform product presentation — @MajorBaguette — Prompt
102. FigPad product promo — @Ai_Baymax — Prompt
103. Database client launch video — @iamMXFSCHR — Prompt
104. Design portfolio video reel — @kikelopezdesign — Prompt
105. Datagran ChatGPT ads explainer — @charlesmendez — Prompt

---

## How to Use This Skill

When asked to create a UI motion design, film, or interactive demo:

1. **Determine entry type:** Are you writing a prompt (for an AI to build) or creating/installing a skill (for reuse)?
2. **Ask for inputs first:** Never build without knowing the UI states, brand, accent color, audio, and copy.
3. **Set the direction:** Define canvas color, component style, typography, camera behavior, cursor interaction, and the banned list.
4. **Structure by beats:** Map out what happens on each beat of a ~120 BPM grid.
5. **Build with `seek(t)`:** Pure function of time, closed-form springs, no CSS transitions or timers.
6. **Check for gotchas:** Loop seam, text swap timing, no teleporting, readable during camera moves.
7. **Render:** Playwright + ffmpeg at 60fps with motion blur, check stills per beat first.

---

## Source

All content compiled from [Prompt Motion](https://prompt-motion.com/?tag=product-ui) — 105 Product UI demos made with Claude Opus 5.5. Videos and prompts belong to their creators, linked on each entry. Curated by @p4nthera_.
