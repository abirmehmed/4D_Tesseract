// ---------- 1. CONSTANTS ----------
const CELLS = ['A','B','C','D','E','F','G','H'];
const FACES = ['u','v','w','x','y','z'];
const CELL_COLORS = {
    'A':'#E63946','B':'#F4A261','C':'#E9C46A','D':'#2A9D8F',
    'E':'#2E8B57','F':'#4895EF','G':'#9C27B0','H':'#FF70B8'
};
// Which 4D cell does each letter correspond to? (x,y,z,w) each ±1
const CELL_SIGNS = {
    'A':[-1,-1,-1,-1], 'B':[ 1,-1,-1,-1], 'C':[-1, 1,-1,-1], 'D':[ 1, 1,-1,-1],
    'E':[-1,-1, 1,-1], 'F':[ 1,-1, 1,-1], 'G':[-1, 1, 1,-1], 'H':[ 1, 1, 1, 1]
};

// ---------- 2. PIECE MODEL ----------
let pieces = [];           // each: { homeCoord, currentCoord, homeCell }
let history = [];
let moveLog = [];

function initPieces() {
    pieces = [];
    const signs = [-1, 1];
    for (let x of signs) {
        for (let y of signs) {
            for (let z of signs) {
                for (let w of signs) {
                    const home = { x, y, z, w };
                    // Determine home cell letter from these signs
                    const homeCell = Object.keys(CELL_SIGNS).find(cell =>
                        CELL_SIGNS[cell][0] === x && CELL_SIGNS[cell][1] === y &&
                        CELL_SIGNS[cell][2] === z && CELL_SIGNS[cell][3] === w
                    );
                    pieces.push({
                        homeCoord: { ...home },
                        currentCoord: { ...home },
                        homeCell: homeCell
                    });
                }
            }
        }
    }
}

// ---------- 3. 4D ROTATION ----------
function rotateCoord(coord, axis1, axis2, dir) {
    // axis1, axis2 are 0..3 (x,y,z,w). dir = 1 for CCW, -1 for CW.
    let newCoord = { ...coord };
    const u = coord[axis1];
    const v = coord[axis2];
    if (dir === 1) {
        newCoord[axis1] = -v;
        newCoord[axis2] = u;
    } else {
        newCoord[axis1] = v;
        newCoord[axis2] = -u;
    }
    return newCoord;
}

function applyMove(axis1, axis2, dir, moveName) {
    // Save state for undo
    history.push(JSON.parse(JSON.stringify(pieces.map(p => p.currentCoord))));
    moveLog = [];

    // Apply rotation to all pieces
    for (let piece of pieces) {
        const newPos = rotateCoord(piece.currentCoord, axis1, axis2, dir);
        piece.currentCoord = newPos;
    }

    // Generate log: show a few sample piece movements
    moveLog.push(`🌀 Applied ${moveName}`);
    const samplePieces = pieces.slice(0, 6);
    for (let p of samplePieces) {
        const home = p.homeCell;
        const now = getCellFromCoord(p.currentCoord);
        if (home !== now) {
            moveLog.push(`  Piece from ${home} moved to ${now}`);
        }
    }
    if (moveLog.length === 1) moveLog.push("  (some pieces changed cells)");
    
    renderDashboard();
    updateLog();
}

function getCellFromCoord(coord) {
    const { x, y, z, w } = coord;
    const cell = Object.keys(CELL_SIGNS).find(cell =>
        CELL_SIGNS[cell][0] === x && CELL_SIGNS[cell][1] === y &&
        CELL_SIGNS[cell][2] === z && CELL_SIGNS[cell][3] === w
    );
    return cell;
}

// ---------- 4. RENDERING ----------
function renderDashboard() {
    const container = document.getElementById('dashboard');
    container.innerHTML = '';
    
    for (let cellName of CELLS) {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.innerHTML = `<div class="cell-title" style="color:${CELL_COLORS[cellName]}">${cellName}</div><div class="faces"></div>`;
        const facesDiv = cellDiv.querySelector('.faces');
        const cellSigns = CELL_SIGNS[cellName];
        
        for (let faceName of FACES) {
            const faceDiv = document.createElement('div');
            faceDiv.className = 'face';
            faceDiv.innerHTML = `<div class="face-label">${faceName}</div><div class="grid-2x2"></div>`;
            const gridDiv = faceDiv.querySelector('.grid-2x2');
            
            // Map face name to outward normal axis and sign
            const faceAxisMap = {
                'u': { axis: 'y', sign: 1 },   // +Y
                'v': { axis: 'y', sign: -1 },  // -Y
                'w': { axis: 'z', sign: 1 },   // +Z
                'x': { axis: 'z', sign: -1 },  // -Z
                'y': { axis: 'x', sign: 1 },   // +X
                'z': { axis: 'x', sign: -1 }    // -X
            };
            const { axis, sign } = faceAxisMap[faceName];
            const axes = ['x','y','z'];
            const varyingAxes = axes.filter(a => a !== axis);
            
            // The four corners of this face correspond to the four combinations of the two varying axes
            const combos = [
                { [varyingAxes[0]]: -1, [varyingAxes[1]]: -1, rc: [0,0] },
                { [varyingAxes[0]]: -1, [varyingAxes[1]]:  1, rc: [0,1] },
                { [varyingAxes[0]]:  1, [varyingAxes[1]]: -1, rc: [1,0] },
                { [varyingAxes[0]]:  1, [varyingAxes[1]]:  1, rc: [1,1] }
            ];
            
            // Temporary storage for the 2x2 grid
            const stickerColors = [[null,null],[null,null]];
            
            for (let combo of combos) {
                // Build expected 4D coordinate for the piece at this corner
                const expectedCoord = {
                    x: (axis === 'x' ? sign : (varyingAxes[0] === 'x' ? combo[varyingAxes[0]] : (varyingAxes[1] === 'x' ? combo[varyingAxes[1]] : cellSigns[0]))),
                    y: (axis === 'y' ? sign : (varyingAxes[0] === 'y' ? combo[varyingAxes[0]] : (varyingAxes[1] === 'y' ? combo[varyingAxes[1]] : cellSigns[1]))),
                    z: (axis === 'z' ? sign : (varyingAxes[0] === 'z' ? combo[varyingAxes[0]] : (varyingAxes[1] === 'z' ? combo[varyingAxes[1]] : cellSigns[2]))),
                    w: cellSigns[3]
                };
                const piece = pieces.find(p => 
                    p.currentCoord.x === expectedCoord.x &&
                    p.currentCoord.y === expectedCoord.y &&
                    p.currentCoord.z === expectedCoord.z &&
                    p.currentCoord.w === expectedCoord.w
                );
                const color = piece ? CELL_COLORS[piece.homeCell] : '#2c2c3a';
                const [r,c] = combo.rc;
                stickerColors[r][c] = color;
            }
            
            // Fill the grid
            for (let r=0; r<2; r++) {
                for (let c=0; c<2; c++) {
                    const sticker = document.createElement('div');
                    sticker.className = 'sticker';
                    sticker.style.backgroundColor = stickerColors[r][c];
                    gridDiv.appendChild(sticker);
                }
            }
            facesDiv.appendChild(faceDiv);
        }
        container.appendChild(cellDiv);
    }
}

// ---------- 5. UTILITIES ----------
function updateLog() {
    const logDiv = document.getElementById('logPanel');
    if (moveLog.length === 0) {
        logDiv.innerHTML = '<strong>📋 Move log:</strong><br>No moves yet.';
    } else {
        logDiv.innerHTML = '<strong>📋 Move log:</strong><br>' + moveLog.map(m => `• ${m}`).join('<br>');
    }
}

function scramble(moves=20) {
    history.push(JSON.parse(JSON.stringify(pieces.map(p => p.currentCoord))));
    const allMoves = [
        [0,3,1,'XW+'], [0,3,-1,'XW-'],
        [1,3,1,'YW+'], [1,3,-1,'YW-'],
        [2,3,1,'ZW+'], [2,3,-1,'ZW-']
    ];
    for (let i=0; i<moves; i++) {
        const m = allMoves[Math.floor(Math.random() * allMoves.length)];
        for (let piece of pieces) {
            piece.currentCoord = rotateCoord(piece.currentCoord, m[0], m[1], m[2]);
        }
    }
    moveLog = [`Scrambled with ${moves} random moves.`];
    renderDashboard();
    updateLog();
}

function reset() {
    history = [];
    initPieces(); // reset all to home
    moveLog = ['Reset to solved state.'];
    renderDashboard();
    updateLog();
}

function undo() {
    if (history.length === 0) return;
    const lastSnapshot = history.pop();
    for (let i=0; i<pieces.length; i++) {
        pieces[i].currentCoord = { ...lastSnapshot[i] };
    }
    moveLog = ['Undid last move.'];
    renderDashboard();
    updateLog();
}

// ---------- 6. INITIALIZE AND BIND UI ----------
document.addEventListener('DOMContentLoaded', () => {
    initPieces();
    renderDashboard();
    updateLog();

    // Bind buttons
    document.getElementById('moveXWp').onclick = () => applyMove(0,3,1,'XW+');
    document.getElementById('moveXWm').onclick = () => applyMove(0,3,-1,'XW-');
    document.getElementById('moveYWp').onclick = () => applyMove(1,3,1,'YW+');
    document.getElementById('moveYWm').onclick = () => applyMove(1,3,-1,'YW-');
    document.getElementById('moveZWp').onclick = () => applyMove(2,3,1,'ZW+');
    document.getElementById('moveZWm').onclick = () => applyMove(2,3,-1,'ZW-');
    document.getElementById('scramble').onclick = () => scramble(20);
    document.getElementById('reset').onclick = reset;
    document.getElementById('undo').onclick = undo;
});