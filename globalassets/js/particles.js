const particleCanvas = document.getElementById('particles');
const particleCtx = particleCanvas.getContext('2d');
particleCanvas.width = window.innerWidth;
particleCanvas.height = window.innerHeight;

const particlesArray = [];
const numberOfParticles = 100;

function parseRGBA(rgba) {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]*)?\)/);
  if (!m) return [255, 255, 255, 1];
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), m[4] ? parseFloat(m[4]) : 1];
}

function getParticleColor() {
  const style = getComputedStyle(document.documentElement);
  const c1 = parseRGBA(style.getPropertyValue('--background-c1'));
  const c2 = parseRGBA(style.getPropertyValue('--background-c2'));

  const base = Math.random() < 0.5 ? c1 : c2;

  const brighten = 40; // adjust for contrast
  const r = Math.min(base[0] + brighten, 255);
  const g = Math.min(base[1] + brighten, 255);
  const b = Math.min(base[2] + brighten, 255);
  const a = Math.random() * 0.4 + 0.3; // slightly stronger alpha

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

class Particle {
  constructor() {
    this.x = Math.random() * particleCanvas.width;
    this.y = Math.random() * particleCanvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.color = getParticleColor();
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

for (let i = 0; i < numberOfParticles; i++) {
  particlesArray.push(new Particle());
}

function animate() {
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  particlesArray.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animate);
}
animate();