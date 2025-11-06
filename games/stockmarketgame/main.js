const canvas = document.getElementById("stockCanvas");
const ctx = canvas.getContext("2d");
const portfolioDiv = document.getElementById("portfolio");
const cashCard = document.getElementById("cashCard");
const pauseCard = document.getElementById("pauseCard");
const eventContainer = document.getElementById("eventContainer");

const POINTS_SHOWN = 200;
const RANGE_PAD = 2.0;
const SCALE_SMOOTH = 0.08;

class Stock {
  constructor(name, price, volatility, color) {
    this.name = name;
    this.price = price;
    this.volatility = volatility;
    this.color = color;
    this.history = [price];
    this.amountOwned = 0;
    this.totalSpent = 0;
    this.displayMin = price - 1;
    this.displayMax = price + 1;
    this.visible = true;
  }

  step() {
    const change = (Math.random() - 0.5) * this.volatility;
    this.price = Math.max(this.price + change, 0);
    this.history.push(this.price);
    if (this.history.length > 5000) this.history.shift();
  }

  avgPrice() {
    return this.amountOwned ? this.totalSpent / this.amountOwned : 0;
  }

  profit() {
    return this.amountOwned * (this.price - this.avgPrice());
  }
}

let money = 10000;
// make the base speed slower: increase baseInterval (ms per tick)
let baseInterval = 200;
let UPDATE_INTERVAL = 200;
let updateTimer = null;
let lastUpdateTime = Date.now();
let paused = false;
let mouseX = null;
let activeEventCount = 0;
let gridVDiv = 12;
let gridHDiv = 8;
let selectedStockIndex = 0;
let speedMultiplier = 1; // 1x by default

const stocks = [
  new Stock("GOOG", 2800, 28, "hsl(120,70%,50%)"), // ~1% per tick
  new Stock("STEM", 1200, 12, "hsl(300, 70%, 50%)"), // ~1% per tick
  new Stock("AMZN", 700, 7, "hsl(240,70%,50%)"), // ~1% per tick
  new Stock("AAPL", 150, 1.5, "hsl(0,70%,50%)"), // ~1% per tick
  new Stock("GM", 0.05, 1, "hsl(180, 70%, 50%)"), // ~20% per tick, penny stock
];

const stockEvents = [
  { name: "New iPhone", stock: "AAPL", impact: 1.15 },
  { name: "Good Reviews", stock: "AAPL", impact: 1.1 },
  { name: "Privacy Scandal", stock: "AAPL", impact: 0.9 },
  { name: "Competition Releases", stock: "AAPL", impact: 0.88 },
  //
  { name: "Breaking News", stock: "GOOG", impact: 1.1 },
  { name: "Search Surge", stock: "GOOG", impact: 1.08 },
  { name: "Ad Revenue Drop", stock: "GOOG", impact: 0.92 },
  { name: "Competition Releases", stock: "GOOG", impact: 0.9 },
  //
  { name: "Black Friday", stock: "AMZN", impact: 1.2 },
  { name: "Holiday Season", stock: "AMZN", impact: 1.12 },
  { name: "Rising Prices", stock: "AMZN", impact: 0.88 },
  { name: "Negative News", stock: "AMZN", impact: 0.7 },
  //
  { name: "Steam Sale", stock: "STEM", impact: 1.2 },
  { name: "Popular Game Release", stock: "STEM", impact: 1.09 },
  { name: "Poor Game Quality", stock: "STEM", impact: 0.9 },
  { name: "Privacy Breach", stock: "STEM", impact: 0.88 },
  //
  { name: "New Cars", stock: "GM", impact: 1.5 },
  { name: "Positive Perfomance", stock: "GM", impact: 1.1 },
  { name: "Increased Tariffs", stock: "GM", impact: 0.8 },
  { name: "Vehicle Recall", stock: "GM", impact: 0.7 },
  //events that modify multiple stocks V
  { name: "Global Panic", targets: "all", impact: 1.3 },
  {
    name: "Tech Boom",
    targets: ["AAPL", "GOOG", "AMZN", "STEM"],
    impact: 1.12,
  },
  {
    name: "Regulation Shock",
    targets: ["GOOG", "AAPL"],
    impacts: { GOOG: 0.92, AAPL: 0.95 },
  },
  { name: "Boycotting", targets: "all", impact: 0.7 },
];

// ------------------- Timer -------------------
function startTimer() {
  if (updateTimer) clearInterval(updateTimer);
  updateTimer = setInterval(() => {
    stocks.forEach((s) => s.step());
    lastUpdateTime = Date.now();
    updatePortfolioValues();
  }, UPDATE_INTERVAL);
}

function stopTimer() {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
}

// ------------------- Mouse -------------------
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});
canvas.addEventListener("mouseleave", () => (mouseX = null));

// ------------------- Utils -------------------
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ------------------- Render Cash & Pause -------------------
function renderCash() {
  cashCard.innerHTML = `<div class="name">Cash</div><span class="name" style="font-weight: 1">$${money.toLocaleString()}</span>`;
}

function renderPause() {
  // display current multiplier (derived from global speedMultiplier)
  pauseCard.innerHTML = `
        <button id="slowBtn" >Slow</button>
        <button id="pauseBtn">${paused ? "Play" : "Pause"
    }</button>
        <button id="fastBtn">Fast</button>
    <span id="speedDisplay">${speedMultiplier.toFixed(1)}x</span>
    `;

  document.getElementById("pauseBtn").addEventListener("click", () => {
    paused = !paused;
    if (paused) stopTimer();
    else {
      lastUpdateTime = Date.now();
      startTimer();
    }
    renderPause();
  });

  document.getElementById("slowBtn").addEventListener("click", () => {
    speedMultiplier = Math.max(0.1, speedMultiplier / 2);
    UPDATE_INTERVAL = Math.max(1, Math.round(baseInterval / speedMultiplier));
    if (!paused) {
      stopTimer();
      startTimer();
    }
    renderPause();
  });

  document.getElementById("fastBtn").addEventListener("click", () => {
    speedMultiplier = Math.min(16, speedMultiplier * 2);
    UPDATE_INTERVAL = Math.max(1, Math.round(baseInterval / speedMultiplier));
    if (!paused) {
      stopTimer();
      startTimer();
    }
    renderPause();
  });
}
// ------------------- Custom Select -------------------
function createCustomSelect(container, options, initialValue, onChange) {
  const button = document.createElement("button");
  button.className = "select-btn";
  button.type = "button";

  // Determine initial display text
  const startValue =
    (initialValue && initialValue.trim() !== "") ||
    (options.length > 0 && options[0])
      ? initialValue || options[0]
      : "1";

  button.textContent = startValue;
  button.style.textAlign = "center"; // center text
  container.innerHTML = "";
  container.appendChild(button);

  // Create dropdown container (absolute, detached from layout)
  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options";
  optionsDiv.style.position = "absolute";
  optionsDiv.style.display = "none";
  optionsDiv.style.zIndex = 9999;
  optionsDiv.style.textAlign = "center";
  optionsDiv.style.whiteSpace = "nowrap"; // prevent wrapping
  document.body.appendChild(optionsDiv);

  // Helper to measure and set width based on longest text
  function adjustWidth() {
    const measure = document.createElement("span");
    measure.style.visibility = "hidden";
    measure.style.position = "absolute";
    measure.style.whiteSpace = "nowrap";
    measure.style.font = getComputedStyle(button).font;
    document.body.appendChild(measure);

    const texts = options.length > 0 ? options.slice() : ["1"];
    texts.push(button.textContent);
    let maxWidth = 0;
    texts.forEach((t) => {
      measure.textContent = t;
      const w = measure.offsetWidth;
      if (w > maxWidth) maxWidth = w;
    });
    measure.remove();

    // Add padding buffer (to account for button padding/borders)
    const finalWidth = maxWidth + 32;
    button.style.width = `${finalWidth}px`;
    optionsDiv.style.width = `${finalWidth}px`;
  }

  function renderOptions(currentOptions) {
    optionsDiv.innerHTML = "";
    const list = currentOptions.length > 0 ? currentOptions : ["1"];
    list.forEach((opt) => {
      const div = document.createElement("div");
      div.className = "option";
      div.dataset.value = opt;
      div.textContent = opt;
      div.style.textAlign = "center";
      div.addEventListener("click", (e) => {
        e.stopPropagation();
        button.textContent = opt;
        hideOptions();
        onChange(opt);
        adjustWidth(); // recheck width if text changes
      });
      optionsDiv.appendChild(div);
    });
  }

  function positionOptions() {
    const rect = button.getBoundingClientRect();
    const left = rect.left + window.pageXOffset;
    const top = rect.bottom + window.pageYOffset + 4;
    optionsDiv.style.left = `${left}px`;
    optionsDiv.style.top = `${top}px`;
    optionsDiv.style.width = `${button.offsetWidth}px`;
  }

  function showOptions() {
    positionOptions();
    optionsDiv.style.display = "flex";
    optionsDiv.style.flexDirection = "column";
    window.addEventListener("scroll", positionOptions, true);
    window.addEventListener("resize", positionOptions);
  }

  function hideOptions() {
    optionsDiv.style.display = "none";
    window.removeEventListener("scroll", positionOptions, true);
    window.removeEventListener("resize", positionOptions);
  }

  renderOptions(options);
  adjustWidth();

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    if (optionsDiv.style.display === "flex") hideOptions();
    else showOptions();
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target) && !optionsDiv.contains(e.target)) {
      hideOptions();
    }
  });

  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      optionsDiv.remove();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return {
    updateOptions(newOptions, currentValue) {
      options = newOptions;
      renderOptions(newOptions);
      adjustWidth();
      if (newOptions.length === 0) {
        button.textContent = "1";
      } else if (newOptions.includes(currentValue)) {
        button.textContent = currentValue;
      } else {
        button.textContent = newOptions[0] || "1";
      }
    },
    getValue() {
      return button.textContent;
    },
    close() {
      hideOptions();
    },
  };
}

// ------------------- Portfolio -------------------
const selectInstances = {}; // store all select instances

function renderPortfolio() {
  portfolioDiv.innerHTML = "";
  stocks.forEach((s, i) => {
    if (s.lastBuy === undefined) s.lastBuy = "1";
    if (s.lastSell === undefined) s.lastSell = "1";

    const card = document.createElement("div");
    card.className = "card blur";
    card.id = `stockCard${i}`;
    card.innerHTML = `
      <div class="name" style="color:${s.color
      }; display:flex; justify-content:space-between; align-items:center;">
        <span>${s.name}</span>
      </div>
      <div>Current: $<span class="currentPrice">${s.price.toFixed(
        3
      )}</span></div>
      <div class="small owned">Owned: ${s.amountOwned} | Avg: $${s
        .avgPrice()
        .toFixed(2)}</div>
      <div class="small profit" style="color:${s.profit() >= 0 ? "#0b7" : "#f55"
      }">${s.amountOwned ? `Profit: $${s.profit().toFixed(2)}` : ""}</div>
      <div style="display:flex; gap:8px; align-items:center; margin-top:6px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:6px;">
          <div id="buyAmt${i}" class="custom-select"></div>
          <button onclick="buy(${i})" style="height: 28px; padding: 4px 8px;">Buy</button>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <div id="sellAmt${i}" class="custom-select"></div>
          <button onclick="sell(${i})" style="height: 28px; padding: 4px 8px;">Sell</button>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button id="view${i}" style="height:28px; padding:4px 8px;">View</button>
        </div>
      </div>
    `;
    portfolioDiv.appendChild(card);

    document.getElementById(`view${i}`).addEventListener("click", () => {
      selectedStockIndex = i;
      renderPause();
    });

    // Create custom select instances or update existing ones
    const maxBuy = Math.floor(money / s.price);
    const buyOptions = [1, 5, 10].filter((v) => v <= maxBuy);
    if (maxBuy > 10) buyOptions.push("Max");

    const maxSell = s.amountOwned;
    const sellOptions = [1, 5, 10].filter((v) => v <= maxSell);
    if (maxSell > 10) sellOptions.push("Max");

    if (!selectInstances[`buy${i}`]) {
      selectInstances[`buy${i}`] = createCustomSelect(
        document.getElementById(`buyAmt${i}`),
        buyOptions,
        s.lastBuy,
        (val) => (s.lastBuy = val)
      );
    } else {
      selectInstances[`buy${i}`].updateOptions(buyOptions, s.lastBuy);
    }

    if (!selectInstances[`sell${i}`]) {
      selectInstances[`sell${i}`] = createCustomSelect(
        document.getElementById(`sellAmt${i}`),
        sellOptions,
        s.lastSell,
        (val) => (s.lastSell = val)
      );
    } else {
      selectInstances[`sell${i}`].updateOptions(sellOptions, s.lastSell);
    }
  });

  renderCash();
}

// ------------------- Update Values -------------------
function updatePortfolioValues() {
  stocks.forEach((s, i) => {
    const card = document.getElementById(`stockCard${i}`);
    if (!card) return;

    card.querySelector(".currentPrice").textContent = s.price.toFixed(2);
    card.querySelector(".owned").textContent = `Owned: ${s.amountOwned
      } | Avg: $${s.avgPrice().toFixed(2)}`;

    const profitElem = card.querySelector(".profit");
    if (s.amountOwned > 0) {
      profitElem.textContent = `Profit: $${s.profit().toFixed(2)}`;
      profitElem.style.color = s.profit() >= 0 ? "#0b7" : "#f55";
    } else profitElem.textContent = "";

    // Update options without resetting user selection
    const maxBuy = Math.floor(money / s.price);
    const buyOptions = [1, 5, 10].filter((v) => v <= maxBuy);
    if (maxBuy > 10) buyOptions.push("Max");

    const maxSell = s.amountOwned;
    const sellOptions = [1, 5, 10].filter((v) => v <= maxSell);
    if (maxSell > 10) sellOptions.push("Max");

    selectInstances[`buy${i}`]?.updateOptions(buyOptions, s.lastBuy);
    selectInstances[`sell${i}`]?.updateOptions(sellOptions, s.lastSell);
  });

  renderCash();
}

function buy(i) {
  const s = stocks[i];
  const select = document.getElementById(`buyAmt${i}`);
  const val = select ? select.value : s.lastBuy;
  s.lastBuy = val;
  let amount =
    val === "Max" ? Math.floor(money / s.price) : parseInt(val, 10) || 1;
  if (amount < 1) return;
  const maxBuy = Math.floor(money / s.price);
  if (amount > maxBuy) amount = maxBuy;
  const total = s.price * amount;
  if (money >= total && amount > 0) {
    money -= total;
    s.amountOwned += amount;
    s.totalSpent += total;
    updatePortfolioValues();
  }
}

function sell(i) {
  const s = stocks[i];
  const select = document.getElementById(`sellAmt${i}`);
  const val = select ? select.value : s.lastSell;
  s.lastSell = val;
  let amount = val === "Max" ? s.amountOwned : parseInt(val, 10) || 1;
  if (amount < 1) return;
  if (amount > s.amountOwned) amount = s.amountOwned;
  if (s.amountOwned >= amount) {
    money += s.price * amount;
    s.amountOwned -= amount;
    s.totalSpent -= s.avgPrice() * amount;
    if (s.amountOwned === 0) s.totalSpent = 0;
    updatePortfolioValues();
  }
}

// ------------------- Events -------------------
function triggerRandomEvent() {
  const event = stockEvents[Math.floor(Math.random() * stockEvents.length)];
  if (!event) return;

  // Resolve targets -> array of Stock objects
  let targets = [];
  if (event.targets === "all") {
    targets = stocks.slice(); // all stocks
  } else if (Array.isArray(event.targets)) {
    targets = event.targets
      .map((name) => stocks.find((s) => s.name === name))
      .filter(Boolean);
  } else if (typeof event.filter === "function") {
    targets = stocks.filter(event.filter);
  } else if (event.stock) {
    // backward compatible single-stock
    const s = stocks.find((x) => x.name === event.stock);
    if (s) targets.push(s);
  } else {
    // if no explicit targets, fallback to a random single stock
    const s = stocks[Math.floor(Math.random() * stocks.length)];
    if (s) targets.push(s);
  }

  if (targets.length === 0) return;

  // Apply impacts and create messages
  targets.forEach((stock) => {
    // compute impact for this stock:
    let impact = 1;
    if (event.impacts && typeof event.impacts === "object") {
      // map lookup (if missing, fallback to event.impact or 1)
      impact =
        event.impacts[stock.name] != null
          ? event.impacts[stock.name]
          : event.impact || 1;
    } else if (typeof event.impact === "number") {
      impact = event.impact;
    } else {
      impact = 1; // no-op if no impact specified
    }

    // apply impact
    stock.price *= impact;
    if (!isFinite(stock.price) || stock.price < 0)
      stock.price = Math.max(0, Math.abs(stock.price) || 0);
    stock.history.push(stock.price);

    // update UI numbers
    updatePortfolioValues();

    // create per-stock event message (you can combine into one if desired)
    const msg = document.createElement("div");
    msg.className = "eventMessage";
    const pct = ((impact - 1) * 100).toFixed(0);
    msg.textContent = `${event.name}: ${stock.name} ${impact > 1 ? "↑" : impact < 1 ? "↓" : "→"
      }${pct}%`;
    msg.style.background = stock.color;
    msg.style.color = "#000";
    eventContainer.appendChild(msg);
    activeEventCount++;

    // animate & remove
    requestAnimationFrame(() => {
      msg.style.opacity = "1";
      msg.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      msg.style.top = "-40px";
      msg.style.opacity = 0;
      setTimeout(() => {
        eventContainer.removeChild(msg);
        activeEventCount--;
      }, 500);
    }, 3000);
  });
}

setInterval(() => {
  if (Math.random() < 0.2 && !paused) triggerRandomEvent();
}, 3500);
// ------------------- Draw -------------------
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  // map drawing units to CSS pixels so mouse coordinates (CSS px) match drawing coords
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function draw() {
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(1, rect.width);
  const H = Math.max(1, rect.height);
  ctx.clearRect(0, 0, W, H);

  // Render only the selected stock (or fallback to first)
  const idx =
    selectedStockIndex >= 0 && selectedStockIndex < stocks.length
      ? selectedStockIndex
      : 0;
  const s = stocks[idx];
  const panelLeft = 0;
  const panelTop = 0;
  const panelW = W;
  const panelH = H;

  // draw panel background (slightly darker)
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(panelLeft, panelTop, panelW, panelH);

  // draw grid lines inside panel
  drawGrid(ctx, panelLeft, panelTop, panelW, panelH, gridVDiv, gridHDiv);

  const recent = s.history.slice(-POINTS_SHOWN);
  if (recent.length) {
    let maxP = Math.max(...recent),
      minP = Math.min(...recent);
    if (!isFinite(maxP)) maxP = s.price || 1;
    if (!isFinite(minP)) minP = 0;
    let range = maxP - minP;
    if (range <= 0) range = Math.max(1, Math.abs(maxP) * 0.02);
    const mid = (maxP + minP) / 2;
    const targetMax = mid + (range * RANGE_PAD) / 2;
    const targetMin = mid - (range * RANGE_PAD) / 2;
    s.displayMin = lerp(s.displayMin, targetMin, SCALE_SMOOTH);
    s.displayMax = lerp(s.displayMax, targetMax, SCALE_SMOOTH);
    if (s.displayMin < 0) s.displayMin = Math.max(0, s.displayMin);
    const L = recent.length;
    const scaleX = panelW / Math.max(1, L - 1);

    // build points for the line
    const points = [];
    for (let i = 0; i < L; i++) {
      const price = recent[i];
      const normalized = (price - s.displayMin) / (s.displayMax - s.displayMin);
      const y = panelTop + (panelH - normalized * panelH);
      const x = panelLeft + i * scaleX;
      points.push({ x, y });
    }

    // fill area under line with a vertical gradient
    if (points.length) {
      ctx.save();
      const grad = ctx.createLinearGradient(0, panelTop, 0, panelTop + panelH);
      // try to create a translucent color from s.color; fallback to rgba
      grad.addColorStop(
        0,
        `${s.color.replace("hsl", "hsla").replace(")", ",0.45)")}`
      );
      grad.addColorStop(1, "rgba(0,0,0,0.02)");
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++)
        ctx.lineTo(points[i].x, points[i].y);
      // close the path down to bottom-right and bottom-left
      ctx.lineTo(panelLeft + panelW, panelTop + panelH);
      ctx.lineTo(panelLeft, panelTop + panelH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    // draw stock line on top
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = s.color;
    ctx.lineJoin = "miter";
    ctx.lineCap = "butt";
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // avg price dashed line
    if (s.amountOwned) {
      const avgY =
        panelTop +
        (panelH -
          ((s.avgPrice() - s.displayMin) / (s.displayMax - s.displayMin)) *
          panelH);
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.setLineDash([4, 2]);
      ctx.moveTo(panelLeft, avgY);
      ctx.lineTo(panelLeft + panelW, avgY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // midline
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.moveTo(panelLeft, panelTop + panelH / 2);
    ctx.lineTo(panelLeft + panelW, panelTop + panelH / 2);
    ctx.stroke();

    // draw y-axis ticks and labels
    drawYAxisTicks(
      ctx,
      panelLeft,
      panelTop,
      panelW,
      panelH,
      s.displayMin,
      s.displayMax,
      8
    );

    // mouse vertical line clipped to panel if inside
    if (mouseX !== null) {
      if (mouseX >= panelLeft && mouseX <= panelLeft + panelW) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.moveTo(mouseX, panelTop);
        ctx.lineTo(mouseX, panelTop + panelH);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  requestAnimationFrame(draw);
}

function drawGrid(ctx, x, y, w, h, vDiv = 6, hDiv = 4) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= vDiv; i++) {
    const px = x + (i / vDiv) * w;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
    ctx.stroke();
  }
  for (let j = 0; j <= hDiv; j++) {
    const py = y + (j / hDiv) * h;
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + w, py);
    ctx.stroke();
  }
  ctx.restore();
}

function drawYAxisTicks(ctx, x, y, w, h, minVal, maxVal, steps = 4) {
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.font = "10px sans-serif";
  ctx.textBaseline = "middle";
  const padding = 6;
  const labelX = x + padding;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const py = y + (1 - t) * h;
    const val = lerp(minVal, maxVal, t);
    const txt = `$${val.toFixed(2)}`;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    const metrics = ctx.measureText(txt);
    const wtxt = metrics.width + 6;
    const htxt = 14;
    ctx.fillRect(labelX - 3, py - htxt / 2, wtxt, htxt);
    ctx.fillStyle = "#fff";
    ctx.fillText(txt, labelX, py);
  }
  ctx.restore();
}

// ------------------- Init -------------------
renderCash();
renderPause();
renderPortfolio();
lastUpdateTime = Date.now();
// ensure UPDATE_INTERVAL matches speedMultiplier
UPDATE_INTERVAL = Math.max(1, Math.round(baseInterval / speedMultiplier));
startTimer();
draw();
