import { getFirstAvailable } from '../../loader.js';

const tools = [
  { title: "The wheel", img: "/globalassets/gameIcons/wheel.png", link: "/games/wheelgame/game.html" },
  { title: "Chat", img: "/globalassets/gameIcons/chat.png", link: "/games/chatgame/game.html" },
  { title: "Download roms", img: "/", link: "/games/downloads/index.html" }
];

async function initializeAppButtons() {
  const container = document.getElementById('appContainer');
  if (!container) {
    console.error('[apps.js] appContainer not found!');
    return;
  }

  // Resolve image and link URLs dynamically using loader
  const imgUrls = await Promise.all(tools.map(tool => getFirstAvailable(tool.img)));
  const linkUrls = await Promise.all(tools.map(tool => getFirstAvailable(tool.link)));

  tools.forEach((tool, i) => {
    const btn = document.createElement('div');
    btn.classList.add('game-button', 'panel');

    const img = document.createElement('img');
    img.alt = tool.title;
    img.src = imgUrls[i] || tool.img; // fallback to original path
    btn.appendChild(img);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = tool.title;
    btn.appendChild(titleDiv);

    const linkUrl = linkUrls[i] || tool.link;
    btn.onclick = () => window.location.href = linkUrl;

    container.appendChild(btn);

    console.log('[apps.js] Added button:', tool.title, 'img:', img.src, 'link:', linkUrl);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAppButtons);
} else {
  initializeAppButtons();
}
