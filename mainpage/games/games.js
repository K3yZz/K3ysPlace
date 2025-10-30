 const myGames = [
      { title: "Stock Market", version: "V1.0.0", img: "/globalassets/gameIcons/stockMarket.png", link: "/games/stockmarketgame/game.html" },
      { title: "Casino", version: "V1.0.1-alpha", img: "/globalassets/gameIcons/casino.png", link: "/games/casinogame/game.html" }
    ];

    const portedGames = [
      { title: "Undertale Yellow", img: "/globalassets/gameIcons/portedgameIcons/undertaleyellow.png", link: "/portedgames/undertale-yellow/undertale_yellow.html" },
      { title: "Bitlife", img: "/globalassets/gameIcons/portedgameIcons/bitlife.jpeg", link: "/portedgames/bitlife-life-simulator/play.html" },
      { title: "Chrome Dino", img: "/globalassets/gameIcons/portedgameIcons/dino.png", link: "/portedgames/chrome-dino" },
      { title: "Cookie Clicker", img: "/globalassets/gameIcons/portedgameIcons/cookieclicker.png", link: "/portedgames/cookie-clicker" },
      { title: "Drive Mad", img: "/globalassets/gameIcons/portedgameIcons/drivemad.jpeg", link: "/portedgames/drive-mad" },
      { title: "Moto X3M", img: "/globalassets/gameIcons/portedgameIcons/moto1.jpeg", link: "/portedgames/Moto-X3M" },
      { title: "Moto Pool", img: "/globalassets/gameIcons/portedgameIcons/moto2.jpeg", link: "/portedgames/motox3m-pool" },
      { title: "Moto Spooky", img: "/globalassets/gameIcons/portedgameIcons/moto3.jpeg", link: "/portedgames/motox3m-spooky" },
      { title: "Moto Winter", img: "/globalassets/gameIcons/portedgameIcons/moto4.jpeg", link: "/portedgames/motox3m-winter" },
      { title: "Subway Surfers", img: "/globalassets/gameIcons/portedgameIcons/subway.jpeg", link: "/ported/games/subwaysurfers-sf" },
      { title: "Emulator", img: "/globalassets/gameIcons/portedgameIcons/emulator.png", link: "/portedgames/emulator/index.html" },
      { title: "Monkey-Mart", img: "/globalassets/gameIcons/portedgameIcons/monkey-mart.jpeg", link: "/portedgames/monkey-mart/game.html" }
    ];

    const allGames = [...myGames, ...portedGames];
    const container = document.getElementById('gameContainer');

    allGames.forEach(game => {
      const btn = document.createElement('div');
      btn.classList.add('game-button', 'panel'); // fixed class assignment
      btn.onclick = () => window.location.href = game.link;

      btn.innerHTML = `
        <img src="${game.img}" alt="${game.title}">
        <div class="title">${game.title}</div>
        <div class="description">${game.description || ''}</div>
      `;

      container.appendChild(btn);
    });