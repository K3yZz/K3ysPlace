// Helper function to split text content into spans
function splitTextToSpans(el) {
  const text = el.textContent;
  el.textContent = "";
  return Array.from(text).map((char) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    Object.assign(span.style, {
      display: "inline-block",
      position: "relative",
    });
    el.appendChild(span);
    return span;
  });
}

// Function to animate text with various effects
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
    gravity = 1000, // px/s²
  } = options;

  let spans = Array.from(el.children);
  if (spans.length === 0) spans = splitTextToSpans(el);

  let currentTransforms = spans.map(() => ({ x: 0, y: 0, rotate: 0 }));
  let velocities = spans.map(() => ({ x: 0, y: 0, rotate: 0 }));
  let exploding = false;

  // Hover explode effect
  if (hoverExplode) {
    el.addEventListener("mouseenter", () => {
      exploding = true;
      velocities = spans.map(() => {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * explodeDistance * 8;
        return {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
          rotate: Math.random() * 180 - 90,
        };
      });
    });

    el.addEventListener("mouseleave", () => {
      exploding = false;
    });
  }

  let lastTime = performance.now();

  // Animation loop
  function animate(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    spans.forEach((span, i) => {
      if (exploding) {
        // Apply gravity and update positions
        velocities[i].y += gravity * dt;
        currentTransforms[i].x += velocities[i].x * dt;
        currentTransforms[i].y += velocities[i].y * dt;
        currentTransforms[i].rotate += velocities[i].rotate * dt;
      } else {
        // Smooth return to origin
        currentTransforms[i].x += (0 - currentTransforms[i].x) * 8 * dt;
        currentTransforms[i].y += (0 - currentTransforms[i].y) * 8 * dt;
        currentTransforms[i].rotate +=
          (0 - currentTransforms[i].rotate) * 8 * dt;
      }

      // Wavy effect
      let topOffset = 0;
      if (wavy) {
        const waveAngle = (timestamp / waveDuration) * 2 * Math.PI;
        topOffset = Math.sin(waveAngle + i * 0.4) * -waveAmplitude;
      }

      // Apply transformations
      span.style.transform = `translate(${currentTransforms[i].x}px, ${currentTransforms[i].y + topOffset
        }px) rotate(${currentTransforms[i].rotate}deg)`;

      // Rainbow effect
      if (rainbow) {
        const rainbowAngle = (timestamp / rainbowDuration) * 2 * Math.PI;
        const hue = ((rainbowAngle + i * 0.4) * (180 / Math.PI)) % 360;
        span.style.color = `hsl(${hue}, 100%, 50%)`;
      }
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}