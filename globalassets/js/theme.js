document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");

  // --------------------------
  // 1. Apply saved theme on load
  // --------------------------
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.className = savedTheme;
    if (themeToggle) themeToggle.value = savedTheme;
  }

  // --------------------------
  // 2. Handle theme changes from select
  // --------------------------
  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      const selectedTheme = themeToggle.value;
      document.documentElement.className = selectedTheme;
      localStorage.setItem("theme", selectedTheme);
    });
  }

  // --------------------------
  // 3. Special effect for specific theme
  // --------------------------
  function addExplosionEffect(themeCheck) {
    document.addEventListener("click", (event) => {
      const currentTheme = document.documentElement.className;
      if (currentTheme !== themeCheck) return;

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

      setTimeout(() => {
        explosion.remove();
      }, 1000); // gif duration
    });
  }

  addExplosionEffect("dexter");

  // --------------------------
  // 4. Optional: Favicon & meta injection
  // --------------------------
  (function injectFavicons() {
    try {
      const head = document.head || document.getElementsByTagName("head")[0];
      if (!head) return;
      if (document.querySelector('link[data-injected-favicon]')) return;

      const createLink = (attrs) => {
        const l = document.createElement("link");
        Object.keys(attrs).forEach(k => l.setAttribute(k, attrs[k]));
        l.setAttribute("data-injected-favicon", "true");
        return l;
      };

      head.appendChild(createLink({ rel: "apple-touch-icon", sizes: "180x180", href: "/K3ysPlace/globalassets/css/favicon/apple-touch-icon.png" }));
      head.appendChild(createLink({ rel: "icon", type: "image/png", sizes: "32x32", href: "/K3ysPlace/globalassets/css/favicon/favicon-32x32.png" }));
      head.appendChild(createLink({ rel: "icon", type: "image/png", sizes: "16x16", href: "/K3ysPlace/globalassets/css/favicon/favicon-16x16.png" }));
      head.appendChild(createLink({ rel: "manifest", href: "/K3ysPlace/globalassets/css/favicon/site.webmanifest" }));
      head.appendChild(createLink({ rel: "mask-icon", href: "/K3ysPlace/globalassets/css/favicon/safari-pinned-tab.svg" }));
      head.appendChild(createLink({ rel: "shortcut icon", href: "/K3ysPlace/globalassets/css/favicon/favicon.ico" }));

      const metaTheme = document.createElement("meta");
      metaTheme.name = "theme-color";
      metaTheme.content = "#ffffff";
      metaTheme.setAttribute("data-injected-favicon", "true");
      head.appendChild(metaTheme);

      const metaMsTileColor = document.createElement("meta");
      metaMsTileColor.name = "msapplication-TileColor";
      metaMsTileColor.content = "#2d89ef";
      metaMsTileColor.setAttribute("data-injected-favicon", "true");
      head.appendChild(metaMsTileColor);

      const metaMsTileImage = document.createElement("meta");
      metaMsTileImage.name = "msapplication-TileImage";
      metaMsTileImage.content = "/mstile-144x144.png";
      metaMsTileImage.setAttribute("data-injected-favicon", "true");
      head.appendChild(metaMsTileImage);
    } catch (e) {
      console.warn("Could not inject favicons:", e);
    }
  })();
});
