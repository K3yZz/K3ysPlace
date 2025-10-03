import SimplexNoise from './simplex-noise.js';
import * as skilltree from './skilltree.js';
import * as playerMod from './player.js';
import * as enemyMod from './enemy.js';
import * as intervalMod from './interval.js';
import * as collision from './collision.js';

export function initBackground() {
    const canvas = document.getElementById('backgroundCanvas');
    const ctx = canvas.getContext('2d');

    // Set the actual drawing size to match the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const width = canvas.width;
    const height = canvas.height;

    const simplex = new SimplexNoise();
    const stars = [];
    const shootingStars = [];

    // ... rest of your star & nebula setup ...

    // Make sure the animation loop uses the correct width/height
    function draw() {
        ctx.clearRect(0, 0, width, height);

        // Draw nebula
        ctx.putImageData(nebImage, 0, 0);

        // Draw stars
        stars.forEach(star => {
            star.opacity += star.delta;
            if (star.opacity > 1) star.opacity = 1, star.delta *= -1;
            if (star.opacity < 0.3) star.opacity = 0.3, star.delta *= -1;

            star.x += 0.02;
            if (star.x > width) star.x = 0;

            ctx.fillStyle = `rgba(${200 + star.colorOffset}, ${200 + star.colorOffset}, 255, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        maybeCreateShootingStar();
        drawShootingStars();
        requestAnimationFrame(draw);
    }

    draw();

    // Optional: handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        nebImage.width = canvas.width;
        nebImage.height = canvas.height;
    });
}

initBackground();
skilltree.loadDeathOverlay();


export const spaceTime = {
    ranOnce: false,
    paused: false,
    offTab: false,
    skillTreeOpen: false,
    gameSpeed: 1,
    debug: false,
};

function runOnce() {
    if (!spaceTime.ranOnce) {
        enemyMod.spawnEnemy(1);
        intervalMod.startIntervals();
        playerMod.scaleBackground();
        spaceTime.ranOnce = true;
    }
}

let gameLoopId;

function gameLoop() {
    if (!spaceTime.paused || spaceTime.offTab) {
        runOnce();
        playerMod.drawPlayer();
        playerMod.drawPlayerHealthBar();
        playerMod.drawTimer();
        enemyMod.moveEnemy();
        enemyMod.moveMoneyItems();
        collision.ccPlayerToEnemy();
        collision.ccPlayerToMoney();
        collision.ccMoneyToMoney();
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

export function editBox(type, box) {
    if (!document.body.contains(box)) {
        document.body.appendChild(box);
    }

    if (type === "create") {
        box.style.zIndex = 10;
    } else if (type === "delete") {
        box.style.zIndex = -10;
    }
};

export function startGame() {
    cancelAnimationFrame(gameLoopId);
    cancelAnimationFrame(skilltree.drawSkillTreeAnimation);
    clearTimeout(playerMod.scaleTimeoutId);
    intervalMod.stopIntervals();

    spaceTime.paused = false;
    spaceTime.ranOnce = false;
    spaceTime.skillTreeOpen = false;

    playerMod.playerStats.health = playerMod.playerStats.maxHealth;
    playerMod.playerStats.moneyThisRun = 0;
    playerMod.playerStats.healthDecreaseInt = 0.01;
    playerMod.player.time = 0;
    enemyMod.enemy.length = 0;
    enemyMod.moneyItem.length = 0;

    ["startButton", "toSkillTreeButton", "againButton", "earningsBox", "moneyBox", "tipBox"]
        .forEach(id => editBox("delete", document.getElementById(id)));

    gameLoop();
}

window.addEventListener('DOMContentLoaded', startGame);

document.addEventListener("keydown", e => {
    if (e.key === "y") playerMod.playerStats.health = 0;
});