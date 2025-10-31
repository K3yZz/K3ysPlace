// apps.js
import { getFirstAvailable } from '/loader.js';

const tools = [
  { title: "The wheel", version: "V1.0.1-alpha", img: "/globalassets/gameIcons/wheel.png", link: "/games/wheelgame/game.html" },
  { title: "Chat", version: "V1.0.0-alpha", img: "/globalassets/gameIcons/chat.png", link: "/games/chatgame/game.html" },
  { title: "Download roms", version: "V1.0.0-alpha", img: "/", link: "/games/downloads/index.html" }
];

const container = document.getElementById('appContainer');

tools.forEach(async tool => {
  const btn = document.createElement('div');
  btn.classList.add('game-button', 'panel');

  const img = document.createElement('img');
  img.alt = tool.title;
  const imgUrl = await getFirstAvailable(tool.img);
  img.src = imgUrl || tool.img;
  btn.appendChild(img);

  const titleDiv = document.createElement('div');
  titleDiv.className = 'title';
  titleDiv.textContent = tool.title;
  btn.appendChild(titleDiv);

  const linkUrl = await getFirstAvailable(tool.link);
  btn.onclick = () => window.location.href = linkUrl || tool.link;

  container.appendChild(btn);
});
