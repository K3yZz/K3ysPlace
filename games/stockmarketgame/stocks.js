const canvas = document.getElementById('stockCanvas');
const ctx = canvas.getContext('2d');
const portfolioDiv = document.getElementById('portfolio');
const cashCard = document.getElementById('cashCard');
const pauseCard = document.getElementById('pauseCard');
const eventContainer = document.getElementById('eventContainer');

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
let baseInterval = 50;
let UPDATE_INTERVAL = 50;
let updateTimer = null;
let lastUpdateTime = Date.now();
let paused = false;
let mouseX = null;
let activeEventCount = 0;

const stocks = [
    new Stock('AAPL', 150, 2, 'hsl(0,70%,50%)'),
    new Stock('GOOG', 2800, 12, 'hsl(120,70%,50%)'),
    new Stock('TSLA', 700, 6, 'hsl(240,70%,50%)')
];

const stockEvents = [
    { name: "Tech Boom", stock: "AAPL", impact: 1.1 },
    { name: "Privacy Scandal", stock: "AAPL", impact: 0.9 },
    { name: "Search Surge", stock: "GOOG", impact: 1.08 },
    { name: "Ad Revenue Drop", stock: "GOOG", impact: 0.92 },
    { name: "EV Popularity", stock: "TSLA", impact: 1.12 },
    { name: "Recall Issue", stock: "TSLA", impact: 0.88 }
];

// ------------------- Timer -------------------
function startTimer() {
    if (updateTimer) clearInterval(updateTimer);
    updateTimer = setInterval(() => {
        stocks.forEach(s => s.step());
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
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});
canvas.addEventListener('mouseleave', () => mouseX = null);

// ------------------- Utils -------------------
function lerp(a, b, t) { return a + (b - a) * t; }

// ------------------- Render Cash & Pause -------------------
function renderCash() {
    cashCard.innerHTML = `<div class="name">Cash</div><div>$${money.toFixed(2)}</div>`;
}

function renderPause() {
    let speedMultiplier = +(baseInterval / UPDATE_INTERVAL).toFixed(2); // numeric

    pauseCard.innerHTML = `
        <button id="slowBtn">Slow</button>
        <button id="pauseBtn">${paused ? 'Play' : 'Pause'}</button>
        <button id="fastBtn">Fast</button>
        <span id="speedDisplay">${speedMultiplier}x</span>
    `;

    document.getElementById('pauseBtn').addEventListener('click', () => {
        paused = !paused;
        if (paused) stopTimer();
        else { lastUpdateTime = Date.now(); startTimer(); }
        renderPause();
    });

    document.getElementById('slowBtn').addEventListener('click', () => {
        speedMultiplier = Math.max(0.1, speedMultiplier / 2); // halve speed
        UPDATE_INTERVAL = baseInterval / speedMultiplier;
        if (!paused) { stopTimer(); startTimer(); }
        renderPause();
    });

    document.getElementById('fastBtn').addEventListener('click', () => {
        speedMultiplier = Math.min(16, speedMultiplier * 2); // double speed
        UPDATE_INTERVAL = baseInterval / speedMultiplier;
        if (!paused) { stopTimer(); startTimer(); }
        renderPause();
    });
}


// ------------------- Portfolio -------------------
function renderPortfolio() {
    portfolioDiv.innerHTML = '';
    stocks.forEach((s, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `stockCard${i}`;

        const maxBuy = Math.floor(money / s.price);
        const buyOptions = Array.from({ length: Math.min(maxBuy, 10) }, (_, n) => n + 1);
        if (maxBuy > 10) buyOptions.push('Max');

        const maxSell = s.amountOwned;
        const sellOptions = Array.from({ length: Math.min(maxSell, 10) }, (_, n) => n + 1);
        if (maxSell > 10) sellOptions.push('Max');

        card.innerHTML = `
      <div class="name" style="color:${s.color}">${s.name}</div>
      <div>Current: $<span class="currentPrice">${s.price.toFixed(2)}</span></div>
      <div class="small owned">Owned: ${s.amountOwned} | Avg: $${s.avgPrice().toFixed(2)}</div>
      <div style="display:flex; gap:4px; align-items:center; margin-top:2px;">
        <div class="dropdown-wrapper">
          <select class="dropdown" id="buyAmt${i}">${buyOptions.map(v => `<option value="${v}">${v}</option>`).join('')}</select>
        </div>
        <button onclick="buy(${i})">Buy</button>
        <div class="dropdown-wrapper">
          <select class="dropdown" id="sellAmt${i}">${sellOptions.map(v => `<option value="${v}">${v}</option>`).join('')}</select>
        </div>
        <button class="secondary" onclick="sell(${i})">Sell</button>
      </div>
    `;
        portfolioDiv.appendChild(card);
    });
}

function updatePortfolioValues() {
    stocks.forEach((s, i) => {
        const card = document.getElementById(`stockCard${i}`);
        if (!card) return;
        card.querySelector('.currentPrice').textContent = s.price.toFixed(2);
        card.querySelector('.owned').textContent = `Owned: ${s.amountOwned} | Avg: $${s.avgPrice().toFixed(2)}`;
    });
    renderCash();
}

// ------------------- Buy/Sell -------------------
function buy(i) {
    const s = stocks[i];
    const input = document.getElementById(`buyAmt${i}`);
    let amount = input.value === 'Max' ? Math.floor(money / s.price) : parseInt(input.value) || 1;
    if (amount < 1) return;
    const totalCost = s.price * amount;
    if (money >= totalCost) {
        money -= totalCost;
        s.amountOwned += amount;
        s.totalSpent += totalCost;
        renderPortfolio();
        updatePortfolioValues();
    }
}

function sell(i) {
    const s = stocks[i];
    const input = document.getElementById(`sellAmt${i}`);
    let amount = input.value === 'Max' ? s.amountOwned : parseInt(input.value) || 1;
    if (amount < 1) return;
    if (s.amountOwned >= amount) {
        money += s.price * amount;
        s.amountOwned -= amount;
        s.totalSpent -= s.avgPrice() * amount;
        if (s.amountOwned === 0) s.totalSpent = 0;
        renderPortfolio();
        updatePortfolioValues();
    }
}

// ------------------- Events -------------------
function triggerRandomEvent() {
    const event = stockEvents[Math.floor(Math.random() * stockEvents.length)];
    const stock = stocks.find(s => s.name === event.stock);
    if (!stock) return;

    stock.price *= event.impact;
    stock.history.push(stock.price);
    updatePortfolioValues();

    const msg = document.createElement('div');
    msg.className = 'eventMessage';
    msg.textContent = `${event.name}: ${stock.name} ${event.impact > 1 ? '↑' : '↓'}${((event.impact - 1) * 100).toFixed(0)}%`;
    msg.style.background = stock.color;
    msg.style.color = '#000';

    const offset = ((activeEventCount % 5) - 2) * 30;
    msg.style.left = `calc(50% + ${offset}px)`;
    eventContainer.appendChild(msg);
    activeEventCount++;

    requestAnimationFrame(() => {
        msg.style.top = '-20px';
        msg.style.opacity = 1;
    });

    setTimeout(() => {
        msg.style.top = '-40px';
        msg.style.opacity = 0;
        setTimeout(() => {
            eventContainer.removeChild(msg);
            activeEventCount--;
        }, 500);
    }, 3000);
}

setInterval(() => { if (Math.random() < 0.2) triggerRandomEvent(); }, 5000);

// ------------------- Draw -------------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now();
    const t = Math.min(1, Math.max(0, (now - lastUpdateTime) / Math.max(1, UPDATE_INTERVAL)));

    stocks.forEach((s, sIdx) => {
        const recent = s.history.slice(-POINTS_SHOWN);
        if (!recent.length) return;

        let maxP = Math.max(...recent);
        let minP = Math.min(...recent);
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
        const scaleX = canvas.width / Math.max(1, L - 1);

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = s.color;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';

        for (let i = 0; i < L; i++) {
            const price = recent[i];
            const normalized = (price - s.displayMin) / (s.displayMax - s.displayMin);
            const y = canvas.height - normalized * canvas.height;
            const x = i * scaleX;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw average buy line if owned
        if (s.amountOwned) {
            const avgY = canvas.height - ((s.avgPrice() - s.displayMin) / (s.displayMax - s.displayMin)) * canvas.height;
            ctx.beginPath();
            ctx.strokeStyle = s.color;
            ctx.setLineDash([4, 2]);
            ctx.moveTo(0, avgY);
            ctx.lineTo(canvas.width, avgY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Base horizontal line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Labels
        ctx.fillStyle = s.color;
        ctx.font = '12px system-ui,sans-serif';
        const latestDisplay = recent[recent.length - 1];
        ctx.fillText(`${s.name} $${latestDisplay.toFixed(2)}`, 8, 16 + sIdx * 18);
    });

    // Hover line
    if (mouseX !== null) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.moveTo(mouseX, 0);
        ctx.lineTo(mouseX, canvas.height);
        ctx.stroke();

        stocks.forEach((s, sIdx) => {
            const recent = s.history.slice(-POINTS_SHOWN);
            const L = recent.length;
            if (!L) return;
            const scaleX = canvas.width / Math.max(1, L - 1);
            const idx = Math.round(mouseX / scaleX);
            if (idx >= 0 && idx < L) {
                const price = recent[idx];
                ctx.fillStyle = s.color;
                ctx.fillText(`${s.name}: $${price.toFixed(2)}`, Math.min(mouseX + 10, canvas.width - 120), 26 + sIdx * 18);
            }
        });
    }

    requestAnimationFrame(draw);
}

// ------------------- Init -------------------
renderCash();
renderPause();
renderPortfolio();
lastUpdateTime = Date.now();
startTimer();
draw();
