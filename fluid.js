/* ============================================================
   POMODORO — WebGL Fluid / Gas Dynamics Simulation
   Crimson & Ember smoke drifting through near-total void
   ============================================================ */

function initFluid() {
  const canvas = document.getElementById('fluidCanvas');
  if (!canvas) return;

  // Set canvas style
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';

  // Config
  const config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 0.985,
    VELOCITY_DISSIPATION: 0.98,
    PRESSURE_ITERATIONS: 16,
    PRESSURE: 0.8,
    CURL: 25,
    SPLAT_RADIUS: 0.18,
    SPLAT_FORCE: 4500,
  };

  // Try WebGL2 first, then WebGL1
  let gl = canvas.getContext('webgl2');
  const isWebGL2 = !!gl;
  if (!gl) {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  }

  if (!gl) {
    console.warn('WebGL not supported, falling back to 2D ambient smoke.');
    init2DFallback(canvas);
    return;
  }

  // Extensions
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

  // Helper: Compile Shader
  function createShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader compile err:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  // Helper: Create Program
  function createProgram(vsSource, fsSource) {
    const p = gl.createProgram();
    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('Program link err:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  // Base Vertex Shader (Full-screen quad)
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

  // Display Fragment Shader (Renders smoke directly to screen with subtle vignette)
  const displayShaderSource = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
      vec3 c = texture2D(uTexture, vUv).rgb;
      // Background void color #0a0a0a
      vec3 bg = vec3(0.039, 0.039, 0.039);
      // Soft vignette
      float dist = distance(vUv, vec2(0.5));
      float vig = smoothstep(0.9, 0.2, dist);
      // Blend smoke into void background
      vec3 finalColor = bg + c * vig;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // Splat Shader (Gaussian stamp for velocity and crimson dye)
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

  // Advection Shader
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

  // Divergence Shader
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

  // Curl Shader
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

  // Vorticity Confinement Shader
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

  // Pressure (Jacobi) Shader
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
      float C = texture2D(uPressure, vUv).x;
      float divergence = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + B + T - divergence) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
  `;

  // Gradient Subtraction Shader
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

  // Compile Programs
  const displayProgram = createProgram(baseVertexShader, displayShaderSource);
  const splatProgram = createProgram(baseVertexShader, splatShaderSource);
  const advectionProgram = createProgram(baseVertexShader, advectionShaderSource);
  const divergenceProgram = createProgram(baseVertexShader, divergenceShaderSource);
  const curlProgram = createProgram(baseVertexShader, curlShaderSource);
  const vorticityProgram = createProgram(baseVertexShader, vorticityShaderSource);
  const pressureProgram = createProgram(baseVertexShader, pressureShaderSource);
  const gradSubtractProgram = createProgram(baseVertexShader, gradientSubtractShaderSource);

  if (!displayProgram || !splatProgram || !advectionProgram) {
    console.warn('Shader creation failed, fallback to 2D.');
    init2DFallback(canvas);
    return;
  }

  // Full-screen Quad Buffer
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]), gl.STATIC_DRAW);

  function blit(target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.width : gl.drawingBufferWidth, target ? target.height : gl.drawingBufferHeight);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // FBO Helpers
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

  // Resize Handling
  let dye, velocity, divergence, curl, pressure;

  function initFramebuffers() {
    const simW = config.SIM_RESOLUTION;
    const simH = Math.round(simW * (canvas.height / canvas.width));
    const dyeW = config.DYE_RESOLUTION;
    const dyeH = Math.round(dyeW * (canvas.height / canvas.width));

    const filter = extHalfFloatLinear ? gl.LINEAR : gl.NEAREST;

    dye = createDoubleFBO(dyeW, dyeH, rgbaFormat, gl.RGBA, halfFloatTexType, filter);
    velocity = createDoubleFBO(simW, simH, rgFormat, isWebGL2 ? gl.RG : gl.RGBA, halfFloatTexType, filter);
    divergence = createFBO(simW, simH, rFormat, isWebGL2 ? gl.RED : gl.RGBA, halfFloatTexType, gl.NEAREST);
    curl = createFBO(simW, simH, rFormat, isWebGL2 ? gl.RED : gl.RGBA, halfFloatTexType, gl.NEAREST);
    pressure = createDoubleFBO(simW, simH, rFormat, isWebGL2 ? gl.RED : gl.RGBA, halfFloatTexType, gl.NEAREST);
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      initFramebuffers();
      return true;
    }
    return false;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Splatting Function (Crimson Palette)
  function splat(x, y, dx, dy, color) {
    // Splat velocity
    gl.useProgram(splatProgram);
    gl.uniform1i(gl.getUniformLocation(splatProgram, 'uTarget'), velocity.read.attach(0));
    gl.uniform1f(gl.getUniformLocation(splatProgram, 'aspectRatio'), canvas.width / canvas.height);
    gl.uniform2f(gl.getUniformLocation(splatProgram, 'point'), x, y);
    gl.uniform3f(gl.getUniformLocation(splatProgram, 'color'), dx, dy, 0.0);
    gl.uniform1f(gl.getUniformLocation(splatProgram, 'radius'), config.SPLAT_RADIUS / 100.0);
    blit(velocity.write);
    velocity.swap();

    // Splat dye (crimson / ember tones)
    gl.uniform1i(gl.getUniformLocation(splatProgram, 'uTarget'), dye.read.attach(0));
    gl.uniform3f(gl.getUniformLocation(splatProgram, 'color'), color.r, color.g, color.b);
    blit(dye.write);
    dye.swap();
  }

  // Crimson/Ember Palette Generator: Dark burgundy, crimson #dc143c, warm hot-orange sparks
  function getCrimsonTone() {
    const r = 0.18 + Math.random() * 0.22; // 0.18 - 0.40
    const g = 0.01 + Math.random() * 0.03; // almost no green
    const b = 0.02 + Math.random() * 0.04; // subtle violet undertone
    // 25% chance of hot ember spark
    if (Math.random() < 0.25) {
      return { r: 0.38, g: 0.06, b: 0.02 };
    }
    return { r, g, b };
  }

  // Initial ambient splats
  for (let i = 0; i < 4; i++) {
    const rx = 0.2 + Math.random() * 0.6;
    const ry = 0.2 + Math.random() * 0.6;
    const angle = Math.random() * Math.PI * 2;
    const force = 300 + Math.random() * 300;
    splat(rx, ry, Math.cos(angle) * force, Math.sin(angle) * force, getCrimsonTone());
  }

  // Mouse & Touch Interaction
  let mouseX = 0, mouseY = 0, prevMouseX = 0, prevMouseY = 0;
  let isPointerActive = false;

  function updatePointer(clientX, clientY) {
    const x = clientX / window.innerWidth;
    const y = 1.0 - (clientY / window.innerHeight);
    const dx = (x - prevMouseX) * config.SPLAT_FORCE;
    const dy = (y - prevMouseY) * config.SPLAT_FORCE;

    const speed = Math.hypot(dx, dy);
    if (speed > 5) {
      splat(x, y, dx * 0.6, dy * 0.6, getCrimsonTone());
    }

    prevMouseX = x;
    prevMouseY = y;
  }

  window.addEventListener('mousemove', (e) => {
    if (!isPointerActive) {
      prevMouseX = e.clientX / window.innerWidth;
      prevMouseY = 1.0 - (e.clientY / window.innerHeight);
      isPointerActive = true;
    }
    updatePointer(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (!isPointerActive) {
        prevMouseX = touch.clientX / window.innerWidth;
        prevMouseY = 1.0 - (touch.clientY / window.innerHeight);
        isPointerActive = true;
      }
      updatePointer(touch.clientX, touch.clientY);
    }
  }, { passive: true });

  // Autonomous Ambient Drifting (Gentle smoke currents)
  let lastAutoSplat = Date.now();
  let ambientAngle = 0;

  function handleAmbientMotion(dt) {
    ambientAngle += dt * 0.8;
    // Slow circular drift near center
    const cx = 0.5 + Math.cos(ambientAngle * 0.5) * 0.18;
    const cy = 0.5 + Math.sin(ambientAngle * 0.7) * 0.15;
    const vx = Math.cos(ambientAngle) * 35;
    const vy = Math.sin(ambientAngle) * 35;
    splat(cx, cy, vx, vy, { r: 0.04, g: 0.003, b: 0.006 });

    // Periodic gentle bursts (smoke billows)
    const now = Date.now();
    if (now - lastAutoSplat > 3200) {
      lastAutoSplat = now;
      const rx = 0.25 + Math.random() * 0.5;
      const ry = 0.3 + Math.random() * 0.4;
      const dir = Math.random() * Math.PI * 2;
      splat(rx, ry, Math.cos(dir) * 120, Math.sin(dir) * 120, getCrimsonTone());
    }
  }

  // Simulation Loop
  let lastTime = performance.now();

  function step(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.033);
    lastTime = time;

    handleAmbientMotion(dt);

    // 1. Curl
    gl.useProgram(curlProgram);
    gl.uniform2f(gl.getUniformLocation(curlProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(curlProgram, 'uVelocity'), velocity.read.attach(0));
    blit(curl);

    // 2. Vorticity Confinement
    gl.useProgram(vorticityProgram);
    gl.uniform2f(gl.getUniformLocation(vorticityProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(vorticityProgram, 'uVelocity'), velocity.read.attach(0));
    gl.uniform1i(gl.getUniformLocation(vorticityProgram, 'uCurl'), curl.attach(1));
    gl.uniform1f(gl.getUniformLocation(vorticityProgram, 'curl'), config.CURL);
    gl.uniform1f(gl.getUniformLocation(vorticityProgram, 'dt'), dt);
    blit(velocity.write);
    velocity.swap();

    // 3. Divergence
    gl.useProgram(divergenceProgram);
    gl.uniform2f(gl.getUniformLocation(divergenceProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(divergenceProgram, 'uVelocity'), velocity.read.attach(0));
    blit(divergence);

    // 4. Pressure Solve (Jacobi)
    gl.useProgram(pressureProgram);
    gl.uniform2f(gl.getUniformLocation(pressureProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(pressureProgram, 'uDivergence'), divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(gl.getUniformLocation(pressureProgram, 'uPressure'), pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    // 5. Gradient Subtract
    gl.useProgram(gradSubtractProgram);
    gl.uniform2f(gl.getUniformLocation(gradSubtractProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(gradSubtractProgram, 'uPressure'), pressure.read.attach(0));
    gl.uniform1i(gl.getUniformLocation(gradSubtractProgram, 'uVelocity'), velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    // 6. Advect Velocity
    gl.useProgram(advectionProgram);
    gl.uniform2f(gl.getUniformLocation(advectionProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uVelocity'), velocity.read.attach(0));
    gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uSource'), velocity.read.attach(0));
    gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dt'), dt);
    gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dissipation'), config.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    // 7. Advect Dye
    gl.uniform2f(gl.getUniformLocation(advectionProgram, 'texelSize'), dye.texelSizeX, dye.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uVelocity'), velocity.read.attach(0));
    gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uSource'), dye.read.attach(1));
    gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dissipation'), config.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();

    // 8. Render to Screen
    gl.useProgram(displayProgram);
    gl.uniform1i(gl.getUniformLocation(displayProgram, 'uTexture'), dye.read.attach(0));
    blit(null);

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ── 2D Canvas Fallback (if WebGL is unavailable) ───────────────
function init2DFallback(canvas) {
  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  for (let i = 0; i < 28; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 120 + Math.random() * 180,
      alpha: 0.03 + Math.random() * 0.05,
    });
  }

  function loop() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -p.radius) p.x = width + p.radius;
      if (p.x > width + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = height + p.radius;
      if (p.y > height + p.radius) p.y = -p.radius;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      grad.addColorStop(0, `rgba(220, 20, 60, ${p.alpha})`);
      grad.addColorStop(0.6, `rgba(140, 10, 40, ${p.alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
