/* ============================================================
   POMODORO — Timer Logic
   Flocus-inspired dashboard with greeting, clock, and
   immersive timer view. 25 / 5 / 15 Pomodoro cycle.
   ============================================================ */

// ── Constants ──────────────────────────────────────────────────
const WORK_DURATION        = 25 * 60;
const SHORT_BREAK_DURATION = 5  * 60;
const LONG_BREAK_DURATION  = 15 * 60;
const SESSIONS_PER_CYCLE   = 4;
const RING_CIRCUMFERENCE   = 2 * Math.PI * 156; // r=156

const MODES = {
  work:       { label: 'focus',       pill: 'Focus',       duration: WORK_DURATION },
  shortBreak: { label: 'short break', pill: 'Short Break', duration: SHORT_BREAK_DURATION },
  longBreak:  { label: 'long break',  pill: 'Long Break',  duration: LONG_BREAK_DURATION },
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

// ── Greeting helper ────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Late night. Stay focused.';
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  if (h < 21) return 'Good evening.';
  return 'Late night. Stay focused.';
}

function formatClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

// ── Pomodoro Timer ─────────────────────────────────────────────
class PomodoroTimer {
  constructor() {
    this.mode = 'work';
    this.timeRemaining = MODES.work.duration;
    this.totalTime = MODES.work.duration;
    this.isRunning = false;
    this.hasStarted = false;   // has the user ever started (controls greeting vs timer view)
    this.interval = null;
    this.sessionsCompleted = 0;
    this.lastQuoteIdx = -1;

    // Real-time tracking
    this.startTimestamp = null;
    this.startingRemaining = null;

    // DOM
    this.$ = {
      greetingBlock:  document.getElementById('greetingBlock'),
      greetingText:   document.getElementById('greetingText'),
      clock:          document.getElementById('clock'),
      timerBlock:     document.getElementById('timerBlock'),
      timerTime:      document.getElementById('timerTime'),
      timerLabel:     document.getElementById('timerLabel'),
      ringProgress:   document.getElementById('ringProgress'),
      modePill:       document.getElementById('modePill'),
      modePillText:   document.getElementById('modePillText'),
      modeDot:        document.querySelector('.mode-dot'),
      startBtn:       document.getElementById('startBtn'),
      resetBtn:       document.getElementById('resetBtn'),
      skipBtn:        document.getElementById('skipBtn'),
      iconPlay:       document.querySelector('.icon-play'),
      iconPause:      document.querySelector('.icon-pause'),
      quoteBlock:     document.getElementById('quoteBlock'),
      quoteText:      document.getElementById('quoteText'),
      quoteAuthor:    document.getElementById('quoteAuthor'),
      sessionTracker: document.getElementById('sessionTracker'),
      timerRingWrap:  document.querySelector('.timer-ring-wrap'),
    };

    // Init ring
    this.$.ringProgress.style.strokeDasharray = RING_CIRCUMFERENCE;

    // Events
    this.$.startBtn.addEventListener('click', () => this.toggle());
    this.$.resetBtn.addEventListener('click', () => this.reset());
    this.$.skipBtn.addEventListener('click',  () => this.skip());

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space')  { e.preventDefault(); this.toggle(); }
      if (e.code === 'KeyR')   this.reset();
      if (e.code === 'KeyS')   this.skip();
    });

    // Clock tick
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    // Initial state
    this.updateClock();
    this.showQuote();
    this.renderTimer();
    this.renderDots();
  }

  // ── Clock (idle view) ────────────────────────────────────
  updateClock() {
    this.$.greetingText.textContent = getGreeting();
    this.$.clock.textContent = formatClock();
  }

  // ── View switching ───────────────────────────────────────
  showTimerView() {
    this.$.greetingBlock.classList.add('hidden');
    this.$.timerBlock.classList.add('visible');
  }

  showClockView() {
    this.$.greetingBlock.classList.remove('hidden');
    this.$.timerBlock.classList.remove('visible');
  }

  // ── Core controls ────────────────────────────────────────
  toggle() {
    this.isRunning ? this.pause() : this.start();
  }

  start() {
    if (this.timeRemaining <= 0) return;

    if (!this.hasStarted) {
      this.hasStarted = true;
      this.showTimerView();
    }

    this.isRunning = true;
    this.setPlayPauseIcon(true);
    this.$.timerRingWrap.closest('.timer-block')?.classList.add('timer-running');
    this.$.modeDot.classList.add('pulsing');

    // Notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    this.startTimestamp = Date.now();
    this.startingRemaining = this.timeRemaining;
    this.interval = setInterval(() => this.tick(), 80);
  }

  pause() {
    this.isRunning = false;
    this.setPlayPauseIcon(false);
    this.$.timerRingWrap.closest('.timer-block')?.classList.remove('timer-running');
    this.$.modeDot.classList.remove('pulsing');
    clearInterval(this.interval);
    this.interval = null;
  }

  reset() {
    this.pause();
    this.timeRemaining = MODES[this.mode].duration;
    this.totalTime = MODES[this.mode].duration;

    this.$.ringProgress.classList.add('smooth-reset');
    this.renderTimer();
    this.renderProgress();
    setTimeout(() => this.$.ringProgress.classList.remove('smooth-reset'), 800);
  }

  skip() {
    this.pause();
    this.advanceMode();
  }

  // ── Tick ─────────────────────────────────────────────────
  tick() {
    const elapsed = Math.floor((Date.now() - this.startTimestamp) / 1000);
    this.timeRemaining = Math.max(0, this.startingRemaining - elapsed);
    this.renderTimer();
    this.renderProgress();
    this.updateTitle();

    if (this.timeRemaining <= 0) this.complete();
  }

  // ── Completion ───────────────────────────────────────────
  complete() {
    clearInterval(this.interval);
    this.interval = null;
    this.isRunning = false;
    this.setPlayPauseIcon(false);
    this.$.timerRingWrap.closest('.timer-block')?.classList.remove('timer-running');
    this.$.timerRingWrap.closest('.timer-block')?.classList.add('timer-complete');
    this.$.modeDot.classList.remove('pulsing');

    this.playChime();
    this.sendNotification();

    setTimeout(() => {
      this.$.timerRingWrap.closest('.timer-block')?.classList.remove('timer-complete');
      this.advanceMode();
    }, 1400);
  }

  // ── Mode management ──────────────────────────────────────
  advanceMode() {
    if (this.mode === 'work') {
      this.sessionsCompleted++;
      this.animateDotComplete(this.sessionsCompleted - 1);

      if (this.sessionsCompleted >= SESSIONS_PER_CYCLE) {
        this.setMode('longBreak');
      } else {
        this.setMode('shortBreak');
      }
    } else {
      if (this.mode === 'longBreak') {
        this.sessionsCompleted = 0;
      }
      this.setMode('work');
    }
    this.showQuote();
  }

  setMode(mode) {
    this.mode = mode;
    this.timeRemaining = MODES[mode].duration;
    this.totalTime = MODES[mode].duration;

    // Update pill
    this.$.modePillText.textContent = MODES[mode].pill;
    if (mode === 'work') {
      this.$.modePill.classList.remove('break-mode');
    } else {
      this.$.modePill.classList.add('break-mode');
    }

    // Update timer label
    this.$.timerLabel.textContent = MODES[mode].label;

    // Smooth ring reset
    this.$.ringProgress.classList.add('smooth-reset');
    this.renderTimer();
    this.renderProgress();
    this.renderDots();
    this.updateTitle();
    setTimeout(() => this.$.ringProgress.classList.remove('smooth-reset'), 800);
  }

  // ── Rendering ────────────────────────────────────────────
  renderTimer() {
    const m = Math.floor(this.timeRemaining / 60);
    const s = this.timeRemaining % 60;
    this.$.timerTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  renderProgress() {
    const progress = this.timeRemaining / this.totalTime;
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    this.$.ringProgress.style.strokeDashoffset = offset;
  }

  renderDots() {
    const dots = this.$.sessionTracker.querySelectorAll('.session-dot');
    dots.forEach((dot, i) => {
      dot.className = 'session-dot';
      if (i < this.sessionsCompleted) {
        dot.classList.add('completed');
      } else if (i === this.sessionsCompleted && this.mode === 'work') {
        dot.classList.add('active');
      }
    });
  }

  animateDotComplete(index) {
    const dots = this.$.sessionTracker.querySelectorAll('.session-dot');
    if (dots[index]) {
      dots[index].className = 'session-dot completed pop';
    }
  }

  setPlayPauseIcon(playing) {
    this.$.iconPlay.style.display  = playing ? 'none'  : 'block';
    this.$.iconPause.style.display = playing ? 'block' : 'none';
  }

  updateTitle() {
    const m = Math.floor(this.timeRemaining / 60);
    const s = this.timeRemaining % 60;
    const t = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    document.title = this.hasStarted
      ? `${t} · ${MODES[this.mode].pill} — Pomodoro`
      : 'Pomodoro — Focus';
  }

  // ── Quotes ───────────────────────────────────────────────
  showQuote() {
    const pool = this.mode === 'work' ? WORK_QUOTES : BREAK_QUOTES;
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); }
    while (idx === this.lastQuoteIdx && pool.length > 1);
    this.lastQuoteIdx = idx;

    const q = pool[idx];
    const block = this.$.quoteBlock;

    block.classList.add('fade-out');
    setTimeout(() => {
      this.$.quoteText.textContent  = `\u201C${q.text}\u201D`;
      this.$.quoteAuthor.textContent = q.author;
      block.classList.remove('fade-out');
    }, 500);
  }

  // ── Audio chime ──────────────────────────────────────────
  playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const tone = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.15, start + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.start(start); osc.stop(start + dur);
      };
      const now = ctx.currentTime;
      tone(587.33, now, 0.3);
      tone(783.99, now + 0.18, 0.3);
      tone(880.00, now + 0.36, 0.45);
    } catch (_) {}
  }

  // ── Browser notification ─────────────────────────────────
  sendNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const next = this.mode === 'work'
      ? (this.sessionsCompleted + 1 >= SESSIONS_PER_CYCLE ? 'longBreak' : 'shortBreak')
      : 'work';
    const body = next === 'work'
      ? 'Break over — time to focus!'
      : `Session complete! Take a ${MODES[next].pill.toLowerCase()}.`;
    new Notification('Pomodoro', { body, silent: true });
  }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Start fluid background (if available)
  if (typeof initFluid === 'function') initFluid();

  // Start timer app
  new PomodoroTimer();
});
