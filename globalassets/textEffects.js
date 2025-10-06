export function loadDramaticText(text) {
    const dramaticText = document.createElement('div');
    dramaticText.id = 'dramaticText';
    dramaticText.style.position = 'absolute';
    dramaticText.style.top = '25%';
    dramaticText.style.left = '50%';
    dramaticText.style.transform = 'translate(-50%, -50%)';
    dramaticText.style.fontFamily = 'font, sans-serif';
    dramaticText.style.fontSize = '48px';
    dramaticText.style.color = 'rgba(255, 255, 255, 1)';
    dramaticText.style.textShadow = '4px 4px 4px rgba(187, 181, 181, 0.7)';
    dramaticText.style.fontWeight = 'bold';
    dramaticText.style.textAlign = 'center';
    dramaticText.style.zIndex = '20';
    dramaticText.style.pointerEvents = 'none';
    dramaticText.style.opacity = '0';

    dramaticText.innerText = text;
    
    document.body.appendChild(dramaticText);

    dramaticText.style.transition = 'opacity 1s ease-in-out';

     requestAnimationFrame(() => {
        dramaticText.style.opacity = '1';
    });

    setTimeout(() => {
        dramaticText.style.opacity = '0';
    }, 3000);
    

    return dramaticText;
}

function splitTextToSpans(el) {
  const text = el.textContent;
  el.textContent = "";
  const spans = [];

  for (let i = 0; i < text.length; i++) {
    const span = document.createElement("span");
    span.textContent = text[i] === " " ? "\u00A0" : text[i];
    span.style.display = "inline-block";
    span.style.position = "relative";
    el.appendChild(span);
    spans.push(span);
  }

  return spans;
}

export function animateText(el, options = {}) {
  if (!el) return;

  const {
    wavy = false,
    waveAmplitude = 10,
    waveDuration = 1300,
    rainbow = false,
    rainbowDuration = 2000,
    hoverExplode = false,
    explodeDistance = 50,
    gravity = 0.5
  } = options;

  let spans = Array.from(el.children);
  if (spans.length === 0) {
    spans = splitTextToSpans(el);
  }

  let currentTransforms = spans.map(() => ({ x: 0, y: 0, rotate: 0 }));
  let velocities = spans.map(() => ({ x: 0, y: 0, rotate: 0 }));
  let exploding = false;

  if (hoverExplode) {
    el.addEventListener("mouseenter", () => {
      exploding = true;
      velocities = spans.map(() => {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * explodeDistance / 10;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const vRotate = Math.random() * 10 - 5;
        return { x: vx, y: vy, rotate: vRotate };
      });
    });

    el.addEventListener("mouseleave", () => {
      exploding = false;
    });
  }

  let startTime = null;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = 16 / 1000; // approximate frame delta in seconds

    spans.forEach((span, i) => {
      if (exploding) {
        velocities[i].y += gravity * dt * 60; // apply gravity
        currentTransforms[i].x += velocities[i].x;
        currentTransforms[i].y += velocities[i].y;
        currentTransforms[i].rotate += velocities[i].rotate;
      } else {
        // Smooth return to original
        currentTransforms[i].x += (0 - currentTransforms[i].x) * 0.1;
        currentTransforms[i].y += (0 - currentTransforms[i].y) * 0.1;
        currentTransforms[i].rotate += (0 - currentTransforms[i].rotate) * 0.1;
      }

      let topOffset = 0;
      if (wavy) {
        const waveProgress = (timestamp - startTime) % waveDuration;
        const waveAngle = (waveProgress / waveDuration) * 2 * Math.PI;
        topOffset = Math.sin(waveAngle + i * 0.4) * -waveAmplitude;
      }

      span.style.transform = `translate(${currentTransforms[i].x}px, ${currentTransforms[i].y + topOffset}px) rotate(${currentTransforms[i].rotate}deg)`;

      if (rainbow) {
        const rainbowProgress = (timestamp - startTime) % rainbowDuration;
        const rainbowAngle = (rainbowProgress / rainbowDuration) * 2 * Math.PI;
        const hue = ((rainbowAngle + i * 0.4) * (180 / Math.PI)) % 360;
        span.style.color = `hsl(${hue}, 100%, 50%)`;
      }
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// Example usage:
// Only wavy
// animateText(document.getElementById("myText"), { wavy: true });

// Only rainbow
// animateText(document.getElementById("myText"), { rainbow: true });

// Both wavy and rainbow
// animateText(document.getElementById("myText"), { wavy: true, rainbow: true });

//animateText(document.getElementById("myText"), { wavy: true, rainbow: true, hoverExplode: true });
