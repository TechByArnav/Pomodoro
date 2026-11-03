/* ============================================================
   POMODORO — Background Atmospheric Simulation Engine
   Modes:
     1. 'smoke'      — Real grid-based Navier–Stokes fluid dynamics
     2. 'waves'      — Harmonic undulating waves & ripples
     3. 'embers'     — Cosmic embers / star drift
     4. 'none'       — Pure dark void
     5. 'thermal'    — Slow shifting heat-map gradient field
     6. 'cotton'     — Soft fluffy puffs drifting upward
     7. 'ripples'    — Slow expanding concentric rings from random points
     8. 'trees'      — Minimalist tree silhouettes swaying in wind
     9. 'horizon'    — Single slow-moving color band across screen
    10. 'sand'       — Rolling sand dune silhouettes, layered parallax
    11. 'ribbon'     — Elegant flowing metallic ribbon
    12. 'sonar'      — Slow pulsing concentric rings from center
    13. 'prisms'     — Slow rotating translucent geometric prisms
    14. 'clouds'     — Soft fluffy clouds drifting slowly
    15. 'silk'       — Flowing silk fabric ribbons
    16. 'sunset'     — Slow color gradient sky
    17. 'mountains'  — Layered mountain silhouettes, slow parallax
    18. 'lava'       — Slow organic lava-lamp blobs
   All non-'none' modes are intentionally SLOW, minimalist, and
   derive their color from the accent color. Non-distracting.
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

  // Palette derived from accent color
  function accentRgba(alpha) { return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`; }
  function accentSoft(alpha) { return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`; }

  function complementRgba(alpha = 0.12) {
    const h = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const c = hslToRgb((h.h + 180) % 360, h.s * 0.6, h.l * 0.7);
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
  }

  // ── 1. Real Fluid Dynamics ('smoke') — Navier–Stokes ─────────
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
    const dt = 0.04;
    const diff = 0.0003;
    const visc = 0.0003;

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
      for (let iter = 0; iter < 15; iter++) {
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
      su[idx] += vx * 8;
      sv[idx] += vy * 8;
      sd[idx] += 100;
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
      for (let k = 0; k < size; k++) dens[k] *= 0.985;
    }

    function render() {
      const r = rgb.r, g = rgb.g, b = rgb.b;
      for (let k = 0; k < size; k++) {
        let d = dens[k];
        if (d < 0.02) d = 0;
        const alpha = Math.min(0.4, d * 0.35);
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
      ctx.globalAlpha = 0.9;
      ctx.drawImage(off, 0, 0, width, height);
      ctx.restore();

      spawnTimer++;
      if (spawnTimer > 30) {
        spawnTimer = 0;
        const sx = Math.random() * width;
        const sy = height * (0.5 + Math.random() * 0.4);
        const i = Math.min(Math.max((sx / width) * (N - 2) + 1 | 0, 1), N - 2);
        const j = Math.min(Math.max((sy / height) * (N - 2) + 1 | 0, 1), N - 2);
        dens[IX(i, j)] += 45;
      }
    }

    for (let k = 0; k < size; k++) dens[k] = Math.random() * 3;

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

  // ── 2. Harmonic Waves ('waves') ──────────────────────────────
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
      t += 0.01;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const layers = 6;
      for (let i = 0; i < layers; i++) {
        const p = i / (layers - 1);
        const yBase = height * (0.4 + p * 0.45);
        const speed = (i + 1) * 0.35;
        const waveH = 25 + i * 12;
        const alpha = 0.05 + p * 0.08;

        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 18) {
          const mDist = Math.hypot(x - mouse.x, yBase - mouse.y);
          const mRipple = Math.exp(-mDist / 240) * 40;
          const y = yBase
            + Math.sin(x * 0.004 + t * speed) * waveH
            + Math.cos(x * 0.007 - t * 0.3) * (waveH * 0.45)
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

  // ── 3. Embers ('embers') ─────────────────────────────────────
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
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.15 - Math.random() * 0.35,
        size: 1.5 + Math.random() * 3,
        alpha: 0.25 + Math.random() * 0.35,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let mouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    let t = 0;
    function loop() {
      if (currentMode !== 'embers') return;
      t += 0.012;

      ctx.fillStyle = 'rgba(10, 10, 10, 0.35)';
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 200 && dist > 10) {
          const force = (200 - dist) / 200 * 0.4;
          p.vx += (-dy / dist) * force;
          p.vy += (dx / dist) * force;
        }

        p.x += p.vx + Math.sin(t + p.pulseOffset) * 0.2;
        p.y += p.vy;
        p.vx *= 0.985;
        if (p.vy > -0.1) p.vy -= 0.008;

        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const curAlpha = p.alpha * (0.55 + 0.45 * Math.sin(t * 1.4 + p.pulseOffset));

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
        grad.addColorStop(0, `rgba(${Math.min(255, rgb.r + 35)}, ${Math.min(255, rgb.g + 20)}, ${rgb.b}, ${curAlpha})`);
        grad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${curAlpha * 0.5})`);
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 4. Static Void ('none') ──────────────────────────────────
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

  // ── 5. Thermal Heat Map ('thermal') ──────────────────────────
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

    const res = 50;
    const cols = Math.ceil(width / res) + 1;
    const rows = Math.ceil(height / res) + 1;
    const grid = new Float32Array(cols * rows);
    const next = new Float32Array(cols * rows);

    for (let i = 0; i < cols * rows; i++) grid[i] = Math.random();

    let t = 0;
    function loop() {
      if (currentMode !== 'thermal') return;
      t += 0.006;

      // Slowly evolve noise field
      for (let j = 1; j < rows - 1; j++) {
        for (let i = 1; i < cols - 1; i++) {
          const idx = i + j * cols;
          const avg = (grid[idx - 1] + grid[idx + 1] + grid[idx - cols] + grid[idx + cols]) / 4;
          next[idx] = clamp(avg + (Math.random() - 0.5) * 0.015, 0, 1);
        }
      }
      const tmp = grid; grid.set(next); next.set(tmp);

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Draw smooth interpolated quads
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

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + cw, cy);
          ctx.lineTo(cx + cw, cy + ch);
          ctx.lineTo(cx, cy + ch);
          ctx.closePath();

          const avg = (v00 + v10 + v01 + v11) / 4;
          // Map 0-1 to a subtle accent-based gradient
          const baseH = rgbToHsl(rgb.r, rgb.g, rgb.b).h;
          const hue = clamp(baseH + (avg - 0.5) * 60, 0, 360);
          const col = hslToRgb(hue, 0.4, 0.25 + avg * 0.15);
          ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.18)`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 6. Cotton Drift ('cotton') ───────────────────────────────
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
    const count = 30;
    for (let i = 0; i < count; i++) {
      puffs.push({
        x: Math.random() * width,
        y: height + Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.3,
        size: 50 + Math.random() * 90,
        alpha: 0.12 + Math.random() * 0.18,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.0008 + Math.random() * 0.0012,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'cotton') return;
      t += 0.008;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const p of puffs) {
        p.x += p.vx + Math.sin(t * p.swaySpeed + p.sway) * 0.4;
        p.y += p.vy;
        p.sway += p.swaySpeed;

        if (p.y < -120) { p.y = height + 120; p.x = Math.random() * width; }
        if (p.x < -120) p.x = width + 120;
        if (p.x > width + 120) p.x = -120;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        const a = p.alpha * (0.6 + 0.4 * Math.sin(t + p.sway));
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`);
        grad.addColorStop(0.5, `rgba(${Math.floor(rgb.r * 0.85)}, ${Math.floor(rgb.g * 0.85)}, ${Math.floor(rgb.b * 0.85)}, ${a * 0.4})`);
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

  // ── 7. Ripples ('ripples') ───────────────────────────────────
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

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      spawn++;
      if (spawn > 240) {
        spawn = 0;
        rings.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0,
          maxR: Math.max(width, height) * 0.6,
          alpha: 0.1,
        });
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.r += 0.4;
        r.alpha -= 0.0005;
        if (r.alpha <= 0 || r.r > r.maxR) { rings.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${r.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 8. Trees ('trees') — minimalist pine silhouettes ─────────
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
    const count = 7;
    for (let i = 0; i < count; i++) {
      trees.push({
        x: (i / count) * width + width / (count * 1.5),
        baseY: height * 0.7,
        h: 100 + Math.random() * 80,
        w: 35 + Math.random() * 25,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.0006 + Math.random() * 0.0009,
        layers: 3 + Math.floor(Math.random() * 2),
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'trees') return;
      t += 0.01;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Subtle ground line
      ctx.strokeStyle = accentSoft(0.15);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.7);
      ctx.lineTo(width, height * 0.7);
      ctx.stroke();

      for (const tr of trees) {
        const sway = Math.sin(t * tr.swaySpeed + tr.sway) * 4;
        const cx = tr.x + sway;

        // Draw triangular pine layers from bottom to top
        for (let l = 0; l < tr.layers; l++) {
          const layerY = tr.baseY - tr.h * 0.1 - l * tr.h * 0.28;
          const layerW = tr.w * (1 - l * 0.25);

          ctx.beginPath();
          ctx.moveTo(cx - layerW * 0.5, layerY);
          ctx.lineTo(cx, layerY - layerW * 0.7);
          ctx.lineTo(cx + layerW * 0.5, layerY);
          ctx.closePath();

          const alpha = 0.12 + (l / tr.layers) * 0.15;
          ctx.fillStyle = accentSoft(alpha);
          ctx.fill();
        }

        // Trunk
        ctx.fillStyle = accentSoft(0.2);
        ctx.fillRect(cx - tr.w * 0.08, tr.baseY - tr.h * 0.08, tr.w * 0.16, tr.h * 0.1);
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 9. Horizon ('horizon') — slow color band ─────────────────
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
      t += 0.004;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const y = height * 0.55 + Math.sin(t * 0.25) * 50;
      const h = 100 + Math.sin(t * 0.45) * 40;

      const grad = ctx.createLinearGradient(0, y - h, 0, y + h);
      grad.addColorStop(0, 'rgba(10, 10, 10, 0)');
      grad.addColorStop(0.3, accentSoft(0.08));
      grad.addColorStop(0.5, accentSoft(0.22));
      grad.addColorStop(0.7, accentSoft(0.08));
      grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, y - h, width, h * 2);

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 10. Sand Dunes ('sand') — rolling dune silhouettes ───────
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

    const layers = [];
    const layerCount = 4;
    for (let i = 0; i < layerCount; i++) {
      layers.push({
        y: height * (0.62 + i * 0.09),
        speed: 0.02 + i * 0.015,
        offset: Math.random() * 2000,
        amp: 40 + i * 25,
        freq: 0.0015 + i * 0.0008,
        alpha: 0.08 + i * 0.05,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'sand') return;
      t += 0.005;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const layer of layers) {
        layer.offset += layer.speed;

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 30) {
          const yy = layer.y + Math.sin((x + layer.offset) * layer.freq) * layer.amp;
          ctx.lineTo(x, yy);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        ctx.fillStyle = accentSoft(layer.alpha);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 11. Metallic Ribbon ('ribbon') — flowing elegant band ────
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
      t += 0.005;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const y = height * 0.5 + Math.sin(t * 0.35) * 35;
      const thickness = 10 + Math.sin(t * 0.6) * 5;

      // Main ribbon band
      const grad = ctx.createLinearGradient(0, y - thickness, 0, y + thickness);
      grad.addColorStop(0, 'rgba(10, 10, 10, 0)');
      grad.addColorStop(0.25, accentSoft(0.18));
      grad.addColorStop(0.5, accentSoft(0.35));
      grad.addColorStop(0.75, accentSoft(0.18));
      grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

      // Flowing ribbon path
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= width; x += 40) {
        const yy = y + Math.sin(x * 0.004 + t) * 20 + Math.cos(x * 0.008 + t * 0.4) * 10;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(width, y + thickness);
      for (let x = width; x >= 0; x -= 40) {
        const yy = y + thickness + Math.sin(x * 0.004 + t) * 20 + Math.cos(x * 0.008 + t * 0.4) * 10;
        ctx.lineTo(x, yy);
      }
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle highlight edge
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= width; x += 40) {
        const yy = y + Math.sin(x * 0.004 + t) * 20 + Math.cos(x * 0.008 + t * 0.4) * 10;
        ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 12. Sonar ('sonar') — slow expanding rings from center ────
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

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      spawn++;
      if (spawn > 220) {
        spawn = 0;
        rings.push({ r: 0, alpha: 0.15 });
      }

      const maxR = Math.max(width, height) * 0.85;

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.r += 0.35;
        r.alpha -= 0.0005;
        if (r.alpha <= 0 || r.r > maxR) { rings.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(cx, cy, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${r.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Center dot
        if (r.r < 20) {
          ctx.beginPath();
          ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = accentRgba(0.5);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 13. Prisms ('prisms') — slow rotating translucent shapes ──
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
    const count = 5;
    for (let i = 0; i < count; i++) {
      prisms.push({
        x: width / 2 + (Math.random() - 0.5) * width * 0.5,
        y: height / 2 + (Math.random() - 0.5) * height * 0.5,
        size: 50 + Math.random() * 70,
        sides: 3 + Math.floor(Math.random() * 3),
        angle: Math.random() * Math.PI * 2,
        speed: 0.0004 + Math.random() * 0.0008,
        orbit: Math.random() * Math.PI * 2,
        orbitSpeed: 0.0002 + Math.random() * 0.0005,
        dist: 40 + Math.random() * 120,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'prisms') return;
      t += 0.008;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (const p of prisms) {
        p.angle += p.speed;
        p.orbit += p.orbitSpeed;
        const ox = cx + Math.cos(p.orbit) * p.dist * 0.25;
        const oy = cy + Math.sin(p.orbit) * p.dist * 0.25;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(p.angle);

        ctx.beginPath();
        for (let s = 0; s <= p.sides; s++) {
          const a = (s / p.sides) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
        }
        ctx.closePath();

        const alpha = 0.06 + 0.04 * Math.sin(t + p.angle);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 14. Clouds ('clouds') — soft fluffy clouds ───────────────
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
    const count = 8;
    for (let i = 0; i < count; i++) {
      clouds.push({
        x: Math.random() * width,
        y: height * (0.25 + Math.random() * 0.45),
        vx: 0.15 + Math.random() * 0.25,
        size: 80 + Math.random() * 120,
        alpha: 0.08 + Math.random() * 0.12,
        puffs: [],
      });
      // Generate puff positions for this cloud
      for (let p = 0; p < 6; p++) {
        clouds[i].puffs.push({
          dx: (Math.random() - 0.5) * clouds[i].size * 0.8,
          dy: (Math.random() - 0.5) * clouds[i].size * 0.4,
          s: 0.5 + Math.random() * 0.8,
        });
      }
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'clouds') return;
      t += 0.006;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const c of clouds) {
        c.x += c.vx;
        if (c.x > width + 200) c.x = -200;

        for (const puff of c.puffs) {
          const px = c.x + puff.dx;
          const py = c.y + puff.dy;
          const ps = c.size * puff.s;

          const grad = ctx.createRadialGradient(px, py, 0, px, py, ps);
          const a = c.alpha * (0.5 + 0.5 * Math.sin(t * 0.5 + puff.dx));
          grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`);
          grad.addColorStop(0.6, `rgba(${Math.floor(rgb.r * 0.8)}, ${Math.floor(rgb.g * 0.8)}, ${Math.floor(rgb.b * 0.8)}, ${a * 0.3})`);
          grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, ps, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 15. Silk ('silk') — flowing fabric ribbons ───────────────
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
    const count = 6;
    for (let i = 0; i < count; i++) {
      ribbons.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        len: 150 + Math.random() * 250,
        w: 12 + Math.random() * 18,
        angle: Math.random() * Math.PI * 2,
        speed: 0.0008 + Math.random() * 0.0015,
        phase: Math.random() * Math.PI * 2,
        waves: 3 + Math.floor(Math.random() * 4),
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'silk') return;
      t += 0.006;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const rb of ribbons) {
        rb.x += rb.vx + Math.sin(t * rb.speed + rb.phase) * 0.25;
        rb.y += rb.vy + Math.cos(t * rb.speed + rb.phase) * 0.25;
        rb.angle += rb.speed * 0.4;

        if (rb.x < -100) rb.x = width + 100;
        if (rb.x > width + 100) rb.x = -100;
        if (rb.y < -100) rb.y = height + 100;
        if (rb.y > height + 100) rb.y = -100;

        ctx.save();
        ctx.translate(rb.x, rb.y);
        ctx.rotate(rb.angle);

        // Draw ribbon as a wavy quad strip
        ctx.beginPath();
        ctx.moveTo(-rb.len / 2, 0);
        for (let s = 0; s <= rb.waves * 2; s++) {
          const x = -rb.len / 2 + (s / (rb.waves * 2)) * rb.len;
          const yTop = Math.sin(s * 0.4 + t * 0.5 + rb.phase) * 8;
          const yBot = Math.sin(s * 0.4 + t * 0.5 + rb.phase + Math.PI) * 8;
          if (s === 0) {
            ctx.lineTo(x, yTop);
            ctx.lineTo(x, yBot);
          } else {
            ctx.lineTo(x, yTop);
            ctx.lineTo(x, yBot);
          }
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(-rb.len / 2, 0, rb.len / 2, 0);
        grad.addColorStop(0, 'rgba(10, 10, 10, 0)');
        grad.addColorStop(0.3, accentSoft(0.12));
        grad.addColorStop(0.5, accentSoft(0.22));
        grad.addColorStop(0.7, accentSoft(0.12));
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 16. Sunset ('sunset') — slow gradient sky ────────────────
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
      t += 0.003;

      // Slow gradient shift derived from accent
      const baseH = rgbToHsl(rgb.r, rgb.g, rgb.b).h;
      const c1 = hslToRgb((baseH + 40 + Math.sin(t) * 20) % 360, 0.4, 0.18);
      const c2 = hslToRgb((baseH + 120 + Math.cos(t) * 15) % 360, 0.45, 0.2);
      const c3 = hslToRgb((baseH + 200 + Math.sin(t * 0.5) * 15) % 360, 0.5, 0.22);

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.35)`);
      grad.addColorStop(0.45, `rgba(${c2.r}, ${c2.g}, ${c2.b}, 0.25)`);
      grad.addColorStop(1, `rgba(${c3.r}, ${c3.g}, ${c3.b}, 0.35)`);

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle sun/moon glow
      const sunX = width * (0.35 + Math.sin(t * 0.15) * 0.08);
      const sunY = height * (0.42 + Math.cos(t * 0.25) * 0.06);
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
      sunGrad.addColorStop(0, accentSoft(0.25));
      sunGrad.addColorStop(0.6, accentSoft(0.05));
      sunGrad.addColorStop(1, 'rgba(10, 10, 10, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, height);

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 17. Mountains ('mountains') — layered silhouettes ────────
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
        y: height * (0.58 + i * 0.075),
        speed: 0.03 + i * 0.02,
        offset: Math.random() * 3000,
        amp: 35 + i * 18,
        freq: 0.0012 + i * 0.0006,
        alpha: 0.06 + i * 0.05,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'mountains') return;
      t += 0.004;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const layer of layers) {
        layer.offset -= layer.speed;

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 35) {
          const yy = layer.y + Math.sin((x + layer.offset) * layer.freq) * layer.amp;
          ctx.lineTo(x, yy);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        ctx.fillStyle = accentSoft(layer.alpha);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ── 18. Lava Lamp ('lava') — organic floating blobs ──────────
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
    const count = 5;
    for (let i = 0; i < count; i++) {
      blobs.push({
        x: Math.random() * width,
        y: height + Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.12 - Math.random() * 0.2,
        size: 50 + Math.random() * 70,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0008 + Math.random() * 0.0014,
        wobble: 0.02 + Math.random() * 0.04,
      });
    }

    let t = 0;
    function loop() {
      if (currentMode !== 'lava') return;
      t += 0.007;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      for (const b of blobs) {
        b.x += b.vx + Math.sin(t * b.speed + b.phase) * 0.35;
        b.y += b.vy;
        b.phase += b.speed * 0.25;

        if (b.y < -120) { b.y = height + 120; b.x = Math.random() * width; }
        if (b.x < -120) b.x = width + 120;
        if (b.x > width + 120) b.x = -120;

        // Organic wobbly blob shape
        ctx.beginPath();
        const segments = 14;
        for (let s = 0; s <= segments; s++) {
          const a = (s / segments) * Math.PI * 2;
          const wobble = Math.sin(s * 0.7 + t * b.wobble + b.phase) * 10;
          const r = b.size + wobble;
          const px = b.x + Math.cos(a) * r;
          const py = b.y + Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const alpha = 0.12 + 0.08 * Math.sin(t + b.phase);
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

  // ── Mode dispatch ─────────────────────────────────────────────
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
