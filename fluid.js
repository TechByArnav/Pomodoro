/* ============================================================
   POMODORO — WebGL Fluid Simulation (Pavel Dobryakov style)
   Real Navier-Stokes: advection, diffusion, pressure projection,
   vorticity confinement, splatting. WebGL2, RGBA16F targets.
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('fluidCanvas');
  if (!canvas) return;

  let currentMode = 'smoke';
  let currentHex = '#084c27';
  try {
    currentMode = localStorage.getItem('pomodoro_fluid_mode') || 'smoke';
    currentHex = localStorage.getItem('pomodoro_accent_color') || '#084c27';
  } catch (_) {}

  // Config
  const CONFIG = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 0.98,
    VELOCITY_DISSIPATION: 0.985,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 12,
    SPLAT_RADIUS: 0.22,
    SPLAT_FORCE: 2000,
    BACK_COLOR: { r: 0.03, g: 0.03, b: 0.04 },
  };

  let gl = null;
  let width = 0, height = 0;
  let animId = null;
  let dyeTex, velTex; // current
  let fbo = {};
  let programs = {};
  let mouse = { x: 0.5, y: 0.5, dx: 0, dy: 0, down: false, moved: false, lastX: 0.5, lastY: 0.5 };
  let color = hexToRgb(currentHex);
  let modeIndex = 0;
  let lastTime = Date.now();

  function hexToRgb(hex) {
    hex = (hex || '#084c27').replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16) || 0x084c27;
    return { r: ((num >> 16) & 255) / 255, g: ((num >> 8) & 255) / 255, b: (num & 255) / 255 };
  }

  // ── Shaders (GLSL ES 3.00) ──
  const VS = `#version 300 es
  precision highp float;
  in vec2 aPosition;
  out vec2 vUv;
  void main(){ vUv = aPosition * 0.5 + 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }`;

  const FS_SPLAT = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uTarget;
  uniform float uAspectRatio;
  uniform vec3 uColor;
  uniform vec2 uPoint;
  uniform float uRadius;
  void main(){
    vec2 p = vUv - uPoint;
    p.x *= uAspectRatio;
    vec3 splat = exp(-dot(p,p) / uRadius) * uColor;
    vec3 base = texture(uTarget, vUv).rgb;
    fragColor = vec4(base + splat, 1.0);
  }`;

  const FS_ADVECT = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uTexelSize;
  uniform float uDt;
  uniform float uDissipation;
  void main(){
    vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexelSize * 20.0;
    fragColor = uDissipation * texture(uSource, coord);
  }`;

  const FS_DIVERGENCE = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main(){
    float L = texture(uVelocity, vUv - vec2(uTexelSize.x,0.0)).x;
    float R = texture(uVelocity, vUv + vec2(uTexelSize.x,0.0)).x;
    float B = texture(uVelocity, vUv - vec2(0.0,uTexelSize.y)).y;
    float T = texture(uVelocity, vUv + vec2(0.0,uTexelSize.y)).y;
    float div = 0.5 * (R - L + T - B);
    fragColor = vec4(div, 0.0, 0.0, 1.0);
  }`;

  const FS_CURL = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main(){
    float L = texture(uVelocity, vUv - vec2(uTexelSize.x,0.0)).y;
    float R = texture(uVelocity, vUv + vec2(uTexelSize.x,0.0)).y;
    float B = texture(uVelocity, vUv - vec2(0.0,uTexelSize.y)).x;
    float T = texture(uVelocity, vUv + vec2(0.0,uTexelSize.y)).x;
    float vorticity = R - L - (T - B);
    fragColor = vec4(vorticity * 0.5, 0.0, 0.0, 1.0);
  }`;

  const FS_VORTICITY = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform vec2 uTexelSize;
  uniform float uCurlStrength;
  uniform float uDt;
  void main(){
    float L = texture(uCurl, vUv - vec2(uTexelSize.x,0.0)).x;
    float R = texture(uCurl, vUv + vec2(uTexelSize.x,0.0)).x;
    float B = texture(uCurl, vUv - vec2(0.0,uTexelSize.y)).x;
    float T = texture(uCurl, vUv + vec2(0.0,uTexelSize.y)).x;
    float C = texture(uCurl, vUv).x;
    vec2 force = vec2(abs(T) - abs(B), -(abs(R) - abs(L)));
    force /= length(force) + 0.0001;
    force *= uCurlStrength * C;
    vec2 vel = texture(uVelocity, vUv).xy;
    vel += force * uDt;
    fragColor = vec4(vel, 0.0, 1.0);
  }`;

  const FS_PRESSURE = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexelSize;
  void main(){
    float L = texture(uPressure, vUv - vec2(uTexelSize.x,0.0)).x;
    float R = texture(uPressure, vUv + vec2(uTexelSize.x,0.0)).x;
    float B = texture(uPressure, vUv - vec2(0.0,uTexelSize.y)).x;
    float T = texture(uPressure, vUv + vec2(0.0,uTexelSize.y)).x;
    float div = texture(uDivergence, vUv).x;
    float p = (L + R + B + T - div) * 0.25;
    fragColor = vec4(p, 0.0, 0.0, 1.0);
  }`;

  const FS_GRADIENT = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main(){
    float L = texture(uPressure, vUv - vec2(uTexelSize.x,0.0)).x;
    float R = texture(uPressure, vUv + vec2(uTexelSize.x,0.0)).x;
    float B = texture(uPressure, vUv - vec2(0.0,uTexelSize.y)).x;
    float T = texture(uPressure, vUv + vec2(0.0,uTexelSize.y)).x;
    vec2 vel = texture(uVelocity, vUv).xy;
    vel -= vec2(R - L, T - B) * 0.5;
    fragColor = vec4(vel, 0.0, 1.0);
  }`;

  const FS_AMB = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform float uTime;
  uniform vec3 uColor;
  uniform int uFamily;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x), f.y); }
  void main(){
    vec2 uv=vUv; vec3 base=vec3(0.03,0.03,0.04); vec3 col=base;
    if(uFamily==1){ float w=sin(uv.x*8.0+uTime*0.7)*0.5+0.5; w*=sin(uv.y*5.0-uTime*0.5)*0.5+0.5; float rings=sin(length(uv-0.5)*30.0-uTime*2.0)*0.5+0.5; col += uColor*(w*0.12 + rings*0.08); }
    else if(uFamily==2){ float t=uTime*0.25; for(int i=0;i<18;i++){ float fi=float(i); vec2 p=vec2(hash(vec2(fi,1.3)), fract(hash(vec2(fi,2.7))+t*(0.05+hash(vec2(fi,3.1))*0.1))); p.x=hash(vec2(fi,4.2))+sin(t+fi)*0.05; float d=distance(uv,p); float sz=0.006+hash(vec2(fi,5.5))*0.012; col += uColor*smoothstep(sz,0.0,d)*(0.5+0.5*sin(t*2.0+fi)); } }
    else if(uFamily==3){ float n=noise(uv*3.0+uTime*0.15); float n2=noise(uv*5.0-uTime*0.1); col += mix(base,uColor,n*0.22)*0.6; col += uColor*n2*0.12; }
    else if(uFamily==4){ float h=noise(vec2(uv.x*4.0,1.0))*0.25+0.05; float ground=smoothstep(h,h-0.02,uv.y); col=mix(col,vec3(0.02,0.02,0.03),ground*0.7); float h2=noise(vec2(uv.x*2.0+10.0,2.0))*0.18+0.15; float hill=smoothstep(h2,h2-0.015,uv.y); col=mix(col,uColor*0.15,hill*0.35); }
    float v=smoothstep(0.9,0.3,distance(uv,vec2(0.5))); col*=0.7+0.3*v;
    fragColor=vec4(col,1.0);
  }`;

  const FS_DISPLAY = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  uniform vec3 uBackColor;
  void main(){
    vec3 c = texture(uTexture, vUv).rgb;
    // soft shading based on magnitude
    float mag = length(c);
    vec3 col = mix(uBackColor, uColor, clamp(mag * 2.0, 0.0, 1.0));
    // add glow
    col += uColor * pow(mag, 0.6) * 0.4;
    fragColor = vec4(col, 1.0);
  }`;

  // ── GL setup ──
  function initGL() {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return false;
    const ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext) { /* may still work for half float */ }

    resizeCanvas();

    // programs
    programs.splat = createProg(VS, FS_SPLAT);
    programs.advect = createProg(VS, FS_ADVECT);
    programs.divergence = createProg(VS, FS_DIVERGENCE);
    programs.curl = createProg(VS, FS_CURL);
    programs.vorticity = createProg(VS, FS_VORTICITY);
    programs.pressure = createProg(VS, FS_PRESSURE);
    programs.gradient = createProg(VS, FS_GRADIENT);
    programs.display = createProg(VS, FS_DISPLAY);
    programs.amb = createProg(VS, FS_AMB);
    for (const k in programs) if (!programs[k]) return false;

    // quad
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    for (const k in programs) {
      gl.useProgram(programs[k]);
      const loc = gl.getAttribLocation(programs[k], 'aPosition');
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    // FBOs
    const simRes = CONFIG.SIM_RESOLUTION;
    const dyeRes = CONFIG.DYE_RESOLUTION;
    fbo.velocity = createDoubleFBO(simRes, simRes);
    fbo.density = createDoubleFBO(dyeRes, dyeRes);
    fbo.pressure = createDoubleFBO(simRes, simRes);
    fbo.divergence = createFBO(simRes, simRes);
    fbo.curl = createFBO(simRes, simRes);

    clearFBO(fbo.velocity.read, CONFIG.BACK_COLOR);
    clearFBO(fbo.velocity.write, CONFIG.BACK_COLOR);
    clearFBO(fbo.density.read, CONFIG.BACK_COLOR);
    clearFBO(fbo.density.write, CONFIG.BACK_COLOR);
    clearFBO(fbo.pressure.read, { r: 0, g: 0, b: 0 });
    clearFBO(fbo.pressure.write, { r: 0, g: 0, b: 0 });

    // events
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    window.addEventListener('resize', onResize);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return true;
  }

  function createFBO(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, w, h };
  }
  function createDoubleFBO(w, h) {
    return { read: createFBO(w, h), write: createFBO(w, h) };
  }
  function createProg(vs, fs) {
    const p = gl.createProgram();
    const v = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(v, vs); gl.compileShader(v);
    if (!gl.getShaderParameter(v, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(v)); return null; }
    const f = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(f, fs); gl.compileShader(f);
    if (!gl.getShaderParameter(f, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(f)); return null; }
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(p)); return null; }
    return p;
  }

  function clearFBO(fbo, c) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
    gl.viewport(0, 0, fbo.w, fbo.h);
    gl.clearColor(c.r, c.g, c.b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  function blit(src, dst) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fbo : null);
    if (dst) gl.viewport(0, 0, dst.w, dst.h); else gl.viewport(0, 0, width, height);
    // copy via display-like? We'll use a simple copy program not defined; instead swap refs.
  }
  function swapDouble(d) { const t = d.read; d.read = d.write; d.write = t; }

  function bindQuad(prog) {
    gl.useProgram(prog);
  }
  function drawQuad() { gl.drawArrays(gl.TRIANGLES, 0, 6); }
  function U(prog, name, val) {
    const loc = gl.getUniformLocation(prog, name);
    if (loc === null) return;
    if (typeof val === 'number') gl.uniform1f(loc, val);
    else if (val.length === 2) gl.uniform2fv(loc, val);
    else if (val.length === 3) gl.uniform3fv(loc, val);
  }
  function T(prog, name, unit) {
    const loc = gl.getUniformLocation(prog, name);
    if (loc !== null) gl.uniform1i(loc, unit);
  }

  function resize() {
    if (!gl) return;
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }
  function onResize() { resize(); }

  function getPos(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    return { x: (cx - rect.left) / rect.width, y: 1.0 - (cy - rect.top) / rect.height };
  }
  function onMouseMove(e) {
    const p = getPos(e.clientX, e.clientY);
    mouse.dx = (p.x - mouse.x) * 10;
    mouse.dy = (p.y - mouse.y) * 10;
    mouse.x = p.x; mouse.y = p.y; mouse.moved = true;
  }
  function onMouseDown(e) { const p = getPos(e.clientX, e.clientY); mouse.x = p.x; mouse.y = p.y; mouse.down = true; mouse.moved = true; }
  function onMouseUp() { mouse.down = false; }
  function onTouchMove(e) { if (!e.touches.length) return; const p = getPos(e.touches[0].clientX, e.touches[0].clientY); mouse.dx=(p.x-mouse.x)*15; mouse.dy=(p.y-mouse.y)*15; mouse.x=p.x; mouse.y=p.y; mouse.down=true; mouse.moved=true; }
  function onTouchStart(e) { if (!e.touches.length) return; const p=getPos(e.touches[0].clientX,e.touches[0].clientY); mouse.x=p.x; mouse.y=p.y; mouse.down=true; e.preventDefault(); }
  function onTouchEnd() { mouse.down=false; }

  function splat(x, y, dx, dy) {
    const aspect = width / height;
    // velocity splat
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.velocity.write.fbo);
    gl.viewport(0, 0, fbo.velocity.write.w, fbo.velocity.write.h);
    bindQuad(programs.splat);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.velocity.read.tex);
    T(programs.splat, 'uTarget', 0);
    U(programs.splat, 'uAspectRatio', aspect);
    U(programs.splat, 'uPoint', [x, y]);
    U(programs.splat, 'uRadius', CONFIG.SPLAT_RADIUS / 100.0);
    U(programs.splat, 'uColor', [dx * CONFIG.SPLAT_FORCE, dy * CONFIG.SPLAT_FORCE, 0]);
    // splat shader adds color to base texture; but base is velocity. Need uColor as velocity delta.
    // Our splat shader does base + splat where splat = exp * uColor. Good. But it writes rgb; velocity stored in rg. So uColor should be [dx*force, dy*force, 0].
    drawQuad();
    swapDouble(fbo.velocity);

    // density splat (color)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.density.write.fbo);
    gl.viewport(0, 0, fbo.density.write.w, fbo.density.write.h);
    bindQuad(programs.splat);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.density.read.tex);
    T(programs.splat, 'uTarget', 0);
    U(programs.splat, 'uAspectRatio', aspect);
    U(programs.splat, 'uPoint', [x, y]);
    U(programs.splat, 'uRadius', CONFIG.SPLAT_RADIUS / 100.0);
    const c = color;
    U(programs.splat, 'uColor', [c.r * 0.3, c.g * 0.3, c.b * 0.3]);
    drawQuad();
    swapDouble(fbo.density);
  }

  function step(dt) {
    const simRes = CONFIG.SIM_RESOLUTION;
    const dyeRes = CONFIG.DYE_RESOLUTION;
    const velTs = [1.0 / simRes, 1.0 / simRes];
    const dyeTs = [1.0 / dyeRes, 1.0 / dyeRes];

    // curl
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.curl.fbo);
    gl.viewport(0, 0, simRes, simRes);
    bindQuad(programs.curl);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.velocity.read.tex);
    T(programs.curl, 'uVelocity', 0);
    U(programs.curl, 'uTexelSize', velTs);
    drawQuad();

    // vorticity
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.velocity.write.fbo);
    gl.viewport(0, 0, simRes, simRes);
    bindQuad(programs.vorticity);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.velocity.read.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fbo.curl.tex);
    T(programs.vorticity, 'uVelocity', 0);
    T(programs.vorticity, 'uCurl', 1);
    U(programs.vorticity, 'uTexelSize', velTs);
    U(programs.vorticity, 'uCurlStrength', CONFIG.CURL);
    U(programs.vorticity, 'uDt', dt);
    drawQuad();
    swapDouble(fbo.velocity);

    // divergence
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.divergence.fbo);
    gl.viewport(0, 0, simRes, simRes);
    bindQuad(programs.divergence);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.velocity.read.tex);
    T(programs.divergence, 'uVelocity', 0);
    U(programs.divergence, 'uTexelSize', velTs);
    drawQuad();

    // pressure solve
    clearFBO(fbo.pressure.read, { r: 0, g: 0, b: 0 });
    clearFBO(fbo.pressure.write, { r: 0, g: 0, b: 0 });
    for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.pressure.write.fbo);
      gl.viewport(0, 0, simRes, simRes);
      bindQuad(programs.pressure);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.pressure.read.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fbo.divergence.tex);
      T(programs.pressure, 'uPressure', 0);
      T(programs.pressure, 'uDivergence', 1);
      U(programs.pressure, 'uTexelSize', velTs);
      drawQuad();
      swapDouble(fbo.pressure);
    }

    // gradient subtract
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.velocity.write.fbo);
    gl.viewport(0, 0, simRes, simRes);
    bindQuad(programs.gradient);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.pressure.read.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fbo.velocity.read.tex);
    T(programs.gradient, 'uPressure', 0);
    T(programs.gradient, 'uVelocity', 1);
    U(programs.gradient, 'uTexelSize', velTs);
    drawQuad();
    swapDouble(fbo.velocity);

    // advect velocity
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.velocity.write.fbo);
    gl.viewport(0, 0, simRes, simRes);
    bindQuad(programs.advect);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.velocity.read.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fbo.velocity.read.tex);
    T(programs.advect, 'uVelocity', 0);
    T(programs.advect, 'uSource', 1);
    U(programs.advect, 'uTexelSize', velTs);
    U(programs.advect, 'uDt', dt);
    U(programs.advect, 'uDissipation', CONFIG.VELOCITY_DISSIPATION);
    drawQuad();
    swapDouble(fbo.velocity);

    // advect density
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.density.write.fbo);
    gl.viewport(0, 0, dyeRes, dyeRes);
    bindQuad(programs.advect);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.velocity.read.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fbo.density.read.tex);
    T(programs.advect, 'uVelocity', 0);
    T(programs.advect, 'uSource', 1);
    U(programs.advect, 'uTexelSize', dyeTs);
    U(programs.advect, 'uDt', dt);
    U(programs.advect, 'uDissipation', CONFIG.DENSITY_DISSIPATION);
    drawQuad();
    swapDouble(fbo.density);
  }

  function render() {
    const now = Date.now();
    const dt = Math.min((now - lastTime) / 1000, 0.016);
    lastTime = now;

    // mouse splat
    if (mouse.moved || mouse.down) {
      const dx = Math.max(-2, Math.min(2, mouse.dx));
      const dy = Math.max(-2, Math.min(2, mouse.dy));
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        splat(mouse.x, mouse.y, dx, dy);
      }
      mouse.moved = false;
      mouse.dx *= 0.5; mouse.dy *= 0.5;
    }
    // ambient splat occasionally (gentle, no random velocity bursts)
    if (Math.random() < 0.008) {
      const ax = 0.2 + Math.random() * 0.6;
      const ay = 0.2 + Math.random() * 0.6;
      splat(ax, ay, 0, 0);
    }

    step(dt);

    // display
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.clearColor(CONFIG.BACK_COLOR.r, CONFIG.BACK_COLOR.g, CONFIG.BACK_COLOR.b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    bindQuad(programs.display);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.density.read.tex);
    T(programs.display, 'uTexture', 0);
    U(programs.display, 'uColor', [color.r, color.g, color.b]);
    U(programs.display, 'uBackColor', [CONFIG.BACK_COLOR.r, CONFIG.BACK_COLOR.g, CONFIG.BACK_COLOR.b]);
    drawQuad();

    animId = requestAnimationFrame(render);
  }

  // ── mode handling: only 'smoke' runs fluid; others fall back to ambient CSS? We'll just run fluid always for smoke, and for other modes run a simple clear + maybe none.
  function renderAmbient() {
    gl.viewport(0, 0, width, height);
    gl.clearColor(CONFIG.BACK_COLOR.r, CONFIG.BACK_COLOR.g, CONFIG.BACK_COLOR.b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    bindQuad(programs.amb);
    const locT = gl.getUniformLocation(programs.amb, 'uTime'); if (locT !== null) gl.uniform1f(locT, performance.now() / 1000);
    const locC = gl.getUniformLocation(programs.amb, 'uColor'); if (locC !== null) gl.uniform3fv(locC, [color.r, color.g, color.b]);
    const locF = gl.getUniformLocation(programs.amb, 'uFamily'); if (locF !== null) gl.uniform1i(locF, modeIndex);
    drawQuad();
    animId = requestAnimationFrame(renderAmbient);
  }

  function switchMode(mode) {
    currentMode = mode || 'smoke';
    try { localStorage.setItem('pomodoro_fluid_mode', currentMode); } catch (_) {}
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    if (currentMode === 'none') {
      if (gl) { gl.clearColor(CONFIG.BACK_COLOR.r, CONFIG.BACK_COLOR.g, CONFIG.BACK_COLOR.b, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
      return;
    }
    if (!gl) { if (!initGL()) return; }
    if (currentMode === 'smoke') {
      animId = requestAnimationFrame(render);
    } else {
      const MODE_FAMILY = { waves:1, ripples:1, sonar:1, embers:2, cotton:2, clouds:2, prisms:2, thermal:3, sunset:3, horizon:3, silk:3, ribbon:3, lava:3, trees:4, sand:4, mountains:4, none:0 };
      modeIndex = MODE_FAMILY[currentMode] || 3;
      animId = requestAnimationFrame(renderAmbient);
    }
  }

  function setColor(hex) {
    currentHex = hex || '#084c27';
    color = hexToRgb(currentHex);
    try { localStorage.setItem('pomodoro_accent_color', currentHex); } catch (_) {}
  }

  function resizeCanvas() {
    if (!gl) return;
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }
  function onResize() { resizeCanvas(); if (gl) { /* FBOs fixed res */ } }

  // fix resize reference
  window.addEventListener('resize', onResize);

  let initialized = false;
  function ensureInit() {
    if (initialized) return true;
    if (!gl) { const ok = initGL(); if (!ok) return false; }
    initialized = true;
    resizeCanvas();
    return true;
  }

  window.initFluid = function () {
    if (!ensureInit()) return;
    switchMode(currentMode);
  };
  window.setFluidMode = switchMode;
  window.setFluidColor = setColor;
  window.getFluidMode = () => currentMode;
  window.getFluidColor = () => currentHex;

  // events bound in initGL; but mouse events need canvas. Already bound there.
})();
