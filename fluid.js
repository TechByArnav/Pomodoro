/* ============================================================
   POMODORO — Background Visual Simulation Engine
   Modes:
     1. 'smoke'  — WebGL Navier-Stokes Fluid / Gas Dynamics
     2. 'waves'  — Harmonic Undulating Waves & Ripples
     3. 'embers' — Cosmic Embers / Star Drift
     4. 'none'   — Pure Dark Void (Zero GPU/CPU)
   Fully customizable color palette & dynamic switching
   ============================================================ */

(function () {
  let currentMode = localStorage.getItem('pomodoro_fluid_mode') || 'smoke';
  let currentHex = localStorage.getItem('pomodoro_accent_color') || '#dc143c';

  let canvas = null;
  let activeAnimationId = null;

  // RGB color cache
  let rgbColor = hexToRgb(currentHex);

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16) || 0xdc143c;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      rf: ((num >> 16) & 255) / 255,
      gf: ((num >> 8) & 255) / 255,
      bf: (num & 255) / 255,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 1. WebGL Fluid Simulation ('smoke')
  // ─────────────────────────────────────────────────────────────
  let fluidInstance = null;

  function runSmokeSimulation() {
    stopCurrentSimulation();
    if (!canvas) canvas = document.getElementById('fluidCanvas');
    if (!canvas) return;

    let gl = canvas.getContext('webgl2');
    const isWebGL2 = !!gl;
    if (!gl) {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    }

    if (!gl) {
      runEmbersSimulation(); // fallback if WebGL not supported
      return;
    }

    let extHalfFloat, extHalfFloatLinear;
    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      extHalfFloatLinear = gl.getExtension('OES_texture_float_linear');
    } else {
      extHalfFloat = gl.getExtension('OES_texture_half_float');
      extHalfFloatLinear = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0.04, 0.04, 0.04, 1.0);

    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : (extHalfFloat ? extHalfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE);
    const rgbaFormat = isWebGL2 ? gl.RGBA16F : gl.RGBA;
    const rgFormat = isWebGL2 ? gl.RG16F : gl.RGBA;
    const rFormat = isWebGL2 ? gl.R16F : gl.RGBA;

    function createShader(type, source) {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    function createProgram(vsSource, fsSource) {
      const p = gl.createProgram();
      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return null;
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
      return p;
    }

    const baseVertexShader = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;

      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const displayShaderSource = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;

      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        vec3 bg = vec3(0.039, 0.039, 0.039);
        float dist = distance(vUv, vec2(0.5));
        float vig = smoothstep(0.9, 0.2, dist);
        vec3 finalColor = bg + c * vig;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const splatShaderSource = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;

      void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `;

    const advectionShaderSource = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;

      void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
        gl_FragColor.a = 1.0;
      }
    `;

    const divergenceShaderSource = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;

      void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;

    const curlShaderSource = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;

      void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `;

    const vorticityShaderSource = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;

      void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
      }
    `;

    const pressureShaderSource = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;

      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `;

    const gradientSubtractShaderSource = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;

      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `;

    const displayProgram = createProgram(baseVertexShader, displayShaderSource);
    const splatProgram = createProgram(baseVertexShader, splatShaderSource);
    const advectionProgram = createProgram(baseVertexShader, advectionShaderSource);
    const divergenceProgram = createProgram(baseVertexShader, divergenceShaderSource);
    const curlProgram = createProgram(baseVertexShader, curlShaderSource);
    const vorticityProgram = createProgram(baseVertexShader, vorticityShaderSource);
    const pressureProgram = createProgram(baseVertexShader, pressureShaderSource);
    const gradSubtractProgram = createProgram(baseVertexShader, gradientSubtractShaderSource);

    if (!displayProgram || !splatProgram || !advectionProgram) {
      runEmbersSimulation();
      return;
    }

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    function blit(target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
      gl.viewport(0, 0, target ? target.width : gl.drawingBufferWidth, target ? target.height : gl.drawingBufferHeight);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function createFBO(w, h, internalFormat, format, type, filter) {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      return {
        texture,
        fbo,
        width: w,
        height: h,
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        }
      };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, filter) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, filter);
      let fbo2 = createFBO(w, h, internalFormat, format, type, filter);
      return {
        width: w,
        height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        get read() { return fbo1; },
        set read(val) { fbo1 = val; },
        get write() { return fbo2; },
        set write(val) { fbo2 = val; },
        swap() {
          const tmp = fbo1;
          fbo1 = fbo2;
          fbo2 = tmp;
        }
      };
    }

    let dye, velocity, divergence, curl, pressure;

    function initFramebuffers() {
      const simW = 128;
      const simH = Math.round(simW * (canvas.height / canvas.width));
      const dyeW = 512;
      const dyeH = Math.round(dyeW * (canvas.height / canvas.width));
      const filter = extHalfFloatLinear ? gl.LINEAR : gl.NEAREST;

      dye = createDoubleFBO(dyeW, dyeH, rgbaFormat, gl.RGBA, halfFloatTexType, filter);
      velocity = createDoubleFBO(simW, simH, rgFormat, isWebGL2 ? gl.RG : gl.RGBA, halfFloatTexType, filter);
      divergence = createFBO(simW, simH, rFormat, isWebGL2 ? gl.RED : gl.RGBA, halfFloatTexType, gl.NEAREST);
      curl = createFBO(simW, simH, rFormat, isWebGL2 ? gl.RED : gl.RGBA, halfFloatTexType, gl.NEAREST);
      pressure = createDoubleFBO(simW, simH, rFormat, isWebGL2 ? gl.RED : gl.RGBA, halfFloatTexType, gl.NEAREST);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        initFramebuffers();
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function splat(x, y, dx, dy, color) {
      gl.useProgram(splatProgram);
      gl.uniform1i(gl.getUniformLocation(splatProgram, 'uTarget'), velocity.read.attach(0));
      gl.uniform1f(gl.getUniformLocation(splatProgram, 'aspectRatio'), canvas.width / canvas.height);
      gl.uniform2f(gl.getUniformLocation(splatProgram, 'point'), x, y);
      gl.uniform3f(gl.getUniformLocation(splatProgram, 'color'), dx, dy, 0.0);
      gl.uniform1f(gl.getUniformLocation(splatProgram, 'radius'), 0.18 / 100.0);
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(gl.getUniformLocation(splatProgram, 'uTarget'), dye.read.attach(0));
      gl.uniform3f(gl.getUniformLocation(splatProgram, 'color'), color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    function getTone() {
      const factor = 0.25 + Math.random() * 0.18;
      return {
        r: rgbColor.rf * factor,
        g: rgbColor.gf * factor,
        b: rgbColor.bf * factor,
      };
    }

    // Initial burst
    for (let i = 0; i < 4; i++) {
      const rx = 0.2 + Math.random() * 0.6;
      const ry = 0.2 + Math.random() * 0.6;
      const angle = Math.random() * Math.PI * 2;
      splat(rx, ry, Math.cos(angle) * 350, Math.sin(angle) * 350, getTone());
    }

    let prevMouseX = 0, prevMouseY = 0, isPointerActive = false;

    function onPointerMove(clientX, clientY) {
      const x = clientX / window.innerWidth;
      const y = 1.0 - (clientY / window.innerHeight);
      if (!isPointerActive) {
        prevMouseX = x;
        prevMouseY = y;
        isPointerActive = true;
        return;
      }
      const dx = (x - prevMouseX) * 4500;
      const dy = (y - prevMouseY) * 4500;
      if (Math.hypot(dx, dy) > 5) {
        splat(x, y, dx * 0.6, dy * 0.6, getTone());
      }
      prevMouseX = x;
      prevMouseY = y;
    }

    const mouseHandler = (e) => onPointerMove(e.clientX, e.clientY);
    const touchHandler = (e) => {
      if (e.touches.length > 0) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', mouseHandler);
    window.addEventListener('touchmove', touchHandler, { passive: true });

    let lastAutoSplat = Date.now();
    let ambientAngle = 0;
    let lastTime = performance.now();

    function frame(time) {
      if (currentMode !== 'smoke') return;

      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      ambientAngle += dt * 0.8;
      const cx = 0.5 + Math.cos(ambientAngle * 0.5) * 0.18;
      const cy = 0.5 + Math.sin(ambientAngle * 0.7) * 0.15;
      splat(cx, cy, Math.cos(ambientAngle) * 35, Math.sin(ambientAngle) * 35, {
        r: rgbColor.rf * 0.05,
        g: rgbColor.gf * 0.05,
        b: rgbColor.bf * 0.05,
      });

      const now = Date.now();
      if (now - lastAutoSplat > 3200) {
        lastAutoSplat = now;
        const rx = 0.25 + Math.random() * 0.5;
        const ry = 0.3 + Math.random() * 0.4;
        const dir = Math.random() * Math.PI * 2;
        splat(rx, ry, Math.cos(dir) * 140, Math.sin(dir) * 140, getTone());
      }

      // Step simulation
      gl.useProgram(curlProgram);
      gl.uniform2f(gl.getUniformLocation(curlProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(curlProgram, 'uVelocity'), velocity.read.attach(0));
      blit(curl);

      gl.useProgram(vorticityProgram);
      gl.uniform2f(gl.getUniformLocation(vorticityProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(vorticityProgram, 'uVelocity'), velocity.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(vorticityProgram, 'uCurl'), curl.attach(1));
      gl.uniform1f(gl.getUniformLocation(vorticityProgram, 'curl'), 25.0);
      gl.uniform1f(gl.getUniformLocation(vorticityProgram, 'dt'), dt);
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(divergenceProgram);
      gl.uniform2f(gl.getUniformLocation(divergenceProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(divergenceProgram, 'uVelocity'), velocity.read.attach(0));
      blit(divergence);

      gl.useProgram(pressureProgram);
      gl.uniform2f(gl.getUniformLocation(pressureProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(pressureProgram, 'uDivergence'), divergence.attach(0));
      for (let i = 0; i < 16; i++) {
        gl.uniform1i(gl.getUniformLocation(pressureProgram, 'uPressure'), pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gl.useProgram(gradSubtractProgram);
      gl.uniform2f(gl.getUniformLocation(gradSubtractProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(gradSubtractProgram, 'uPressure'), pressure.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(gradSubtractProgram, 'uVelocity'), velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(advectionProgram);
      gl.uniform2f(gl.getUniformLocation(advectionProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uVelocity'), velocity.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uSource'), velocity.read.attach(0));
      gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dt'), dt);
      gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dissipation'), 0.98);
      blit(velocity.write);
      velocity.swap();

      gl.uniform2f(gl.getUniformLocation(advectionProgram, 'texelSize'), dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uVelocity'), velocity.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uSource'), dye.read.attach(1));
      gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dissipation'), 0.985);
      blit(dye.write);
      dye.swap();

      gl.useProgram(displayProgram);
      gl.uniform1i(gl.getUniformLocation(displayProgram, 'uTexture'), dye.read.attach(0));
      blit(null);

      activeAnimationId = requestAnimationFrame(frame);
    }

    activeAnimationId = requestAnimationFrame(frame);

    fluidInstance = {
      cleanup() {
        window.removeEventListener('mousemove', mouseHandler);
        window.removeEventListener('touchmove', touchHandler);
        window.removeEventListener('resize', resize);
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Harmonic Waves Simulation ('waves')
  // ─────────────────────────────────────────────────────────────
  function runWavesSimulation() {
    stopCurrentSimulation();
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

    let t = 0;
    let mouse = { x: width / 2, y: height / 2, vx: 0, vy: 0 };

    function onPointerMove(x, y) {
      mouse.vx = (x - mouse.x) * 0.1;
      mouse.vy = (y - mouse.y) * 0.1;
      mouse.x = x;
      mouse.y = y;
    }
    const mouseHandler = (e) => onPointerMove(e.clientX, e.clientY);
    const touchHandler = (e) => {
      if (e.touches.length > 0) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener('mousemove', mouseHandler);
    window.addEventListener('touchmove', touchHandler, { passive: true });

    function frame() {
      if (currentMode !== 'waves') return;
      t += 0.012;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const layers = 5;
      for (let i = 0; i < layers; i++) {
        const progress = i / (layers - 1);
        const yBase = height * (0.35 + progress * 0.45);
        const speed = (i + 1) * 0.6;
        const waveHeight = 35 + i * 15;
        const alpha = 0.03 + progress * 0.05;

        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 15) {
          const mouseDist = Math.hypot(x - mouse.x, yBase - mouse.y);
          const mouseInfluence = Math.exp(-mouseDist / 200) * 40;

          const y = yBase
            + Math.sin(x * 0.004 + t * speed) * waveHeight
            + Math.cos(x * 0.008 - t * 0.4) * (waveHeight * 0.5)
            + mouseInfluence;

          if (x === 0) ctx.lineTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, yBase - waveHeight, 0, height);
        grad.addColorStop(0, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${alpha})`);
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      activeAnimationId = requestAnimationFrame(frame);
    }
    activeAnimationId = requestAnimationFrame(frame);

    fluidInstance = {
      cleanup() {
        window.removeEventListener('mousemove', mouseHandler);
        window.removeEventListener('touchmove', touchHandler);
        window.removeEventListener('resize', resize);
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Cosmic Embers / Star Drift ('embers')
  // ─────────────────────────────────────────────────────────────
  function runEmbersSimulation() {
    stopCurrentSimulation();
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
    const count = 70;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.6,
        size: 1.2 + Math.random() * 3.5,
        alpha: 0.15 + Math.random() * 0.45,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let mouse = { x: -1000, y: -1000 };
    const mouseHandler = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const touchHandler = (e) => {
      if (e.touches.length > 0) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
    };
    window.addEventListener('mousemove', mouseHandler);
    window.addEventListener('touchmove', touchHandler, { passive: true });

    let t = 0;
    function frame() {
      if (currentMode !== 'embers') return;
      t += 0.02;

      ctx.fillStyle = 'rgba(10, 10, 10, 0.25)';
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        // Swirl around mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 180 && dist > 10) {
          const force = (180 - dist) / 180 * 0.5;
          p.vx += (-dy / dist) * force;
          p.vy += (dx / dist) * force;
        }

        p.x += p.vx + Math.sin(t + p.pulseOffset) * 0.2;
        p.y += p.vy;

        // Dampen
        p.vx *= 0.98;
        if (p.vy > -0.2) p.vy -= 0.01;

        // Wrap
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(t * p.pulseSpeed * 60 + p.pulseOffset));

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        grad.addColorStop(0, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${currentAlpha})`);
        grad.addColorStop(0.5, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${currentAlpha * 0.3})`);
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      activeAnimationId = requestAnimationFrame(frame);
    }
    activeAnimationId = requestAnimationFrame(frame);

    fluidInstance = {
      cleanup() {
        window.removeEventListener('mousemove', mouseHandler);
        window.removeEventListener('touchmove', touchHandler);
        window.removeEventListener('resize', resize);
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Pure Dark Void ('none')
  // ─────────────────────────────────────────────────────────────
  function runNoneSimulation() {
    stopCurrentSimulation();
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

  function stopCurrentSimulation() {
    if (activeAnimationId) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
    }
    if (fluidInstance && fluidInstance.cleanup) {
      fluidInstance.cleanup();
      fluidInstance = null;
    }
  }

  function switchMode(newMode) {
    currentMode = newMode;
    localStorage.setItem('pomodoro_fluid_mode', newMode);
    if (newMode === 'smoke') runSmokeSimulation();
    else if (newMode === 'waves') runWavesSimulation();
    else if (newMode === 'embers') runEmbersSimulation();
    else if (newMode === 'none') runNoneSimulation();
  }

  function setColor(hex) {
    currentHex = hex;
    rgbColor = hexToRgb(hex);
    localStorage.setItem('pomodoro_accent_color', hex);
    // Refresh running simulation
    switchMode(currentMode);
  }

  // Global API
  window.initFluid = function () {
    canvas = document.getElementById('fluidCanvas');
    if (!canvas) return;
    switchMode(currentMode);
  };

  window.setFluidMode = switchMode;
  window.setFluidColor = setColor;
  window.getFluidMode = () => currentMode;
  window.getFluidColor = () => currentHex;
})();
