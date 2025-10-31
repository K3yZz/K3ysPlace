// games.js
import { getFirstAvailable } from '../../loader.js';

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

(async () => {
  for (const game of allGames) {
    const btn = document.createElement('div');
    btn.classList.add('game-button', 'panel');

    // Prepend BASE_PATH to absolute URLs
    const imgPath = game.img.startsWith('/') ? BASE_PATH + game.img.slice(1) : game.img;
    const linkPath = game.link.startsWith('/') ? BASE_PATH + game.link.slice(1) : game.link;

    const img = document.createElement('img');
    img.alt = game.title;

    // Await getFirstAvailable properly
    const imgUrl = typeof getFirstAvailable === "function" ? await getFirstAvailable(imgPath) : imgPath;
    img.src = imgUrl || imgPath;
    btn.appendChild(img);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = game.title;
    btn.appendChild(titleDiv);

    const linkUrl = typeof getFirstAvailable === "function" ? await getFirstAvailable(linkPath) : linkPath;
    btn.onclick = () => window.location.href = linkUrl || linkPath;

    container.appendChild(btn);
  }
})();