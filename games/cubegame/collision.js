import { enemy, enemyDropMoney, moneyItem } from "./enemy.js";
import { player, playerStats } from "./player.js";

export function ccPlayerToEnemy() {
  for (let i = enemy.length - 1; i >= 0; i--) {
    const playerLeft = player.x - player.size / 2;
    const playerRight = player.x + player.size / 2;
    const playerTop = player.y - player.size / 2;
    const playerBottom = player.y + player.size / 2;

    const enemyLeft = enemy[i].x;
    const enemyRight = enemy[i].x + enemy[i].size;
    const enemyTop = enemy[i].y;
    const enemyBottom = enemy[i].y + enemy[i].size;

    const isColliding =
      playerRight > enemyLeft &&
      playerLeft < enemyRight &&
      playerBottom > enemyTop &&
      playerTop < enemyBottom;

    if (isColliding && player.backgroundScalingOpacity >= 1) {
      const now = performance.now();

      if (
        !enemy[i].lastHitTime ||
        now - enemy[i].lastHitTime >= playerStats.attackSpeed * 1000
      ) {
        enemy[i].health -= playerStats.strength;
        enemy[i].lastHitTime = now;
      }

      if (enemy[i].health <= 0) {
        enemyDropMoney(enemy[i]);
        enemy.splice(i, 1);

        if (playerStats.vampire) {
          playerStats.health = Math.min(
            playerStats.health + playerStats.vamprismStrength,
            playerStats.maxHealth
          );
        }
      }
    }
  }
}

export function ccBulletToEnemy() {
  //
}

export function ccPlayerToMoney() {
    for (let i = 0; i < moneyItem.length; i++) {
        const dx = player.x - moneyItem[i].x;
        const dy = player.y - moneyItem[i].y;
        let value = moneyItem[i].value;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        if (distance < player.size / 2 + 10) {
          moneyItem.splice(i, 1);
          playerStats.money += Math.ceil(value);
          playerStats.moneyThisRun += Math.ceil(value);
        }
    }
}

export function ccMoneyToMoney() {
  if (moneyItem.length <= 1) return;

  const toRemove = new Set();

  for (let i = 0; i < moneyItem.length; i++) {
    for (let j = i + 1; j < moneyItem.length; j++) {
      if (toRemove.has(i) || toRemove.has(j)) continue;

      const dx = moneyItem[i].x - moneyItem[j].x;
      const dy = moneyItem[i].y - moneyItem[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 20) {
        moneyItem[i].value += moneyItem[j].value;
        toRemove.add(j);
      }
    }
  }

  const indices = Array.from(toRemove).sort((a, b) => b - a);
  for (const index of indices) {
    moneyItem.splice(index, 1);
  }
}
