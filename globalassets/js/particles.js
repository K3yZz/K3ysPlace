let particleCanvas, particleCtx, particlesArray = [];
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
    this.useBg1 = Math.random() < 0.5; // choose background 1 or 2
    this.alpha = Math.random() * 0.4 + 0.3;
    this.updateColor(); // initial color
  }

  updateColor() {
    const style = getComputedStyle(document.documentElement);
    const bg1 = style.getPropertyValue('--background-c1') || '#1a1a1a';
    const bg2 = style.getPropertyValue('--background-c2') || '#2a2a2a';
    const c = parseRGBA(this.useBg1 ? bg1 : bg2);

    const brighten = 40;
    const r = Math.min(c[0] + brighten, 255);
    const g = Math.min(c[1] + brighten, 255);
    const b = Math.min(c[2] + brighten, 255);

    this.color = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
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
    particleCtx.beginPath();
    particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    particleCtx.fillStyle = this.color;
    particleCtx.fill();
  }
}

// --------------------------
// Initialize particles
// --------------------------
function initParticles() {
  if (!particleCanvas) particleCanvas = document.getElementById('particles');
  if (!particleCanvas) return;

  particleCtx = particleCanvas.getContext('2d');
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;

  if (!particlesArray.length) {
    const numberOfParticles = Math.floor((window.innerWidth * window.innerHeight) / 10000);
    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }
  } else {
    particlesArray.forEach(p => p.updateColor());
  }

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
// Handle window resize
// --------------------------
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    particlesArray.forEach(p => p.updateColor());
  }, 200);
});
