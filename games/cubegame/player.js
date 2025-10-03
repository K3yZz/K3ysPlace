import { spaceTime } from "./main.js";

const canvas = document.getElementById("playerCanvas");
const ctx = canvas.getContext("2d");

export const playerStats = {
    health: 10.00,
    maxHealth: 10.00,
    healthDecreaseInt: 0.01,
    damageTickRate: 10,

    strength: 1,
    attackSpeed: 1,

    money: 0,
    moneyThisRun: 0,
    moneyMultiplier: 1,

    vampire: false,
    bulletsEnabled: false,
    magnet: false,

    magnetStrength: 1,
    vamprismStrength: 0.5,
}

export const player = {
    x: 0,
    y: 0,
    size: 100,
    time: 0,
    centerX: canvas.width / 2,
    centerY: canvas.height / 2,
    backgroundScalingOpacity: 0.05,
    backgroundDefaultOpacity: 1,
    backgroundOpacityChangeAmount: 0.05,
    backgroundOpacityChangeSpeed: 100 * playerStats.attackSpeed,
};

export function drawPlayer() {
    //define gap size + center square size
    const spaceSize = player.size / 2;
    const centerSquareSize = player.size / 4;

    //draw border
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.rect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    ctx.strokeStyle = 'rgba(31, 181, 250, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    //create gaps
    ctx.clearRect(player.x - spaceSize / 2, player.y + player.size / 2 - spaceSize, spaceSize, spaceSize * 2);
    ctx.clearRect(player.x + player.size / 2 - spaceSize, player.y - spaceSize / 2, spaceSize * 2, spaceSize);
    ctx.clearRect(player.x - spaceSize / 2, player.y - player.size / 2 - spaceSize, spaceSize, spaceSize * 2);
    ctx.clearRect(player.x - player.size / 2 - spaceSize, player.y - spaceSize / 2, spaceSize * 2, spaceSize);

    //draw background
    ctx.beginPath();
    ctx.rect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    ctx.fillStyle = `rgba(31, 181, 250, ${player.backgroundScalingOpacity})`;
    ctx.fill();
    ctx.closePath();

    //draw center square
    ctx.beginPath();
    ctx.rect(player.x - centerSquareSize / 2, player.y - centerSquareSize / 2, centerSquareSize, centerSquareSize);
    ctx.shadowColor = 'rgba(31, 181, 250, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(31, 181, 250, 0.6)';
    ctx.fill();
    ctx.closePath();
}

export function drawPlayerHealthBar() {
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthBarX = 20;
    const healthBarY = 20;

    //draw border
    ctx.beginPath();
    ctx.rect(healthBarX, healthBarY, healthBarWidth - 10, healthBarHeight + 10);
    ctx.strokeStyle = 'rgba(31, 181, 250, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    //draw health
    ctx.beginPath();
    ctx.rect(healthBarX + 6, healthBarY + 6, (playerStats.health / playerStats.maxHealth) * (healthBarWidth - 22), healthBarHeight - 1);
    ctx.fillStyle = 'rgba(31, 181, 250, 0.8)';
    ctx.fill();
    ctx.closePath();

    //draw text on health bar
    ctx.font = '14px font';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(`Health: ${playerStats.health.toFixed(2)}`, healthBarX + healthBarWidth / 2 - 10, healthBarY + 22);
    ctx.textAlign = 'left';
}

export function drawBullet() {
    //
}

export let scaleTimeoutId;
export function scaleBackground() {
    scaleTimeoutId = setTimeout(() => {
        if (player.backgroundScalingOpacity < player.backgroundDefaultOpacity) {
            player.backgroundScalingOpacity += player.backgroundOpacityChangeAmount;
        } else {
            player.backgroundScalingOpacity = .05;
        }
        scaleBackground();
    }, player.backgroundOpacityChangeSpeed * spaceTime.gameSpeed);
}

export function drawTimer() {
    ctx.font = '30px font';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    let minutes = Math.floor(player.time / 60);
    let seconds = player.time % 60;
    ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, player.centerX, 30);
}

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    player.x = event.clientX - rect.left;
    player.y = event.clientY - rect.top;
});