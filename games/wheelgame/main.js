let entries = [
    { name: 'Alice', weight: 3, color: '#ff6666' },
    { name: 'Bob', weight: 2, color: '#66ccff' },
    { name: 'Charlie', weight: 4, color: '#99ff99' },
    { name: 'Diana', weight: 1, color: '#ffcc66' },
    { name: 'Eve', weight: 2, color: '#cc99ff' },
];
let riggedName = null;
let editingIndex = null;
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2;
let startAngle = 0;
let spinning = false;

const messageBox = document.getElementById('messageBox');

function showMessage(text) {
    messageBox.textContent = text;
    messageBox.style.display = 'block';
}

function submitEntry() {
    const name = document.getElementById("nameInput").value.trim();
    let weightInput = document.getElementById("weightInput").value.trim();
    let weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
        showMessage("⚠️ Enter a weight greater than 0.");
        return;
    }

    const color = document.getElementById("colorInput").value || "#cccccc";

    if (!name) {
        showMessage("⚠️ Enter a valid name.");
        return;
    }

    if (editingIndex !== null) {
        entries[editingIndex] = { name, weight, color };
        editingIndex = null;
        document.getElementById("submitButton").textContent = "Add";
        document.getElementById("cancelEdit").style.display = "none";
    } else {
        entries.push({ name, weight, color });
    }

    document.getElementById("nameInput").value = "";
    document.getElementById("weightInput").value = "";
    document.getElementById("colorInput").value = "#" + Math.floor(Math.random() * 16777215).toString(16);
    updateUI();
    drawWheel();
    showMessage("✅ Entry added.");
}

function cancelEdit() {
    editingIndex = null;
    document.getElementById('nameInput').value = '';
    document.getElementById('weightInput').value = '';
    document.getElementById('colorInput').value = '#ffcc66';
    document.getElementById('submitButton').textContent = 'Add';
    document.getElementById('cancelEdit').style.display = 'none';
    showMessage('✏️ Edit canceled.');
}

function editEntry(index) {
    const entry = entries[index];
    document.getElementById('nameInput').value = entry.name;
    document.getElementById('weightInput').value = entry.weight;
    document.getElementById('colorInput').value = entry.color || '#cccccc';
    editingIndex = index;
    document.getElementById('submitButton').textContent = 'Update';
    document.getElementById('cancelEdit').style.display = 'inline-block';
    showMessage('📝 Editing entry: ' + entry.name);
}

function deleteEntry(index) {
    if (editingIndex === index) cancelEdit();
    const removed = entries.splice(index, 1)[0];
    updateUI();
    drawWheel();
    showMessage('🗑️ Deleted: ' + removed.name);
}

function updateUI() {
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    const listDiv = document.getElementById("entriesList");
    listDiv.innerHTML = "<strong>Entries:</strong><ul>" +
        entries.map((e, i) => {
            const percent = ((e.weight / totalWeight) * 100).toFixed(3);
            return `
        <li>
          <span style="display:inline-block;width:15px;height:15px;background:${e.color};border-radius:50%;margin-right:5px;"></span>
          ${e.name} (weight: ${e.weight.toFixed(2)}, ${percent}%)
          <span class="entry-buttons">
            <button onclick="editEntry(${i})">Edit</button>
            <button onclick="deleteEntry(${i})">Delete</button>
          </span>
        </li>`;
        }).join("") +
        "</ul>";

    const rigSelect = document.getElementById("rigSelect");
    rigSelect.innerHTML = '<option value="">(Fair spin)</option>';
    entries.forEach(entry => {
        const opt = document.createElement("option");
        opt.value = entry.name;
        opt.textContent = entry.name;
        rigSelect.appendChild(opt);
    });
}


function drawWheel() {
    if (entries.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    let angleStart = startAngle;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = 'round';

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const angleSize = (entry.weight / totalWeight) * 2 * Math.PI;
        const color = entry.color || (i % 2 === 0 ? '#ffcc66' : '#66ccff');

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angleStart, angleStart + angleSize);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        const rgb = hexToRgb(color);
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        const textColor = luminance < 0.8 ? '#ffffff' : '#000000';

        let fontSize = Math.min(24, Math.max(10, angleSize * radius * 0.4));
        ctx.save();
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.translate(centerX, centerY);
        ctx.rotate(angleStart + angleSize / 2);
        ctx.fillText(entry.name, radius - 10, 0);
        ctx.restore();

        angleStart += angleSize;
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'white';
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(centerX + radius - 20, centerY);
    ctx.lineTo(centerX + radius + 10, centerY - 15);
    ctx.lineTo(centerX + radius + 10, centerY + 15);
    ctx.closePath();
    ctx.fill();
}

function hexToRgb(hex) {
    const raw = hex.replace('#', '');
    const bigint = parseInt(
        raw.length === 3
            ? raw
                .split('')
                .map(x => x + x)
                .join('')
            : raw,
        16
    );
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

function getTargetAngle(name) {
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    let currentAngle = 0;
    for (const entry of entries) {
        const sliceAngle = (entry.weight / totalWeight) * 2 * Math.PI;
        if (entry.name === name) {
            const randomOffset = Math.random() * sliceAngle;
            return (2 * Math.PI - (currentAngle + randomOffset)) % (2 * Math.PI);
        }
        currentAngle += sliceAngle;
    }
    return 0;
}


function pickRandomEntry() {
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    const rand = Math.random() * totalWeight;
    let accum = 0;
    for (const e of entries) {
        accum += e.weight;
        if (rand < accum) return e.name;
    }
    return entries[entries.length - 1].name;
}

function spin() {
    if (spinning || entries.length === 0) return;
    spinning = true;

    const winnerName = riggedName || pickRandomEntry();
    const totalSpins = 5;
    const targetAngle = getTargetAngle(winnerName);
    const fullRotation = 2 * Math.PI * totalSpins;
    const finalAngle = fullRotation + targetAngle;

    const duration = 4000;
    const start = performance.now();

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function animate(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const currentAngle = easedProgress * finalAngle;

        startAngle = currentAngle;
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            spinning = false;
            showMessage('🎉 Winner: ' + winnerName);
        }
    }

    requestAnimationFrame(animate);
}

function simulateSpins() {
    const input = document.getElementById("simCountInput");
    let count = parseInt(input.value.trim(), 10);
    if (isNaN(count) || count <= 0) {
        showMessage("⚠️ Enter a valid number of simulations.");
        return;
    }

    const results = {};
    const batchSize = 100_000_000;

    while (count > 0) {
        const spinsThisBatch = Math.min(batchSize, count);
        for (let i = 0; i < spinsThisBatch; i++) {
            const name = pickRandomEntry();
            results[name] = (results[name] || 0) + 1;
        }
        count -= spinsThisBatch;
    }

    const total = Object.values(results).reduce((a, b) => a + b, 0);

    const output = Object.entries(results)
        .sort((a, b) => b[1] - a[1])
        .map(([name, num]) => {
            const percent = ((num / total) * 100).toFixed(3);
            return `${name}: ${num} (${percent}%)`;
        })
        .join("\n");

    document.getElementById("simResultBox").textContent = output;
}

document.addEventListener('keydown', e => {
    if (!window._typedRig) window._typedRig = '';
    window._typedRig += e.key.toLowerCase();
    if (window._typedRig.endsWith('rig')) {
        if (document.getElementById('secretMenu').style.display === 'none') {
            document.getElementById('secretMenu').style.display = 'block';
        } else
            document.getElementById('secretMenu').style.display = 'none';
        window._typedRig = '';
    } else if (window._typedRig.length > 10) {
        window._typedRig = window._typedRig.slice(-3);
    }
});

document.getElementById('rigSelect').addEventListener('change', e => {
    riggedName = e.target.value || null;
});

updateUI();
drawWheel();