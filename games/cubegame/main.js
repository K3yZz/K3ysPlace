//! ================== imports ==================
import SimplexNoise from '/workspaces/K3ysPlace/globalassets/simplex-noise';

//! ================== run things ==================

//! ================== Canvas + ctx ==================
const skilltreeCanvas = document.getElementById("skillTreeCanvas");
const skilltreeCtx = skilltreeCanvas.getContext("2d");

const skilltreeBgCanvas = document.getElementById("skillTreeBackground");
const skilltreeBgCtx = skilltreeBgCanvas.getContext("2d");

const deathOverlay = document.getElementById("deathOverlay");

const playerCanvas = document.getElementById("playerCanvas");
const playerCtx = playerCanvas.getContext("2d");

const enemyCanvas = document.getElementById("enemyCanvas");
const enemyCtx = enemyCanvas.getContext("2d");


//! ================== variables ==================
//*main
const spaceTime = {
    ranOnce: false,
    paused: false,
    offTab: false,
    skillTreeOpen: false,
    gameSpeed: 1,
    debug: false,
};

//*player
const playerStats = {
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
const player = {
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

//*enemy
let enemy = [];
const COLOR_MAP = {
    gold: "rgba(255, 166, 0, 1)",
    red: "rgba(255, 0, 0, 1)",
    purple: "rgba(128, 0, 128, 1)",
    blue: "rgba(50, 102, 179, 1)",
};
const ENEMY_DATA = {
    1: { type: "square", color: "red", size: 50, maxHealth: 3, dropAmount: [1, 3] },
    2: { type: "square", color: "red", size: 100, maxHealth: 6, dropAmount: [4, 6] },
    3: { type: "square", color: "red", size: 300, maxHealth: 20, dropAmount: [20, 40], boss: true },
    4: { type: "square", color: "red", size: 100, maxHealth: 12, dropAmount: [7, 10] },
    5: { type: "triangle", color: "purple", size: 50, maxHealth: 15, dropAmount: [11, 15] },
    6: { type: "triangle", color: "gold", size: 500, maxHealth: 50, dropAmount: [40, 60], boss: true },
    7: { type: "triangle", color: "gold", size: 100, maxHealth: 25, dropAmount: [16, 25] },
    8: { type: "hexagon", color: "blue", size: 400, maxHealth: 100, dropAmount: [100, 100], boss: true },
    9: { type: "hexagon", color: "blue", size: 100, maxHealth: 40, dropAmount: [26, 30] },
};

//*money
let moneyItem = [];

//*skill tree
const skills = [
    //!damage skill tree
    {
        name: "Damage+",
        description: ".",
        icon: "",
        drawLinesTo: ["Damage++", "Attack Speed+"],
        pos: [0, 0],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 4,
        costInflation: null,
        unlocked: true,
        hoveringOverSkill: false,
    },
    {
        name: "Damage++",
        description: ".",
        icon: "",
        drawLinesTo: ["Damage+++", "Size+"],
        pos: [-100, -100],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 5,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Damage+++",
        description: ".",
        icon: "",
        drawLinesTo: ["AOE Bullets"],
        pos: [-100, -200],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 5,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Attack Speed+",
        description: ".",
        icon: "",
        drawLinesTo: ["Attack Speed++"],
        pos: [100, -100],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 4,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Attack Speed++",
        description: ".",
        icon: "",
        drawLinesTo: [""],
        pos: [100, -200],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 5,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Size+",
        description: ".",
        icon: "",
        drawLinesTo: ["Size++"],
        pos: [-200, -200],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 3,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Size++",
        description: ".",
        icon: "",
        drawLinesTo: [""],
        pos: [-200, -300],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 3,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "AOE Bullets",
        description: ".",
        icon: "",
        drawLinesTo: [""],
        pos: [-100, -300],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 1,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    //todo Health skill tree
    {
        name: "Health+",
        description: ".",
        icon: "",
        drawLinesTo: ["Health++"],
        pos: [400, 0],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 5,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Health++",
        description: ".",
        icon: "",
        drawLinesTo: ["Health+++", "Resistance+", "Vampirism"],
        pos: [400, -100],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 5,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Health+++",
        description: ".",
        icon: "",
        drawLinesTo: [""],
        pos: [400, -200],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 5,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Vampirism",
        description: ".",
        icon: "",
        drawLinesTo: ["Vampire Regeneration+"],
        pos: [300, -200],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 1,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Vampire Regeneration+",
        description: ".",
        icon: "",
        drawLinesTo: ["a", "a"],
        pos: [300, -300],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 3,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Resistance+",
        description: ".",
        icon: "",
        drawLinesTo: [""],
        pos: [500, -200],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 3,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    //^ Money skill tree
    {
        name: "Money+",
        description: ".",
        icon: "",
        drawLinesTo: ["Money++", "Magnetism"],
        pos: [-400, 0],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 5,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Money++",
        description: ".",
        icon: "",
        drawLinesTo: ["a", "a"],
        pos: [-400, -100],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 5,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Magnetism",
        description: ".",
        icon: "",
        drawLinesTo: ["Magnet Strength+",],
        pos: [-500, -100],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 1,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
    {
        name: "Magnet Strength+",
        description: ".",
        icon: "",
        drawLinesTo: [""],
        pos: [-500, -200],
        cost: null,
        amountAbtained: 0,
        maxAbtainable: 5,
        costInflation: null,
        unlocked: false,
        hoveringOverSkill: false,
    },
];
let position = [player.centerX, player.centerY];
let previous_position = [0, 0];
let drag_position = [0, 0];
let dragging = false;
let offset = 0;
const icon = new Image();

//*intervals + timeouts + requestanimation
let timerTimeout, healthTimeout, squaresTimeout, triangleTimeout, hexagonTimeout, bossSquareTimeout, checkIfTabInterval, scaleDamageInterval;

let drawSkillTreeAnimation;
let gameLoopId;
let scaleTimeoutId;

//*other
const keys = {};

let fps = 0;

let lastFrameTime = performance.now();
let frames = 0;

//! ================== main functions ==================
function initBackground() {
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
function runOnce() {
    if (!spaceTime.ranOnce) {
        spawnEnemy(1);
        startIntervals();
        scaleBackground();
        spaceTime.ranOnce = true;
    }
}
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
function editBox(type, box) {
    if (!document.body.contains(box)) {
        document.body.appendChild(box);
    }

    if (type === "create") {
        box.style.zIndex = 10;
    } else if (type === "delete") {
        box.style.zIndex = -10;
    }
};
function startGame() {
    cancelAnimationFrame(gameLoopId);
    cancelAnimationFrame(drawSkillTreeAnimation);
    clearTimeout(scaleTimeoutId);
    stopIntervals();

    spaceTime.paused = false;
    spaceTime.ranOnce = false;
    spaceTime.skillTreeOpen = false;

    playerStats.health = playerStats.maxHealth;
    playerStats.moneyThisRun = 0;
    playerStats.healthDecreaseInt = 0.01;
    player.time = 0;
    enemy.length = 0;
    moneyItem.length = 0;

    ["startButton", "toSkillTreeButton", "againButton", "earningsBox", "moneyBox", "tipBox"]
        .forEach(id => editBox("delete", document.getElementById(id)));

    gameLoop();
}

//! ================== skill tree functions ==================
function loadDeathOverlay() {
    let deathOverlay = document.getElementById("deathOverlay");

    function drawScanlines() {
        const ctx = deathOverlay.getContext("2d");

        const lineHeight = 2;
        const lineSpacing = 2;

        for (let y = 0; y < window.innerHeight; y += lineHeight + lineSpacing) {
            ctx.fillStyle = "rgba(11, 200, 233, 0.28)";
            ctx.fillRect(0, y, window.innerWidth, lineHeight);
        }
    }

    drawScanlines();
    window.addEventListener("resize", drawScanlines);
}
function drawSkillTree() {
    const skillTreeCanvas = document.getElementById("skillTreeCanvas");
    skillTreeCanvas.style.zIndex = "3";
    skillTreeCanvas.style.cursor = "auto";
    skillTreeCanvas.style.pointerEvents = "auto";
    spaceTime.skillTreeOpen = true;

    editBox("create", document.getElementById("startButton"));
    editBox("create", document.getElementById("moneyBox"));
    editBox("delete", document.getElementById("toSkillTreeButton"));
    editBox("delete", document.getElementById("againButton"));
    editBox("delete", document.getElementById("earningsBox"));
    editBox("delete", document.getElementById("tipBox"));

    const deathOverlay = document.getElementById("deathOverlay");
    deathOverlay.style.zIndex = "-999";
    deathOverlay.style.cursor = "none";
    deathOverlay.style.pointerEvents = "none";

    document.getElementById("moneyBox").innerHTML = `
    <p style="font-size: 18px; margin: 5px 0 0 0;">Money</p>
    <div style="display: flex; align-items: center; justify-content: center;">
      <p id="moneyDisplay" style="font-size: 14px; margin: 0;">${playerStats.money}</p>
    </div>
  `;

    draw();
}
function drawDeathOverlay() {
    const deathOverlay = document.getElementById("deathOverlay");
    deathOverlay.style.zIndex = "5";
    deathOverlay.style.cursor = "auto";
    deathOverlay.style.pointerEvents = "auto";
    editBox("create", document.getElementById("toSkillTreeButton"));
    editBox("create", document.getElementById("againButton"));
    editBox("create", document.getElementById("earningsBox"));
    editBox("create", document.getElementById("tipBox"));

    document.getElementById("tipBox").innerText = randomTipGenerator();
    let earnings = playerStats.moneyThisRun;
    if (playerStats.moneyThisRun === 0) {
        earnings = "Nothing...";
    } else if (playerStats.moneyThisRun >= 1000) {
        earnings = playerStats.moneyThisRun.toLocaleString();
    }

    document.getElementById("earningsBox").innerHTML = `
  <p id="earnedText" style="font-size: 24px; margin-top: 12px; position: relative;">You Earned</p>
  <div style="display: flex; align-items: center; justify-content: center;">
    <span id="earningsAmount" style="font-size: 16px; margin: 10px 0;">${earnings}</span>
  </div>
`;

    if (playerStats.moneyThisRun === 0) {
        let earningsAmount = document.getElementById("earningsAmount");
        earningsAmount.style.color = "rgba(255, 40, 40, 1)";
    }

    const el = document.getElementById("earnedText");
    animateText(el, { wavy: true, rainbow: true });

    let opacity = 0;
    deathOverlay.style.opacity = opacity;

    const interval = setInterval(() => {
        if (opacity < 1) {
            opacity += 0.02;
            if (opacity > 1) opacity = 1;
            deathOverlay.style.opacity = opacity;
        } else {
            clearInterval(interval);
        }
    }, 16);
}
function randomTipGenerator() {
    const tips = [
        "Tip: you're poor...",
        "Tip: WASD to move the skill tree",
        "Tip: Pressing Y lets you leave the match",
        "Tip: did you know.....",
    ];
    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex];
}
function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    ctx.translate(position[0], position[1]);
    drawSkills();

    drawSkillTreeAnimation = requestAnimationFrame(draw);
}
function preRenderBackground() {
    const lineSpacing = 80;
    const waveAmplitude = 40;
    const waveFrequency = 0.05;
    const lineThickness = 16;

    bgCtx.fillStyle = "rgb(18, 16, 50)";
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    bgCtx.fillStyle = "rgb(60, 60, 160)";

    for (let y = -bgCanvas.height; y < bgCanvas.height; y += lineSpacing) {
        for (let x = 0; x <= bgCanvas.width; x += 4) {
            const wave = Math.sin(x * waveFrequency + offset) * waveAmplitude;
            const px = Math.round(x);
            const py = Math.round(y + x * 0.5 + wave);
            bgCtx.fillRect(px, py, 4, lineThickness);
        }
    }
}
function drawBackground() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(bgCanvas, 0, 0);

    offset += 0.02;
    preRenderBackground();
}
function drawSkills() {
    let hovering = false;

    for (const skill of skills) {
        if (!skill.unlocked) continue;

        drawSkillConnections(skill);
        drawSkillBox(skill);

        if (skill.hoveringOverSkill && spaceTime.skillTreeOpen) {
            updateSkillDescriptionBox(skill);
            hovering = true;
        }

        handleSkillPurchase(skill);
    }

    if (!hovering) hideSkillDescriptionBox();
}
function drawSkillConnections(skill) {
    ctx.shadowBlur = 0;
    for (const to of skill.drawLinesTo) {
        const to_skill = skills.find((s) => s.name === to);
        if (to_skill && to_skill.unlocked) {
            ctx.beginPath();
            ctx.moveTo(skill.pos[0], skill.pos[1]);
            ctx.lineTo(to_skill.pos[0], to_skill.pos[1]);
            ctx.strokeStyle = "rgb(255,255,255)";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}
function drawSkillBox(skill) {
    icon.src = skill.icon;

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(skill.pos[0] - 32, skill.pos[1] - 32, 64, 64);
    ctx.drawImage(icon, skill.pos[0] - 32, skill.pos[1] - 32, 64, 64);

    let borderStrokeColor = "rgb(255, 255, 255)";
    let affordable = skill.cost <= playerStats.money;
    let boughtAll = skill.amountAbtained === skill.maxAbtainable;

    if (boughtAll) borderStrokeColor = "rgb(243, 240, 43)";
    else if (affordable) borderStrokeColor = "rgb(64, 240, 143)";

    ctx.strokeStyle = borderStrokeColor;
    ctx.strokeRect(skill.pos[0] - 32, skill.pos[1] - 32, 64, 64);
}
function updateSkillDescriptionBox(skill) {
    let box = document.getElementById("skillDescriptionBox");
    if (!box) {
        box = document.createElement("div");
        box.id = "skillDescriptionBox";
        document.body.appendChild(box);

        Object.assign(box.style, {
            position: "absolute",
            top: "50%",
            left: "20px",
            transform: "translateY(-50%)",
            width: "250px",
            padding: "15px",
            backgroundColor: "rgba(10,10,10,0.9)",
            color: "white",
            border: "1px solid white",
            fontFamily: "font, sans-serif",
            fontSize: "14px",
            lineHeight: "18px",
            borderRadius: "8px",
            boxShadow: "0 0 5px rgba(255,255,255,0.5)",
            zIndex: "1000",
        });
    }

    let borderStrokeColor =
        skill.amountAbtained === skill.maxAbtainable
            ? "rgb(243, 240, 43)"
            : skill.cost <= playerStats.money
                ? "rgb(64, 240, 143)"
                : "rgb(255, 255, 255)";

    box.innerHTML = `
    <h3 style="margin:0; text-align:center; font-size:18px;">${skill.name}</h3>
    <hr style="border:1px solid white; margin:8px 0;">
    <p>${skill.description}</p>
    <p>Cost: ${skill.cost}$</p>
    <p style="color:${borderStrokeColor};">${skill.amountAbtained}/${skill.maxAbtainable}</p>
  `;
    box.style.display = "block";
}
function hideSkillDescriptionBox() {
    const box = document.getElementById("skillDescriptionBox");
    if (box) box.style.display = "none";
}
function handleSkillPurchase(skill) {
    if (!skill.hoveringOverSkill || !dragging) return;

    if (typeof window.skillPurchaseCooldown === "undefined")
        window.skillPurchaseCooldown = false;

    if (
        playerStats.money >= skill.cost &&
        skill.amountAbtained < skill.maxAbtainable &&
        !window.skillPurchaseCooldown
    ) {
        window.skillPurchaseCooldown = true;
        setTimeout(() => {
            window.skillPurchaseCooldown = false;
        }, 200);

        unlockSkillEffects(skill);

        skill.amountAbtained = Math.min(
            skill.amountAbtained + 1,
            skill.maxAbtainable
        );
        playerStats.money -= skill.cost;
        skill.cost = Math.floor(skill.cost * skill.costInflation);

        document.getElementById("moneyDisplay").innerText = playerStats.money;
    }
}
function unlockSkillEffects(skill) {

    function unlockSkill(name, when) {
        const s = skills.find((sk) => sk.name === name);
        if (skill.amountAbtained === when) {
            s.unlocked = true;
        }
    }
    switch (skill.name) {
        //!Damage skill Tree Stuff
        case "Damage+":
            playerStats.strength += 1;

            unlockSkill("Damage++", 3);
            unlockSkill("Attack Speed+", 3);
            unlockSkill("Money+", 0);
            unlockSkill("Health+", 0);
            break;
        case "Damage++":
            playerStats.strength += 1;

            unlockSkill("Damage+++", 4);
            unlockSkill("Size+", 0);
            break;
        case "Damage+++":
            playerStats.strength += 1;

            unlockSkill("AOE Bullets", 4);
            break;
        case "Attack Speed+":
            playerStats.attackSpeed -= 0.1;
            player.backgroundOpacityChangeSpeed = 100 * playerStats.attackSpeed;

            unlockSkill("Attack Speed++", 3);
            break;
        case "Attack Speed++":
            playerStats.attackSpeed -= 0.1;
            player.backgroundOpacityChangeSpeed = 100 * playerStats.attackSpeed;
            break;
        case "Size+":
            player.size *= 1.1;

            unlockSkill("Size++", 2);
            break;
        case "Size++":
            player.size *= 1.1;
            break;
        case "AOE Bullets":
            playerStats.bulletsEnabled = true;
            break;
        //todo Health Skill Tree Stuff
        case "Health+":
            playerStats.maxHealth += 5;

            unlockSkill("Health++", 4);
            break;
        case "Health++":
            playerStats.maxHealth += 5;

            unlockSkill("Health+++", 4);
            unlockSkill("Vampirism", 0);
            unlockSkill("Resistance+", 0);
            break;
        case "Health+++":
            playerStats.maxHealth += 5;
            break;
        case "Vampirism":
            playerStats.vampire = true;

            unlockSkill("Vampire Regeneration+", 0);
            break;
        case "Vampire Regeneration+":
            playerStats.vamprismStrength += 0.5;
            break;
        case "Resistance+":
            playerStats.damageTickRate -= 0.1; //wonky fix mayber
            break;
        //^ Money Stuff
        case "Money+":
            playerStats.moneyMultiplier += 0.2;

            unlockSkill("Money++", 4);
            unlockSkill("Magnetism", 0);
            break;
        case "Money++":
            playerStats.moneyMultiplier += 0.2;
            break;
        case "Magnetism":
            playerStats.magnet = true;

            unlockSkill("Magnet Strength+", 0);
            break;
        case "Magnet Strength+":
            playerStats.magnetStrength += 0.2;
            break;
    }
}
function updateKeyboardMovement() {
    const speed = 8;
    if (keys["w"]) position[1] += speed;
    if (keys["s"]) position[1] -= speed;
    if (keys["a"]) position[0] += speed;
    if (keys["d"]) position[0] -= speed;
    requestAnimationFrame(updateKeyboardMovement);
}

//! ================== player functions ==================
function drawPlayer() {
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
function drawPlayerHealthBar() {
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
function drawBullet() {
    //
}
function scaleBackground() {
    scaleTimeoutId = setTimeout(() => {
        if (player.backgroundScalingOpacity < player.backgroundDefaultOpacity) {
            player.backgroundScalingOpacity += player.backgroundOpacityChangeAmount;
        } else {
            player.backgroundScalingOpacity = .05;
        }
        scaleBackground();
    }, player.backgroundOpacityChangeSpeed * spaceTime.gameSpeed);
}
function drawTimer() {
    ctx.font = '30px font';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    let minutes = Math.floor(player.time / 60);
    let seconds = player.time % 60;
    ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, player.centerX, 30);
}

//! ================== enemy functions ==================
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
function spawnEnemy(enemyID) {
    const data = ENEMY_DATA[enemyID];
    if (data) makeEnemy(data);
}
function drawEnemy(e) {
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
function moveEnemy() {
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
function enemyDropMoney(enemy) {
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
function drawMoney(x, y, targetCtx = ctx) {
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
function moveMoneyItems() {
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

//! ================== collision functions ==================
function ccPlayerToEnemy() {
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

function ccBulletToEnemy() {
    //
}

function ccPlayerToMoney() {
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

function ccMoneyToMoney() {
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

//! ================== interval functions ==================
function startIntervals() {
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
function stopIntervals() {
    clearTimeout(timerTimeout);
    clearTimeout(healthTimeout);
    clearTimeout(squaresTimeout);
    clearTimeout(triangleTimeout);
    clearTimeout(bossSquareTimeout);
}

//! ================== debug functions ==================
function update() {
    const now = performance.now();
    frames++;

    if (now - lastFrameTime >= 1000) {
        fps = frames;
        frames = 0;
        lastFrameTime = now;
    }

    requestAnimationFrame(update);
}
function loadDebugInfo() {
    const debugInfo = document.createElement('div');
    debugInfo.id = 'debugInfo';
    debugInfo.style.position = 'absolute';
    debugInfo.style.top = '10px';
    debugInfo.style.right = '10px';
    debugInfo.style.fontFamily = 'Merriweather, serif';
    debugInfo.style.fontSize = '14px';
    debugInfo.style.color = 'white';
    debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    debugInfo.style.padding = '10px';
    debugInfo.style.borderRadius = '5px';
    debugInfo.style.zIndex = '100';
    debugInfo.style.pointerEvents = 'auto';
    debugInfo.style.cursor = 'auto';

    const select = document.createElement('select');
    select.style.marginBottom = '10px';
    select.style.pointerEvents = 'auto';
    select.style.background = 'rgba(30,30,30,0.8)';
    select.style.color = 'white';
    select.style.border = '1px solid #444';
    select.style.borderRadius = '3px';
    select.style.fontFamily = 'inherit';
    select.style.fontSize = 'inherit';

    const options = [
        { value: 'player', text: 'Player' },
        { value: 'enemy', text: 'Enemies' },
        { value: 'money', text: 'Money Items' },
        { value: 'other', text: 'Other' },
        { value: 'debug', text: 'Debug Tools' }
    ];
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.text = opt.text;
        select.appendChild(option);
    });

    debugInfo.appendChild(select);

    const infoContainer = document.createElement('div');
    debugInfo.appendChild(infoContainer);

    const debugControls = document.createElement('div');
    debugControls.style.marginTop = '15px';

    function addDebugButton(label, onClick) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.margin = '4px 4px 4px 0';
        btn.addEventListener('click', onClick);
        debugControls.appendChild(btn);
    }
    addDebugButton('Pause Game', () => {
        spaceTime.paused = true;
    });
    addDebugButton('Resume Game', () => {
        spaceTime.paused = false;
    });
    addDebugButton('Add 10000 Money', () => {
        playerStats.money += 10000;
    });
    addDebugButton('Kill All Enemies', () => {
        if (Array.isArray(enemy)) enemy.splice(0, enemy.length);
    });
    addDebugButton('Clear Money Items', () => {
        if (Array.isArray(moneyItem)) moneyItem.length = 0;
    });
    addDebugButton('slow game speed', () => {
        spaceTime.gameSpeed += 0.1;
    });
    addDebugButton('speed up game speed', () => {
        spaceTime.gameSpeed -= 0.1;
    });
    let currentEnemyPage = 0;
    const ENEMIES_PER_PAGE = 3;
    let currentMoneyPage = 0;
    const MONEY_ITEMS_PER_PAGE = 3;

    function updateDebugInfo() {
        infoContainer.innerHTML = '';
        debugControls.style.display = 'none';

        if (select.value === 'player') {
            infoContainer.innerHTML = `
                <div style="font-weight:bold;">Player Info:</div>
                <div>Position: <span id="playerPos">${player.x}, ${player.y}</span></div>
                <div>Size: <span id="playerSize">${player.size}</span></div>
                <div>Background Opacity Change Speed: <span id="bgOpacitySpeed">${player.backgroundOpacityChangeSpeed}</span></div>
                <div>Max Health: <span id="playerMaxHealth">${playerStats.maxHealth}</span></div>
                <div>Strength: <span id="playerDamage">${playerStats.strength}</span></div>
                <div>Attack Speed: <span id="playerAttackSpeed">${playerStats.attackSpeed}</span></div>
                <div>Damage Tick Rate: <span id="playerDamageTickRate">${playerStats.damageTickRate}</span></div>
                <div>Health Decrease Int: <span id="playerHealthDecreaseInt">${playerStats.healthDecreaseInt}</span></div>
                <div>Money: <span id="playerMoney">${playerStats.money}</span></div>
                <div>Money This Run: <span id="playerMoneyThisRun">${playerStats.moneyThisRun}</span></div>
                <div>Money Mulitplier: <span id="playerMoneyMultiplier">${playerStats.moneyMultiplier}</span></div>
                <div>Vampire: <span id="playerVampire">${playerStats.vampire}</span></div>
                <div>Vamprism Strength: <span id="playervamprismBuff">${playerStats.vamprismStrength}</span></div>
                <div>Magnet: <span id="playerMagnet">${playerStats.magnet}</span></div>
                <div>Magnet Strength: <span id="playerMagnetPower">${playerStats.magnetStrength}</span></div>
                <div>Bullets: <span id="playerMagnet">${playerStats.bulletsEnabled}</span></div>
            `;
        } else if (select.value === 'enemy') {
            let enemyInfo = '';
            let totalEnemyPages = 1;
            if (Array.isArray(enemy)) {
                totalEnemyPages = Math.ceil(enemy.length / ENEMIES_PER_PAGE);
                enemyInfo += `<div style="font-weight:bold;">Enemy Info:</div>`;
                enemyInfo += `<div>Enemy Count: <span id="enemyCount">${enemy.length}</span></div>`;
                const startIdx = currentEnemyPage * ENEMIES_PER_PAGE;
                const endIdx = Math.min(startIdx + ENEMIES_PER_PAGE, enemy.length);
                for (let idx = startIdx; idx < endIdx; idx++) {
                    const en = enemy[idx];
                    enemyInfo += `
                        <div style="margin-top:6px;"><b>Enemy #${idx + 1}</b></div>
                        <div>Position: ${Math.round(en.x)}, ${Math.round(en.y)}</div>
                        <div>Size: ${en.size}</div>
                        <div>Health: ${en.health}/${en.maxHealth}</div>
                        <div>Drop Amount: ${en.dropAmount}</div>
                        <div>Boss: ${en.boss}</div>
                        <div>Type: ${en.type}</div>
                        <div>Color: ${en.color}</div>
                        <div>Rotation: ${en.rotation.toFixed(2)}</div>
                        <div>Last Hit Time: ${en.lastHitTime.toFixed(2)}</div>
                    `;
                }
                enemyInfo += `
                    <div style="margin-top:10px;">
                        <button id="enemyPrevBtn" ${currentEnemyPage === 0 ? 'disabled' : ''}>Prev</button>
                        <span> Page ${currentEnemyPage + 1} / ${totalEnemyPages} </span>
                        <button id="enemyNextBtn" ${currentEnemyPage >= totalEnemyPages - 1 ? 'disabled' : ''}>Next</button>
                    </div>
                `;
            } else {
                enemyInfo += `<div>No enemy data</div>`;
            }
            infoContainer.innerHTML = enemyInfo;

            const prevBtn = infoContainer.querySelector('#enemyPrevBtn');
            const nextBtn = infoContainer.querySelector('#enemyNextBtn');
            if (prevBtn) prevBtn.onclick = () => { if (currentEnemyPage > 0) { currentEnemyPage--; updateDebugInfo(); } };
            if (nextBtn) nextBtn.onclick = () => { if (currentEnemyPage < totalEnemyPages - 1) { currentEnemyPage++; updateDebugInfo(); } };
        } else if (select.value === 'money') {
            let moneyItemInfo = '';
            let totalMoneyPages = 1;
            if (Array.isArray(moneyItem)) {
                totalMoneyPages = Math.ceil(moneyItem.length / MONEY_ITEMS_PER_PAGE);
                moneyItemInfo += `<div style="font-weight:bold;">Money Item Info:</div>`;
                moneyItemInfo += `<div>Money Item Count: <span id="moneyItemCount">${moneyItem.length}</span></div>`;
                const startIdx = currentMoneyPage * MONEY_ITEMS_PER_PAGE;
                const endIdx = Math.min(startIdx + MONEY_ITEMS_PER_PAGE, moneyItem.length);
                for (let idx = startIdx; idx < endIdx; idx++) {
                    const mi = moneyItem[idx];
                    moneyItemInfo += `
                        <div style="margin-top:6px;"><b>Money Item #${idx + 1}</b></div>
                        <div>Position: ${Math.round(mi.x)}, ${Math.round(mi.y)}</div>
                        <div>Value: ${mi.value}</div>
                    `;
                }
                moneyItemInfo += `
                    <div style="margin-top:10px;">
                        <button id="moneyPrevBtn" ${currentMoneyPage === 0 ? 'disabled' : ''}>Prev</button>
                        <span> Page ${currentMoneyPage + 1} / ${totalMoneyPages} </span>
                        <button id="moneyNextBtn" ${currentMoneyPage >= totalMoneyPages - 1 ? 'disabled' : ''}>Next</button>
                    </div>
                `;
            } else {
                moneyItemInfo += `<div>No money item data</div>`;
            }
            infoContainer.innerHTML = moneyItemInfo;

            const moneyPrevBtn = infoContainer.querySelector('#moneyPrevBtn');
            const moneyNextBtn = infoContainer.querySelector('#moneyNextBtn');
            if (moneyPrevBtn) moneyPrevBtn.onclick = () => { if (currentMoneyPage > 0) { currentMoneyPage--; updateDebugInfo(); } };
            if (moneyNextBtn) moneyNextBtn.onclick = () => { if (currentMoneyPage < totalMoneyPages - 1) { currentMoneyPage++; updateDebugInfo(); } };
        } else if (select.value === 'other') {
            infoContainer.innerHTML = `
                <div style="font-weight:bold;">Other Info:</div>
                <div>Game Paused: <span id="gamePaused">${spaceTime.paused}</span></div>
                <div>Off Tab: <span id="gameOffTab">${spaceTime.offTab}</span></div>
                <div>Skill Tree Open: <span id="skillTreeOpen">${spaceTime.skillTreeOpen}</span></div>
                <div>Ran Once: <span id="ranOnce">${spaceTime.ranOnce}</span></div>
                <div>FPS: <span id="fps">${fps}</span></div>
                <div>Game Speed: <span id="gameSpeed">${spaceTime.gameSpeed.toFixed(2)}</span></div>
            `;
        } else if (select.value === 'debug') {
            infoContainer.innerHTML = `<div style="font-weight:bold;">Debug Tools:</div>`;
            debugControls.style.display = '';
        }
    }

    document.body.appendChild(debugInfo);
    debugInfo.appendChild(debugControls);
    updateDebugInfo();

    select.addEventListener('change', () => {
        currentEnemyPage = 0;
        currentMoneyPage = 0;
        updateDebugInfo();
    });
    setInterval(updateDebugInfo, 100);

    return debugInfo;
}
//! ================== intervals ==================
scaleDamageInterval = setInterval(() => {
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

//! ================== event Listeners ==================
document.addEventListener("mousedown", (e) => {
    dragging = true;
    previous_position[0] = position[0];
    previous_position[1] = position[1];
    drag_position[0] = e.clientX;
    drag_position[1] = e.clientY;
});
document.addEventListener("mouseup", (e) => {
    dragging = false;
});

//mouse move
document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const transformedX = mouseX - position[0];
    const transformedY = mouseY - position[1];

    skills.forEach((skill) => {
        const left = skill.pos[0] - 32;
        const right = skill.pos[0] + 32;
        const top = skill.pos[1] - 32;
        const bottom = skill.pos[1] + 32;
        const onHitBox =
            transformedX >= left &&
            transformedX <= right &&
            transformedY >= top &&
            transformedY <= bottom;

        if (onHitBox) {
            skill.hoveringOverSkill = true;
        } else {
            skill.hoveringOverSkill = false;
        }
    });
});
document.addEventListener("mousemove", (e) => {
    if (dragging) {
        position[0] = previous_position[0] - (drag_position[0] - e.clientX);
        position[1] = previous_position[1] - (drag_position[1] - e.clientY);
    }
});
//for player V
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    player.x = event.clientX - rect.left;
    player.y = event.clientY - rect.top;
});

//keyboard
document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keydown", e => {
    if (e.key === "y") playerMod.playerStats.health = 0;
});
document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

//on load
window.addEventListener('DOMContentLoaded', e => {
    startGame();
    initBackground();
    loadDeathOverlay();
    updateKeyboardMovement();
});
window.addEventListener('load', () => {
    setTimeout(() => {
        if (spaceTime.debug = true) {
            loadDebugInfo();
        }
    }, 100);
});



