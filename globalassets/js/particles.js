// particles.js (WebGL2-only)

const METABALL_MAX = 256;
const POINT_MAX = 64;
const NORMAL_DENSITY_DIV = 6000;
const GOO_DENSITY_DIV = 29000;
const GOO_THRESHOLD = 3.0;
const BRIGHTEN = 40;
const UNIFORM_ARRAY_GL2 = 64;

let canvas = null;
let gl = null;
let program = null;
let pointProgram = null;
let dpr = Math.max(1, window.devicePixelRatio || 1);

let particleMode = localStorage.getItem("particleMode") || "normal";
let particlesEnabled = (() => {
  const s = localStorage.getItem("particlesEnabled");
  return s === null ? true : s === "true";
})();

let blobs = [];
let animationId = null;
let lastTS = 0;

const posMetaArr = new Float32Array(METABALL_MAX * 2);
const radMetaArr = new Float32Array(METABALL_MAX);
const colMetaArr = new Float32Array(METABALL_MAX * 3);
const _pointsUploadArr = new Float32Array(POINT_MAX * 6);

let pointsVBO = null;
let pointsCount = 0;
let pointsAttrs = {
  a_pos: -1,
  a_rad: -1,
  a_col: -1,
  u_resolution: null,
  u_pointScale: null,
};
let metaballLocations = {};

let SPEED_MULT = 1.2;

// --- WebGL2 shaders ---
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
uniform int u_mode;
uniform float u_threshold;
uniform vec2 u_positions[64];
uniform float u_radii[64];
uniform vec3 u_colors[64];

void main(){
  vec2 fragPx = v_uv * u_resolution;
  float field = 0.0;
  vec3 colorAcc = vec3(0.0);
  float contribAcc = 0.0;

  for(int i=0;i<64;++i){
    if(i >= u_blobCount) break;
    vec2 p = u_positions[i];
    float r = u_radii[i];
    float dx = fragPx.x - p.x;
    float dy = fragPx.y - p.y;
    float dsq = dx*dx + dy*dy + 1e-6;
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
    vec3 accum = vec3(0.0);
    float alpha = 0.0;
    for(int i=0;i<64;++i){
      if(i >= u_blobCount) break;
      vec2 p = u_positions[i];
      float r = u_radii[i];
      float dx = fragPx.x - p.x;
      float dy = fragPx.y - p.y;
      float dist = sqrt(dx*dx + dy*dy);
      float t = smoothstep(r - 2.5, r, dist);
      float sizeFactor = clamp(r / 80.0, 0.25, 1.0);
      float a = (1.0 - t) * 0.6 * sizeFactor;
      if(a > 0.001){
        accum += u_colors[i] * a;
        alpha = min(1.0, alpha + a);
      }
    }
    if(alpha > 0.0){
      vec3 outc = accum / max(1.0, alpha);
      outColor = vec4(outc, alpha);
    } else {
      outColor = vec4(0.0);
    }
  }
}
`;

const pointsVertexGL2 = `#version 300 es
precision mediump float;
in vec2 a_pos;
in float a_rad;
in vec3 a_col;
uniform vec2 u_resolution;
uniform float u_pointScale;
out vec3 v_col;
out float v_rad;
void main(){
  vec2 posN = (a_pos / u_resolution) * 2.0 - 1.0;
  posN.y *= -1.0;
  gl_Position = vec4(posN, 0.0, 1.0);
  gl_PointSize = a_rad * u_pointScale * 2.0;
  v_col = a_col;
  v_rad = a_rad;
}
`;

const pointsFragmentGL2 = `#version 300 es
precision mediump float;
in vec3 v_col;
in float v_rad;
out vec4 outColor;
void main(){
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = length(c);
  if(d > 1.0) discard;
  float a = smoothstep(0.85, 1.0, d);
  float alphaScale = clamp(v_rad / 8.0, 0.25, 1.0);
  outColor = vec4(v_col, (1.0 - a) * alphaScale);
}
`;

// --- utility functions ---
function createShader(glCtx, type, src) {
  const sh = glCtx.createShader(type);
  glCtx.shaderSource(sh, src);
  glCtx.compileShader(sh);
  if (!glCtx.getShaderParameter(sh, glCtx.COMPILE_STATUS)) {
    const info = glCtx.getShaderInfoLog(sh);
    glCtx.deleteShader(sh);
    throw new Error("Shader compile error: " + info);
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
    throw new Error("Program link error: " + info);
  }
  return prog;
}

function parseHexOrRgb(str) {
  if (!str) return [255, 255, 255];
  str = String(str).trim();
  if (str[0] === "#") {
    if (str.length === 7)
      return [
        parseInt(str.slice(1, 3), 16),
        parseInt(str.slice(3, 5), 16),
        parseInt(str.slice(5, 7), 16),
      ];
    if (str.length === 4)
      return [
        parseInt(str[1] + str[1], 16),
        parseInt(str[2] + str[2], 16),
        parseInt(str[3] + str[3], 16),
      ];
  }
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(str);
  if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  return [255, 255, 255];
}

function waitForCanvas(timeout = 3000) {
  return new Promise((resolve, reject) => {
    const c = document.getElementById("particles");
    if (c) return resolve(c);
    const obs = new MutationObserver((m, o) => {
      const cc = document.getElementById("particles");
      if (cc) {
        o.disconnect();
        resolve(cc);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      obs.disconnect();
      reject(new Error("particles canvas not found"));
    }, timeout);
  });
}

function setupQuad(glCtx, prog) {
  const verts = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const vbo = glCtx.createBuffer();
  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, vbo);
  glCtx.bufferData(glCtx.ARRAY_BUFFER, verts, glCtx.STATIC_DRAW);
  const attrib = glCtx.getAttribLocation(prog, "a_pos");
  if (attrib >= 0) {
    glCtx.enableVertexAttribArray(attrib);
    glCtx.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);
  }
}

// --- core functions ---
function createBlobs() {
  const w = Math.max(1, Math.floor(window.innerWidth));
  const h = Math.max(1, Math.floor(window.innerHeight));
  const area = w * h;
  let desired =
    particleMode === "normal"
      ? Math.floor(area / NORMAL_DENSITY_DIV)
      : Math.floor(area / GOO_DENSITY_DIV);
  if (particleMode === "normal") {
    desired = Math.max(96, desired);
    desired = Math.min(desired, POINT_MAX);
  } else {
    desired = Math.max(4, desired);
    desired = Math.min(desired, METABALL_MAX);
  }
  blobs.length = 0;

  // fixed gradient color
  const style = getComputedStyle(document.documentElement);
  const leftColor = parseHexOrRgb(
    style.getPropertyValue("--background-c1") || "#1a1a1a"
  );
  const rightColor = parseHexOrRgb(
    style.getPropertyValue("--background-c2") || "#2a2a2a"
  );
  const fixedColor = [
    (leftColor[0] + rightColor[0] + BRIGHTEN) / 2 / 255,
    (leftColor[1] + rightColor[1] + BRIGHTEN) / 2 / 255,
    (leftColor[2] + rightColor[2] + BRIGHTEN) / 2 / 255,
  ];

  for (let i = 0; i < desired; i++) {
    const minR = particleMode === "normal" ? 1 : 40;
    const maxR = particleMode === "normal" ? 8 : 120;
    const r = Math.random() * (maxR - minR) + minR;
    const x = Math.random() * w;
    const y = Math.random() * h;
    const vx = (Math.random() - 0.5) * (particleMode === "normal" ? 0.9 : 1.2);
    const vy = (Math.random() - 0.5) * (particleMode === "normal" ? 0.9 : 1.2);
    blobs.push({ x, y, vx, vy, r, baseR: r, color: fixedColor });
  }

  pointsCount =
    particleMode === "normal" ? Math.min(blobs.length, POINT_MAX) : 0;
}

function fillMetaUniformArrays(limit = METABALL_MAX) {
  const count = Math.min(blobs.length, limit);
  for (let i = 0; i < limit; i++) {
    if (i < count) {
      const b = blobs[i];
      posMetaArr[i * 2] = b.x;
      posMetaArr[i * 2 + 1] = b.y;
      radMetaArr[i] = b.r;
      colMetaArr[i * 3] = b.color[0];
      colMetaArr[i * 3 + 1] = b.color[1];
      colMetaArr[i * 3 + 2] = b.color[2];
    } else {
      posMetaArr[i * 2] = posMetaArr[i * 2 + 1] = 0;
      radMetaArr[i] = 0;
      colMetaArr[i * 3] = colMetaArr[i * 3 + 1] = colMetaArr[i * 3 + 2] = 0;
    }
  }
}

// --- animation loop ---
function step(dtMs) {
  const w = Math.max(1, Math.floor(window.innerWidth));
  const h = Math.max(1, Math.floor(window.innerHeight));
  const dt = dtMs * 0.06;
  for (let b of blobs) {
    b.x += b.vx * dt * SPEED_MULT;
    b.y += b.vy * dt * SPEED_MULT;
    if (b.r < b.baseR) {
      b.r += (b.baseR - b.r) * 0.04;
      if (b.r > b.baseR) b.r = b.baseR;
    }
    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx *= -1;
    }
    if (b.x + b.r > w) {
      b.x = w - b.r;
      b.vx *= -1;
    }
    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy *= -1;
    }
    if (b.y + b.r > h) {
      b.y = h - b.r;
      b.vy *= -1;
    }
  }
}

function buildPointBuffers() {
  if (!gl) return;
  if (!pointsVBO) pointsVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsVBO);
  const usedElements = pointsCount * 6;
  for (let i = 0; i < pointsCount; i++) {
    const b = blobs[i],
      o = i * 6;
    _pointsUploadArr[o] = b.x;
    _pointsUploadArr[o + 1] = b.y;
    _pointsUploadArr[o + 2] = b.r;
    _pointsUploadArr[o + 3] = b.color[0];
    _pointsUploadArr[o + 4] = b.color[1];
    _pointsUploadArr[o + 5] = b.color[2];
  }
  gl.bufferData(
    gl.ARRAY_BUFFER,
    _pointsUploadArr.subarray(0, usedElements),
    gl.DYNAMIC_DRAW
  );
}

function enablePointAttributes() {
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsVBO);
  const stride = 6 * 4;
  const { a_pos, a_rad, a_col } = pointsAttrs;
  if (a_pos >= 0) {
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, stride, 0);
  }
  if (a_rad >= 0) {
    gl.enableVertexAttribArray(a_rad);
    gl.vertexAttribPointer(a_rad, 1, gl.FLOAT, false, stride, 8);
  }
  if (a_col >= 0) {
    gl.enableVertexAttribArray(a_col);
    gl.vertexAttribPointer(a_col, 3, gl.FLOAT, false, stride, 12);
  }
}

function renderPoints() {
  if (!pointProgram) return;
  gl.useProgram(pointProgram);
  buildPointBuffers();
  enablePointAttributes();
  if (pointsAttrs.u_resolution)
    gl.uniform2f(
      pointsAttrs.u_resolution,
      canvas.width / dpr,
      canvas.height / dpr
    );
  if (pointsAttrs.u_pointScale) gl.uniform1f(pointsAttrs.u_pointScale, dpr);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.POINTS, 0, pointsCount);
  gl.disable(gl.BLEND);
}

function renderMetaballs() {
  if (!program) return;
  gl.useProgram(program);
  const uniformLimit = UNIFORM_ARRAY_GL2;
  fillMetaUniformArrays(uniformLimit);
  const count = Math.min(blobs.length, uniformLimit);
  if (metaballLocations.u_blobCount)
    gl.uniform1i(metaballLocations.u_blobCount, count);
  if (metaballLocations.u_mode)
    gl.uniform1i(metaballLocations.u_mode, particleMode === "gooey" ? 1 : 0);
  if (metaballLocations.u_threshold)
    gl.uniform1f(metaballLocations.u_threshold, GOO_THRESHOLD);
  if (metaballLocations.u_resolution)
    gl.uniform2f(
      metaballLocations.u_resolution,
      canvas.width / dpr,
      canvas.height / dpr
    );
  if (metaballLocations.u_positions)
    gl.uniform2fv(
      metaballLocations.u_positions,
      posMetaArr.subarray(0, count * 2)
    );
  if (metaballLocations.u_radii)
    gl.uniform1fv(metaballLocations.u_radii, radMetaArr.subarray(0, count));
  if (metaballLocations.u_colors)
    gl.uniform3fv(
      metaballLocations.u_colors,
      colMetaArr.subarray(0, count * 3)
    );
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function renderLoop(ts) {
  if (!lastTS) lastTS = ts || performance.now();
  const now = ts || performance.now();
  const dt = Math.min(40, now - lastTS);
  lastTS = now;
  if (!particlesEnabled) {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    return;
  }
  if (!gl) return;
  step(dt);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  particleMode === "normal" ? renderPoints() : renderMetaballs();
  animationId = requestAnimationFrame(renderLoop);
}

function resizeCanvas() {
  if (!canvas) return;
  dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.floor(window.innerWidth * dpr));
  const h = Math.max(1, Math.floor(window.innerHeight * dpr));
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  canvas.style.zIndex = "-2";
}

async function initParticles() {
  try {
    canvas = await waitForCanvas();
  } catch (e) {
    console.warn("particles: canvas injection not found", e);
    return;
  }
  if (!canvas) return;
  gl = canvas.getContext("webgl2", {
    antialias: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) {
    console.warn("WebGL2 not available");
    return;
  }
  resizeCanvas();
  try {
    program = createProgram(gl, vertexGL2, fragmentGL2);
  } catch (e) {
    console.error("Shader compile/link failed:", e);
    return;
  }
  try {
    pointProgram = createProgram(gl, pointsVertexGL2, pointsFragmentGL2);
  } catch (e) {
    pointProgram = null;
  }
  gl.useProgram(program);
  setupQuad(gl, program);
  metaballLocations.u_blobCount = gl.getUniformLocation(program, "u_blobCount");
  metaballLocations.u_positions = gl.getUniformLocation(program, "u_positions");
  metaballLocations.u_radii = gl.getUniformLocation(program, "u_radii");
  metaballLocations.u_colors = gl.getUniformLocation(program, "u_colors");
  metaballLocations.u_resolution = gl.getUniformLocation(
    program,
    "u_resolution"
  );
  metaballLocations.u_mode = gl.getUniformLocation(program, "u_mode");
  metaballLocations.u_threshold = gl.getUniformLocation(program, "u_threshold");
  if (pointProgram) {
    gl.useProgram(pointProgram);
    pointsAttrs.a_pos = gl.getAttribLocation(pointProgram, "a_pos");
    pointsAttrs.a_rad = gl.getAttribLocation(pointProgram, "a_rad");
    pointsAttrs.a_col = gl.getAttribLocation(pointProgram, "a_col");
    pointsAttrs.u_resolution = gl.getUniformLocation(
      pointProgram,
      "u_resolution"
    );
    pointsAttrs.u_pointScale = gl.getUniformLocation(
      pointProgram,
      "u_pointScale"
    );
    pointsVBO = gl.createBuffer();
  }
  createBlobs();
  if (particlesEnabled) {
    lastTS = 0;
    animationId = requestAnimationFrame(renderLoop);
  }
}

function toggleParticles() {
  particlesEnabled = !particlesEnabled;
  localStorage.setItem("particlesEnabled", particlesEnabled ? "true" : "false");
  if (!canvas) initParticles();
  if (!particlesEnabled) {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (gl) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  } else {
    if (!animationId) {
      lastTS = 0;
      animationId = requestAnimationFrame(renderLoop);
    }
  }
}

function toggleParticleMode() {
  particleMode = particleMode === "normal" ? "gooey" : "normal";
  localStorage.setItem("particleMode", particleMode);
  createBlobs();

  if (particleMode === "normal") {
    buildPointBuffers();
  } else {
    pointsVBO = null;
    if (gl && program) {
      gl.useProgram(program);
      setupQuad(gl, program);
      const uniformLimit = isWebGL2 ? UNIFORM_ARRAY_GL2 : METABALL_MAX;
      fillMetaUniformArrays(uniformLimit);
      try {
        if (metaballLocations.u_positions)
          gl.uniform2fv(
            metaballLocations.u_positions,
            posMetaArr.subarray(0, Math.min(blobs.length, uniformLimit) * 2)
          );
        if (metaballLocations.u_radii)
          gl.uniform1fv(
            metaballLocations.u_radii,
            radMetaArr.subarray(0, Math.min(blobs.length, uniformLimit))
          );
        if (metaballLocations.u_colors)
          gl.uniform3fv(
            metaballLocations.u_colors,
            colMetaArr.subarray(0, Math.min(blobs.length, uniformLimit) * 3)
          );
      } catch (e) {}
    }
  }

  if (!animationId && particlesEnabled) {
    lastTS = 0;
    animationId = requestAnimationFrame(renderLoop);
  }
}

window.addEventListener("resize", () => {
  setTimeout(() => {
    resizeCanvas();
    createBlobs();
  }, 120);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  } else {
    if (particlesEnabled && !animationId) {
      lastTS = 0;
      animationId = requestAnimationFrame(renderLoop);
    }
  }
});

initParticles().catch(() => {});

export { initParticles, toggleParticles, toggleParticleMode };
