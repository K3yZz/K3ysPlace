import { spaceTime } from "./main.js";
import { player, playerStats } from "./player.js";

const canvas = document.getElementById("enemyCanvas");
const ctx = canvas.getContext("2d");

export let enemy = [];

const COLOR_MAP = {
  gold: "rgba(255, 166, 0, 1)",
  red: "rgba(255, 0, 0, 1)",
  purple: "rgba(128, 0, 128, 1)",
  blue: "rgba(50, 102, 179, 1)",
};

function makeEnemy({ type, color, amount = 1, size, maxHealth, dropAmount = [], boss = false }) {
  const c = typeof color === "string" ? COLOR_MAP[color.toLowerCase()] || color : color;

  for (let i = 0; i < amount; i++) {
    enemy.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size,
      type,
      health: maxHealth,
      maxHealth,
      dropAmount,
      moneyValue: 1,
      color: c,
      rotation: 0,
      lastHitTime: 0,
      boss,
    });
  }
}

const ENEMY_DATA = {
  1:  { type: "square",   color: "red",    size: 50,  maxHealth: 3,   dropAmount: [1, 3] },
  2:  { type: "square",   color: "red",    size: 100, maxHealth: 6,   dropAmount: [4, 6] },
  3:  { type: "square",   color: "red",    size: 300, maxHealth: 20,  dropAmount: [20, 40], boss: true },
  4:  { type: "square",   color: "red",    size: 100, maxHealth: 12,  dropAmount: [7, 10] },
  5:  { type: "triangle", color: "purple", size: 50,  maxHealth: 15,  dropAmount: [11, 15] },
  6:  { type: "triangle", color: "gold",   size: 500, maxHealth: 50,  dropAmount: [40, 60], boss: true },
  7:  { type: "triangle", color: "gold",   size: 100, maxHealth: 25,  dropAmount: [16, 25] },
  8:  { type: "hexagon",  color: "blue",   size: 400, maxHealth: 100, dropAmount: [100, 100], boss: true },
  9:  { type: "hexagon",  color: "blue",   size: 100, maxHealth: 40,  dropAmount: [26, 30] },
};

export function spawnEnemy(enemyID) {
  const data = ENEMY_DATA[enemyID];
  if (data) makeEnemy(data);
}


export function drawEnemy(e) {
  const fullSize = Math.max(8, Math.round(e.size + 10));
  const cx = e.x + fullSize / 2;
  const cy = e.y + fullSize / 2;
  const health = Math.max(0, Math.min(1, (e.health || 0) / (e.maxHealth || 1)));

  const strokeW = 2;
  const paddingPx = Math.max(4, Math.round(fullSize * 0.08));
  const outlineInset = paddingPx + Math.ceil(strokeW / 2);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(e.rotation || 0);
  ctx.lineWidth = strokeW;
  ctx.strokeStyle = e.color;
  ctx.fillStyle = e.color;

  if (e.type === "square") {
    const half = fullSize / 2;
    ctx.beginPath();
    ctx.rect(-half, -half, fullSize, fullSize);
    ctx.stroke();

    const baseInner = Math.max(2, fullSize - 2 * outlineInset);

    if (health > 0) {
      ctx.save();
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 20;
      ctx.scale(health, health);
      ctx.fillStyle = e.color;
      ctx.fillRect(-baseInner / 2, -baseInner / 2, baseInner, baseInner);
      ctx.restore();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  }

  if (e.type === "triangle") {
    const fullHeight = fullSize * Math.sqrt(3) / 2;
    const topY = -fullHeight / 2;
    const leftX = -fullSize / 2;
    const rightX = fullSize / 2;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(leftX, topY + fullHeight);
    ctx.lineTo(rightX, topY + fullHeight);
    ctx.closePath();
    ctx.stroke();

    const baseInner = Math.max(2, fullSize - 2 * outlineInset);
    const innerHeight = baseInner * Math.sqrt(3) / 2;
    const centroidY = topY + (2 / 3) * fullHeight;

    if (health > 0) {
      ctx.save();
      ctx.translate(0, centroidY);
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 20;
      ctx.scale(health, health);
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(0, -(2 / 3) * innerHeight);
      ctx.lineTo(-baseInner / 2, innerHeight / 3);
      ctx.lineTo(baseInner / 2, innerHeight / 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  }

  if (e.type === "hexagon") {
    const radius = fullSize / 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    const baseRadius = Math.max(3, radius - outlineInset);
    if (health > 0) {
      ctx.save();
      ctx.scale(health, health);
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = baseRadius * Math.cos(angle);
        const y = baseRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  }

  ctx.restore();
}

export function moveEnemy() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  enemy = enemy.filter(
    (e) => e.x <= canvas.width && e.x >= 0 && e.y <= canvas.height && e.y >= 0
  );

  enemy.forEach((e) => {
    const centerX = player.centerX;
    const centerY = player.centerY;
    const speed = 0.2 / spaceTime.gameSpeed;

    if (!e.angle) {
      e.angle = Math.atan2(centerY - e.y, centerX - e.x);
    }

    e.x += Math.cos(e.angle) * speed;
    e.y += Math.sin(e.angle) * speed;
    e.rotation += 0.001;

    drawEnemy(e);
  });

  moneyItem.forEach((drop) => {
    drawMoney(drop.x, drop.y);
  });
}

export let moneyItem = [];

export function enemyDropMoney(enemy) {
    const numDrops = Math.floor((Math.random() * enemy.dropAmount[1]) + enemy.dropAmount[0]);

  for (let i = 0; i < numDrops; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 200;

    let dropX = enemy.x + Math.cos(angle) * distance;
    let dropY = enemy.y + Math.sin(angle) * distance;

    dropX = Math.max(0, Math.min(canvas.width, dropX));
    dropY = Math.max(0, Math.min(canvas.height, dropY));

    moneyItem.push({ x: dropX, y: dropY, value: (enemy.moneyValue * playerStats.moneyMultiplier) });
  }
}

export function drawMoney(x, y, targetCtx = ctx) {
  targetCtx.save();
  targetCtx.beginPath();
  targetCtx.arc(x, y, 10, 0, Math.PI * 2);
  targetCtx.shadowColor = "rgba(255, 255, 0, 0.8)";
  targetCtx.shadowBlur = 20;
  targetCtx.fillStyle = "yellow";
  targetCtx.fill();
  targetCtx.closePath();
  targetCtx.restore();
}

export function moveMoneyItems() {
  if (!playerStats.magnet) return;
  const speed = playerStats.magnetStrength;
  moneyItem.forEach((drop) => {
    const dx = player.x - drop.x;
    const dy = player.y - drop.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      drop.x += (dx / dist) * speed;
      drop.y += (dy / dist) * speed;
    }
  });
}