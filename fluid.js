/* ============================================================
   POMODORO — Background Atmospheric Simulation Engine
   Modes:
     1. 'smoke'      — Real grid-based Navier–Stokes fluid dynamics
     2. 'waves'      — Harmonic Undulating Waves & Ripples
     3. 'embers'     — Cosmic Embers / Star Drift
     4. 'none'       — Pure Dark Void (Zero GPU/CPU)
     5. 'thermal'    — Very slow thermal heat-map gradient field
     6. 'cotton'     — Soft puffy cotton drifting slowly upward
     7. 'ripples'    — Slow expanding concentric rings
     8. 'trees'      — Minimalist silhouettes swaying in the wind
     9. 'horizon'    — Slow moving color band across the screen
    10. 'sand'       — Slow flowing sand dune lines
    11. 'ribbon'     — Slow flowing metallic ribbon
    12. 'sonar'      — Slow expanding concentric rings from center
    13. 'prisms'     — Slow rotating translucent geometric prisms
    14. 'clouds'     — Slow drifting minimalist clouds
    15. 'silk'       — Slow flowing fabric-like silk ribbons
    16. 'sunset'     — Slow color gradient sky
    17. 'mountains'  — Slowly zooming past layered mountain silhouettes
    18. 'lava'       — Slow floating lava-lamp blobs
   Visible, high-contrast, responsive, 100% crash-proof
   All non-'none' modes are intentionally SLOW for focus/study.
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

  // ── Helpers ───────────────────────────────────────────────────
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

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

  // ── Palette derived from accent color ─────────────────────────
  function accentRgba(alpha = 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }
  function accentSoft(alpha = 0.15) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }
  function complement() {
    // Rotate hue ~180° for a subtle complementary wash
    const h = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const c = hslToRgb((h.h + 180) % 360, h.s, h.l);
    return `rgba(${c.r}, ${c.g}, ${c.b}, 0.12)`;
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s, l };
  }
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  // ── Resize handler helper ─────────────────────────────────────
  function setupResize(cb) {
    const onResize = () => {
      if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
      cb && cb();
    };
    window.addEventListener('resize', onResize, { passive: true });
    return onResize;
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Real Fluid Dynamics ('smoke') — Navier–Stokes solver
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

    const N = 80;
    const size = N * N;
    const dt = 0.05;
    const diff = 0.0004;
    const visc = 0.0004;

    const u = new Float32Array(size);
    const v = new Float32Array(size);
    const u0 = new Float32Array(size);
    const v0 = new Float32Array(size);
    const dens = new Float32Array(size);
    const dens0 = new Float32Array(size);
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

    const off = document.createElement('canvas');
    off.width = N;
    off.height = N;
    const offCtx = off.getContext('2d', { willReadFrequently: true });
    const img = offCtx.createImageData(N, N);
    const data = img.data;

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

    let spawnTimer = 0;

    function step() {
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

      dens0.set(dens);
      for (let k = 0; k < size; k++) {
        dens0[k] += sd[k]; sd[k] = 0;
      }
      diffuse(0, dens, dens0, dt, diff);
      dens0.set(dens);
      advect(0, dens, dens0, u, v, dt);
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

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(off, 0, 0, width, height);
      ctx.restore();

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
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    let mouse = { x: width / 2, y: height / 2 };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    let t = 0;
    function loop() {
      if (currentMode !== 'waves') return;
      t += 0.012; // slower

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const layers = 5;
      for (let i = 0; i < layers; i++) {
        const p = i / (layers - 1);
        const yBase = height * (0.35 + p * 0.5);
        const speed = (i + 1) * 0.4;
        const waveH = 30 + i * 14;
        const alpha = 0.06 + p * 0.1;

        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 16) {
          const mDist = Math.hypot(x - mouse.x, yBase - mouse.y);
          const mRipple = Math.exp(-mDist / 260) * 45;
          const y = yBase
            + Math.sin(x * 0.004 + t * speed) * waveH
            + Math.cos(x * 0.008 - t * 0.35) * (waveH * 0.5)
            + mRipple;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, yBase - waveH, 0, height);
        grad.addColorStop(0, accentSoft(alpha));
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
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        size: 2.0 + Math.random() * 3.5,
        alpha: 0.3 + Math.random() * 0.4,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let mouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    let t = 0;
    function loop() {
      if (currentMode !== 'embers') return;
      t += 0.015;

      ctx.fillStyle = 'rgba(10, 10, 10, 0.35)';
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 220 && dist > 10) {
          const force = (220 - dist) / 220 * 0.5;
          p.vx += (-dy / dist) * force;
          p.vy += (dx / dist) * force;
        }

        p.x += p.vx + Math.sin(t + p.pulseOffset) * 0.25;
        p.y += p.vy;
        p.vx *= 0.985;
        if (p.vy > -0.15) p.vy -= 0.01;

        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const curAlpha = p.alpha * (0.6 + 0.4 * Math.sin(t * 1.5 + p.pulseOffset));

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        grad.addColorStop(0, `rgba(${Math.min(255, rgb.r + 40)}, ${Math.min(255, rgb.g + 25)}, ${rgb.b}, ${curAlpha})`);
        grad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${curAlpha * 0.6})`);
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
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

  // ─────────────────────────────────────────────────────────────
  // 5. Thermal Heat Map ('thermal') — slow shifting gradient noise
  // ─────────────────────────────────────────────────────────────
  function startThermal() {
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

    // Low-res noise grid
    const res = 40;
    const cols = Math.ceil(width / res) + 1;
    const rows = Math.ceil(height / res) + 1;
    const grid = new Float32Array(cols * rows);
    const next = new Float32Array(cols * rows);

    for (let i = 0; i < cols * rows; i++) grid[i] = Math.random();

    let t = 0;
    function loop() {
      if (currentMode !== 'thermal') return;
      t += 0.008; // very slow

      // Evolve noise field slowly
      for (let j = 1; j < rows - 1; j++) {
        for (let i = 1; i < cols - 1; i++) {
          const idx = i + j * cols;
          const avg = (grid[idx - 1] + grid[idx + 1] + grid[idx - cols] + grid[idx + cols]) / 4;
          next[idx] = avg + (Math.random() - 0.5) * 0.02;
        }
      }
      const tmp = grid; grid.set(next); next.set(tmp);

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Draw interpolated heat map
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const v00 = grid[i + j * cols];
          const v10 = grid[i + 1 + j * cols];
          const v01 = grid[i + (j + 1) * cols];
          const v11 = grid[i + 1 + (j + 1) * cols];

          const cx = i * res;
          const cy = j * res;
          const cw = res;
          const ch = res;

          // Sample corners for a bilinear-ish quad
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + cw, cy);
          ctx.lineTo(cx + cw, cy + ch);
          ctx.lineTo(cx, cy + ch);
          ctx.closePath();

          const avg = (v00 + v10 + v01 + v11) / 4;
          const hue = clamp(avg * 360, 0, 360);
          const c = hslToRgb(hue, 0.6, 0.35);
          ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.25)`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Cotton ('cotton') — soft puffy particles drifting upward
  // ─────────────────────────────────────────────────────────────
  function startCotton() {
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

    const puffs = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      puffs.push({
        x: Math.random() * width,
        y: height + Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.4,
        size: 40 + Math.random() * 80,
        alpha: 0.15 + Math.random() * 0.2,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.001 + Math.random() * 0.002,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'cotton') return;
      t += 0.01;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const p of puffs) {
        p.x += p.vx + Math.sin(t * p.swaySpeed + p.sway) * 0.5;
        p.y += p.vy;
        p.sway += p.swaySpeed;

        if (p.y < -100) { p.y = height + 100; p.x = Math.random() * width; }
        if (p.x < -100) p.x = width + 100;
        if (p.x > width + 100) p.x = -100;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        const a = p.alpha * (0.7 + 0.3 * Math.sin(t + p.sway));
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`);
        grad.addColorStop(0.6, `rgba(${Math.floor(rgb.r * 0.8)}, ${Math.floor(rgb.g * 0.8)}, ${Math.floor(rgb.b * 0.8)}, ${a * 0.5})`);
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. Ripples ('ripples') — slow expanding concentric rings
  // ─────────────────────────────────────────────────────────────
  function startRipples() {
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

    const rings = [];
    let spawn = 0;

    function loop() {
      if (currentMode !== 'ripples') return;
      t_local += 0.006;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      spawn++;
      if (spawn > 180) { // spawn every ~3 seconds at 60fps
        spawn = 0;
        rings.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0,
          maxR: Math.max(width, height) * 0.7,
          alpha: 0.12,
        });
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.r += 0.6; // slow expansion
        r.alpha -= 0.0008;
        if (r.alpha <= 0 || r.r > r.maxR) { rings.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${r.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animId = requestAnimationFrame(loop);
    }

    let t_local = 0;
    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 8. Trees ('trees') — minimalist silhouettes swaying in wind
  // ─────────────────────────────────────────────────────────────
  function startTrees() {
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

    const trees = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      trees.push({
        x: (i / count) * width + width / (count * 2),
        y: height * 0.65,
        h: 120 + Math.random() * 100,
        w: 40 + Math.random() * 30,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.0008 + Math.random() * 0.001,
        swayAmp: 3 + Math.random() * 5,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'trees') return;
      t += 0.01;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Ground line
      ctx.strokeStyle = accentSoft(0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      ctx.lineTo(width, height * 0.65);
      ctx.stroke();

      for (const tr of trees) {
        const sway = Math.sin(t * tr.swaySpeed + tr.sway) * tr.swayAmp;
        const cx = tr.x + sway;

        ctx.save();
        ctx.translate(cx, tr.y);

        // Trunk
        ctx.fillStyle = accentSoft(0.4);
        ctx.fillRect(-tr.w * 0.15, -tr.h * 0.5, tr.w * 0.3, tr.h * 0.5);

        // Foliage (minimalist rounded top)
        ctx.beginPath();
        ctx.arc(0, -tr.h * 0.65, tr.w * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = accentSoft(0.25);
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 9. Horizon ('horizon') — slow moving color band across screen
  // ─────────────────────────────────────────────────────────────
  function startHorizon() {
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

    let t = 0;
    function loop() {
      if (currentMode !== 'horizon') return;
      t += 0.005;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const y = height * 0.5 + Math.sin(t * 0.3) * 60;
      const h = 80 + Math.sin(t * 0.5) * 30;

      // Gradient band
      const grad = ctx.createLinearGradient(0, y - h, 0, y + h);
      grad.addColorStop(0, 'rgba(10, 10, 10, 0)');
      grad.addColorStop(0.4, accentSoft(0.15));
      grad.addColorStop(0.5, accentSoft(0.35));
      grad.addColorStop(0.6, accentSoft(0.15));
      grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, y - h, width, h * 2);

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 10. Sand Dune ('sand') — slow flowing sand lines
  // ─────────────────────────────────────────────────────────────
  function startSand() {
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

    const lines = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      lines.push({
        y: (i / count) * height,
        xOff: 0,
        speed: 0.1 + Math.random() * 0.2,
        amp: 60 + Math.random() * 80,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'sand') return;
      t += 0.008;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = accentSoft(0.25);
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';

      for (const ln of lines) {
        ln.xOff += ln.speed;
        ctx.beginPath();
        ctx.moveTo(0, ln.y);
        for (let x = 0; x <= width; x += 20) {
          const yy = ln.y + Math.sin(x * 0.01 + ln.xOff + ln.phase) * ln.amp;
          ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 11. Metallic Ribbon ('ribbon') — slow flowing metallic band
  // ─────────────────────────────────────────────────────────────
  function startRibbon() {
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

    let t = 0;
    function loop() {
      if (currentMode !== 'ribbon') return;
      t += 0.006;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const y = height * 0.5 + Math.sin(t * 0.4) * 40;
      const thickness = 12 + Math.sin(t * 0.7) * 6;

      // Metallic gradient
      const grad = ctx.createLinearGradient(0, y - thickness, 0, y + thickness);
      grad.addColorStop(0, 'rgba(10, 10, 10, 0)');
      grad.addColorStop(0.3, accentSoft(0.2));
      grad.addColorStop(0.5, accentSoft(0.5));
      grad.addColorStop(0.7, accentSoft(0.2));
      grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

      // Flowing ribbon path
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= width; x += 30) {
        const yy = y + Math.sin(x * 0.005 + t) * 15 + Math.cos(x * 0.01 + t * 0.5) * 8;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(width, y + thickness);
      for (let x = width; x >= 0; x -= 30) {
        const yy = y + thickness + Math.sin(x * 0.005 + t) * 15 + Math.cos(x * 0.01 + t * 0.5) * 8;
        ctx.lineTo(x, yy);
      }
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();

      // Highlight edge
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= width; x += 30) {
        const yy = y + Math.sin(x * 0.005 + t) * 15 + Math.cos(x * 0.01 + t * 0.5) * 8;
        ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 12. Sonar ('sonar') — slow expanding rings from center
  // ─────────────────────────────────────────────────────────────
  function startSonar() {
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

    const rings = [];
    let spawn = 0;
    const cx = width / 2;
    const cy = height / 2;

    function loop() {
      if (currentMode !== 'sonar') return;
      spawn++;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      if (spawn > 200) {
        spawn = 0;
        rings.push({ r: 0, alpha: 0.18 });
      }

      const maxR = Math.max(width, height) * 0.9;

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.r += 0.5;
        r.alpha -= 0.0006;
        if (r.alpha <= 0 || r.r > maxR) { rings.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(cx, cy, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${r.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Center dot pulse
        if (r.r < 30) {
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fillStyle = accentRgba(0.6);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 13. Prisms ('prisms') — slow rotating translucent geometric prisms
  // ─────────────────────────────────────────────────────────────
  function startPrisms() {
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

    const prisms = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      prisms.push({
        x: width / 2 + (Math.random() - 0.5) * width * 0.6,
        y: height / 2 + (Math.random() - 0.5) * height * 0.6,
        size: 40 + Math.random() * 80,
        sides: 3 + Math.floor(Math.random() * 4), // 3-6 sides
        angle: Math.random() * Math.PI * 2,
        speed: 0.0005 + Math.random() * 0.001,
        orbit: Math.random() * Math.PI * 2,
        orbitSpeed: 0.0003 + Math.random() * 0.0007,
        dist: 50 + Math.random() * 150,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'prisms') return;
      t += 0.01;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (const p of prisms) {
        p.angle += p.speed;
        p.orbit += p.orbitSpeed;
        const ox = cx + Math.cos(p.orbit) * p.dist * 0.3;
        const oy = cy + Math.sin(p.orbit) * p.dist * 0.3;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(p.angle);

        ctx.beginPath();
        for (let s = 0; s <= p.sides; s++) {
          const a = (s / p.sides) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
        }
        ctx.closePath();

        const alpha = 0.08 + 0.05 * Math.sin(t + p.angle);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 14. Clouds ('clouds') — slow drifting minimalist clouds
  // ─────────────────────────────────────────────────────────────
  function startClouds() {
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

    const clouds = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      clouds.push({
        x: Math.random() * width,
        y: height * (0.2 + Math.random() * 0.5),
        vx: 0.2 + Math.random() * 0.4,
        size: 60 + Math.random() * 100,
        alpha: 0.1 + Math.random() * 0.15,
        shapeOffset: Math.random() * Math.PI * 2,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'clouds') return;
      t += 0.008;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const c of clouds) {
        c.x += c.vx;
        if (c.x > width + 150) c.x = -150;

        ctx.save();
        ctx.translate(c.x, c.y);

        // Minimalist cloud: overlapping circles
        const parts = 5;
        for (let p = 0; p < parts; p++) {
          const a = (p / parts) * Math.PI * 2 + c.shapeOffset;
          const px = Math.cos(a) * c.size * 0.4;
          const py = Math.sin(a) * c.size * 0.2;
          const ps = c.size * (0.5 + 0.5 * Math.sin(p + t * 0.1));

          ctx.beginPath();
          ctx.arc(px, py, ps, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${c.alpha * (0.6 + 0.4 * Math.sin(t + p))})`;
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 15. Silk ('silk') — slow flowing fabric-like silk ribbons
  // ─────────────────────────────────────────────────────────────
  function startSilk() {
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

    const ribbons = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      ribbons.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        len: 100 + Math.random() * 200,
        width: 10 + Math.random() * 20,
        angle: Math.random() * Math.PI * 2,
        speed: 0.001 + Math.random() * 0.002,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'silk') return;
      t += 0.008;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const rb of ribbons) {
        rb.x += rb.vx + Math.sin(t * rb.speed + rb.phase) * 0.3;
        rb.y += rb.vy + Math.cos(t * rb.speed + rb.phase) * 0.3;
        rb.angle += rb.speed * 0.5;

        if (rb.x < -50) rb.x = width + 50;
        if (rb.x > width + 50) rb.x = -50;
        if (rb.y < -50) rb.y = height + 50;
        if (rb.y > height + 50) rb.y = -50;

        ctx.save();
        ctx.translate(rb.x, rb.y);
        ctx.rotate(rb.angle);

        const grad = ctx.createLinearGradient(-rb.len / 2, 0, rb.len / 2, 0);
        grad.addColorStop(0, 'rgba(10, 10, 10, 0)');
        grad.addColorStop(0.3, accentSoft(0.15));
        grad.addColorStop(0.5, accentSoft(0.3));
        grad.addColorStop(0.7, accentSoft(0.15));
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(-rb.len / 2, -rb.width / 2, rb.len, rb.width);

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 16. Sunset ('sunset') — slow color gradient sky
  // ─────────────────────────────────────────────────────────────
  function startSunset() {
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

    let t = 0;
    function loop() {
      if (currentMode !== 'sunset') return;
      t += 0.004;

      // Slow gradient shift
      const c1 = hslToRgb((200 + Math.sin(t) * 30) % 360, 0.5, 0.2);
      const c2 = hslToRgb((300 + Math.cos(t) * 20) % 360, 0.6, 0.25);
      const c3 = hslToRgb((40 + Math.sin(t * 0.5) * 20) % 360, 0.7, 0.3);

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.4)`);
      grad.addColorStop(0.5, `rgba(${c2.r}, ${c2.g}, ${c2.b}, 0.3)`);
      grad.addColorStop(1, `rgba(${c3.r}, ${c3.g}, ${c3.b}, 0.4)`);

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle sun/moon
      const sunX = width * (0.3 + Math.sin(t * 0.2) * 0.1);
      const sunY = height * (0.4 + Math.cos(t * 0.3) * 0.1);
      ctx.beginPath();
      ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
      ctx.fillStyle = accentSoft(0.4);
      ctx.fill();

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 17. Mountains ('mountains') — slowly zooming past layered silhouettes
  // ─────────────────────────────────────────────────────────────
  function startMountains() {
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

    const layers = [];
    const layerCount = 5;
    for (let i = 0; i < layerCount; i++) {
      layers.push({
        y: height * (0.55 + i * 0.08),
        speed: 0.05 + i * 0.03,
        offset: Math.random() * 1000,
        color: accentSoft(0.08 + i * 0.05),
        peakCount: 6 + i * 2,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'mountains') return;
      t += 0.005;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const layer of layers) {
        layer.offset -= layer.speed;

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 40) {
          const yy = layer.y + Math.sin((x + layer.offset) * 0.003) * (40 + layer.peakCount * 5);
          ctx.lineTo(x, yy);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────
  // 18. Lava Lamp ('lava') — slow floating blobs
  // ─────────────────────────────────────────────────────────────
  function startLava() {
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

    const blobs = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      blobs.push({
        x: Math.random() * width,
        y: height + Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.15 - Math.random() * 0.25,
        size: 40 + Math.random() * 60,
        phase: Math.random() * Math.PI * 2,
        speed: 0.001 + Math.random() * 0.002,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'lava') return;
      t += 0.008;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const b of blobs) {
        b.x += b.vx + Math.sin(t * b.speed + b.phase) * 0.4;
        b.y += b.vy;
        b.phase += b.speed * 0.3;

        if (b.y < -100) { b.y = height + 100; b.x = Math.random() * width; }
        if (b.x < -100) b.x = width + 100;
        if (b.x > width + 100) b.x = -100;

        // Wobbly blob shape
        ctx.beginPath();
        const segments = 12;
        for (let s = 0; s <= segments; s++) {
          const a = (s / segments) * Math.PI * 2;
          const wobble = Math.sin(s * 0.8 + t * 0.5 + b.phase) * 8;
          const px = b.x + Math.cos(a) * (b.size + wobble);
          const py = b.y + Math.sin(a) * (b.size + wobble);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const alpha = 0.15 + 0.1 * Math.sin(t + b.phase);
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size);
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
  // Mode dispatch
  // ─────────────────────────────────────────────────────────────
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
    else if (currentMode === 'none') startNone();
    else if (currentMode === 'thermal') startThermal();
    else if (currentMode === 'cotton') startCotton();
    else if (currentMode === 'ripples') startRipples();
    else if (currentMode === 'trees') startTrees();
    else if (currentMode === 'horizon') startHorizon();
    else if (currentMode === 'sand') startSand();
    else if (currentMode === 'ribbon') startRibbon();
    else if (currentMode === 'sonar') startSonar();
    else if (currentMode === 'prisms') startPrisms();
    else if (currentMode === 'clouds') startClouds();
    else if (currentMode === 'silk') startSilk();
    else if (currentMode === 'sunset') startSunset();
    else if (currentMode === 'mountains') startMountains();
    else if (currentMode === 'lava') startLava();
    else startNone();
  }

  function setColor(hex) {
    currentHex = hex || '#dc143c';
    rgb = hexToRgb(currentHex);
    try { localStorage.setItem('pomodoro_accent_color', currentHex); } catch (_) {}
    // Restart current mode to pick up new color
    if (currentMode !== 'none') {
      const m = currentMode;
      stopCurrent();
      switchMode(m);
    }
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
