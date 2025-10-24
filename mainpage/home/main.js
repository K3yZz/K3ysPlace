//bg canvas
const bgCanvas = document.getElementById('backgroundGradient');
const bgCtx = bgCanvas.getContext('2d');
bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;

// Particle canvas
const particleCanvas = document.getElementById('particles');
const particleCtx = particleCanvas.getContext('2d');
particleCanvas.width = window.innerWidth;
particleCanvas.height = window.innerHeight;

// Get computed CSS variables from :root
function getThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    const c1 = styles.getPropertyValue('--background-c1').trim() || 'rgba(255,140,0,0.4)';
    const c2 = styles.getPropertyValue('--background-c2').trim() || 'rgba(0,0,0,0.8)';
    return [c1, c2];
}

// Gradient background
let gradientX = 0;
let gradientY = 0;
let angle = 0;
let speed = 0.001;

function drawGradient() {
    const [c1, c2] = getThemeColors();

    gradientX = window.innerWidth / 2 + Math.sin(angle) * 300;
    gradientY = window.innerHeight / 2 + Math.cos(angle / 2) * 200;
    angle += speed;

    const gradient = bgCtx.createRadialGradient(
        gradientX, gradientY, 100,
        window.innerWidth / 2, window.innerHeight / 2, window.innerWidth
    );
    gradient.addColorStop(0, c1);
    gradient.addColorStop(1, c2);

    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
}


// --- Particles (grey/white, slow floating) ---
const particlesArray = [];
const numberOfParticles = 100;

class Particle {
  constructor() {
    this.x = Math.random() * particleCanvas.width;
    this.y = Math.random() * particleCanvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    const greyShade = Math.floor(Math.random() * 156 + 100);
    const alpha = Math.random() * 0.5 + 0.2;
    this.color = `rgba(${greyShade}, ${greyShade}, ${greyShade}, ${alpha})`;
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

// --- Animate everything ---
function animate() {
  // Gradient background
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  drawGradient();

  // Particles
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  particlesArray.forEach(p => {
    p.update();
    p.draw();
  });

  requestAnimationFrame(animate);
}
animate();

// --- Resize canvases on window resize ---
window.addEventListener('resize', () => {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
});