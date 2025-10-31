// apps.js
const tools = [
  { title: "The wheel", version: "V1.0.1-alpha", img: "/globalassets/gameIcons/wheel.png", link: "/games/wheelgame/game.html" },
  { title: "Chat", version: "V1.0.0-alpha", img: "/globalassets/gameIcons/chat.png", link: "/games/chatgame/game.html" },
  { title: "Download roms", version: "V1.0.0-alpha", img: "/", link: "/games/downloads/index.html" }
];

const container = document.getElementById('appContainer');

(async () => {
  for (const tool of tools) {
    const btn = document.createElement('div');
    btn.classList.add('game-button', 'panel');

    // Make paths compatible with BASE_PATH
    const imgPath = tool.img.startsWith('/') ? BASE_PATH + tool.img.slice(1) : tool.img;
    const linkPath = tool.link.startsWith('/') ? BASE_PATH + tool.link.slice(1) : tool.link;

    const img = document.createElement('img');
    img.alt = tool.title;

    // Ensure getFirstAvailable is ready
    const imgUrl = typeof getFirstAvailable === "function" ? await getFirstAvailable(imgPath) : imgPath;
    img.src = imgUrl || imgPath;
    btn.appendChild(img);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = tool.title;
    btn.appendChild(titleDiv);

    const linkUrl = typeof getFirstAvailable === "function" ? await getFirstAvailable(linkPath) : linkPath;
    btn.onclick = () => window.location.href = linkUrl || linkPath;

    container.appendChild(btn);
  }
})();
