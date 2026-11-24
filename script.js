/* ============================================================
   POMODORO & FOCUS SANCTUARY — Main Application Logic
   Light & Minimal Design (Flocus-inspired)
   ============================================================ */

// ── Default Configurations ─────────────────────────────────────
const DEFAULTS = {
  method: 'classic',
  userName: '',
  appName: 'DragonFocus',
  accentColor: '#084c27',
  theme: 'dark',
  fluidMode: 'smoke',
  chimeEnabled: true,

  // Clock customization
  clockFont: 'system',
  clockSize: 'medium',
  clockFormat: '12',
  clockStyle: 'normal',
  clockColor: '#f0ebe3',

  // Quote customization
  quoteFont: 'system',
  quoteSize: 'medium',
  quoteCorner: true,

  // Timer style
  timerStyle: 'ring',

  // Tasks
  tasksEnabled: true,
  tasks: [],

  // Calendar (ICS)
  icsUrl: '',
  icsEvents: [],

  // Background video
  ytUrl: '',

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
  { text: "Concentrate all your thoughts upon the work in hand.", author: "Alexander Graham Bell" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
];

const BREAK_QUOTES = [
  { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "Anne Lamott" },
  { text: "Rest is not idleness, and to lie sometimes on the grass under trees is not a waste of time.", author: "John Lubbock" },
  { text: "Take rest; a field that has rested gives a bountiful crop.", author: "Ovid" },
  { text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill" },
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
        // Migrate old dark clock color
        if (parsed.clockColor === '#1d1d1f') parsed.clockColor = '#f0ebe3';
        if (parsed.appName === 'POMODORO') parsed.appName = 'DragonFocus';
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
    this.currentMode = 'work';
    this.sessionsCompleted = 0;
    this.superPhase = 1;
    this.flowElapsedSeconds = 0;
    this.timeRemaining = 0;
    this.totalTime = 0;
    this.lastQuoteIdx = -1;

    this.cacheDOM();
    this.activeTaskId = null;
    this.applyAccentColor(this.state.data.accentColor, false);
    this.applyAppName(this.state.data.appName);
    this.applyTheme(this.state.data.theme || 'dark', false);
    this.applyYtBackground(this.state.data.ytUrl || '', false);
    this.setupEventListeners();
    this.setupSettingsUI();

    // Init timer
    this.resetTimer();
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.showQuote();
    this.renderTasks();
    this.renderEvents();
    if (this.state.data.icsUrl) {
      this.syncIcs();
    }
  }

  cacheDOM() {
    this.$ = {
      // Main UI
      logoMark:            document.getElementById('logoMark'),
      settingsBtn:         document.getElementById('settingsBtnBottom'),
      sessionTracker:      document.getElementById('sessionTracker'),

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
      timerProgressWrap:    document.getElementById('timerProgressWrap'),
      timerProgressFill:    document.getElementById('timerProgressFill'),
      timerGaugeWrap:      document.getElementById('timerGaugeWrap'),
      timerGaugeTime:      document.getElementById('timerGaugeTime'),
      timerGaugeProgress:   document.getElementById('timerGaugeProgress'),
      timerDotsWrap:       document.getElementById('timerDotsWrap'),
      timerDotMatrix:      document.getElementById('timerDotMatrix'),
      timerPieWrap:        document.getElementById('timerPieWrap'),
      timerPieTime:        document.getElementById('timerPieTime'),
      timerPieProgress:    document.getElementById('timerPieProgress'),
      ringProgress:        document.getElementById('ringProgress'),
      timerTime:           document.getElementById('timerTime'),
      timerLabel:          document.getElementById('timerLabel'),

      // Quote (top right corner)
      quoteCorner:         document.getElementById('quoteCorner'),
      quoteTextCorner:     document.getElementById('quoteTextCorner'),
      quoteAuthorCorner:   document.getElementById('quoteAuthorCorner'),

      // Active task + a11y
      activeTaskPill:      document.getElementById('activeTaskPill'),
      activeTaskName:      document.getElementById('activeTaskName'),
      liveRegion:          document.getElementById('liveRegion'),

      // Controls
      startBtn:            document.getElementById('startBtn'),
      resetBtn:            document.getElementById('resetBtn'),
      skipBtn:             document.getElementById('skipBtn'),
      iconPlay:            document.querySelector('.icon-play'),
      iconPause:           document.querySelector('.icon-pause'),

      // Tasks
      tasksToggleBtn:      document.getElementById('tasksToggleBtn'),
      tasksPanel:          document.getElementById('tasksPanel'),
      tasksCloseBtn:       document.getElementById('tasksCloseBtn'),
      taskInput:           document.getElementById('taskInput'),
      addTaskBtn:          document.getElementById('addTaskBtn'),
      tasksList:           document.getElementById('tasksList'),
      tasksEmpty:          document.getElementById('tasksEmpty'),
      tasksCount:          document.getElementById('tasksCount'),
      workTypeSelect:      document.getElementById('workTypeSelect'),
      recommendationCard:  document.getElementById('recommendationCard'),
      recMethod:           document.getElementById('recMethod'),
      recReason:           document.getElementById('recReason'),
      applyRecBtn:         document.getElementById('applyRecBtn'),
      cfgIcsUrl:           document.getElementById('cfgIcsUrl'),
      syncIcsBtn:          document.getElementById('syncIcsBtn'),
      clearIcsBtn:         document.getElementById('clearIcsBtn'),
      cfgIcsPaste:         document.getElementById('cfgIcsPaste'),
      importIcsBtn:        document.getElementById('importIcsBtn'),
      icsStatus:           document.getElementById('icsStatus'),
      calendarSection:     document.getElementById('calendarSection'),
      eventsList:          document.getElementById('eventsList'),

      // Flowtime UI
      flowtimeEarnedWrap:  document.getElementById('flowtimeEarnedWrap'),
      flowtimeEarnedText:  document.getElementById('flowtimeEarnedText'),
      flowFinishWrap:      document.getElementById('flowFinishWrap'),
      flowFinishBtn:       document.getElementById('flowFinishBtn'),

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
      cfgClockFont:        document.getElementById('cfgClockFont'),
      cfgClockSize:        document.getElementById('cfgClockSize'),
      cfgClockFormat:      document.getElementById('cfgClockFormat'),
      cfgClockStyle:       document.getElementById('cfgClockStyle'),
      cfgClockColor:       document.getElementById('cfgClockColor'),
      cfgQuoteFont:        document.getElementById('cfgQuoteFont'),
      cfgQuoteSize:        document.getElementById('cfgQuoteSize'),
      cfgQuoteCorner:      document.getElementById('cfgQuoteCorner'),
      cfgTheme:            document.getElementById('cfgTheme'),
      cfgYtUrl:            document.getElementById('cfgYtUrl'),
      applyYtBtn:          document.getElementById('applyYtBtn'),
      clearYtBtn:          document.getElementById('clearYtBtn'),
      cfgTimerStyle:       document.getElementById('cfgTimerStyle'),
      cfgTasksEnabled:     document.getElementById('cfgTasksEnabled'),
      quickTaskInput:      document.getElementById('cfgQuickTask'),
      addQuickTaskBtn:     document.getElementById('addQuickTaskBtn'),

      // Profile
      cfgUserName:         document.getElementById('cfgUserName'),
      namePreview:         document.getElementById('namePreview'),
      cfgAppName:          document.getElementById('cfgAppName'),
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

    const clock = this.$.clock;
    const data = this.state.data;

    const fontMap = {
      system: '-apple-system, system-ui, "SF Pro", sans-serif',
      monospace: '"SF Mono", "Courier New", monospace',
      serif: '"SF Pro Display", "Georgia", serif',
      rounded: '-apple-system, system-ui, sans-serif',
    };
    clock.style.fontFamily = fontMap[data.clockFont || 'system'] || fontMap.system;

    const sizeMap = {
      small: 'clamp(32px, 6vw, 48px)',
      medium: 'clamp(48px, 8vw, 64px)',
      large: 'clamp(64px, 10vw, 96px)',
      xlarge: 'clamp(80px, 12vw, 128px)',
    };
    clock.style.fontSize = sizeMap[data.clockSize || 'medium'] || sizeMap.medium;
    clock.style.color = data.clockColor || '#1d1d1f';

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

    const r = parseInt(hex.slice(1, 3), 16) || 220;
    const g = parseInt(hex.slice(3, 5), 16) || 20;
    const b = parseInt(hex.slice(5, 7), 16) || 60;

    const root = document.documentElement;
    root.style.setProperty('--crimson', hex);
    root.style.setProperty('--crimson-glow', `rgba(${r}, ${g}, ${b}, 0.12)`);
    root.style.setProperty('--crimson-soft', `rgba(${r}, ${g}, ${b}, 0.25)`);

    if (typeof window.setFluidColor === 'function') {
      window.setFluidColor(hex);
    }

    this.$.colorSwatches.forEach(swatch => {
      swatch.classList.toggle('active', swatch.dataset.color.toLowerCase() === hex.toLowerCase());
    });
    if (this.$.customColorInput) this.$.customColorInput.value = hex;
  }

  applyAppName(name) {
    if (!name) name = 'DragonFocus';
    this.state.data.appName = name;
    this.$.logoMark.textContent = name;
    if (this.$.cfgAppName) this.$.cfgAppName.value = name;
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

  extractYouTubeId(url) {
    url = (url || '').trim();
    if (!url) return null;
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
    return null;
  }

  applyYtBackground(url, updateStorage = true) {
    if (updateStorage) { this.state.data.ytUrl = url || ''; this.state.save(); }
    const container = document.getElementById('ytBgContainer');
    const canvas = document.getElementById('fluidCanvas');
    if (!container) return;
    const id = this.extractYouTubeId(url);
    if (url && url.trim() && id) {
      container.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      container.style.display = 'block';
      if (canvas) canvas.style.display = 'none';
    } else {
      container.style.display = 'none';
      container.innerHTML = '';
      if (canvas) canvas.style.display = 'block';
      if (url && url.trim() && !id && this.$.icsStatus) {
        // reuse status? no. just ignore
      }
    }
    if (this.$.cfgYtUrl) this.$.cfgYtUrl.value = this.state.data.ytUrl || '';
  }

  applyTheme(theme, updateStorage = true) {
    if (!theme) theme = 'dark';
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    this.state.data.theme = this.state.data.theme || 'dark';
    if (updateStorage) { this.state.data.theme = theme === 'light' ? 'light' : 'dark'; this.state.save(); }
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    if (this.$.cfgTheme) this.$.cfgTheme.value = this.state.data.theme;
  }

  // ── Active task ──
  setActiveTask(id) {
    this.activeTaskId = id;
    const task = (this.state.data.tasks || []).find(t => t.id === id);
    if (task && this.$.activeTaskPill && this.$.activeTaskName) {
      this.$.activeTaskName.textContent = task.text;
      this.$.activeTaskPill.style.display = 'inline-flex';
    } else if (this.$.activeTaskPill) {
      this.$.activeTaskPill.style.display = 'none';
    }
    this.renderTasks();
    this.updateRecommendation();
  }
  clearActiveTask() { this.setActiveTask(null); }

  announce(msg) {
    if (this.$.liveRegion) this.$.liveRegion.textContent = msg;
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
          const earned = Math.max(300, Math.floor(this.flowElapsedSeconds / 5));
          return earned;
        }
        if (this.superPhase === 3) return timings.stage3Break * 60;
      } else {
        return timings.resetBreak * 60;
      }
    }

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
      this.flowElapsedSeconds = elapsed;
      this.timeRemaining = elapsed;

      this.renderStopwatchDisplay(elapsed);
      this.renderProgressStopwatch(elapsed);

      const earnedSeconds = Math.floor(elapsed / 5);
      const earnedMins = Math.floor(earnedSeconds / 60);
      const earnedRemainderSecs = earnedSeconds % 60;
      this.$.flowtimeEarnedText.textContent = `Earned Rest: ${earnedMins}m ${earnedRemainderSecs}s`;

      const cap = (this.state.data.timings.super.stage2Cap || 90) * 60;
      if (elapsed >= cap) {
        this.completeSession();
      }
    } else {
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

    // Focus tracking per active task
    if (this.activeTaskId && this.hasStarted) {
      const task = (this.state.data.tasks || []).find(t => t.id === this.activeTaskId);
      if (task) {
        task.focusSeconds = (task.focusSeconds || 0) + (this.totalTime - this.timeRemaining);
        this.state.save();
      }
    }

    const msg = this.currentMode === 'work' ? 'Focus session complete. Time to rest.' : 'Break complete. Time to focus.';
    this.announce(msg);

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
      if (this.currentMode === 'work') {
        this.currentMode = 'shortBreak';
      } else {
        if (this.superPhase === 1) {
          this.superPhase = 2;
          this.currentMode = 'work';
        } else if (this.superPhase === 2) {
          this.superPhase = 3;
          this.currentMode = 'work';
        } else if (this.superPhase === 3) {
          this.superPhase = 1;
          this.currentMode = 'longBreak';
        } else {
          this.superPhase = 1;
          this.currentMode = 'work';
        }
      }
    } else {
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

    if (this.$.timerRingWrap) this.$.timerRingWrap.style.display = style === 'ring' ? 'block' : 'none';
    if (this.$.timerProgressWrap) this.$.timerProgressWrap.style.display = style === 'progress' ? 'block' : 'none';
    if (this.$.timerGaugeWrap) this.$.timerGaugeWrap.style.display = style === 'gauge' ? 'block' : 'none';
    if (this.$.timerDotsWrap) this.$.timerDotsWrap.style.display = style === 'dots' ? 'block' : 'none';
    if (this.$.timerPieWrap) this.$.timerPieWrap.style.display = style === 'pie' ? 'block' : 'none';

    const showCenterText = style === 'ring' || style === 'gauge' || style === 'pie';
    if (this.$.timerTime) this.$.timerTime.style.display = showCenterText ? 'block' : 'none';
    if (this.$.timerLabel) this.$.timerLabel.style.display = showCenterText ? 'block' : 'none';

    if (style === 'ring') {
      this.$.timerTime.textContent = timeStr;
    } else if (style === 'gauge') {
      this.$.timerGaugeTime.textContent = timeStr;
    } else if (style === 'dots') {
      this.renderDotMatrix();
    } else if (style === 'pie') {
      this.$.timerPieTime.textContent = timeStr;
    } else if (style === 'none') {
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
      if (this.$.ringProgress) this.$.ringProgress.style.strokeDashoffset = offset;
    } else if (style === 'progress') {
      const fillPct = progress * 100;
      if (this.$.timerProgressFill) this.$.timerProgressFill.style.width = `${fillPct}%`;
    } else if (style === 'gauge') {
      const gaugeC = 2 * Math.PI * 80;
      const offset = gaugeC * (1 - progress);
      if (this.$.timerGaugeProgress) {
        this.$.timerGaugeProgress.style.strokeDasharray = gaugeC;
        this.$.timerGaugeProgress.style.strokeDashoffset = offset;
      }
    } else if (style === 'dots') {
      this.renderDotMatrix();
    } else if (style === 'pie') {
      const pieC = 2 * Math.PI * 75;
      const offset = pieC * (1 - progress);
      if (this.$.timerPieProgress) {
        this.$.timerPieProgress.style.strokeDasharray = pieC;
        this.$.timerPieProgress.style.strokeDashoffset = offset;
      }
    }
  }

  renderProgressStopwatch(elapsed) {
    const cap = (this.state.data.timings.super.stage2Cap || 90) * 60;
    const progress = Math.min(1, elapsed / cap);
    const offset = this.RING_C * (1 - progress);
    if (this.$.ringProgress) this.$.ringProgress.style.strokeDashoffset = offset;
  }

  renderStopwatchDisplay(elapsed) {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    if (this.$.timerTime) this.$.timerTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
    if (this.$.iconPlay) this.$.iconPlay.style.display = playing ? 'none' : 'block';
    if (this.$.iconPause) this.$.iconPause.style.display = playing ? 'block' : 'none';
  }

  updateTitle() {
    const m = Math.floor(this.timeRemaining / 60);
    const s = this.timeRemaining % 60;
    const t = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const name = this.state.data.appName || 'Pomodoro';

    if (this.hasStarted) {
      document.title = `${t} · ${this.$.timerLabel?.textContent || 'focus'} — ${name}`;
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

    // Update both quote-main elements (greeting + timer)
    const updateQuote = (textEl, authorEl) => {
      textEl.textContent = `\u201C${q.text}\u201D`;
      authorEl.textContent = q.author;

      const data = this.state.data;
      const qFontMap = {
        system: '-apple-system, system-ui, sans-serif',
        serif: '"Georgia", "Times New Roman", serif',
        monospace: '"SF Mono", "Courier New", monospace',
        italic: '-apple-system, system-ui, sans-serif',
      };
      textEl.style.fontFamily = qFontMap[data.quoteFont || 'system'] || qFontMap.system;
      textEl.style.fontStyle = data.quoteFont === 'italic' ? 'italic' : 'normal';

      const qSizeMap = {
        small: '11px',
        medium: '12px',
        large: '14px',
      };
      textEl.style.fontSize = qSizeMap[data.quoteSize || 'medium'] || qSizeMap.medium;
    };

    if (this.state.data.quoteCorner) {
      this.$.quoteCorner.style.display = 'block';
      updateQuote(this.$.quoteTextCorner, this.$.quoteAuthorCorner);
    } else {
      this.$.quoteCorner.style.display = 'none';
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

  // ── Tasks ──────────────────────────────────────────────────────
  addTask(text) {
    if (!text || !text.trim()) return;
    const task = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    this.state.data.tasks.push(task);
    this.state.save();
    this.renderTasks();
    this.updateRecommendation();
    return task;
  }

  toggleTask(id) {
    const task = this.state.data.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.state.save();
      this.renderTasks();
    }
  }

  deleteTask(id) {
    this.state.data.tasks = this.state.data.tasks.filter(t => t.id !== id);
    this.state.save();
    this.renderTasks();
  }

  renderTasks() {
    const tasks = this.state.data.tasks;
    const activeCount = tasks.filter(t => !t.completed).length;

    if (this.$.tasksCount) {
      this.$.tasksCount.textContent = activeCount;
      this.$.tasksCount.style.display = activeCount > 0 ? 'block' : 'none';
    }

    if (!this.$.tasksList) return;

    if (tasks.length === 0) {
      this.$.tasksList.innerHTML = '';
      if (this.$.tasksEmpty) this.$.tasksEmpty.style.display = 'block';
      return;
    }

    if (this.$.tasksEmpty) this.$.tasksEmpty.style.display = 'none';

    this.$.tasksList.innerHTML = tasks.map(task => `
      <div class="task-item${task.completed ? ' completed' : ''}${task.id === this.activeTaskId ? ' active-task' : ''}" data-id="${task.id}">
        <button class="task-checkbox${task.completed ? ' checked' : ''}" aria-label="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}"></button>
        <span class="task-text" role="button" tabindex="0">${this.escapeHtml(task.text)}</span>
        <button class="task-delete" aria-label="Delete task">&times;</button>
      </div>
    `).join('');

    this.$.tasksList.querySelectorAll('.task-checkbox').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.task-item').dataset.id;
        this.toggleTask(id);
      });
    });
    this.$.tasksList.querySelectorAll('.task-text').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.closest('.task-item').dataset.id;
        this.setActiveTask(this.activeTaskId === id ? null : id);
      });
    });
    this.$.tasksList.querySelectorAll('.task-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.task-item').dataset.id;
        if (this.activeTaskId === id) this.clearActiveTask();
        this.deleteTask(id);
      });
    });
  }

  // ── ICS Calendar ──
  importIcsText(text) {
    const events = this.parseIcs(text);
    this.state.data.icsEvents = events;
    this.state.save();
    this.renderEvents();
    this.updateIcsStatus();
    if (this.$.icsStatus) this.$.icsStatus.textContent = `Imported ${events.length} events.`;
  }

  async syncIcs() {
    if (this.$.cfgIcsUrl && this.$.cfgIcsUrl.value.trim()) {
      this.state.data.icsUrl = this.$.cfgIcsUrl.value.trim();
      this.state.save();
    }
    const url = (this.state.data.icsUrl || '').trim();
    if (!url) { if (this.$.icsStatus) this.$.icsStatus.textContent = 'Enter an ICS URL first.'; return; }
    if (this.$.icsStatus) this.$.icsStatus.textContent = 'Syncing...';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const events = this.parseIcs(text);
      this.state.data.icsEvents = events;
      this.state.save();
      this.renderEvents();
      if (this.$.icsStatus) this.$.icsStatus.textContent = `Synced ${events.length} events.`;
    } catch (e) {
      console.error('ICS sync failed', e);
      if (this.$.icsStatus) this.$.icsStatus.textContent = 'Sync failed: ' + (e.message || e);
    }
  }

  parseIcs(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const events = [];
    let cur = null;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // unfold
      while (i + 1 < lines.length && /^\s/.test(lines[i + 1])) {
        line += lines[++i].trim();
      }
      if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
      if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; continue; }
      if (!cur) continue;
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const key = line.slice(0, idx).split(';')[0].toUpperCase();
      const val = line.slice(idx + 1);
      if (key === 'SUMMARY') cur.summary = val;
      else if (key === 'DTSTART') cur.start = this.parseIcsDate(val);
      else if (key === 'DTEND') cur.end = this.parseIcsDate(val);
      else if (key === 'LOCATION') cur.location = val;
      else if (key === 'DESCRIPTION') cur.description = val;
    }
    const now = Date.now();
    return events
      .filter(e => e.start && e.start.getTime() >= now - 86400000)
      .sort((a, b) => a.start - b.start)
      .slice(0, 20);
  }

  renderEvents() {
    const events = this.state.data.icsEvents || [];
    if (!this.$.calendarSection || !this.$.eventsList) return;
    if (events.length === 0) { this.$.calendarSection.style.display = 'none'; return; }
    this.$.calendarSection.style.display = 'block';
    this.$.eventsList.innerHTML = events.map(e => {
      const d = e.start;
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="task-item" data-ics="1">
          <span class="task-text">${this.escapeHtml(e.summary || 'Untitled event')}</span>
          <span style="font-size:11px;color:var(--text-muted);white-space:nowrap;">${dateStr} ${timeStr}</span>
        </div>
      `;
    }).join('');
  }

  parseIcsDate(val) {
    // handles 20240101T120000Z, 20240101T120000, 20240101
    val = (val || '').trim();
    let m = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
    if (m) {
      const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${val.endsWith('Z') ? 'Z' : ''}`;
      const d = new Date(iso);
      return isNaN(d) ? null : d;
    }
    m = val.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) {
      const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
      return isNaN(d) ? null : d;
    }
    const d = new Date(val);
    return isNaN(d) ? null : d;
  }

  updateIcsStatus() {
    if (!this.$.icsStatus) return;
    const n = (this.state.data.icsEvents || []).length;
    this.$.icsStatus.textContent = n ? `${n} events synced.` : (this.state.data.icsUrl ? 'Connected. Click Sync to load.' : 'No calendar connected.');
  }

  // ── Study type recommendation ──
  classifyWorkType(text) {
    const t = (text || '').toLowerCase();
    // Manual override
    const manual = this.$.workTypeSelect ? this.$.workTypeSelect.value : 'auto';
    let type = manual;
    if (type === 'auto') {
      if (/chapter|ch\.?\s*\d|pages?|p\.\s*\d|read|novel|book|article|essay\s*read/i.test(t)) type = 'reading';
      else if (/math|algebra|calculus|equation|problem|worksheet|exercise|solve/i.test(t)) type = 'math';
      else if (/essay|write|draft|paper|report|blog/i.test(t)) type = 'writing';
      else if (/code|program|debug|function|api|git|bug|script/i.test(t)) type = 'coding';
      else if (/memoriz|flashcard|vocab|terms|definitions/i.test(t)) type = 'memorization';
      else if (/draw|design|art|music|creative|compose/i.test(t)) type = 'creative';
      else type = 'general';
    }

    const map = {
      reading:       { method: 'ultradian', reason: 'Long-form reading needs sustained 90-min focus with biological recovery.' },
      math:          { method: 'classic',   reason: 'Problem-solving benefits from frequent short breaks to avoid fatigue.' },
      writing:       { method: '52_17',     reason: 'Writing flows best in 52-min sprints with full disconnection.' },
      coding:        { method: 'ultradian', reason: 'Coding requires deep immersion; 90/20 matches flow state.' },
      memorization:  { method: 'classic',   reason: 'Short 25-min bursts aid retention and spacing.' },
      creative:      { method: 'animedoro', reason: 'Creative work thrives with a 50-min focus + rewarding break.' },
      general:       { method: 'classic',   reason: 'A balanced default for mixed tasks.' },
    };
    const info = map[type] || map.general;
    const names = { classic:'Classic Pomodoro', super:'Super-Pomodoro', '52_17':'52/17 Method', ultradian:'Ultradian Rhythm', animedoro:'Animedoro', desktime:'DeskTime 112/26' };
    return { type, method: info.method, reason: info.reason, methodName: names[info.method] };
  }

  updateRecommendation() {
    if (!this.$.recommendationCard) return;
    const text = this.$.taskInput ? this.$.taskInput.value : '';
    const activeTask = this.activeTaskId ? (this.state.data.tasks || []).find(t => t.id === this.activeTaskId) : null;
    const sourceText = activeTask ? activeTask.text : text;
    if (!sourceText.trim() && (!this.$.workTypeSelect || this.$.workTypeSelect.value === 'auto')) {
      this.$.recommendationCard.style.display = 'none';
      return;
    }
    const rec = this.classifyWorkType(sourceText);
    this.$.recommendationCard.style.display = 'flex';
    if (this.$.recMethod) this.$.recMethod.textContent = rec.methodName;
    if (this.$.recReason) this.$.recReason.textContent = rec.reason;
    if (this._recMethod) this._recMethod = rec.method;
    this._recMethod = rec.method;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Event Listeners ──────────────────────────────────────────
  setupEventListeners() {
    this.$.startBtn.addEventListener('click', () => this.toggle());
    this.$.resetBtn.addEventListener('click', () => this.resetTimer());
    this.$.skipBtn.addEventListener('click', () => this.skip());

    // Tasks panel toggle
    this.$.tasksToggleBtn.addEventListener('click', () => {
      this.$.tasksPanel.classList.toggle('open');
    });
    this.$.tasksCloseBtn.addEventListener('click', () => {
      this.$.tasksPanel.classList.remove('open');
    });

    // Add task from panel
    this.$.addTaskBtn.addEventListener('click', () => {
      const text = this.$.taskInput.value;
      if (text.trim()) {
        this.addTask(text);
        this.$.taskInput.value = '';
      }
    });
    this.$.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const text = this.$.taskInput.value;
        if (text.trim()) {
          this.addTask(text);
          this.$.taskInput.value = '';
        }
      }
    });

    // Close tasks panel when clicking outside
    this.$.tasksPanel.addEventListener('click', (e) => {
      if (e.target === this.$.tasksPanel) this.$.tasksPanel.classList.remove('open');
    });

    // Quick add task from settings
    if (this.$.addQuickTaskBtn) {
      this.$.addQuickTaskBtn.addEventListener('click', () => {
        const text = this.$.quickTaskInput ? this.$.quickTaskInput.value : '';
        if (text.trim()) {
          this.addTask(text);
          if (this.$.quickTaskInput) this.$.quickTaskInput.value = '';
          this.renderTasks();
        }
      });
    }
    if (this.$.quickTaskInput) {
      this.$.quickTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const text = this.$.quickTaskInput.value;
          if (text.trim()) {
            this.addTask(text);
            this.$.quickTaskInput.value = '';
            this.renderTasks();
          }
        }
      });
    }

    // Super-Pomodoro Phase 2 "Finish Flow Block"
    this.$.flowFinishBtn.addEventListener('click', () => {
      this.completeSession();
    });

    // Study type recommendation
    if (this.$.workTypeSelect) {
      this.$.workTypeSelect.addEventListener('change', () => this.updateRecommendation());
    }
    if (this.$.taskInput) {
      this.$.taskInput.addEventListener('input', () => this.updateRecommendation());
    }
    if (this.$.applyRecBtn) {
      this.$.applyRecBtn.addEventListener('click', () => {
        const method = this._recMethod || 'classic';
        this.state.data.method = method;
        this.state.save();
        // update method cards UI
        this.$.methodCards.forEach(c => c.classList.toggle('active', c.dataset.method === method));
        const info = METHOD_INFO[method] || METHOD_INFO.classic;
        if (this.$.explainerTitle) this.$.explainerTitle.textContent = info.title;
        if (this.$.explainerBody) this.$.explainerBody.textContent = info.body;
        const isSuper = method === 'super';
        if (this.$.classicTimerSettings) this.$.classicTimerSettings.style.display = isSuper ? 'none' : 'block';
        if (this.$.superTimerSettings) this.$.superTimerSettings.style.display = isSuper ? 'block' : 'none';
        this.resetTimer();
      });
    }

    // YouTube background buttons
    if (this.$.applyYtBtn) {
      this.$.applyYtBtn.addEventListener('click', () => {
        const url = this.$.cfgYtUrl ? this.$.cfgYtUrl.value.trim() : '';
        this.applyYtBackground(url);
      });
    }
    if (this.$.clearYtBtn) {
      this.$.clearYtBtn.addEventListener('click', () => {
        if (this.$.cfgYtUrl) this.$.cfgYtUrl.value = '';
        this.applyYtBackground('');
      });
    }

    // ICS sync buttons:
    if (this.$.syncIcsBtn) {
      this.$.syncIcsBtn.addEventListener('click', () => this.syncIcs());
    }
    if (this.$.clearIcsBtn) {
      this.$.clearIcsBtn.addEventListener('click', () => {
        this.state.data.icsUrl = '';
        this.state.data.icsEvents = [];
        this.state.save();
        if (this.$.cfgIcsUrl) this.$.cfgIcsUrl.value = '';
        this.renderEvents();
        this.updateIcsStatus();
      });
    }
    if (this.$.importIcsBtn) {
      this.$.importIcsBtn.addEventListener('click', () => {
        const text = this.$.cfgIcsPaste ? this.$.cfgIcsPaste.value : '';
        if (!text.trim()) { if (this.$.icsStatus) this.$.icsStatus.textContent = 'Paste ICS content first.'; return; }
        this.importIcsText(text);
      });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); this.toggle(); }
      if (e.code === 'KeyR')  this.resetTimer();
      if (e.code === 'KeyK')  this.skip();
      if (e.code === 'KeyS')  { e.preventDefault(); this.openSettings(); }
      if (e.code === 'KeyT')  { e.preventDefault(); this.$.tasksPanel.classList.toggle('open'); }
      if (e.code === 'KeyA')  { e.preventDefault(); this.openSettings('tab-appearance'); }
      if (e.code === 'KeyM')  { e.preventDefault(); this.openSettings('tab-method'); }
      if (e.code === 'Escape') this.closeSettings();
      if (e.ctrlKey && e.code === 'KeyN') { e.preventDefault(); this.$.tasksPanel.classList.add('open'); this.$.taskInput?.focus(); }
      if (e.ctrlKey && e.code === 'KeyD') { e.preventDefault(); this.state.data.tasks = (this.state.data.tasks || []).filter(t => !t.completed); this.state.save(); this.renderTasks(); }
    });

    // Settings Modal Triggers
    this.$.settingsBtn.addEventListener('click', () => this.openSettings());
    this.$.modalCloseBtn.addEventListener('click', () => this.closeSettings());
    this.$.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.$.modalBackdrop) this.closeSettings();
    });
    this.$.saveSettingsBtn.addEventListener('click', () => {
      try {
        this.saveSettingsFromForm();
        this.closeSettings();
      } catch (err) {
        console.error('Save settings error:', err);
        alert('Error saving settings: ' + err.message);
        // Don't close modal on error so user can fix it
      }
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

    if (this.$.cfgTheme) {
      this.$.cfgTheme.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
      });
    }

    // Fluid Mode Selection Cards
    this.$.fluidModeCards.forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.fluid;
        this.applyFluidMode(mode);
      });
    });

    // App Name input live preview
    if (this.$.cfgAppName) {
      this.$.cfgAppName.addEventListener('input', () => {
        this.applyAppName(this.$.cfgAppName.value);
        this.state.save();
      });
    }

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

    const isSuper = method === 'super';
    this.$.classicTimerSettings.style.display = isSuper ? 'none' : 'block';
    this.$.superTimerSettings.style.display = isSuper ? 'block' : 'none';
  }

  populateSettingsForm() {
    const data = this.state.data;

    this.selectMethodInUI(data.method);

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

    this.$.cfgUserName.value = data.userName || '';
    this.applyAppName(data.appName || 'DragonFocus');

    this.$.cfgChimeToggle.checked = !!data.chimeEnabled;

    this.$.fluidModeCards.forEach(c => {
      c.classList.toggle('active', c.dataset.fluid === (data.fluidMode || 'smoke'));
    });

    // Clock settings
    this.$.cfgClockFont.value = data.clockFont || 'system';
    this.$.cfgClockSize.value = data.clockSize || 'medium';
    this.$.cfgClockFormat.value = data.clockFormat || '12';
    this.$.cfgClockStyle.value = data.clockStyle || 'normal';
    this.$.cfgClockColor.value = data.clockColor || '#1d1d1f';

    // Quote settings
    this.$.cfgQuoteFont.value = data.quoteFont || 'system';
    this.$.cfgQuoteSize.value = data.quoteSize || 'medium';
    this.$.cfgQuoteCorner.checked = !!data.quoteCorner;

    if (this.$.cfgTheme) this.$.cfgTheme.value = data.theme || 'dark';

    if (this.$.cfgIcsUrl) this.$.cfgIcsUrl.value = data.icsUrl || '';
    if (this.$.cfgYtUrl) this.$.cfgYtUrl.value = data.ytUrl || '';
    this.updateIcsStatus();

    // Timer style
    this.$.cfgTimerStyle.value = data.timerStyle || 'ring';

    // Tasks
    this.$.cfgTasksEnabled.checked = !!data.tasksEnabled;
    this.renderTasks();
  }

  saveSettingsFromForm() {
    const activeMethodCard = document.querySelector('.method-card.active');
    if (activeMethodCard) {
      this.state.data.method = activeMethodCard.dataset.method;
    }

    this.state.data.userName = this.$.cfgUserName?.value.trim() || '';

    if (this.$.cfgAppName) {
      this.applyAppName(this.$.cfgAppName.value.trim());
    }

    this.state.data.timings.classic = {
      work: Math.max(1, parseInt(this.$.cfgWorkDuration?.value) || 25),
      shortBreak: Math.max(1, parseInt(this.$.cfgShortBreak?.value) || 5),
      longBreak: Math.max(1, parseInt(this.$.cfgLongBreak?.value) || 15),
      cycles: Math.max(1, parseInt(this.$.cfgCycleCount?.value) || 4),
    };

    this.state.data.timings.super = {
      stage1Work: Math.max(1, parseInt(this.$.cfgStage1Work?.value) || 20),
      stage1Break: Math.max(1, parseInt(this.$.cfgStage1Break?.value) || 5),
      stage2Cap: Math.max(1, parseInt(this.$.cfgStage2Cap?.value) || 90),
      stage2BreakFallback: Math.max(1, parseInt(this.$.cfgStage2Break?.value) || 20),
      stage3Work: Math.max(1, parseInt(this.$.cfgStage3Work?.value) || 50),
      stage3Break: Math.max(1, parseInt(this.$.cfgStage3Break?.value) || 25),
      resetBreak: Math.max(1, parseInt(this.$.cfgSuperResetBreak?.value) || 30),
    };

    this.state.data.chimeEnabled = this.$.cfgChimeToggle?.checked;

    this.state.data.clockFont = this.$.cfgClockFont?.value || 'system';
    this.state.data.clockSize = this.$.cfgClockSize?.value || 'medium';
    this.state.data.clockFormat = this.$.cfgClockFormat?.value || '12';
    this.state.data.clockStyle = this.$.cfgClockStyle?.value || 'normal';
    this.state.data.clockColor = this.$.cfgClockColor?.value || '#ffffff';

    this.state.data.quoteFont = this.$.cfgQuoteFont?.value || 'system';
    this.state.data.quoteSize = this.$.cfgQuoteSize?.value || 'medium';
    this.state.data.quoteCorner = this.$.cfgQuoteCorner?.checked;

    this.state.data.timerStyle = this.$.cfgTimerStyle?.value || 'ring';

    this.state.data.tasksEnabled = this.$.cfgTasksEnabled?.checked;

    if (this.$.cfgIcsUrl) this.state.data.icsUrl = this.$.cfgIcsUrl.value.trim();
    if (this.$.cfgYtUrl) this.state.data.ytUrl = this.$.cfgYtUrl.value.trim();

    if (this.$.cfgTheme) this.applyTheme(this.$.cfgTheme.value);

    this.state.save();
    try {
      this.resetTimer();
    } catch (err) {
      console.error('Reset timer error:', err);
    }
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
