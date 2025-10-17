/* ---------------- Globals & HiDPI ---------------- */
    const chipsDisplay = document.getElementById("chipsDisplay");

    const blackjackCanvas = document.getElementById("blackjack");
    const slotMachineCanvas = document.getElementById("slotMachine");
    const dayJobCanvas = document.getElementById("dayJob");

    const blackjackCtx = blackjackCanvas.getContext("2d");
    const slotMachineCtx = slotMachineCanvas.getContext("2d");
    const dayJobCtx = dayJobCanvas.getContext("2d");

    const bjStatus = document.getElementById("bjStatus");
    const slotStatus = document.getElementById("slotStatus");
    const jobStatus = document.getElementById("jobStatus");

    let chips = 10000, activeTab = "blackjack";
    function renderChips() {
      chipsDisplay.textContent = `Money: ${chips.toLocaleString()}`;
      if (chips < 0) {
        chipsDisplay.style.color = 'rgba(202, 11, 11, 1)';
      }
      else {
        chipsDisplay.style.color = 'white';
      }
    }

    function resizeCanvas(canvas, ctx) {
      const ratio = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function resizeAll() {
      resizeCanvas(blackjackCanvas, blackjackCtx);
      resizeCanvas(slotMachineCanvas, slotMachineCtx);
      resizeCanvas(dayJobCanvas, dayJobCtx);
      render(); // wrapper deciding which to draw
    }
    window.addEventListener('resize', resizeAll);

    /* ---------------- Tabs ---------------- */
    function clickTab(tab) {
      activeTab = tab;
      blackjackCanvas.style.display = (tab === "blackjack") ? "block" : "none";
      slotMachineCanvas.style.display = (tab === "slotMachine") ? "block" : "none";
      dayJobCanvas.style.display = (tab === "dayJob") ? "block" : "none";

      document.getElementById("blackjackControls").style.display = (tab === "blackjack") ? "flex" : "none";
      document.getElementById("slotControls").style.display = (tab === "slotMachine") ? "flex" : "none";
      document.getElementById("dayJobControls").style.display = (tab === "dayJob") ? "flex" : "none";

      document.getElementById("blackjackTab").classList.toggle("active", tab === "blackjack");
      document.getElementById("slotMachineTab").classList.toggle("active", tab === "slotMachine");
      document.getElementById("dayJobTab").classList.toggle("active", tab === "dayJob");
      resizeAll();
    }

    /* ---------------- Utilities ---------------- */

    function roundRect(ctx, x, y, w, h, r, fill = true, stroke = true) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }

    /* ---------------- Blackjack ---------------- */
    function createDeck() {
      const suits = ["♠", "♣", "♥", "♦"];
      const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      let deck = [];
      for (let s of suits) for (let v of values) deck.push({ suit: s, value: v });
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      return deck;
    }

    function cardValue(card) {
      if (card.value === "A") return 11; if (["K", "Q", "J"].includes(card.value)) return 10; return parseInt(card.value, 10);
    }

    function handTotal(hand) {
      let total = 0, aces = 0;
      for (let c of hand) { total += cardValue(c); if (c.value === "A") aces++; }
      while (total > 21 && aces > 0) { total -= 10; aces--; }
      return total;
    }

    let blackjack = {
      deck: [], playerHands: [], playerBets: [], currentHand: 0, dealer: [], inProgress: false
    };

    function uiSetButtons(state) {
      // state: { deal, hit, stand, split }
      document.getElementById("dealBtn").disabled = !state.deal;
      document.getElementById("hitBtn").disabled = !state.hit;
      document.getElementById("standBtn").disabled = !state.stand;
      document.getElementById("splitBtn").disabled = !state.split;
    }

    function canSplit() {
      if (!blackjack.inProgress) return false;
      if (blackjack.playerHands.length !== 1) return false; // only allow initial single-hand split
      const hand = blackjack.playerHands[0];
      if (hand.length !== 2) return false;
      const a = hand[0].value, b = hand[1].value;
      const tens = new Set(["10", "J", "Q", "K"]);
      if (a === b) return true;
      if (tens.has(a) && tens.has(b)) return true;
      return false;
    }

    function bjDeal() {
      if (blackjack.inProgress) return;
      const betInput = document.getElementById("bjBet");
      let bet = Math.floor(Number(betInput.value) || 0);
      if (bet <= 0) { bjStatus.textContent = "Bet must be > 0."; return; }
      if (bet >= chips + 1000) { bjStatus.textContent = "Not enough money."; return; }
      if (chips <= -1000) { bjStatus.textContent = "Banned until debt paid"; return; }

      blackjack.deck = createDeck();
      blackjack.playerHands = [];
      blackjack.playerBets = [];
      blackjack.currentHand = 0;
      blackjack.dealer = [];
      blackjack.inProgress = true;

      // subtract initial bet for primary hand
      chips -= bet;
      blackjack.playerHands.push([]);
      blackjack.playerBets.push(bet);

      // deal sequence: P D P D
      blackjack.playerHands[0].push(blackjack.deck.pop());
      blackjack.dealer.push(blackjack.deck.pop());
      blackjack.playerHands[0].push(blackjack.deck.pop());
      blackjack.dealer.push(blackjack.deck.pop());

      renderChips();
      bjStatus.textContent = "In play — Hit, Stand, or Split.";
      uiSetButtons({ deal: false, hit: true, stand: true, split: canSplit() });
      render();

      // immediate blackjack check for primary hand
      const pTot = handTotal(blackjack.playerHands[0]);
      if (pTot === 21) {
        const payout = Math.floor(blackjack.playerBets[0] * 2.5);
        chips += payout;
        blackjack.inProgress = false;
        bjStatus.textContent = `Blackjack! You win ${payout}.`;
        uiSetButtons({ deal: true, hit: false, stand: false, split: false });
        renderChips();
        render();
      }
    }

    function bjHit() {
      if (!blackjack.inProgress) return;
      const hand = blackjack.playerHands[blackjack.currentHand];
      hand.push(blackjack.deck.pop());
      const total = handTotal(hand);
      if (total > 21) {
        bjStatus.textContent = `Hand ${blackjack.currentHand + 1} busted (${total}).`;
        proceedAfterHand(true); // mark as busted and advance
      } else {
        bjStatus.textContent = `Hand ${blackjack.currentHand + 1}: ${total}. Hit or Stand.`;
        uiSetButtons({ deal: false, hit: true, stand: true, split: false });
      }
      render();
    }

    function bjStand() {
      if (!blackjack.inProgress) return;
      bjStatus.textContent = `Stand on hand ${blackjack.currentHand + 1}.`;
      proceedAfterHand(false); // stood
      render();
    }

    function proceedAfterHand(justBusted = false) {
      // Find next playable hand (index > current) whose total <= 21 and has cards.
      // If found, switch to it. Otherwise dealer plays and we resolve.
      const start = blackjack.currentHand + 1;
      let next = -1;
      for (let i = start; i < blackjack.playerHands.length; i++) {
        const t = handTotal(blackjack.playerHands[i]);
        if (blackjack.playerHands[i].length > 0 && t <= 21) { next = i; break; }
      }

      if (next !== -1) {
        blackjack.currentHand = next;
        bjStatus.textContent = `Now playing hand ${blackjack.currentHand + 1}.`;
        uiSetButtons({ deal: false, hit: true, stand: true, split: false });
        render();
        return;
      }

      // No more playable player hands: dealer plays
      while (handTotal(blackjack.dealer) < 16) {
        blackjack.dealer.push(blackjack.deck.pop());
      }

      // Resolve each player hand
      const dealerTotal = handTotal(blackjack.dealer);
      let results = [];
      for (let i = 0; i < blackjack.playerHands.length; i++) {
        const ph = blackjack.playerHands[i];
        const bet = blackjack.playerBets[i];
        const pTot = handTotal(ph);
        if (pTot > 21) {
          results.push(`Hand ${i + 1}: busted (${pTot}) — lose ${bet}`);
          continue;
        }
        if (dealerTotal > 21 || pTot > dealerTotal) {
          const payout = bet * 2;
          chips += payout;
          results.push(`Hand ${i + 1}: ${pTot} beats ${dealerTotal} — win ${payout}`);
        } else if (pTot === dealerTotal) {
          chips += bet; // push
          results.push(`Hand ${i + 1}: push ${pTot} — bet returned`);
        } else {
          results.push(`Hand ${i + 1}: ${pTot} vs dealer ${dealerTotal} — lose ${bet}`);
        }
      }

      blackjack.inProgress = false;
      uiSetButtons({ deal: true, hit: false, stand: false, split: false });
      bjStatus.textContent = results.join(" | ");
      renderChips();
      render();
    }

    function bjSplit() {
      if (!canSplit()) return;
      const baseHand = blackjack.playerHands[0];
      const baseBet = blackjack.playerBets[0];
      if (chips < baseBet) { bjStatus.textContent = "Not enough chips to split."; return; }
      chips -= baseBet; // second bet
      const cardA = baseHand[0];
      const cardB = baseHand[1];
      blackjack.playerHands = [[cardA], [cardB]];
      blackjack.playerBets = [baseBet, baseBet];
      blackjack.currentHand = 0;
      // deal one card to each new hand
      blackjack.playerHands[0].push(blackjack.deck.pop());
      blackjack.playerHands[1].push(blackjack.deck.pop());

      bjStatus.textContent = `Split performed. Playing hand 1 of ${blackjack.playerHands.length}.`;
      uiSetButtons({ deal: false, hit: true, stand: true, split: false });
      renderChips();
      render();
    }

    function renderBlackjack() {
      const ctx = blackjackCtx;
      const W = blackjackCanvas.clientWidth;
      const H = blackjackCanvas.clientHeight;
      ctx.clearRect(0, 0, W, H);

      // header
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = "20px system-ui";
      const betSum = blackjack.playerBets.reduce((s, b) => s + b, 0);
      ctx.fillText(`Bet: ${betSum.toLocaleString()}`, 20, 30);

      // layout params
      const padding = 20;
      const areaW = W - padding * 2;
      const cardMaxWidth = 110;
      const cardMinWidth = 50;
      const cardAspect = 0.72;
      const cardGap = 14;

      function computeCardLayout(count) {
        if (count === 0) return { w: cardMaxWidth, h: Math.round(cardMaxWidth / cardAspect), perRow: 1 };
        let perRow = Math.min(count, Math.floor((areaW + cardGap) / (cardMaxWidth + cardGap)));
        if (perRow < 1) perRow = 1;
        let w = Math.min(cardMaxWidth, Math.floor((areaW - (perRow - 1) * cardGap) / perRow));
        if (w < cardMinWidth) {
          perRow = Math.floor((areaW + cardGap) / (cardMinWidth + cardGap));
          if (perRow < 1) perRow = 1;
          w = Math.max(cardMinWidth, Math.floor((areaW - (perRow - 1) * cardGap) / perRow));
        }
        return { w: w, h: Math.round(w / cardAspect), perRow: perRow };
      }

      // dealer
      ctx.fillStyle = "#ddd";
      ctx.font = "16px system-ui";
      const dealerLayout = computeCardLayout(blackjack.dealer.length);
      drawCardRow(ctx, blackjack.dealer, padding, 80, dealerLayout, { hideSecond: blackjack.inProgress });
      ctx.fillStyle = "#aaa";

      // player area
      ctx.fillStyle = "#ddd";
      const startY = 260;
      const handSpacing = 20;
      const maxCards = Math.max(...(blackjack.playerHands.map(h => h.length)), 1);
      const unifiedLayout = computeCardLayout(maxCards);
      for (let i = 0; i < blackjack.playerHands.length; i++) {
        const hand = blackjack.playerHands[i];
        const y = startY + i * (unifiedLayout.h + handSpacing + 28);
        drawCardRow(ctx, hand, padding, y, unifiedLayout, { hideSecond: false });
        ctx.fillStyle = "#fff";
      }
    }

    function drawCardRow(ctx, cards, startX, startY, layout, options = { hideSecond: false }) {
      const W = blackjackCanvas.clientWidth;
      const padding = 20;
      const areaW = W - padding * 2;
      const gap = 14;
      const perRow = layout.perRow || 1;
      const w = layout.w, h = layout.h;
      const rows = Math.ceil(cards.length / perRow) || 1;
      const vgap = 18;
      for (let r = 0; r < rows; r++) {
        const itemsThisRow = Math.min(perRow, cards.length - r * perRow);
        const rowWidth = itemsThisRow * w + (itemsThisRow - 1) * gap;
        const offsetX = padding + (areaW - rowWidth) / 2;
        const y = startY + r * (h + vgap);
        for (let i = 0; i < itemsThisRow; i++) {
          const cardIndex = r * perRow + i;
          const x = offsetX + i * (w + gap);
          const card = cards[cardIndex];
          const hide = options.hideSecond && cardIndex === 1 && cards === blackjack.dealer;
          drawCard(blackjackCtx, x, y, w, h, hide ? null : card);
        }
      }
    }

    function drawCard(ctx, x, y, w, h, card) {
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, w, h, 8, true, true);
      if (!card) {
        ctx.fillStyle = "#222";
        roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 6, true, false);
        ctx.fillStyle = "#666";
        ctx.font = `${Math.max(14, Math.round(w * 0.18))}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("?", x + w / 2, y + h / 2 + 6);
        return;
      }
      const isRed = (card.suit === "♥" || card.suit === "♦");
      ctx.fillStyle = isRed ? "#c33" : "#111";
      ctx.font = `${Math.max(12, Math.round(w * 0.16))}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText(card.value + card.suit, x + 10, y + 20);
      ctx.font = `${Math.max(28, Math.round(w * 0.36))}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = isRed ? "#c33" : "#111";
      ctx.fillText(card.suit, x + w / 2, y + h / 2 + 12);
    }

    /* ---------------- Slots ---------------- */
    const EASE = {
      outCubic: t => 1 - Math.pow(1 - t, 3),
      outQuad: t => 1 - (1 - t) * (1 - t)
    };

    let slots = {
      symbols: ["🍒", "🍋", "🍊", "⭐", "7"],
      bet: 0, spinning: false,
      reels: [
        { pos: 0, speed: 0, stopped: true, stopAt: 0, targetPos: 0, targetIndex: 0 },
        { pos: 0, speed: 0, stopped: true, stopAt: 0, targetPos: 0, targetIndex: 0 },
        { pos: 0, speed: 0, stopped: true, stopAt: 0, targetPos: 0, targetIndex: 0 }
      ],
      symbolHeight: 70,
      lastTime: 0
    };

    function slotSpin() {
      if (slots.spinning) return;
      const betInput = document.getElementById("slotBet");
      let bet = Math.floor(Number(betInput.value) || 0);
      if (bet <= 0) { slotStatus.textContent = "Bet must be > 0."; return; }
      if (bet > chips + 1000) { slotStatus.textContent = "Not enough money."; return; }
      if (chips < -1000) { slotStatus.textContent = "Banned until debt paid"; return; }
      slots.bet = bet;
      chips -= bet; renderChips();
      slotStatus.textContent = "Spinning...";
      document.getElementById("spinBtn").disabled = true;

      const now = performance.now();
      const baseDuration = 1400;
      for (let i = 0; i < 3; i++) {
        const reel = slots.reels[i];
        reel.stopped = false;
        reel.speed = 18 + Math.random() * 10;
        const extra = Math.floor(Math.random() * 600);
        const duration = baseDuration + i * 300 + extra;
        reel.startTime = now;
        reel.duration = duration;
        reel.startPos = reel.pos;
        reel.targetIndex = Math.floor(Math.random() * slots.symbols.length);
        const minSpins = 5 + Math.floor(Math.random() * 6);
        const curInt = Math.floor(reel.pos);
        reel.targetPos = curInt + minSpins * slots.symbols.length + reel.targetIndex;
      }
      slots.spinning = true;
      slots.lastTime = now;
      requestAnimationFrame(slotLoop);
    }

    function slotLoop(ts) {
      if (!slots.spinning) { renderSlotMachine(); return; }
      slots.lastTime = ts;
      let moving = false;
      for (let i = 0; i < 3; i++) {
        const reel = slots.reels[i];
        if (reel.stopped) continue;
        const elapsed = ts - (reel.startTime || ts);
        const duration = Math.max(1, reel.duration || 1);
        const t = Math.min(1, elapsed / duration);
        const ease = EASE.outCubic(t);
        reel.pos = reel.startPos + (reel.targetPos - reel.startPos) * ease;
        if (t >= 1) {
          reel.pos = reel.targetPos;
          reel.stopped = true;
        } else {
          moving = true;
        }
      }

      renderSlotMachine();

      if (slots.reels.every(r => r.stopped)) {
        slots.spinning = false;
        evaluateSlotResult();
        document.getElementById("spinBtn").disabled = false;
      } else {
        requestAnimationFrame(slotLoop);
      }
    }

    function evaluateSlotResult() {
      const results = slots.reels.map(r => slots.symbols[Math.floor(r.pos) % slots.symbols.length]);
      const [a, b, c] = results;
      let payout = 0;
      if (a === b && b === c) {
        if (a === "7") payout = slots.bet * 20;
        else if (a === "⭐") payout = slots.bet * 10;
        else payout = slots.bet * 5;
      } else if (a === b || b === c || a === c) {
        payout = slots.bet * 2;
      }
      if (payout > 0) {
        chips += payout;
        slotStatus.textContent = `Result: ${results.join(" ")} — You won ${payout}!`;
      } else {
        slotStatus.textContent = `Result: ${results.join(" ")} — No win.`;
      }
      renderChips();
    }

    function renderSlotMachine() {
      const ctx = slotMachineCtx;
      const W = slotMachineCanvas.clientWidth;
      const H = slotMachineCanvas.clientHeight;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#fff";
      ctx.font = "20px system-ui";
      ctx.textAlign = "left";
      ctx.fillText(`Bet: ${slots.bet.toLocaleString()}`, 20, 30);

      const reelCount = 3;
      const reelW = Math.min(160, Math.floor((W - 120) / reelCount));
      const reelH = 260;
      const startX = (W - (reelW * reelCount + 20 * (reelCount - 1))) / 2;
      const startY = 60;
      const centerY = startY + reelH / 2;
      const symbolH = slots.symbolHeight;
      const len = slots.symbols.length;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < reelCount; r++) {
        const x = startX + r * (reelW + 20);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, startY, reelW, reelH);
        ctx.clip();

        ctx.fillStyle = "#fafafa";
        ctx.fillRect(x, startY, reelW, reelH);

        const reel = slots.reels[r];
        const pos = reel.pos;

        const visibleRows = Math.ceil(reelH / symbolH) + 1;
        for (let row = -1; row <= visibleRows; row++) {
          const idxFloat = pos + row;
          const idx = Math.floor(idxFloat);
          const symbol = slots.symbols[((idx % len) + len) % len];
          const frac = idxFloat - Math.floor(idxFloat);
          const y = centerY - (frac * symbolH) + row * symbolH;

          if (y + symbolH * 0.5 < startY || y - symbolH * 0.5 > startY + reelH) continue;

          const fontSize = Math.min(Math.round(symbolH * 0.9), Math.floor(reelW * 0.6));
          ctx.font = `${fontSize}px system-ui`;
          ctx.fillStyle = "#111";
          ctx.fillText(symbol, x + reelW / 2, y);
        }

        ctx.restore();

        ctx.lineWidth = 3;
        ctx.strokeRect(x + 8, centerY - symbolH / 2, reelW - 16, symbolH);

        roundRect(ctx, x, startY, reelW, reelH, 8, false, false);
      }
    }

    /* ---------------- Day Job ---------------- */
    let dayJob = {
      job: "Dishwasher",
      pay: 10,
      cooldown: 500,
      lastWorked: 0,
      plateCleanliness: 0,
      scrubbing: false
    };
    let dayJobXP = 0;
    let dayJobXPMax = 100;
    let dayJobLevel = 1;
    let displayedXP = 0;

    function renderDayJob() {
      const ctx = dayJobCtx;
      const W = dayJobCanvas.clientWidth;
      const H = dayJobCanvas.clientHeight;
      ctx.clearRect(0, 0, W, H);

      // header text
      ctx.fillStyle = "#fff";
      ctx.font = "24px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`Job: ${dayJob.job} (Lvl ${dayJobLevel})`, W / 2, 40);
      ctx.fillText(`Pay: ${dayJob.pay} chips`, W / 2, 80);

      // draw plate
      const plateX = W / 2, plateY = H / 2, radius = 100;
      const cleanliness = dayJob.plateCleanliness / 100;
      ctx.fillStyle = `rgba(200,200,200,${0 + cleanliness})`;
      ctx.beginPath();
      ctx.arc(plateX, plateY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    let plateDragging = false;

    dayJobCanvas.addEventListener('mousemove', e => {
      const dx = e.offsetX - dayJobCanvas.clientWidth / 2;
      const dy = e.offsetY - dayJobCanvas.clientHeight / 2;
      if (Math.sqrt(dx * dx + dy * dy) <= 60) {
        dayJob.plateCleanliness += 1.5;
        if (dayJob.plateCleanliness >= 100) {
          dayJob.plateCleanliness = 100;
          giveDayJobPay(); 

        }
        renderDayJob();
      }
    });

    function startScrub(x, y) {
      const dx = x - dayJobCanvas.clientWidth / 2;
      const dy = y - dayJobCanvas.clientHeight / 2;
      if (Math.sqrt(dx * dx + dy * dy) <= 60) plateDragging = true;
    }

    function animateXPBar() {
      const progressEl = document.getElementById("jobProgress");
      if (!progressEl) return;

      const targetPercent = Math.min((dayJobXP / dayJobXPMax) * 100, 100);
      const currentPercent = parseFloat(progressEl.style.width) || 0;

      if (Math.abs(currentPercent - targetPercent) < 0.1) {
        progressEl.style.width = targetPercent + "%";
        displayedXP = dayJobXP;
        return;
      }

      // Smooth step
      const newPercent = currentPercent + (targetPercent - currentPercent) * 0.2;
      progressEl.style.width = newPercent + "%";

      requestAnimationFrame(animateXPBar);
    }

    function endScrub() {
      plateDragging = false;
    }

    function giveDayJobPay() {
      const now = Date.now();
      if (now - dayJob.lastWorked < dayJob.cooldown) return;

      chips += dayJob.pay;
      dayJob.lastWorked = now;

      dayJob.plateCleanliness = 0;

      // Add XP
      dayJobXP += 10;

      // Check for level up
      while (dayJobXP >= dayJobXPMax) {
        dayJobXP -= dayJobXPMax;         // carry over extra XP
        dayJobLevel += 1;                // level up
        dayJob.pay += 10;                  // increase pay per plate
        dayJobXPMax = Math.floor(dayJobXPMax * 1.5); // increase XP requirement
        jobStatus.textContent = `🎉 Level up! Job is now level ${dayJobLevel}, pay is ${dayJob.pay} chips!`;
      }

      renderDayJob();
      animateXPBar();
      renderChips();
    }

    /* ---------------- Init & bindings ---------------- */
    function render() {
      if (activeTab === "blackjack") renderBlackjack();
      else if (activeTab === "slotMachine") renderSlotMachine();
      else renderDayJob();
    }

    renderChips();
    resizeAll();
    document.getElementById("hitBtn").disabled = true;
    document.getElementById("standBtn").disabled = true;
    document.getElementById("splitBtn").disabled = true;

    /* wire existing HTML buttons if not already wired (defensive) */
    if (!document.getElementById("dealBtn").onclick) document.getElementById("dealBtn").onclick = bjDeal;
    if (!document.getElementById("hitBtn").onclick) document.getElementById("hitBtn").onclick = bjHit;
    if (!document.getElementById("standBtn").onclick) document.getElementById("standBtn").onclick = bjStand;
    if (!document.getElementById("spinBtn").onclick) document.getElementById("spinBtn").onclick = slotSpin;

    /* update split button availability whenever relevant events happen */
    const betInput = document.getElementById("bjBet");
    betInput.addEventListener('input', () => {
      if (blackjack.inProgress) document.getElementById("splitBtn").disabled = !canSplit();
    });
    document.getElementById("dealBtn").addEventListener('click', () => {
      setTimeout(() => document.getElementById("splitBtn").disabled = !canSplit(), 50);
    });
