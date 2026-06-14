// ----------------------------- CONSTANTS -----------------------------
const CELLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const FACES = ['u', 'v', 'w', 'x', 'y', 'z'];
const ROWS = [1, 2];
const COLS = [1, 2];

const CELL_COLOR = {
    'A': '#E63946', 'B': '#F4A261', 'C': '#E9C46A', 'D': '#2A9D8F',
    'E': '#2E8B57', 'F': '#4895EF', 'G': '#9C27B0', 'H': '#FF70B8'
};

// ----------------------------- STATE -----------------------------
let state = {};
let history = [];

function initState() {
    state = {};
    for (let c of CELLS) {
        state[c] = {};
        for (let f of FACES) {
            state[c][f] = {};
            for (let r of ROWS) {
                state[c][f][r] = {};
                for (let col of COLS) {
                    state[c][f][r][col] = `${c}${f}-${r}${col}`;
                }
            }
        }
    }
}

// ----------------------------- DEMO 4D MOVE (XW+) -----------------------------
// This is a simplified swap to demonstrate movement.
// In a real 4D puzzle, you would replace this with a full geometric permutation.
function applyXWplus() {
    // Save current state for undo
    const snapshot = JSON.parse(JSON.stringify(state));
    history.push(snapshot);

    // Swap face 'u' of cell A with face 'v' of cell B
    let temp = state['A']['u'];
    state['A']['u'] = state['B']['v'];
    state['B']['v'] = temp;

    // Swap face 'w' of cell C with face 'x' of cell D
    let temp2 = state['C']['w'];
    state['C']['w'] = state['D']['x'];
    state['D']['x'] = temp2;

    renderDashboard();
}

function resetPuzzle() {
    initState();
    history = [];
    renderDashboard();
}

function undo() {
    if (history.length === 0) return;
    const last = history.pop();
    state = JSON.parse(JSON.stringify(last));
    renderDashboard();
}

// ----------------------------- RENDER DASHBOARD -----------------------------
function renderDashboard() {
    const container = document.getElementById('dashboard');
    container.innerHTML = '';

    for (let c of CELLS) {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.innerHTML = `<div class="cell-title" style="color:${CELL_COLOR[c]}">${c}</div><div class="faces"></div>`;
        const facesDiv = cellDiv.querySelector('.faces');

        for (let f of FACES) {
            const faceDiv = document.createElement('div');
            faceDiv.className = 'face';
            faceDiv.innerHTML = `<div class="face-label">${f}</div><div class="grid-2x2"></div>`;
            const gridDiv = faceDiv.querySelector('.grid-2x2');

            for (let r of ROWS) {
                for (let col of COLS) {
                    const stickerLabel = state[c][f][r][col];
                    const homeCell = stickerLabel[0];
                    const bgColor = CELL_COLOR[homeCell] || '#888';
                    const stickerDiv = document.createElement('div');
                    stickerDiv.className = 'sticker';
                    stickerDiv.style.backgroundColor = bgColor;
                    stickerDiv.title = stickerLabel;
                    stickerDiv.textContent = stickerLabel.slice(0, 3); // short label
                    gridDiv.appendChild(stickerDiv);
                }
            }
            facesDiv.appendChild(faceDiv);
        }
        container.appendChild(cellDiv);
    }
}

// ----------------------------- INITIALIZE -----------------------------
initState();
renderDashboard();

// Attach event listeners after DOM is ready
document.getElementById('moveXWp').onclick = applyXWplus;
document.getElementById('resetBtn').onclick = resetPuzzle;
document.getElementById('undoBtn').onclick = undo;