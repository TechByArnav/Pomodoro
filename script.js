/* ============================================================
   POMODORO & FOCUS SANCTUARY — Main Application Logic
   Frameworks:
     - Classic Pomodoro (25/5/15, 4 cycles)
     - Super-Pomodoro (3 Stages: Ignition, Flow Stopwatch 5:1, Animedoro)
     - 52/17 Method (DeskTime sprint)
     - Ultradian Rhythm (90/20)
     - Animedoro (50/20 Reward)
     - DeskTime Method (112/26 Deep Sprint)
   Customizations: Accent Color, Fluid Background, Name, Titles
   ============================================================ */

// ── Default Configurations ─────────────────────────────────────
const DEFAULTS = {
  method: 'classic',
  userName: '',
  appName: 'POMODORO',
  accentColor: '#dc143c',
  fluidMode: 'smoke',
  chimeEnabled: true,

  // Clock customization
  clockFont: 'system',
  clockSize: 'medium',
  clockFormat: '12',
  clockStyle: 'normal',
  clockColor: '#ffffff',

  // Quote customization
  quoteFont: 'system',
  quoteSize: 'medium',
  quoteCorner: true,

  // Timer style
  timerStyle: 'ring',

  // Method-specific timing (in minutes)
  timings: {
    classic: {
      work: 25,
      shortBreak: 5,
      longBreak: 15,
      cycles: 4,
    },
    super: {
      stage1Work: 20,
      stage1Break: 5,
      stage2Cap: 90,
      stage2BreakFallback: 20,
      stage3Work: 50,
      stage3Break: 25,
      resetBreak: 30,
    },
    '52_17': {
      work: 52,
      shortBreak: 17,
      longBreak: 30,
      cycles: 3,
    },
    ultradian: {
      work: 90,
      shortBreak: 20,
      longBreak: 35,
      cycles: 2,
    },
    animedoro: {
      work: 50,
      shortBreak: 20,
      longBreak: 30,
      cycles: 4,
    },
    desktime: {
      work: 112,
      shortBreak: 26,
      longBreak: 45,
      cycles: 2,
    },
  },
};

// ── Method Metadata & Explainers ───────────────────────────────
const METHOD_INFO = {
  classic: {
    name: 'Pomodoro',
    pill: 'Classic 25 / 5',
    title: 'Classic Pomodoro Technique',
    body: 'Developed by Francesco Cirillo in the late 1980s. Works on the psychological principle that knowing a break is imminent relieves mental fatigue and builds steady momentum.',
  },
  super: {
    name: 'Super-Pomodoro',
    pill: 'Super-Pomodoro',
    title: 'Super-Pomodoro · 3 Cognitive Stages',
    body: 'Matches your brain\'s natural energy curves: Phase 1 (Ignition 20m) beats friction; Phase 2 (Deep Flow Stopwatch) rides continuous immersion with 5:1 proportional rest; Phase 3 (Animedoro 50m) provides a high-value guilt-free recharge.',
  },
  '52_17': {
    name: '52 / 17',
    pill: '52 / 17 Method',
    title: 'The 52 / 17 Sprint Rule',
    body: 'Derived from DeskTime\'s study of top 10% performers. High intensity 52-minute focus sprints coupled with 17 minutes of total disconnection from all screens.',
  },
  ultradian: {
    name: 'Ultradian',
    pill: 'Ultradian 90 / 20',
    title: 'Ultradian Rhythm (BRAC Cycle)',
    body: 'Based on sleep researcher Nathaniel Kleitman\'s Basic Rest-Activity Cycle. The human brain naturally cycles through peak alertness for 90 minutes before requiring 20 minutes of biological recovery.',
  },
  animedoro: {
    name: 'Animedoro',
    pill: 'Animedoro 50 / 20',
    title: 'Animedoro Reward Method',
    body: 'Popularized by study communities: 50 minutes of pure, uninterrupted deep work rewarded with 20 minutes of high-dopamine media (exactly one anime episode or TV show without commercials).',
  },
  desktime: {
    name: 'DeskTime',
    pill: 'DeskTime 112 / 26',
    title: 'DeskTime 112 / 26 Deep Work',
    body: 'Updated post-pandemic workplace research by DeskTime showing modern knowledge workers thrive with 1.5x longer immersion blocks (112m) and deep 26m recovery breaks.',
  },
};

// ── Quotes ─────────────────────────────────────────────────────
const WORK_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It's not that we need to do more but rather that we need to focus on less.", author: "Nathan W. Morris" },
  { text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
  { text: "Until we can manage time, we can manage nothing else.", author: "Peter Drucker" },
  { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
  { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
  { text: "Simplicity boils down to two steps: identify the essential, eliminate the rest.", author: "Leo Babauta" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Work hard in silence, let your success be the noise.", author: "Frank Ocean" },
];

const BREAK_QUOTES = [
  { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "Anne Lamott" },
  { text: "Rest is not idleness, and to lie sometimes on the grass under trees is not a waste of time.", author: "John Lubbock" },
  { text: "Take rest; a field that has rested gives a bountiful crop.", author: "Ovid" },
  { text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill" },
  { text: "Tension is who you think you should be. Relaxation is who you are.", author: "Chinese Proverb" },
  { text: "The time to relax is when you don't have time for it.", author: "Sydney J. Harris" },
  { text: "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.", author: "Oprah Winfrey" },
  { text: "Sometimes the most productive thing you can do is relax.", author: "Mark Black" },
];

const SUPER_PHASE_NAMES = {
  1: { badge: 'Phase 1: The Ignition Block', hint: 'Beat procrastination · Low pressure sprint' },
  2: { badge: 'Phase 2: The Deep Flow Block', hint: 'Ultradian Surge · Stopwatch Mode (5:1 Flowtime)' },
  3: { badge: 'Phase 3: Animedoro Reward Block', hint: 'High-value recharge · Complete the cycle' },
};

// ── Application State Manager ──────────────────────────────────
class AppState {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem('pomodoro_app_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULTS,
          ...parsed,
          timings: {
            ...DEFAULTS.timings,
            ...(parsed.timings || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Could not load stored settings, using defaults.', e);
    }
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  save() {
    try {
      localStorage.setItem('pomodoro_app_state', JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save settings.', e);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULTS));
    this.save();
  }
}

// ── Main Timer Controller ──────────────────────────────────────
class FocusController {
  constructor() {
    this.state = new AppState();
    this.RING_C = 2 * Math.PI * 156;

    // Running State
    this.isRunning = false;
    this.hasStarted = false;
    this.interval = null;
    this.startTimestamp = null;
    this.startingRemaining = null;

    // Timer session state
    this.currentMode = 'work'; // 'work' | 'shortBreak' | 'longBreak'
    this.sessionsCompleted = 0;
    this.superPhase = 1;       // 1, 2, 3 for Super-Pomodoro
    this.flowElapsedSeconds = 0; // for Phase 2 stopwatch
    this.timeRemaining = 0;
    this.totalTime = 0;
    this.lastQuoteIdx = -1;

    this.cacheDOM();
    this.applyAccentColor(this.state.data.accentColor, false);
    this.applyAppName(this.state.data.appName);
    this.setupEventListeners();
    this.setupSettingsUI();

    // Init timer
    this.resetTimer();
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.showQuote();
  }

  cacheDOM() {
    this.$ = {
      // Main UI
      logoMark:            document.getElementById('logoMark'),
      modePill:            document.getElementById('modePill'),
      modePillText:        document.getElementById('modePillText'),
      modeDot:             document.querySelector('.mode-dot'),
      sessionTracker:      document.getElementById('sessionTracker'),
      methodBadgeBtn:      document.getElementById('methodBadgeBtn'),
      methodBadgeText:     document.getElementById('methodBadgeText'),
      settingsBtn:         document.getElementById('settingsBtn'),

      // App name (visible while working)
      appNameWorking:      document.getElementById('appNameWorking'),

      // Greeting & Clock
      greetingBlock:       document.getElementById('greetingBlock'),
      greetingText:        document.getElementById('greetingText'),
      clock:               document.getElementById('clock'),
      greetingSub:         document.getElementById('greetingSub'),

      // Timer block
      timerBlock:          document.getElementById('timerBlock'),
      stageBadgeContainer: document.getElementById('stageBadgeContainer'),
      stageBadge:          document.getElementById('stageBadge'),
      stageHint:           document.getElementById('stageHint'),
      timerRingWrap:       document.querySelector('.timer-ring-wrap'),
      ringProgress:        document.getElementById('ringProgress'),
      timerTime:           document.getElementById('timerTime'),
      timerLabel:          document.getElementById('timerLabel'),

      // Timer Style Variants
      timerProgressWrap:   document.getElementById('timerProgressWrap'),
      timerProgressFill:   document.getElementById('timerProgressFill'),
      timerGaugeWrap:      document.getElementById('timerGaugeWrap'),
      timerGaugeProgress:  document.getElementById('timerGaugeProgress'),
      timerGaugeTime:      document.getElementById('timerGaugeTime'),
      timerDotsWrap:       document.getElementById('timerDotsWrap'),
      timerDotMatrix:      document.getElementById('timerDotMatrix'),
      timerPieWrap:        document.getElementById('timerPieWrap'),
      timerPieProgress:    document.getElementById('timerPieProgress'),
      timerPieTime:        document.getElementById('timerPieTime'),

      // Flowtime UI (Phase 2 Stopwatch)
      flowtimeEarnedWrap:  document.getElementById('flowtimeEarnedWrap'),
      flowtimeEarnedText:  document.getElementById('flowtimeEarnedText'),
      flowFinishWrap:      document.getElementById('flowFinishWrap'),
      flowFinishBtn:       document.getElementById('flowFinishBtn'),

      // Quote & Controls
      quoteBlock:          document.getElementById('quoteBlock'),
      quoteText:           document.getElementById('quoteText'),
      quoteAuthor:         document.getElementById('quoteAuthor'),
      quoteCorner:         document.getElementById('quoteCorner'),
      quoteTextCorner:     document.getElementById('quoteTextCorner'),
      quoteAuthorCorner:   document.getElementById('quoteAuthorCorner'),
      startBtn:            document.getElementById('startBtn'),
      resetBtn:            document.getElementById('resetBtn'),
      skipBtn:             document.getElementById('skipBtn'),
      iconPlay:            document.querySelector('.icon-play'),
      iconPause:           document.querySelector('.icon-pause'),

      // Corner settings buttons
      cornerSettingsLeft:  document.getElementById('cornerSettingsLeft'),
      cornerSettingsRight: document.getElementById('cornerSettingsRight'),

      // Settings Modal
      modalBackdrop:       document.getElementById('modalBackdrop'),
      modalCloseBtn:       document.getElementById('modalCloseBtn'),
      saveSettingsBtn:     document.getElementById('saveSettingsBtn'),
      resetDefaultsBtn:    document.getElementById('resetDefaultsBtn'),
      modalTabs:           document.querySelectorAll('.modal-tab'),
      tabPanes:            document.querySelectorAll('.tab-pane'),

      // Settings Inputs
      methodCards:         document.querySelectorAll('.method-card'),
      explainerTitle:      document.getElementById('explainerTitle'),
      explainerBody:       document.getElementById('explainerBody'),

      // Timing configs
      classicTimerSettings:document.getElementById('classicTimerSettings'),
      superTimerSettings:  document.getElementById('superTimerSettings'),
      cfgWorkDuration:     document.getElementById('cfgWorkDuration'),
      cfgShortBreak:       document.getElementById('cfgShortBreak'),
      cfgLongBreak:        document.getElementById('cfgLongBreak'),
      cfgCycleCount:       document.getElementById('cfgCycleCount'),

      cfgStage1Work:       document.getElementById('cfgStage1Work'),
      cfgStage1Break:      document.getElementById('cfgStage1Break'),
      cfgStage2Cap:        document.getElementById('cfgStage2Cap'),
      cfgStage2Break:      document.getElementById('cfgStage2Break'),
      cfgStage3Work:       document.getElementById('cfgStage3Work'),
      cfgStage3Break:      document.getElementById('cfgStage3Break'),
      cfgSuperResetBreak:  document.getElementById('cfgSuperResetBreak'),

      // Appearance
      colorSwatches:       document.querySelectorAll('.color-swatch'),
      customColorInput:    document.getElementById('customColorInput'),
      fluidModeCards:      document.querySelectorAll('.fluid-mode-card'),
      cfgChimeToggle:      document.getElementById('cfgChimeToggle'),

      // Clock settings
      cfgClockFont:        document.getElementById('cfgClockFont'),
      cfgClockSize:        document.getElementById('cfgClockSize'),
      cfgClockFormat:      document.getElementById('cfgClockFormat'),
      cfgClockStyle:       document.getElementById('cfgClockStyle'),
      cfgClockColor:       document.getElementById('cfgClockColor'),

      // Quote settings
      cfgQuoteFont:        document.getElementById('cfgQuoteFont'),
      cfgQuoteSize:        document.getElementById('cfgQuoteSize'),
      cfgQuoteCorner:      document.getElementById('cfgQuoteCorner'),

      // Timer style
      cfgTimerStyle:       document.getElementById('cfgTimerStyle'),

      // Profile
      cfgUserName:         document.getElementById('cfgUserName'),
      namePreview:         document.getElementById('namePreview'),
      nameCards:           document.querySelectorAll('.name-card'),
    };

    this.$.ringProgress.style.strokeDasharray = this.RING_C;
  }

  // ── Time & Clock ─────────────────────────────────────────────
  getGreeting() {
    const h = new Date().getHours();
    const name = this.state.data.userName.trim();
    const nameSuffix = name ? `, ${name}.` : '.';

    if (h < 5)  return `Late night${name ? ', ' + name : ''}. Stay focused.`;
    if (h < 12) return `Good morning${nameSuffix}`;
    if (h < 17) return `Good afternoon${nameSuffix}`;
    if (h < 21) return `Good evening${nameSuffix}`;
    return `Late night${name ? ', ' + name : ''}. Stay focused.`;
  }

  formatClock() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const format = this.state.data.clockFormat || '12';

    if (format === '24') {
      return `${String(h).padStart(2, '0')}:${m}`;
    }

    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  updateClock() {
    this.$.greetingText.textContent = this.getGreeting();

    // Apply clock styling
    const clock = this.$.clock;
    const data = this.state.data;

    // Font
    const fontMap = {
      system: '-apple-system, system-ui, "SF Pro", sans-serif',
      monospace: '"SF Mono", "Courier New", monospace',
      serif: '"SF Pro Display", "Georgia", serif',
      rounded: '-apple-system, system-ui, sans-serif',
    };
    clock.style.fontFamily = fontMap[data.clockFont || 'system'] || fontMap.system;

    // Size
    const sizeMap = {
      small: 'clamp(32px, 6vw, 48px)',
      medium: 'clamp(48px, 8vw, 64px)',
      large: 'clamp(64px, 10vw, 96px)',
      xlarge: 'clamp(80px, 12vw, 128px)',
    };
    clock.style.fontSize = sizeMap[data.clockSize || 'medium'] || sizeMap.medium;

    // Color
    clock.style.color = data.clockColor || '#ffffff';

    // Style: normal vs flip
    if (data.clockStyle === 'flip' && !clock.classList.contains('clock-flip')) {
      clock.classList.add('clock-flip');
      this.renderFlipClock();
    } else if (data.clockStyle !== 'flip' && clock.classList.contains('clock-flip')) {
      clock.classList.remove('clock-flip');
      clock.textContent = this.formatClock();
    }

    if (clock.classList.contains('clock-flip')) {
      this.renderFlipClock();
    } else {
      clock.textContent = this.formatClock();
    }

    if (this.$.namePreview) this.$.namePreview.textContent = this.getGreeting();
  }

  renderFlipClock() {
    const timeStr = this.formatClock();
    const is24 = this.state.data.clockFormat === '24';
    const parts = is24 ? timeStr.split(':') : timeStr.replace(' ', ':').split(':');

    let html = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i > 0) html += '<span class="flip-digit">:</span>';
      for (let j = 0; j < part.length; j++) {
        html += `<span class="flip-card"><span class="flip-card-top" data-value="${part[j]}"></span><span class="flip-card-bottom" data-value="${part[j]}"></span></span>`;
      }
    }
    if (!is24) {
      html += `<span class="flip-digit">${timeStr.slice(-2)}</span>`;
    }
    this.$.clock.innerHTML = html;
  }

  // ── Appearance & Names ───────────────────────────────────────
  applyAccentColor(hex, updateStorage = true) {
    if (!hex) hex = '#dc143c';
    this.state.data.accentColor = hex;
    if (updateStorage) this.state.save();

    // Convert hex to rgb for alpha channels
    const r = parseInt(hex.slice(1, 3), 16) || 220;
    const g = parseInt(hex.slice(3, 5), 16) || 20;
    const b = parseInt(hex.slice(5, 7), 16) || 60;

    const root = document.documentElement;
    root.style.setProperty('--crimson', hex);
    root.style.setProperty('--crimson-glow', `rgba(${r}, ${g}, ${b}, 0.12)`);
    root.style.setProperty('--crimson-soft', `rgba(${r}, ${g}, ${b}, 0.32)`);

    // Update fluid shader color
    if (typeof window.setFluidColor === 'function') {
      window.setFluidColor(hex);
    }

    // Update active swatch UI
    this.$.colorSwatches.forEach(swatch => {
      swatch.classList.toggle('active', swatch.dataset.color.toLowerCase() === hex.toLowerCase());
    });
    if (this.$.customColorInput) this.$.customColorInput.value = hex;
  }

  applyAppName(name) {
    if (!name) name = 'POMODORO';
    this.state.data.appName = name;
    this.$.logoMark.textContent = name;
    this.updateTitle();

    this.$.nameCards.forEach(card => {
      card.classList.toggle('active', card.dataset.name === name);
    });
  }

  applyFluidMode(mode) {
    this.state.data.fluidMode = mode;
    this.state.save();
    if (typeof window.setFluidMode === 'function') {
      window.setFluidMode(mode);
    }
    this.$.fluidModeCards.forEach(card => {
      card.classList.toggle('active', card.dataset.fluid === mode);
    });
  }

  // ── Current Method Timing Helper ─────────────────────────────
  getCurrentMethodTiming() {
    const method = this.state.data.method;
    const timings = this.state.data.timings[method] || DEFAULTS.timings[method];

    if (method === 'super') {
      if (this.currentMode === 'work') {
        if (this.superPhase === 1) return timings.stage1Work * 60;
        if (this.superPhase === 2) return timings.stage2Cap * 60;
        if (this.superPhase === 3) return timings.stage3Work * 60;
      } else if (this.currentMode === 'shortBreak') {
        if (this.superPhase === 1) return timings.stage1Break * 60;
        if (this.superPhase === 2) {
          // Flowtime 5:1 proportional rest! 1 minute rest per 5 minutes worked.
          const earned = Math.max(300, Math.floor(this.flowElapsedSeconds / 5));
          return earned;
        }
        if (this.superPhase === 3) return timings.stage3Break * 60;
      } else {
        return timings.resetBreak * 60;
      }
    }

    // Standard methods
    if (this.currentMode === 'work') return timings.work * 60;
    if (this.currentMode === 'shortBreak') return timings.shortBreak * 60;
    return (timings.longBreak || 15) * 60;
  }

  // ── Timer Reset & Transition ─────────────────────────────────
  resetTimer() {
    this.pause();
    const method = this.state.data.method;
    this.flowElapsedSeconds = 0;

    const seconds = this.getCurrentMethodTiming();
    this.timeRemaining = seconds;
    this.totalTime = seconds;

    this.renderViewElements();
    this.renderDisplay();
    this.renderProgress();
    this.renderSessionDots();
    this.updateTitle();
  }

  renderViewElements() {
    const method = this.state.data.method;
    const info = METHOD_INFO[method] || METHOD_INFO.classic;

    // Topbar method badge
    this.$.methodBadgeText.textContent = info.name;

    // App name visible while working (top left)
    if (this.$.appNameWorking) {
      this.$.appNameWorking.style.display = this.hasStarted ? 'block' : 'none';
    }

    // Greeting subline
    if (method === 'classic') {
      this.$.greetingSub.textContent = `Classic Pomodoro · ${this.state.data.timings.classic.work}m Focus / ${this.state.data.timings.classic.shortBreak}m Break`;
    } else if (method === 'super') {
      this.$.greetingSub.textContent = `Super-Pomodoro · 3 Stages (Ignition → Flow → Animedoro)`;
    } else {
      const t = this.state.data.timings[method];
      this.$.greetingSub.textContent = `${info.title} · ${t.work}m Work / ${t.shortBreak}m Break`;
    }

    // Super-Pomodoro Phase Badge
    const isSuper = method === 'super';
    this.$.stageBadgeContainer.style.display = isSuper ? 'flex' : 'none';
    if (isSuper) {
      const p = SUPER_PHASE_NAMES[this.superPhase] || SUPER_PHASE_NAMES[1];
      this.$.stageBadge.textContent = p.badge;
      this.$.stageHint.textContent = p.hint;
    }

    // Phase 2 Stopwatch specifics
    const isPhase2Stopwatch = isSuper && this.superPhase === 2 && this.currentMode === 'work';
    this.$.flowtimeEarnedWrap.style.display = isPhase2Stopwatch ? 'flex' : 'none';
    this.$.flowFinishWrap.style.display = isPhase2Stopwatch ? 'block' : 'none';

    // Mode Pill
    let pillText = 'Focus';
    if (this.currentMode === 'shortBreak') pillText = 'Short Break';
    if (this.currentMode === 'longBreak')  pillText = 'Long Break';

    if (isSuper) {
      if (this.currentMode === 'work') pillText = `Phase ${this.superPhase} Focus`;
      else pillText = `Phase ${this.superPhase} Break`;
    }
    this.$.modePillText.textContent = pillText;
    this.$.modePill.classList.toggle('break-mode', this.currentMode !== 'work');

    // Label under timer
    this.$.timerLabel.textContent = this.currentMode === 'work' ? 'focus' : 'rest';
  }

  // ── Core Playback ────────────────────────────────────────────
  toggle() {
    this.isRunning ? this.pause() : this.start();
  }

  start() {
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.$.greetingBlock.classList.add('hidden');
      this.$.timerBlock.classList.add('visible');
    }

    this.isRunning = true;
    this.setPlayPauseIcon(true);
    this.$.timerRingWrap.closest('.timer-block')?.classList.add('timer-running');
    this.$.modeDot.classList.add('pulsing');

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    this.startTimestamp = Date.now();
    this.startingRemaining = this.timeRemaining;
    this.interval = setInterval(() => this.tick(), 100);
  }

  pause() {
    this.isRunning = false;
    this.setPlayPauseIcon(false);
    this.$.timerRingWrap.closest('.timer-block')?.classList.remove('timer-running');
    this.$.modeDot.classList.remove('pulsing');
    clearInterval(this.interval);
    this.interval = null;
  }

  skip() {
    this.pause();
    this.advanceSession();
  }

  // ── Main Tick Loop ───────────────────────────────────────────
  tick() {
    const elapsed = Math.floor((Date.now() - this.startTimestamp) / 1000);
    const isSuperPhase2 = this.state.data.method === 'super' && this.superPhase === 2 && this.currentMode === 'work';

    if (isSuperPhase2) {
      // STOPWATCH COUNTING UP
      this.flowElapsedSeconds = elapsed;
      this.timeRemaining = elapsed;

      this.renderStopwatchDisplay(elapsed);
      this.renderProgressStopwatch(elapsed);

      // Flowtime 5:1 calculation
      const earnedSeconds = Math.floor(elapsed / 5);
      const earnedMins = Math.floor(earnedSeconds / 60);
      const earnedRemainderSecs = earnedSeconds % 60;
      this.$.flowtimeEarnedText.textContent = `Earned Rest: ${earnedMins}m ${earnedRemainderSecs}s`;

      // If reached cap (e.g. 90m), notify user
      const cap = (this.state.data.timings.super.stage2Cap || 90) * 60;
      if (elapsed >= cap) {
        this.completeSession();
      }
    } else {
      // STANDARD COUNTDOWN
      this.timeRemaining = Math.max(0, this.startingRemaining - elapsed);
      this.renderDisplay();
      this.renderProgress();

      if (this.timeRemaining <= 0) {
        this.completeSession();
      }
    }
    this.updateTitle();
  }

  // ── Session Completion ───────────────────────────────────────
  completeSession() {
    this.pause();
    this.$.timerRingWrap.closest('.timer-block')?.classList.add('timer-complete');

    if (this.state.data.chimeEnabled) {
      this.playChime();
    }
    this.sendNotification();

    setTimeout(() => {
      this.$.timerRingWrap.closest('.timer-block')?.classList.remove('timer-complete');
      this.advanceSession();
    }, 1300);
  }

  advanceSession() {
    const method = this.state.data.method;

    if (method === 'super') {
      // Super-Pomodoro Sequence:
      // Phase 1 Work -> Phase 1 Break -> Phase 2 Flow -> Phase 2 Break -> Phase 3 Work -> Phase 3 Break -> Cycle Reset Break -> Phase 1
      if (this.currentMode === 'work') {
        this.currentMode = 'shortBreak';
      } else {
        // Ending a break
        if (this.superPhase === 1) {
          this.superPhase = 2;
          this.currentMode = 'work';
        } else if (this.superPhase === 2) {
          this.superPhase = 3;
          this.currentMode = 'work';
        } else if (this.superPhase === 3) {
          this.superPhase = 1;
          this.currentMode = 'longBreak'; // reset long break
        } else {
          this.superPhase = 1;
          this.currentMode = 'work';
        }
      }
    } else {
      // Standard Frameworks
      const cycleLimit = (this.state.data.timings[method] && this.state.data.timings[method].cycles) || 4;

      if (this.currentMode === 'work') {
        this.sessionsCompleted++;
        this.animateDotComplete(this.sessionsCompleted - 1);

        if (this.sessionsCompleted >= cycleLimit) {
          this.currentMode = 'longBreak';
        } else {
          this.currentMode = 'shortBreak';
        }
      } else {
        if (this.currentMode === 'longBreak') {
          this.sessionsCompleted = 0;
        }
        this.currentMode = 'work';
      }
    }

    this.showQuote();
    this.resetTimer();
  }

  // ── Rendering ────────────────────────────────────────────────
  renderDisplay() {
    const m = Math.floor(this.timeRemaining / 60);
    const s = this.timeRemaining % 60;
    const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const style = this.state.data.timerStyle || 'ring';

    // Hide all variants first
    this.$.timerRingWrap.style.display = style === 'ring' ? 'block' : 'none';
    this.$.timerProgressWrap.style.display = style === 'progress' ? 'block' : 'none';
    this.$.timerGaugeWrap.style.display = style === 'gauge' ? 'block' : 'none';
    this.$.timerDotsWrap.style.display = style === 'dots' ? 'block' : 'none';
    this.$.timerPieWrap.style.display = style === 'pie' ? 'block' : 'none';

    // Center timer text (used by ring, gauge, pie; hidden for progress/dots/none)
    const showCenterText = style === 'ring' || style === 'gauge' || style === 'pie';
    this.$.timerTime.style.display = showCenterText ? 'block' : 'none';
    this.$.timerLabel.style.display = showCenterText ? 'block' : 'none';

    if (style === 'ring') {
      this.$.timerTime.textContent = timeStr;
    } else if (style === 'gauge') {
      this.$.timerGaugeTime.textContent = timeStr;
    } else if (style === 'dots') {
      this.renderDotMatrix();
    } else if (style === 'pie') {
      this.$.timerPieTime.textContent = timeStr;
    } else if (style === 'none') {
      // No visualization, just the time text
      this.$.timerTime.style.display = 'block';
      this.$.timerTime.textContent = timeStr;
      this.$.timerLabel.style.display = 'block';
    }
  }

  renderDotMatrix() {
    const totalDots = 60;
    const progress = this.totalTime > 0 ? (this.timeRemaining / this.totalTime) : 0;
    const activeCount = Math.round(totalDots * progress);

    let html = '';
    for (let i = 0; i < totalDots; i++) {
      html += `<span class="dot${i < activeCount ? ' active' : ''}"></span>`;
    }
    this.$.timerDotMatrix.innerHTML = html;
  }

  renderProgress() {
    const progress = this.totalTime > 0 ? (this.timeRemaining / this.totalTime) : 0;
    const style = this.state.data.timerStyle || 'ring';

    if (style === 'ring') {
      const offset = this.RING_C * (1 - progress);
      this.$.ringProgress.style.strokeDashoffset = offset;
    } else if (style === 'progress') {
      const fillPct = progress * 100;
      this.$.timerProgressFill.style.width = `${fillPct}%`;
    } else if (style === 'gauge') {
      const gaugeC = 2 * Math.PI * 80;
      const offset = gaugeC * (1 - progress);
      this.$.timerGaugeProgress.style.strokeDasharray = gaugeC;
      this.$.timerGaugeProgress.style.strokeDashoffset = offset;
    } else if (style === 'dots') {
      this.renderDotMatrix();
    } else if (style === 'pie') {
      const pieC = 2 * Math.PI * 75;
      const offset = pieC * (1 - progress);
      this.$.timerPieProgress.style.strokeDasharray = pieC;
      this.$.timerPieProgress.style.strokeDashoffset = offset;
    }
  }

  renderStopwatchDisplay(elapsed) {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    this.$.timerTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  renderProgressStopwatch(elapsed) {
    const cap = (this.state.data.timings.super.stage2Cap || 90) * 60;
    const progress = Math.min(1, elapsed / cap);
    const offset = this.RING_C * (1 - progress);
    this.$.ringProgress.style.strokeDashoffset = offset;
  }

  renderSessionDots() {
    const method = this.state.data.method;
    const cycleCount = method === 'super'
      ? 3
      : ((this.state.data.timings[method] && this.state.data.timings[method].cycles) || 4);

    let html = '';
    for (let i = 0; i < cycleCount; i++) {
      let cls = 'session-dot';
      if (method === 'super') {
        if (i + 1 < this.superPhase) cls += ' completed';
        else if (i + 1 === this.superPhase && this.currentMode === 'work') cls += ' active';
      } else {
        if (i < this.sessionsCompleted) cls += ' completed';
        else if (i === this.sessionsCompleted && this.currentMode === 'work') cls += ' active';
      }
      html += `<span class="${cls}"></span>`;
    }
    this.$.sessionTracker.innerHTML = html;
  }

  animateDotComplete(idx) {
    const dots = this.$.sessionTracker.querySelectorAll('.session-dot');
    if (dots[idx]) {
      dots[idx].className = 'session-dot completed pop';
    }
  }

  setPlayPauseIcon(playing) {
    this.$.iconPlay.style.display = playing ? 'none' : 'block';
    this.$.iconPause.style.display = playing ? 'block' : 'none';
  }

  updateTitle() {
    const m = Math.floor(this.timeRemaining / 60);
    const s = this.timeRemaining % 60;
    const t = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const name = this.state.data.appName || 'Pomodoro';

    if (this.hasStarted) {
      document.title = `${t} · ${this.$.modePillText.textContent} — ${name}`;
    } else {
      document.title = `${name} — Focus`;
    }
  }

  // ── Quotes ───────────────────────────────────────────────────
  showQuote() {
    const pool = this.currentMode === 'work' ? WORK_QUOTES : BREAK_QUOTES;
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); }
    while (idx === this.lastQuoteIdx && pool.length > 1);
    this.lastQuoteIdx = idx;

    const q = pool[idx];
    const block = this.$.quoteBlock;
    block.classList.add('fade-out');
    setTimeout(() => {
      this.$.quoteText.textContent = `\u201C${q.text}\u201D`;
      this.$.quoteAuthor.textContent = q.author;
      block.classList.remove('fade-out');
    }, 450);

    // Also update corner quotes
    if (this.$.quoteCorner) {
      if (this.state.data.quoteCorner) {
        this.$.quoteCorner.style.display = 'block';
      } else {
        this.$.quoteCorner.style.display = 'none';
      }
      this.$.quoteTextCorner.textContent = `\u201C${q.text}\u201D`;
      this.$.quoteAuthorCorner.textContent = q.author;

      // Apply quote styling
      const data = this.state.data;
      const qFontMap = {
        system: '-apple-system, system-ui, sans-serif',
        serif: '"Georgia", "Times New Roman", serif',
        monospace: '"SF Mono", "Courier New", monospace',
        italic: '-apple-system, system-ui, sans-serif',
      };
      this.$.quoteTextCorner.style.fontFamily = qFontMap[data.quoteFont || 'system'] || qFontMap.system;
      this.$.quoteTextCorner.style.fontStyle = data.quoteFont === 'italic' ? 'italic' : 'normal';

      const qSizeMap = {
        small: '11px',
        medium: '12px',
        large: '14px',
      };
      this.$.quoteTextCorner.style.fontSize = qSizeMap[data.quoteSize || 'medium'] || qSizeMap.medium;
    }
  }

  // ── Audio & Notifications ────────────────────────────────────
  playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const tone = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.18, start + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.start(start);
        osc.stop(start + dur);
      };
      const now = ctx.currentTime;
      tone(587.33, now, 0.32);
      tone(783.99, now + 0.18, 0.32);
      tone(880.00, now + 0.36, 0.5);
    } catch (_) {}
  }

  sendNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const body = this.currentMode === 'work'
      ? 'Focus sprint completed! Time to rest.'
      : 'Break is over — time to lock in.';
    new Notification(this.state.data.appName || 'Pomodoro', { body, silent: true });
  }

  // ── Event Listeners ──────────────────────────────────────────
  setupEventListeners() {
    this.$.startBtn.addEventListener('click', () => this.toggle());
    this.$.resetBtn.addEventListener('click', () => this.resetTimer());
    this.$.skipBtn.addEventListener('click',  () => this.skip());

    // Corner settings buttons
    this.$.cornerSettingsLeft.addEventListener('click', () => this.openSettings('tab-appearance'));
    this.$.cornerSettingsRight.addEventListener('click', () => this.openSettings('tab-timer'));

    // Super-Pomodoro Phase 2 "Finish Flow Block"
    this.$.flowFinishBtn.addEventListener('click', () => {
      this.completeSession();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); this.toggle(); }
      if (e.code === 'KeyR')  this.resetTimer();
      if (e.code === 'KeyK')  this.skip();
      if (e.code === 'KeyS')  { e.preventDefault(); this.openSettings(); }
      if (e.code === 'Escape') this.closeSettings();
    });

    // Settings Modal Triggers
    this.$.settingsBtn.addEventListener('click', () => this.openSettings());
    this.$.methodBadgeBtn.addEventListener('click', () => {
      this.openSettings('tab-method');
    });
    this.$.modalCloseBtn.addEventListener('click', () => this.closeSettings());
    this.$.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.$.modalBackdrop) this.closeSettings();
    });
    this.$.saveSettingsBtn.addEventListener('click', () => {
      this.saveSettingsFromForm();
      this.closeSettings();
    });
    this.$.resetDefaultsBtn.addEventListener('click', () => {
      if (confirm('Reset all parameters, timers, and appearance to default?')) {
        this.state.reset();
        this.populateSettingsForm();
        this.applyAccentColor(this.state.data.accentColor);
        this.applyAppName(this.state.data.appName);
        this.applyFluidMode(this.state.data.fluidMode);
        this.resetTimer();
        this.closeSettings();
      }
    });
  }

  // ── Settings UI Management ───────────────────────────────────
  setupSettingsUI() {
    // Modal Tab Navigation
    this.$.modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.$.modalTabs.forEach(t => t.classList.remove('active'));
        this.$.tabPanes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(target)?.classList.add('active');
      });
    });

    // Method selection cards
    this.$.methodCards.forEach(card => {
      card.addEventListener('click', () => {
        const method = card.dataset.method;
        this.selectMethodInUI(method);
      });
    });

    // Color Swatches
    this.$.colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.color;
        this.applyAccentColor(color);
      });
    });

    if (this.$.customColorInput) {
      this.$.customColorInput.addEventListener('input', (e) => {
        this.applyAccentColor(e.target.value);
      });
    }

    // Fluid Mode Selection Cards
    this.$.fluidModeCards.forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.fluid;
        this.applyFluidMode(mode);
      });
    });

    // App Name Cards
    this.$.nameCards.forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        this.applyAppName(name);
        this.state.save();
      });
    });

    // Name input live preview
    this.$.cfgUserName.addEventListener('input', () => {
      this.state.data.userName = this.$.cfgUserName.value;
      this.updateClock();
    });

    this.populateSettingsForm();
  }

  selectMethodInUI(method) {
    this.$.methodCards.forEach(c => c.classList.toggle('active', c.dataset.method === method));
    const info = METHOD_INFO[method] || METHOD_INFO.classic;
    this.$.explainerTitle.textContent = info.title;
    this.$.explainerBody.textContent = info.body;

    // Toggle timer settings view
    const isSuper = method === 'super';
    this.$.classicTimerSettings.style.display = isSuper ? 'none' : 'block';
    this.$.superTimerSettings.style.display = isSuper ? 'block' : 'none';
  }

  populateSettingsForm() {
    const data = this.state.data;

    // Method
    this.selectMethodInUI(data.method);

    // Timings
    const tClassic = data.timings.classic || DEFAULTS.timings.classic;
    this.$.cfgWorkDuration.value = tClassic.work;
    this.$.cfgShortBreak.value = tClassic.shortBreak;
    this.$.cfgLongBreak.value = tClassic.longBreak;
    this.$.cfgCycleCount.value = tClassic.cycles;

    const tSuper = data.timings.super || DEFAULTS.timings.super;
    this.$.cfgStage1Work.value = tSuper.stage1Work;
    this.$.cfgStage1Break.value = tSuper.stage1Break;
    this.$.cfgStage2Cap.value = tSuper.stage2Cap;
    this.$.cfgStage2Break.value = tSuper.stage2BreakFallback;
    this.$.cfgStage3Work.value = tSuper.stage3Work;
    this.$.cfgStage3Break.value = tSuper.stage3Break;
    this.$.cfgSuperResetBreak.value = tSuper.resetBreak;

    // Profile & Name
    this.$.cfgUserName.value = data.userName || '';
    this.applyAppName(data.appName || 'POMODORO');

    // Chime
    this.$.cfgChimeToggle.checked = !!data.chimeEnabled;

    // Fluid mode
    this.$.fluidModeCards.forEach(c => {
      c.classList.toggle('active', c.dataset.fluid === (data.fluidMode || 'smoke'));
    });

    // Clock settings
    this.$.cfgClockFont.value = data.clockFont || 'system';
    this.$.cfgClockSize.value = data.clockSize || 'medium';
    this.$.cfgClockFormat.value = data.clockFormat || '12';
    this.$.cfgClockStyle.value = data.clockStyle || 'normal';
    this.$.cfgClockColor.value = data.clockColor || '#ffffff';

    // Quote settings
    this.$.cfgQuoteFont.value = data.quoteFont || 'system';
    this.$.cfgQuoteSize.value = data.quoteSize || 'medium';
    this.$.cfgQuoteCorner.checked = !!data.quoteCorner;

    // Timer style
    this.$.cfgTimerStyle.value = data.timerStyle || 'ring';
  }

  saveSettingsFromForm() {
    // Read selected method
    const activeMethodCard = document.querySelector('.method-card.active');
    if (activeMethodCard) {
      this.state.data.method = activeMethodCard.dataset.method;
    }

    // Read user name
    this.state.data.userName = this.$.cfgUserName.value.trim();

    // Read classic timings
    this.state.data.timings.classic = {
      work: Math.max(1, parseInt(this.$.cfgWorkDuration.value) || 25),
      shortBreak: Math.max(1, parseInt(this.$.cfgShortBreak.value) || 5),
      longBreak: Math.max(1, parseInt(this.$.cfgLongBreak.value) || 15),
      cycles: Math.max(1, parseInt(this.$.cfgCycleCount.value) || 4),
    };

    // Read super-pomodoro timings
    this.state.data.timings.super = {
      stage1Work: Math.max(1, parseInt(this.$.cfgStage1Work.value) || 20),
      stage1Break: Math.max(1, parseInt(this.$.cfgStage1Break.value) || 5),
      stage2Cap: Math.max(1, parseInt(this.$.cfgStage2Cap.value) || 90),
      stage2BreakFallback: Math.max(1, parseInt(this.$.cfgStage2Break.value) || 20),
      stage3Work: Math.max(1, parseInt(this.$.cfgStage3Work.value) || 50),
      stage3Break: Math.max(1, parseInt(this.$.cfgStage3Break.value) || 25),
      resetBreak: Math.max(1, parseInt(this.$.cfgSuperResetBreak.value) || 30),
    };

    // Chime
    this.state.data.chimeEnabled = this.$.cfgChimeToggle.checked;

    // Clock settings
    this.state.data.clockFont = this.$.cfgClockFont.value;
    this.state.data.clockSize = this.$.cfgClockSize.value;
    this.state.data.clockFormat = this.$.cfgClockFormat.value;
    this.state.data.clockStyle = this.$.cfgClockStyle.value;
    this.state.data.clockColor = this.$.cfgClockColor.value;

    // Quote settings
    this.state.data.quoteFont = this.$.cfgQuoteFont.value;
    this.state.data.quoteSize = this.$.cfgQuoteSize.value;
    this.state.data.quoteCorner = this.$.cfgQuoteCorner.checked;

    // Timer style
    this.state.data.timerStyle = this.$.cfgTimerStyle.value;

    this.state.save();
    this.resetTimer();
    this.updateClock();
  }

  openSettings(tabId) {
    if (tabId) {
      this.$.modalTabs.forEach(t => {
        const matches = t.dataset.tab === tabId;
        t.classList.toggle('active', matches);
        document.getElementById(t.dataset.tab)?.classList.toggle('active', matches);
      });
    }
    this.populateSettingsForm();
    this.$.modalBackdrop.classList.add('open');
    this.$.modalBackdrop.setAttribute('aria-hidden', 'false');
  }

  closeSettings() {
    this.$.modalBackdrop.classList.remove('open');
    this.$.modalBackdrop.setAttribute('aria-hidden', 'true');
  }
}

// Global quick triggers
window.openSettings = function (tabId) {
  if (window.pomodoroApp) window.pomodoroApp.openSettings(tabId);
};
window.closeSettings = function () {
  if (window.pomodoroApp) window.pomodoroApp.closeSettings();
};
window.toggleTimer = function () {
  if (window.pomodoroApp) window.pomodoroApp.toggle();
};
window.resetTimer = function () {
  if (window.pomodoroApp) window.pomodoroApp.resetTimer();
};
window.skipTimer = function () {
  if (window.pomodoroApp) window.pomodoroApp.skip();
};

// ── Application Initialization ─────────────────────────────────
function bootstrapApp() {
  try {
    if (!window.pomodoroApp) {
      window.pomodoroApp = new FocusController();
    }
  } catch (err) {
    console.error('FocusController init error:', err);
  }

  try {
    if (typeof initFluid === 'function') {
      initFluid();
    }
  } catch (err) {
    console.warn('Fluid init note:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

