const tools = [
      { title: "The wheel", version: "V1.0.1-alpha", img: "/globalassets/gameIcons/wheel.png", link: "/games/wheelgame/game.html" },
      { title: "Chat", version: "V1.0.0-alpha", img: "/globalassets/gameIcons/chat.png", link: "/games/chatgame/game.html" },
      { title: "Download roms", version: "V1.0.0-alpha", img: "/", link: "/games/downloads/index.html"}
];

const container = document.getElementById('appContainer');

    tools.forEach(game => {
  const btn = document.createElement('div');
  btn.classList.add('game-button', 'panel');
      btn.onclick = () => window.location.href = game.link;

  btn.innerHTML = `
        <img src="${game.img}" alt="${game.title}">
        <div class="title">${game.title}</div>`;
  container.appendChild(btn);
    });