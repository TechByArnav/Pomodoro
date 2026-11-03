/* ============================================================
   POMODORO — Background Atmospheric Simulation Engine
   Modes:
     1. 'smoke'  — Real grid-based Navier–Stokes fluid dynamics
                   (semi-Lagrangian advection, diffusion,
                    pressure projection) — genuine swirling smoke
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
  // 1. Real Fluid Dynamics ('smoke') — Navier–Stokes solver
  //    Semi-Lagrangian advection + diffusion + pressure projection
  //    (Jos Stam "Stable Fluids" style). Rendered as a low-res
  //    density field scaled up with bilinear smoothing for soft,
  //    swirling, ink-in-water smoke.
  // ─────────────────────────────────────────────────────────────
  function startSmoke() {
    stopCurrent();
    if (!canvas) canvas = document.getElementById('fluidCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // ── Grid (Navier–Stokes solver) ──────────────────────────
    const N = 80;                 // simulation resolution
    const size = N * N;
    const dt = 0.05;
    const diff = 0.0004;
    const visc = 0.0004;

    const u = new Float32Array(size);      // velocity x
    const v = new Float32Array(size);      // velocity y
    const u0 = new Float32Array(size);     // previous velocity x
    const v0 = new Float32Array(size);     // previous velocity y
    const dens = new Float32Array(size);   // density (smoke amount)
    const dens0 = new Float32Array(size);  // previous density

    // Mouse source accumulators (applied at start of each step)
    const su = new Float32Array(size);
    const sv = new Float32Array(size);
    const sd = new Float32Array(size);

    const IX = (i, j) => i + j * N;

    function setBnd(b, x) {
      for (let i = 1; i < N - 1; i++) {
        x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
        x[IX(i, N - 1)] = b === 2 ? -x[IX(i, N - 2)] : x[IX(i, N - 2)];
        x[IX(0, i)] = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
        x[IX(N - 1, i)] = b === 1 ? -x[IX(N - 2, i)] : x[IX(N - 2, i)];
      }
      x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
      x[IX(0, N - 1)] = 0.5 * (x[IX(1, N - 1)] + x[IX(0, N - 2)]);
      x[IX(N - 1, 0)] = 0.5 * (x[IX(N - 2, 0)] + x[IX(N - 1, 1)]);
      x[IX(N - 1, N - 1)] = 0.5 * (x[IX(N - 2, N - 1)] + x[IX(N - 1, N - 2)]);
    }

    function linSolve(b, x, x0, a, c) {
      for (let iter = 0; iter < 20; iter++) {
        for (let j = 1; j < N - 1; j++) {
          for (let i = 1; i < N - 1; i++) {
            const idx = IX(i, j);
            x[idx] = (x0[idx] + a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] +
                                       x[IX(i, j - 1)] + x[IX(i, j + 1)])) / c;
          }
        }
        setBnd(b, x);
      }
    }

    function diffuse(b, x, x0, dt, diffusion) {
      const a = dt * diffusion * (N - 2) * (N - 2);
      linSolve(b, x, x0, a, 1 + 4 * a);
    }

    function project(u, v, p, div) {
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          const idx = IX(i, j);
          div[idx] = -0.5 * (u[IX(i + 1, j)] - u[IX(i - 1, j)] +
                             v[IX(i, j + 1)] - v[IX(i, j - 1)]) / N;
          p[idx] = 0;
        }
      }
      setBnd(0, div); setBnd(0, p);
      linSolve(0, p, div, 1, 4);
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          const idx = IX(i, j);
          u[idx] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]) * N;
          v[idx] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]) * N;
        }
      }
      setBnd(1, u); setBnd(2, v);
    }

    function advect(b, d, d0, u, v, dt) {
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          const idx = IX(i, j);
          let x = i - dt * N * u[idx];
          let y = j - dt * N * v[idx];
          if (x < 0.5) x = 0.5; if (x > N - 1.5) x = N - 1.5;
          if (y < 0.5) y = 0.5; if (y > N - 1.5) y = N - 1.5;
          const i0 = (x | 0), i1 = i0 + 1;
          const j0 = (y | 0), j1 = j0 + 1;
          const s1 = x - i0, s0 = 1 - s1;
          const t1 = y - j0, t0 = 1 - t1;
          d[idx] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
                   s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
        }
      }
      setBnd(b, d);
    }

    // ── Offscreen low-res density canvas (scaled up + smoothed) ─
    const off = document.createElement('canvas');
    off.width = N;
    off.height = N;
    const offCtx = off.getContext('2d', { willReadFrequently: true });
    const img = offCtx.createImageData(N, N);
    const data = img.data;

    // ── Mouse source ─────────────────────────────────────────
    const mouse = { x: width / 2, y: height / 2, active: false };
    let lastX = width / 2, lastY = height / 2;
    let timeout = null;

    function handlePointer(cx, cy) {
      const vx = cx - lastX, vy = cy - lastY;
      lastX = cx; lastY = cy;
      mouse.x = cx; mouse.y = cy; mouse.active = true;
      const i = Math.min(Math.max((cx / width) * (N - 2) + 1 | 0, 1), N - 2);
      const j = Math.min(Math.max((cy / height) * (N - 2) + 1 | 0, 1), N - 2);
      const idx = IX(i, j);
      su[idx] += vx * 9;
      sv[idx] += vy * 9;
      sd[idx] += 130;
      clearTimeout(timeout);
      timeout = setTimeout(() => { mouse.active = false; }, 600);
    }
    window.addEventListener('mousemove', e => handlePointer(e.clientX, e.clientY));
    window.addEventListener('touchmove', e => {
      if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    // ── Ambient puffs so the fluid is alive without input ────
    let spawnTimer = 0;

    function step() {
      // Velocity step (Stam stable fluids)
      u0.set(u); v0.set(v);
      for (let k = 0; k < size; k++) {
        u0[k] += su[k]; v0[k] += sv[k]; su[k] = 0; sv[k] = 0;
      }
      diffuse(1, u, u0, dt, visc);
      diffuse(2, v, v0, dt, visc);
      project(u, v, u0, v0);
      u0.set(u); v0.set(v);
      advect(1, u, u0, u0, v0, dt);
      advect(2, v, v0, u0, v0, dt);
      project(u, v, u0, v0);

      // Density step
      dens0.set(dens);
      for (let k = 0; k < size; k++) {
        dens0[k] += sd[k]; sd[k] = 0;
      }
      diffuse(0, dens, dens0, dt, diff);
      dens0.set(dens);
      advect(0, dens, dens0, u, v, dt);

      // Slight decay so smoke doesn't saturate to solid
      for (let k = 0; k < size; k++) dens[k] *= 0.982;
    }

    function render() {
      const r = rgb.r, g = rgb.g, b = rgb.b;
      for (let k = 0; k < size; k++) {
        let d = dens[k];
        if (d < 0.02) d = 0;
        const alpha = Math.min(1, d * 0.5);
        const base = k * 4;
        data[base] = r;
        data[base + 1] = g;
        data[base + 2] = b;
        data[base + 3] = alpha * 255;
      }
      offCtx.putImageData(img, 0, 0);

      // Draw the low-res density field scaled up with bilinear
      // smoothing -> soft, continuous, fluid-like smoke.
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(off, 0, 0, width, height);
      ctx.restore();

      // Ambient puff so it's never completely blank on load
      spawnTimer++;
      if (spawnTimer > 24) {
        spawnTimer = 0;
        const sx = Math.random() * width;
        const sy = height * (0.5 + Math.random() * 0.4);
        const i = Math.min(Math.max((sx / width) * (N - 2) + 1 | 0, 1), N - 2);
        const j = Math.min(Math.max((sy / height) * (N - 2) + 1 | 0, 1), N - 2);
        dens[IX(i, j)] += 55;
      }
    }

    // Seed a little initial density so it isn't blank on first load
    for (let k = 0; k < size; k++) dens[k] = Math.random() * 4;

    let time = 0;
    function loop(now) {
      if (currentMode !== 'smoke') return;
      time += 0.016;
      step();
      render();
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
