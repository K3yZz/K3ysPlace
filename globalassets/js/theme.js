document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");

  // Apply saved theme (even if no toggle is found yet)
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.className = savedTheme;
    if (themeToggle) themeToggle.value = savedTheme;
  }

  // If toggle exists, handle changes
  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      const selectedTheme = themeToggle.value;
      document.documentElement.className = selectedTheme;
      localStorage.setItem("theme", selectedTheme);
    });
  }
});

function addExplosionEffect(themeCheck) {
  document.addEventListener("click", (event) => {
    // Check if the theme matches the condition
    const currentTheme = document.documentElement.className;
    if (currentTheme !== themeCheck) return;

    // Create explosion image
    const explosion = document.createElement("img");
    explosion.src = "globalassets/css/explosion.gif";
    explosion.alt = "Explosion";
    explosion.style.position = "absolute";
    explosion.style.zIndex = "1000";
    explosion.style.pointerEvents = "none";

    // Position explosion at the click location
    explosion.style.left = `${event.pageX}px`;
    explosion.style.top = `${event.pageY}px`;
    explosion.style.transform = "translate(-50%, -50%)";

    document.body.appendChild(explosion);

    // Remove explosion after animation ends
    setTimeout(() => {
      explosion.remove();
    }, 1000); // Assuming the explosion.gif lasts 1 second
  });
}

addExplosionEffect("yeah");
addExplosionEffect("theme1");


;(function injectFavicons() {
  try {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;

    // Prevent injecting twice
    if (document.querySelector('link[data-injected-favicon]')) return;

    const createLink = (attrs) => {
      const l = document.createElement('link');
      Object.keys(attrs).forEach(k => l.setAttribute(k, attrs[k]));
      l.setAttribute('data-injected-favicon', 'true');
      return l;
    };

    head.appendChild(createLink({ rel: 'apple-touch-icon', sizes: '180x180', href: 'globalassets/css/favicon/apple-touch-icon.png' }));
    head.appendChild(createLink({ rel: 'icon', type: 'image/png', sizes: '32x32', href: 'globalassets/css/favicon/favicon-32x32.png' }));
    head.appendChild(createLink({ rel: 'icon', type: 'image/png', sizes: '16x16', href: 'globalassets/css/favicon/favicon-16x16.png' }));
    head.appendChild(createLink({ rel: 'manifest', href: 'globalassets/css/favicon/site.webmanifest' }));
    head.appendChild(createLink({ rel: 'mask-icon', href: 'globalassets/css/favicon/safari-pinned-tab.svg' }));
    head.appendChild(createLink({ rel: 'shortcut icon', href: 'globalassets/css/favicon/favicon.ico' }));

    // Meta tags
    const metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    metaTheme.content = '#ffffff';
    metaTheme.setAttribute('data-injected-favicon', 'true');
    head.appendChild(metaTheme);

    const metaMsTileColor = document.createElement('meta');
    metaMsTileColor.name = 'msapplication-TileColor';
    metaMsTileColor.content = '#2d89ef';
    metaMsTileColor.setAttribute('data-injected-favicon', 'true');
    head.appendChild(metaMsTileColor);

    const metaMsTileImage = document.createElement('meta');
    metaMsTileImage.name = 'msapplication-TileImage';
    metaMsTileImage.content = '/mstile-144x144.png';
    metaMsTileImage.setAttribute('data-injected-favicon', 'true');
    head.appendChild(metaMsTileImage);
  } catch (e) {
    // Fail silently - injecting favicons is non-critical
    console.warn('Could not inject favicons:', e);
  }
})();
