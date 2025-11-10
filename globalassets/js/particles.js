// particles.js — WebGL metaballs + normal particles
// Exports: initParticles, toggleParticles, toggleParticleMode

const MAX_BLOBS = 32;           // safe default (increase only if you test)
const NORMAL_DENSITY_DIV = 14000;
const GOO_DENSITY_DIV = 180000;
const GOO_THRESHOLD = 1.0;      // tune for merge strength
const BRIGHTEN = 40;

let canvas = null, gl = null;
let program = null;
let dpr = Math.max(1, window.devicePixelRatio || 1);

let particleMode = localStorage.getItem('particleMode') || 'normal';
let particlesEnabled = (() => {
  const s = localStorage.getItem('particlesEnabled');
  return s === null ? true : s === 'true';
})();

let blobs = []; // { x, y, vx, vy, r, color:[r,g,b] }
let animationId = null;
let lastTS = 0;

// Reusable arrays to upload to GPU
const posArr = new Float32Array(MAX_BLOBS * 2);
const radArr = new Float32Array(MAX_BLOBS);
const colArr = new Float32Array(MAX_BLOBS * 3);

// --- Shaders --- (WebGL2 preferred, fallback to WebGL1)
const vertexGL2 = `#version 300 es
precision mediump float;
in vec2 a_pos;
out vec2 v_uv;
void main(){
  v_uv = (a_pos + 1.0) * 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const fragmentGL2 = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

uniform int u_blobCount;
uniform vec2 u_resolution;
uniform int u_mode; // 0 normal, 1 gooey
uniform float u_threshold;
uniform vec2 u_positions[${MAX_BLOBS}];
uniform float u_radii[${MAX_BLOBS}];
uniform vec3 u_colors[${MAX_BLOBS}];

void main(){
  vec2 fragPx = v_uv * u_resolution;
  float field = 0.0;
  vec3 colorAcc = vec3(0.0);
  float contribAcc = 0.0;

  for(int i=0;i<${MAX_BLOBS};++i){
    if(i >= u_blobCount) break;
    vec2 p = u_positions[i];
    float r = u_radii[i];
    float dx = fragPx.x - p.x;
    float dy = fragPx.y - p.y;
    float dsq = dx*dx + dy*dy + 1.0;
    float contrib = (r*r) / dsq;
    field += contrib;
    colorAcc += contrib * u_colors[i];
    contribAcc += contrib;
  }

  if(u_mode == 1){
    if(field > u_threshold){
      vec3 col = contribAcc > 0.0 ? (colorAcc / contribAcc) : vec3(1.0);
      outColor = vec4(col, 1.0);
    } else {
      outColor = vec4(0.0);
    }
  } else {
    // normal mode: render small discs using radii, blend
    vec3 accum = vec3(0.0);
    float alpha = 0.0;
    for(int i=0;i<${MAX_BLOBS};++i){
      if(i >= u_blobCount) break;
      vec2 p = u_positions[i];
      float r = u_radii[i];
      float dx = fragPx.x - p.x;
      float dy = fragPx.y - p.y;
      float dist = sqrt(dx*dx + dy*dy);
      float t = smoothstep(r, r - 1.8, dist);
      float a = 1.0 - t;
      if(a > 0.001){
        accum += u_colors[i] * a;
        alpha = min(1.0, alpha + a);
      }
    }
    if(alpha > 0.0){
      vec3 outc = accum / max(1.0, alpha);
      outColor = vec4(outc, min(1.0, alpha));
    } else {
      outColor = vec4(0.0);
    }
  }
}
`;

// WebGL1 versions (no #version, attributes/varyings differences)
const vertexGL1 = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main(){
  v_uv = (a_pos + 1.0) * 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const fragmentGL1 = `
precision highp float;
varying vec2 v_uv;
uniform int u_blobCount;
uniform vec2 u_resolution;
uniform int u_mode;
uniform float u_threshold;
uniform vec2 u_positions[${MAX_BLOBS}];
uniform float u_radii[${MAX_BLOBS}];
uniform vec3 u_colors[${MAX_BLOBS}];

void main(){
  vec2 fragPx = v_uv * u_resolution;
  float field = 0.0;
  vec3 colorAcc = vec3(0.0);
  float contribAcc = 0.0;

  for(int i=0;i<${MAX_BLOBS};++i){
    if(i >= u_blobCount) break;
    vec2 p = u_positions[i];
    float r = u_radii[i];
    float dx = fragPx.x - p.x;
    float dy = fragPx.y - p.y;
    float dsq = dx*dx + dy*dy + 1.0;
    float contrib = (r*r) / dsq;
    field += contrib;
    colorAcc += contrib * u_colors[i];
    contribAcc += contrib;
  }

  if(u_mode == 1){
    if(field > u_threshold){
      vec3 col = contribAcc > 0.0 ? (colorAcc / contribAcc) : vec3(1.0);
      gl_FragColor = vec4(col, 1.0);
    } else {
      gl_FragColor = vec4(0.0);
    }
  } else {
    vec3 accum = vec3(0.0);
    float alpha = 0.0;
    for(int i=0;i<${MAX_BLOBS};++i){
      if(i >= u_blobCount) break;
      vec2 p = u_positions[i];
      float r = u_radii[i];
      float dx = fragPx.x - p.x;
      float dy = fragPx.y - p.y;
      float dist = sqrt(dx*dx + dy*dy);
      float t = smoothstep(r, r - 1.8, dist);
      float a = 1.0 - t;
      if(a > 0.001){
        accum += u_colors[i] * a;
        alpha = min(1.0, alpha + a);
      }
    }
    if(alpha > 0.0){
      vec3 outc = accum / max(1.0, alpha);
      gl_FragColor = vec4(outc, min(1.0, alpha));
    } else {
      gl_FragColor = vec4(0.0);
    }
  }
}
`;

// --- Utils ---
function createShader(glCtx, type, src) {
  const sh = glCtx.createShader(type);
  glCtx.shaderSource(sh, src);
  glCtx.compileShader(sh);
  if (!glCtx.getShaderParameter(sh, glCtx.COMPILE_STATUS)) {
    const info = glCtx.getShaderInfoLog(sh);
    glCtx.deleteShader(sh);
    throw new Error('Shader compile error: ' + info);
  }
  return sh;
}

function createProgram(glCtx, vsrc, fsrc) {
  const vert = createShader(glCtx, glCtx.VERTEX_SHADER, vsrc);
  const frag = createShader(glCtx, glCtx.FRAGMENT_SHADER, fsrc);
  const prog = glCtx.createProgram();
  glCtx.attachShader(prog, vert);
  glCtx.attachShader(prog, frag);
  glCtx.linkProgram(prog);
  if (!glCtx.getProgramParameter(prog, glCtx.LINK_STATUS)) {
    const info = glCtx.getProgramInfoLog(prog);
    glCtx.deleteProgram(prog);
    throw new Error('Program link error: ' + info);
  }
  return prog;
}

function parseHexOrRgb(str) {
  if (!str) return [255,255,255];
  str = String(str).trim();
  if (str[0] === '#') {
    if (str.length === 7) return [parseInt(str.slice(1,3),16), parseInt(str.slice(3,5),16), parseInt(str.slice(5,7),16)];
    if (str.length === 4) return [parseInt(str[1]+str[1],16), parseInt(str[2]+str[2],16), parseInt(str[3]+str[3],16)];
  }
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(str);
  if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  return [255,255,255];
}

// wait for canvas injected by loader.js
function waitForCanvas(timeout = 3000) {
  return new Promise((resolve, reject) => {
    const c = document.getElementById('particles');
    if (c) return resolve(c);
    const obs = new MutationObserver((m, o) => {
      const cc = document.getElementById('particles');
      if (cc) { o.disconnect(); resolve(cc); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); reject(new Error('particles canvas not found')); }, timeout);
  });
}

// create and bind full-screen quad
function setupQuad(glCtx, prog, isWebGL2) {
  const verts = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]);
  const vbo = glCtx.createBuffer();
  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, vbo);
  glCtx.bufferData(glCtx.ARRAY_BUFFER, verts, glCtx.STATIC_DRAW);
  const attrib = glCtx.getAttribLocation(prog, 'a_pos');
  if (attrib >= 0) {
    glCtx.enableVertexAttribArray(attrib);
    glCtx.vertexAttribPointer(attrib, 2, glCtx.FLOAT, false, 0, 0);
  }
}

// create blobs based on mode & screen area
function createBlobs() {
  const w = Math.max(1, Math.floor(window.innerWidth));
  const h = Math.max(1, Math.floor(window.innerHeight));
  const area = w * h;
  let count = particleMode === 'normal'
    ? Math.max(12, Math.floor(area / NORMAL_DENSITY_DIV))
    : Math.max(4, Math.floor(area / GOO_DENSITY_DIV));
  count = Math.min(count, MAX_BLOBS);
  blobs.length = 0;
  for (let i = 0; i < count; i++) {
    // radius selection
    const minR = particleMode === 'normal' ? 2 : 60;
    const maxR = particleMode === 'normal' ? 5 : 160;
    const r = particleMode === 'normal' ? (Math.random()*(maxR-minR)+minR) : (Math.random()*(maxR-minR)+minR);

    // pick theme color and brighten
    const style = getComputedStyle(document.documentElement);
    const bg1 = style.getPropertyValue('--background-c1') || '#1a1a1a';
    const bg2 = style.getPropertyValue('--background-c2') || '#2a2a2a';
    const hex = Math.random() < 0.5 ? bg1.trim() : bg2.trim();
    const rgb = parseHexOrRgb(hex);
    const cr = Math.min(255, rgb[0] + BRIGHTEN) / 255;
    const cg = Math.min(255, rgb[1] + BRIGHTEN) / 255;
    const cb = Math.min(255, rgb[2] + BRIGHTEN) / 255;

    const vx = (Math.random() - 0.5) * (particleMode === 'normal' ? 0.6 : 1.2);
    const vy = (Math.random() - 0.5) * (particleMode === 'normal' ? 0.6 : 1.2);
    const x = Math.random() * w;
    const y = Math.random() * h;
    blobs.push({ x, y, vx, vy, r, color: [cr, cg, cb] });
  }
}

// upload blobs to the typed arrays for uniforms
function fillUniformArrays() {
  const count = blobs.length;
  for (let i = 0; i < MAX_BLOBS; i++) {
    if (i < count) {
      const b = blobs[i];
      posArr[i*2 + 0] = b.x;
      posArr[i*2 + 1] = b.y;
      radArr[i] = b.r;
      colArr[i*3 + 0] = b.color[0];
      colArr[i*3 + 1] = b.color[1];
      colArr[i*3 + 2] = b.color[2];
    } else {
      posArr[i*2 + 0] = posArr[i*2 + 1] = 0;
      radArr[i] = 0;
      colArr[i*3 + 0] = colArr[i*3 + 1] = colArr[i*3 + 2] = 0;
    }
  }
}

// step physics: move blobs and wrap
function step(dtMs) {
  const w = Math.max(1, Math.floor(window.innerWidth));
  const h = Math.max(1, Math.floor(window.innerHeight));
  const dt = dtMs * 0.06; // tune speed
  for (let b of blobs) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < -b.r) b.x = w + b.r;
    if (b.x > w + b.r) b.x = -b.r;
    if (b.y < -b.r) b.y = h + b.r;
    if (b.y > h + b.r) b.y = -b.r;
  }
}

let isWebGL2 = false;
let locations = {};

// main render loop
function renderLoop(ts) {
  if (!lastTS) lastTS = ts || performance.now();
  const now = ts || performance.now();
  const dt = Math.min(40, now - lastTS);
  lastTS = now;

  if (!particlesEnabled) {
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    return;
  }

  if (!gl) return;

  // step simulation
  step(dt);

  // upload uniforms and draw
  const count = blobs.length;
  fillUniformArrays();

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // blob count
  const uBlobCount = locations.u_blobCount;
  if (uBlobCount) {
    gl.uniform1i(uBlobCount, count);
  }
  // mode
  if (locations.u_mode) gl.uniform1i(locations.u_mode, particleMode === 'gooey' ? 1 : 0);
  // threshold
  if (locations.u_threshold) gl.uniform1f(locations.u_threshold, GOO_THRESHOLD);
  // resolution (use CSS pixels)
  if (locations.u_resolution) gl.uniform2f(locations.u_resolution, canvas.width / dpr, canvas.height / dpr);

  // upload arrays (vec2 positions -> use uniform2fv if available)
  // For WebGL2 we declared uniform vec2 u_positions[MAX_BLOBS]; still use uniform2fv by flattening posArr
  if (locations.u_positions) {
    // WebGL expects flattening; in GL2 uniform2fv is supported by many drivers. Use uniform2fv for safety.
    try {
      gl.uniform2fv(locations.u_positions, posArr);
    } catch (e) {
      // fallback: try uniform3fv expecting vec3s
      try {
        const pos3 = new Float32Array(MAX_BLOBS * 3);
        for (let i=0;i<MAX_BLOBS;i++){ pos3[i*3]=posArr[i*2]; pos3[i*3+1]=posArr[i*2+1]; pos3[i*3+2]=0; }
        gl.uniform3fv(locations.u_positions, pos3);
      } catch (err) { /* ignore */ }
    }
  }
  if (locations.u_radii) gl.uniform1fv(locations.u_radii, radArr);
  if (locations.u_colors) gl.uniform3fv(locations.u_colors, colArr);

  // draw full-screen quad
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  animationId = requestAnimationFrame(renderLoop);
}

// resize canvas to DPR
function resizeCanvas() {
  if (!canvas) return;
  dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.floor(window.innerWidth * dpr));
  const h = Math.max(1, Math.floor(window.innerHeight * dpr));
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
}

// initialize WebGL, compile shaders, set up attributes/uniform locations
async function initParticles() {
  try {
    canvas = await waitForCanvas();
  } catch (e) {
    console.warn('particles: canvas injection not found', e);
    return;
  }
  if (!canvas) return;

  // try WebGL2 then fallback
  const gl2 = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
  isWebGL2 = !!gl2;
  gl = gl2 || canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false });
  if (!gl) { console.warn('WebGL not available'); return; }

  resizeCanvas();

  // create program
  try {
    const vsrc = isWebGL2 ? vertexGL2 : vertexGL1;
    const fsrc = isWebGL2 ? fragmentGL2 : fragmentGL1;
    program = createProgram(gl, vsrc, fsrc);
  } catch (err) {
    console.error('Shader compile/link failed:', err);
    return;
  }

  gl.useProgram(program);
  setupQuad(gl, program, isWebGL2);

  // locations
  locations.u_blobCount = gl.getUniformLocation(program, 'u_blobCount');
  locations.u_positions = gl.getUniformLocation(program, 'u_positions');
  locations.u_radii = gl.getUniformLocation(program, 'u_radii');
  locations.u_colors = gl.getUniformLocation(program, 'u_colors');
  locations.u_resolution = gl.getUniformLocation(program, 'u_resolution');
  locations.u_mode = gl.getUniformLocation(program, 'u_mode');
  locations.u_threshold = gl.getUniformLocation(program, 'u_threshold');

  // create initial blobs
  createBlobs();

  // start loop if enabled
  if (particlesEnabled) {
    lastTS = 0;
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(renderLoop);
  }
}

// toggle on/off
function toggleParticles() {
  particlesEnabled = !particlesEnabled;
  localStorage.setItem('particlesEnabled', particlesEnabled ? 'true' : 'false');
  if (!canvas) initParticles();
  if (!particlesEnabled) {
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    if (gl) { gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); }
  } else {
    if (!animationId) { lastTS = 0; animationId = requestAnimationFrame(renderLoop); }
  }
}

// toggle mode and recreate blobs
function toggleParticleMode() {
  particleMode = particleMode === 'normal' ? 'gooey' : 'normal';
  localStorage.setItem('particleMode', particleMode);
  createBlobs();
}

// recreate blobs when theme changes or resize
function recreateAndRefresh() {
  createBlobs();
}

// watch theme changes optionally: you can call recreateAndRefresh() from settings after changing theme

window.addEventListener('resize', () => {
  clearTimeout(window._particlesResizeDebounce);
  window._particlesResizeDebounce = setTimeout(() => {
    resizeCanvas();
    createBlobs();
  }, 120);
});

// auto-init non-blocking
initParticles().catch(() => { /* ignore */ });

export { initParticles, toggleParticles, toggleParticleMode };
