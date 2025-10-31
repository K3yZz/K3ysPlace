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
const BASE_PATH = '/K3ysPlace/';
const container = document.getElementById('gameContainer');

function resolvePath(path) {
  return path.startsWith('/') ? BASE_PATH + path.slice(1) : path;
}

async function initializeGameButtons() {
  if (!container) {
    console.error('[games.js] gameContainer not found!');
    return;
  }

  // Compute image and link URLs in parallel
  const imgPromises = allGames.map(game => getFirstAvailable ? getFirstAvailable(resolvePath(game.img)) : resolvePath(game.img));
  const linkPromises = allGames.map(game => getFirstAvailable ? getFirstAvailable(resolvePath(game.link)) : resolvePath(game.link));

  const imgUrls = await Promise.all(imgPromises);
  const linkUrls = await Promise.all(linkPromises);

  allGames.forEach((game, i) => {
    const btn = document.createElement('div');
    btn.classList.add('game-button', 'panel');

    const img = document.createElement('img');
    img.alt = game.title;
    img.src = imgUrls[i] || resolvePath(game.img); // fallback
    btn.appendChild(img);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = game.title;
    btn.appendChild(titleDiv);

    const linkUrl = linkUrls[i] || resolvePath(game.link);
    btn.onclick = () => window.location.href = linkUrl;

    container.appendChild(btn);
    console.log('[games.js] Added button:', game.title, 'img:', img.src, 'link:', linkUrl);
  });
}


initializeGameButtons();
