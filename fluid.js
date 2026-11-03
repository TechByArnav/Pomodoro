/* ============================================================
   POMODORO — Background Atmospheric Simulation Engine
   Modes:
     1. 'smoke'  — Organic Fluid & Gas Dynamics (Crimson Embers/Smoke)
     2. 'waves'  — Harmonic Undulating Waves & Ripples
     3. 'embers' — Cosmic Embers / Star Drift
     4. 'none'   — Pure Dark Void (Zero GPU/CPU)
   Visible, high-contrast, responsive, 100% crash-proof
   ============================================================ */

(function () {
  let currentMode = 'smoke';
  let currentHex = '#dc143c';

  try {
    currentMode = localStorage.getItem('pomodoro_fluid_mode') || 'smoke';
    currentHex = localStorage.getItem('pomodoro_accent_color') || '#dc143c';
  } catch (_) {}

  let canvas = null;
  let animId = null;
  let rgb = hexToRgb(currentHex);

  function hexToRgb(hex) {
    hex = (hex || '#dc143c').replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16) || 0xdc143c;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Organic Fluid & Gas Smoke Dynamics ('smoke')
  // ─────────────────────────────────────────────────────────────
  function startSmoke() {
    stopCurrent();
    if (!canvas) canvas = document.getElementById('fluidCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    const particles = [];
    const MAX_PARTICLES = 55;

    class SmokePuff {
      constructor(x, y, vx, vy, size, life, isBurst = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        // High visibility alpha: 0.35 - 0.65
        this.maxAlpha = isBurst ? 0.55 : (0.28 + Math.random() * 0.25);
        this.alpha = 0;
        this.rot = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.025;
        this.isEmber = Math.random() < 0.3;
      }

      update(time, mouse) {
        // Fluid vortex curl
        const curlScale = 0.0025;
        const curlX = Math.sin(this.y * curlScale + time * 0.8);
        const curlY = Math.cos(this.x * curlScale + time * 0.7);

        this.vx += curlX * 0.08;
        this.vy += (curlY * 0.06) - 0.05; // upward thermal lift

        // Mouse suction & swirl
        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 320 && dist > 10) {
            const force = (320 - dist) / 320;
            this.vx += (-dy / dist) * force * 1.2 + mouse.vx * 0.1;
            this.vy += (dx / dist) * force * 1.2 + mouse.vy * 0.1;
          }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.982;
        this.vy *= 0.982;
        this.rot += this.rotSpeed;
        this.size += 0.55;
        this.life--;

        // Fade in and out
        const p = this.life / this.maxLife;
        if (p > 0.85) {
          this.alpha = this.maxAlpha * ((1 - p) / 0.15);
        } else {
          this.alpha = this.maxAlpha * (p / 0.85);
        }
      }

      draw(c) {
        if (this.alpha <= 0.005) return;
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rot);

        const r = this.size;
        const grad = c.createRadialGradient(0, 0, 0, 0, 0, r);

        if (this.isEmber) {
          // Hot ember core
          const coreR = Math.min(255, rgb.r + 70);
          const coreG = Math.min(255, rgb.g + 45);
          const coreB = rgb.b;
          grad.addColorStop(0, `rgba(${coreR}, ${coreG}, ${coreB}, ${this.alpha * 1.4})`);
          grad.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.alpha * 0.8})`);
          grad.addColorStop(0.7, `rgba(${Math.floor(rgb.r * 0.5)}, 10, 20, ${this.alpha * 0.3})`);
          grad.addColorStop(1, 'rgba(10, 10, 10, 0)');
        } else {
          // Luminous crimson smoke
          grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.alpha})`);
          grad.addColorStop(0.4, `rgba(${Math.floor(rgb.r * 0.7)}, ${Math.floor(rgb.g * 0.3)}, 30, ${this.alpha * 0.6})`);
          grad.addColorStop(0.8, `rgba(40, 10, 20, ${this.alpha * 0.2})`);
          grad.addColorStop(1, 'rgba(10, 10, 10, 0)');
        }

        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // Mouse velocity tracking
    const mouse = { x: width / 2, y: height / 2, vx: 0, vy: 0, active: false };
    let lastX = width / 2, lastY = height / 2;
    let timeout = null;

    function handlePointer(cx, cy) {
      mouse.vx = cx - lastX;
      mouse.vy = cy - lastY;
      mouse.x = cx;
      mouse.y = cy;
      lastX = cx;
      lastY = cy;
      mouse.active = true;

      const speed = Math.hypot(mouse.vx, mouse.vy);
      if (speed > 2 && particles.length < MAX_PARTICLES + 25) {
        particles.push(new SmokePuff(
          cx + (Math.random() - 0.5) * 20,
          cy + (Math.random() - 0.5) * 20,
          mouse.vx * 0.15 + (Math.random() - 0.5) * 2,
          mouse.vy * 0.15 + (Math.random() - 0.5) * 2,
          45 + Math.random() * 35,
          110 + Math.random() * 70,
          true
        ));
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => { mouse.active = false; }, 1800);
    }

    window.addEventListener('mousemove', e => handlePointer(e.clientX, e.clientY));
    window.addEventListener('touchmove', e => {
      if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    // Initial ambient billows across screen
    for (let i = 0; i < 35; i++) {
      particles.push(new SmokePuff(
        Math.random() * width,
        height * 0.25 + Math.random() * (height * 0.65),
        (Math.random() - 0.5) * 1.2,
        -0.5 - Math.random() * 0.8,
        80 + Math.random() * 110,
        140 + Math.random() * 120
      ));
    }

    let time = 0;
    let lastSpawn = 0;

    function loop(now) {
      if (currentMode !== 'smoke') return;
      time += 0.016;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Continual ambient generation
      if (now - lastSpawn > 500 && particles.length < MAX_PARTICLES) {
        lastSpawn = now;
        const sx = width * (0.2 + Math.random() * 0.6);
        const sy = height * (0.6 + Math.random() * 0.35);
        particles.push(new SmokePuff(
          sx,
          sy,
          (Math.random() - 0.5) * 0.8,
          -0.7 - Math.random() * 0.9,
          75 + Math.random() * 90,
          160 + Math.random() * 90
        ));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(time, mouse);
        p.draw(ctx);
        if (p.life <= 0 || p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Harmonic Undulating Waves ('waves')
  // ─────────────────────────────────────────────────────────────
  function startWaves() {
    stopCurrent();
    if (!canvas) canvas = document.getElementById('fluidCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    let mouse = { x: width / 2, y: height / 2 };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    let t = 0;
    function loop() {
      if (currentMode !== 'waves') return;
      t += 0.016;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const layers = 5;
      for (let i = 0; i < layers; i++) {
        const p = i / (layers - 1);
        const yBase = height * (0.35 + p * 0.5);
        const speed = (i + 1) * 0.6;
        const waveH = 45 + i * 18;
        const alpha = 0.08 + p * 0.12; // visibly rich alpha

        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 14) {
          const mDist = Math.hypot(x - mouse.x, yBase - mouse.y);
          const mRipple = Math.exp(-mDist / 220) * 55;

          const y = yBase
            + Math.sin(x * 0.004 + t * speed) * waveH
            + Math.cos(x * 0.008 - t * 0.45) * (waveH * 0.5)
            + mRipple;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, yBase - waveH, 0, height);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Cosmic Embers / Star Drift ('embers')
  // ─────────────────────────────────────────────────────────────
  function startEmbers() {
    stopCurrent();
    if (!canvas) canvas = document.getElementById('fluidCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    const particles = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.3 - Math.random() * 0.8,
        size: 2.0 + Math.random() * 4.5,
        alpha: 0.35 + Math.random() * 0.55,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let mouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    let t = 0;
    function loop() {
      if (currentMode !== 'embers') return;
      t += 0.02;

      ctx.fillStyle = 'rgba(10, 10, 10, 0.32)';
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 220 && dist > 10) {
          const force = (220 - dist) / 220 * 0.7;
          p.vx += (-dy / dist) * force;
          p.vy += (dx / dist) * force;
        }

        p.x += p.vx + Math.sin(t + p.pulseOffset) * 0.35;
        p.y += p.vy;
        p.vx *= 0.985;
        if (p.vy > -0.2) p.vy -= 0.015;

        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const curAlpha = p.alpha * (0.65 + 0.35 * Math.sin(t * 1.8 + p.pulseOffset));

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.8);
        grad.addColorStop(0, `rgba(${Math.min(255, rgb.r + 50)}, ${Math.min(255, rgb.g + 30)}, ${rgb.b}, ${curAlpha})`);
        grad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${curAlpha * 0.7})`);
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Static Dark Void ('none')
  // ─────────────────────────────────────────────────────────────
  function startNone() {
    stopCurrent();
    if (!canvas) canvas = document.getElementById('fluidCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function stopCurrent() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function switchMode(mode) {
    currentMode = mode || 'smoke';
    try { localStorage.setItem('pomodoro_fluid_mode', currentMode); } catch (_) {}

    if (currentMode === 'smoke') startSmoke();
    else if (currentMode === 'waves') startWaves();
    else if (currentMode === 'embers') startEmbers();
    else startNone();
  }

  function setColor(hex) {
    currentHex = hex || '#dc143c';
    rgb = hexToRgb(currentHex);
    try { localStorage.setItem('pomodoro_accent_color', currentHex); } catch (_) {}
    switchMode(currentMode);
  }

  // Global Exports
  window.initFluid = function () {
    try {
      canvas = document.getElementById('fluidCanvas');
      if (!canvas) return;
      switchMode(currentMode);
    } catch (err) {
      console.warn('Atmospheric simulation init note:', err);
    }
  };

  window.setFluidMode = switchMode;
  window.setFluidColor = setColor;
  window.getFluidMode = () => currentMode;
  window.getFluidColor = () => currentHex;
})();
