// =======================
// PARTICLES SCRIPT
// =======================
let particleCanvas, particleCtx, particlesArray = [];
const numberOfParticles = 100;
let animationFrameId;

// --------------------------
// Parse RGBA string to array
// --------------------------
function parseRGBA(rgba) {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]*)?\)/);
  if (!m) return [255, 255, 255, 1];
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), m[4] ? parseFloat(m[4]) : 1];
}

// --------------------------
// Particle class
// --------------------------
class Particle {
  constructor() {
    this.x = Math.random() * particleCanvas.width;
    this.y = Math.random() * particleCanvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x > particleCanvas.width) this.x = 0;
    if (this.x < 0) this.x = particleCanvas.width;
    if (this.y > particleCanvas.height) this.y = 0;
    if (this.y < 0) this.y = particleCanvas.height;
  }

  draw() {
    const style = getComputedStyle(document.documentElement);
    const bg1 = style.getPropertyValue('--background-c1') || '#1a1a1a';
    const bg2 = style.getPropertyValue('--background-c2') || '#2a2a2a';
    const c1 = parseRGBA(bg1);
    const c2 = parseRGBA(bg2);
    const base = Math.random() < 0.5 ? c1 : c2;
    const brighten = 40;
    const r = Math.min(base[0] + brighten, 255);
    const g = Math.min(base[1] + brighten, 255);
    const b = Math.min(base[2] + brighten, 255);
    const a = Math.random() * 0.4 + 0.3;

    particleCtx.beginPath();
    particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    particleCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    particleCtx.fill();
  }
}

// --------------------------
// Initialize particles
// --------------------------
function initParticles() {
  // Cancel previous animation if any
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  particleCanvas = document.getElementById('particles');
  if (!particleCanvas) return;

  particleCtx = particleCanvas.getContext('2d');
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;

  // Get theme colors AFTER CSS variables are applied
  const style = getComputedStyle(document.documentElement);
  const bg1 = style.getPropertyValue('--background-c1') || '#1a1a1a';
  const bg2 = style.getPropertyValue('--background-c2') || '#2a2a2a';

  particlesArray = [];
  for (let i = 0; i < numberOfParticles; i++) {
    particlesArray.push(new Particle(bg1, bg2));
  }

  animateParticles();
}

// --------------------------
// Animate particles
// --------------------------
function animateParticles() {
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  particlesArray.forEach(p => {
    p.update();
    p.draw();
  });
  animationFrameId = requestAnimationFrame(animateParticles);
}

// --------------------------
// Start particles on load
// --------------------------
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initParticles);
} else {
  initParticles();
}

// --------------------------
// Optional: Restart on window resize
// --------------------------
window.addEventListener('resize', () => {
  initParticles();
});
