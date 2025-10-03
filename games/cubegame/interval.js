import { spawnEnemy, enemy } from "./enemy.js";
import { playerStats, player } from "./player.js";
import { spaceTime } from "./main.js";
import { drawDeathOverlay, position } from "./skilltree.js";
import { loadDramaticText } from "/workspaces/K3ysPlace/globaljs/textEffects.js";

let timerTimeout, healthTimeout, squaresTimeout, triangleTimeout, hexagonTimeout, bossSquareTimeout, checkIfTabInterval, scaleDamageInterval;

export function startIntervals() {    
    function timerTick() {
        if (!spaceTime.offTab) {
            player.time += 1;
        }
        timerTimeout = setTimeout(timerTick, 1000 * spaceTime.gameSpeed);
    }

    function healthTick() {
        if (!spaceTime.offTab) {
            playerStats.health -= playerStats.healthDecreaseInt;

            if (playerStats.health <= 0) {
                drawDeathOverlay();
                position[0] = player.centerX;
                position[1] = player.centerY;
                spaceTime.paused = true;
                stopIntervals();
                return;
            }
        }
        healthTimeout = setTimeout(healthTick, playerStats.damageTickRate * spaceTime.gameSpeed);
    }

    function squaresTick() {
        if (!spaceTime.offTab) {
            if (player.time < 45) {
                spawnEnemy(1);

                setTimeout(() => {
                    spawnEnemy(2);
                }, 500 * spaceTime.gameSpeed);

            } else if (player.time >= 45 && player.time < 150) {

                setTimeout(() => {
                    spawnEnemy(4);
                }, 500 * spaceTime.gameSpeed);

            }
        }
        squaresTimeout = setTimeout(squaresTick, 1000 * spaceTime.gameSpeed);
    }

    function triangleTick() {
        if (!spaceTime.offTab) {
            if (player.time >= 45) spawnEnemy(5);
            if (player.time >= 70) spawnEnemy(7);
        }
        triangleTimeout = setTimeout(triangleTick, 2000 * spaceTime.gameSpeed);
    }

    function hexagonTick() {
        if (!spaceTime.offTab) {
            if (player.time >= 120) spawnEnemy(9);
        }
        hexagonTimeout = setTimeout(hexagonTick, 3000 * spaceTime.gameSpeed);
    }

    function bossSquareTick() {
        if (!spaceTime.offTab) {
            if (player.time === 30) {
                loadDramaticText("Big Cube");
                spawnEnemy(3);
            }
            if (player.time === 60) {
                loadDramaticText("Panic Triangle");
                spawnEnemy(6);
            }
            if (player.time === 90) {
                loadDramaticText("Hexagonal Horror");
                spawnEnemy(8);
            }
        }
        bossSquareTimeout = setTimeout(bossSquareTick, 1000 * spaceTime.gameSpeed);
    }

    // start all ticks
    timerTick();
    healthTick();
    squaresTick();
    triangleTick();
    hexagonTick();
    bossSquareTick();
}

export function stopIntervals() {
    clearTimeout(timerTimeout);
    clearTimeout(healthTimeout);
    clearTimeout(squaresTimeout);
    clearTimeout(triangleTimeout);
    clearTimeout(bossSquareTimeout);
}

scaleDamageInterval = setInterval (() => {
    if (!spaceTime.offTab) {
        playerStats.healthDecreaseInt = 0.01 + (enemy.length * 0.00005);
        if (enemy.some(e => e.boss)) {
            playerStats.healthDecreaseInt += 0.0005;
        }
    }
}, 1000);

checkIfTabInterval = setInterval(() => {
    spaceTime.offTab = document.visibilityState !== "visible";
}, 1000);