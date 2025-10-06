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
    new Stock('AMZN', 700, 6, 'hsl(240,70%,50%)'),
    new Stock('STEM', 1200, 8, 'hsl(300, 70%, 50%)'),
    new Stock('GM', 0.1, 16, 'hsl(180, 70%, 50%)')
];

const stockEvents = [
    { name: "New iPhone", stock: "AAPL", impact: 1.15 },
    { name: "Tech Boom", stock: "AAPL", impact: 1.1 },
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
    { name: "Steam Sale", stock: "STEM", impact: 1.20 },
    { name: "Popular Game Release", stock: "STEM", impact: 1.09 },
    { name: "Poor Game Quality", stock: "STEM", impact: 0.9 },
    { name: "Privacy Breach", stock: "STEM", impact: 0.88 },
    //
    { name: "New Cars", stock: "GM", impact: 1.1 },
    { name: "Positive Perfomance", stock: "GM", impact: 1.08 },
    { name: "Increased Tariffs", stock: "GM", impact: 0.9 },
    { name: "Vehicle Recall", stock: "GM", impact: 0.86 }
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
    cashCard.innerHTML = `<div class="name">Cash</div><div>$${money.toLocaleString()}</div>`;
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
        if (s.lastBuy === undefined) s.lastBuy = '1';
        if (s.lastSell === undefined) s.lastSell = '1';
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `stockCard${i}`;
        card.innerHTML = `
        <div class="name" style="color:${s.color}; display:flex; justify-content:space-between; align-items:center;">
          <span>${s.name}</span>
          <button id="toggle${i}" class="secondary" style="font-size:12px; padding:2px 6px;">${s.visible ? 'Hide' : 'Show'}</button>
        </div>
        <div>Current: $<span class="currentPrice">${s.price.toFixed(2)}</span></div>
        <div class="small owned">Owned: ${s.amountOwned} | Avg: $${s.avgPrice().toFixed(2)}</div>
        <div class="small profit" style="color:${s.profit() >= 0 ? 'var(--profit)' : 'var(--loss)'}">${s.amountOwned ? `Profit: $${s.profit().toFixed(2)}` : ''}</div>
        <div style="display:flex; gap:8px; align-items:center; margin-top:6px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:6px;">
            <select id="buyAmt${i}" class="dropdown"></select>
            <button onclick="buy(${i})">Buy</button>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <select id="sellAmt${i}" class="dropdown"></select>
            <button class="secondary" onclick="sell(${i})">Sell</button>
          </div>
        </div>`;
        portfolioDiv.appendChild(card);
        document.getElementById(`toggle${i}`).addEventListener('click', () => {
            s.visible = !s.visible;
            renderPortfolio();
        });
        const buySelect = document.getElementById(`buyAmt${i}`);
        const sellSelect = document.getElementById(`sellAmt${i}`);
        buySelect.addEventListener('change', () => { s.lastBuy = buySelect.value; });
        sellSelect.addEventListener('change', () => { s.lastSell = sellSelect.value; });
        const maxBuy = Math.floor(money / s.price);
        const maxSell = s.amountOwned;
        populateSelectOptions(buySelect, maxBuy, s.lastBuy);
        populateSelectOptions(sellSelect, maxSell, s.lastSell);
    });
    renderCash();
}

function populateSelectOptions(select, max, lastVal) {
    const fixed = [1, 5, 10];
    const opts = [];
    fixed.forEach(v => { if (v <= max) opts.push(String(v)); });
    if (max > 10) opts.push('Max');
    if (opts.length === 0) opts.push('1');

    while (select.options.length) select.remove(0);
    opts.forEach(o => select.add(new Option(o, o)));

    if (opts.includes(String(lastVal))) {
        select.value = String(lastVal);
    } else {
        if (lastVal === 'Max' && opts.includes('Max')) {
            select.value = 'Max';
        } else {
            const numericOpts = opts.filter(x => x !== 'Max').map(Number).sort((a, b) => a - b);
            const desired = parseInt(lastVal, 10);
            if (!isNaN(desired)) {
                let pick = numericOpts.find(n => n >= desired);
                if (!pick) pick = numericOpts[numericOpts.length - 1] || Number(opts[0]);
                select.value = String(pick);
            } else {
                select.value = opts[0];
            }
        }
    }
}

function updatePortfolioValues() {
    stocks.forEach((s, i) => {
        const card = document.getElementById(`stockCard${i}`);
        if (!card) return;

        const maxBuy = Math.floor(money / s.price);
        const maxSell = s.amountOwned;

        card.querySelector('.currentPrice').textContent = s.price.toFixed(2);
        card.querySelector('.owned').textContent = `Owned: ${s.amountOwned} | Avg: $${s.avgPrice().toFixed(2)}`;

        const profitElem = card.querySelector('.profit');
        if (s.amountOwned > 0) {
            profitElem.textContent = `Profit: $${s.profit().toFixed(2)}`;
            profitElem.style.color = s.profit() >= 0 ? 'var(--profit)' : 'var(--loss)';
        } else profitElem.textContent = '';

        const buySelect = document.getElementById(`buyAmt${i}`);
        const sellSelect = document.getElementById(`sellAmt${i}`);

        if (buySelect) populateSelectOptions(buySelect, maxBuy, s.lastBuy || buySelect.value);
        if (sellSelect) populateSelectOptions(sellSelect, maxSell, s.lastSell || sellSelect.value);
    });
    renderCash();
}

function buy(i) {
    const s = stocks[i];
    const select = document.getElementById(`buyAmt${i}`);
    const val = select ? select.value : s.lastBuy;
    s.lastBuy = val;
    let amount = val === 'Max' ? Math.floor(money / s.price) : parseInt(val, 10) || 1;
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
    let amount = val === 'Max' ? s.amountOwned : parseInt(val, 10) || 1;
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

setInterval(() => { if (Math.random() < 0.2 && !paused) triggerRandomEvent(); }, 5000);

// ------------------- Draw -------------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now();
    const t = Math.min(1, Math.max(0, (now - lastUpdateTime) / Math.max(1, UPDATE_INTERVAL)));
    stocks.forEach((s, sIdx) => {
        if (!s.visible) return;
        const recent = s.history.slice(-POINTS_SHOWN);
        if (!recent.length) return;
        let maxP = Math.max(...recent), minP = Math.min(...recent);
        if (!isFinite(maxP)) maxP = s.price || 1; if (!isFinite(minP)) minP = 0;
        let range = maxP - minP; if (range <= 0) range = Math.max(1, Math.abs(maxP) * 0.02);
        const mid = (maxP + minP) / 2;
        const targetMax = mid + (range * RANGE_PAD) / 2;
        const targetMin = mid - (range * RANGE_PAD) / 2;
        s.displayMin = lerp(s.displayMin, targetMin, SCALE_SMOOTH);
        s.displayMax = lerp(s.displayMax, targetMax, SCALE_SMOOTH);
        if (s.displayMin < 0) s.displayMin = Math.max(0, s.displayMin);
        const L = recent.length;
        const scaleX = canvas.width / Math.max(1, L - 1);
        ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = s.color; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
        for (let i = 0; i < L; i++) {
            const price = recent[i];
            const normalized = (price - s.displayMin) / (s.displayMax - s.displayMin);
            const y = canvas.height - normalized * canvas.height;
            const x = i * scaleX;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        if (s.amountOwned) {
            const avgY = canvas.height - ((s.avgPrice() - s.displayMin) / (s.displayMax - s.displayMin)) * canvas.height;
            ctx.beginPath(); ctx.strokeStyle = s.color; ctx.setLineDash([4, 2]); ctx.moveTo(0, avgY); ctx.lineTo(canvas.width, avgY); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
        ctx.fillStyle = s.color; ctx.font = '12px system-ui,sans-serif';
        const latestDisplay = recent[recent.length - 1];
        ctx.fillText(`${s.name} $${latestDisplay.toFixed(2)}`, 8, 16 + sIdx * 18);
    });
    if (mouseX !== null) {
        ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.moveTo(mouseX, 0); ctx.lineTo(mouseX, canvas.height); ctx.stroke();
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
