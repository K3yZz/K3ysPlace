document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");

  // --------------------------
  // Apply saved theme on load
  // --------------------------
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.className = savedTheme;
    if (themeToggle) themeToggle.value = savedTheme;
  }

  // --------------------------
  // Handle theme changes from select
  // --------------------------
  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      const selectedTheme = themeToggle.value;
      document.documentElement.className = selectedTheme;
      localStorage.setItem("theme", selectedTheme);
    });
  }

  // --------------------------
  // Special effect for specific theme
  // --------------------------
  function addExplosionEffect(themeCheck) {
    document.addEventListener("click", (event) => {
      if (document.documentElement.className !== themeCheck) return;

      const explosion = document.createElement("img");
      explosion.src = "globalassets/css/explosion.gif";
      explosion.alt = "Explosion";
      explosion.style.position = "absolute";
      explosion.style.zIndex = "1000";
      explosion.style.pointerEvents = "none";
      explosion.style.left = `${event.pageX}px`;
      explosion.style.top = `${event.pageY}px`;
      explosion.style.transform = "translate(-50%, -50%)";

      document.body.appendChild(explosion);

      setTimeout(() => explosion.remove(), 1000);
    });
  }

  addExplosionEffect("dexter");
  addExplosionEffect("harry-styles");
});