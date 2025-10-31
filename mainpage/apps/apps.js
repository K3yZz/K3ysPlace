// apps.js
import { getFirstAvailable } from '../../loader.js';

const tools = [
  { title: "The wheel", version: "V1.0.1-alpha", img: "/globalassets/gameIcons/wheel.png", link: "/games/wheelgame/game.html" },
  { title: "Chat", version: "V1.0.0-alpha", img: "/globalassets/gameIcons/chat.png", link: "/games/chatgame/game.html" },
  { title: "Download roms", version: "V1.0.0-alpha", img: "/", link: "/games/downloads/index.html" }
];

function resolvePath(path) {
  const BASE_PATH = '/K3ysPlace/';
  return path.startsWith('/') ? BASE_PATH + path.slice(1) : path;
}

async function initializeAppButtons() {
  const container = document.getElementById('appContainer');
  if (!container) {
    console.error('[apps.js] appContainer not found!');
    return;
  }

  // Precompute all URLs in parallel
  const imgPromises = tools.map(tool => getFirstAvailable ? getFirstAvailable(resolvePath(tool.img)) : resolvePath(tool.img));
  const linkPromises = tools.map(tool => getFirstAvailable ? getFirstAvailable(resolvePath(tool.link)) : resolvePath(tool.link));

  const imgUrls = await Promise.all(imgPromises);
  const linkUrls = await Promise.all(linkPromises);

  tools.forEach((tool, i) => {
    const btn = document.createElement('div');
    btn.classList.add('game-button', 'panel');

    const img = document.createElement('img');
    img.alt = tool.title;
    img.src = imgUrls[i] || resolvePath(tool.img); // fallback to original path
    btn.appendChild(img);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = tool.title;
    btn.appendChild(titleDiv);

    const linkUrl = linkUrls[i] || resolvePath(tool.link);
    btn.onclick = () => window.location.href = linkUrl;

    container.appendChild(btn);
    console.log('[apps.js] Added button:', tool.title, 'img:', img.src, 'link:', linkUrl);
  });
}

  initializeAppButtons();

