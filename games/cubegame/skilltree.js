import { spaceTime, editBox } from "./main.js";
import { player, playerStats } from "./player.js";
import { animateText } from "/workspaces/K3ysPlace/globaljs/textEffects.js";

const canvas = document.getElementById("skillTreeCanvas");
const ctx = canvas.getContext("2d");

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
  drawLinesTo: ["Health+++","Resistance+", "Vampirism"],
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

export let position = [player.centerX, player.centerY];
let previous_position = [0, 0];
let drag_position = [0, 0];
let dragging = false;

export function loadDeathOverlay() {
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

export function drawSkillTree() {
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

export function drawDeathOverlay() {
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

export let drawSkillTreeAnimation;
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  ctx.translate(position[0], position[1]);
  drawSkills();

  drawSkillTreeAnimation = requestAnimationFrame(draw);
}

const bgCanvas = document.getElementById("skillTreeBackground");
const bgCtx = bgCanvas.getContext("2d");

let offset = 0;

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

const icon = new Image();
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

//for movable area
document.addEventListener("mousedown", (e) => {
  dragging = true;
  previous_position[0] = position[0];
  previous_position[1] = position[1];
  drag_position[0] = e.clientX;
  drag_position[1] = e.clientY;
});

document.addEventListener("mousemove", (e) => {
  if (dragging) {
    position[0] = previous_position[0] - (drag_position[0] - e.clientX);
    position[1] = previous_position[1] - (drag_position[1] - e.clientY);
  }
});

document.addEventListener("mouseup", (e) => {
  dragging = false;
});

//for skill tooltip
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

const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function updateKeyboardMovement() {
  const speed = 8;
  if (keys["w"]) position[1] += speed;
  if (keys["s"]) position[1] -= speed;
  if (keys["a"]) position[0] += speed;
  if (keys["d"]) position[0] -= speed;
  requestAnimationFrame(updateKeyboardMovement);
}
updateKeyboardMovement();
