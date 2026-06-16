// ============================================================
// 1. CELL DEFINITIONS (each cell is a 3D region in 4D space)
// ============================================================
// A cell is defined by fixing ONE coordinate (axis) to ONE value (±1)
// The other 3 coordinates can vary (±1 each), giving 8 pieces per cell

const CELL_DEFS = {
    'A': { axis: 'w', val: -1, color: '#E63946' },   // W- cell
    'B': { axis: 'x', val:  1, color: '#F4A261' },   // X+ cell
    'C': { axis: 'y', val:  1, color: '#E9C46A' },   // Y+ cell
    'D': { axis: 'x', val: -1, color: '#2A9D8F' },   // X- cell
    'E': { axis: 'z', val:  1, color: '#2E8B57' },   // Z+ cell
    'F': { axis: 'w', val:  1, color: '#4895EF' },   // W+ cell
    'G': { axis: 'y', val: -1, color: '#9C27B0' },   // Y- cell
    'H': { axis: 'z', val: -1, color: '#FF70B8' }    // Z- cell
};

const CELLS = Object.keys(CELL_DEFS);
const FACES = ['u','v','w','x','y','z'];

// Map face names to axis directions (for the 3D cube faces)
const FACE_AXIS = {
    'u': { axis: 'y', val:  1 },  // +Y face
    'v': { axis: 'y', val: -1 },  // -Y face
    'w': { axis: 'z', val:  1 },  // +Z face
    'x': { axis: 'z', val: -1 },  // -Z face
    'y': { axis: 'x', val:  1 },  // +X face
    'z': { axis: 'x', val: -1 }   // -X face
};

// ============================================================
// 2. PIECES: 16 corners of the tesseract
// ============================================================
// Each piece has:
//   - homeCoord: its original position (x,y,z,w) where each is ±1
//   - currentCoord: where it is now after moves
//   - homeCell: which cell it "belongs to" (based on homeCoord)

let pieces = [];
let moveHistory = [];
let moveLog = [];

function initPieces() {
    pieces = [];
    const signs = [-1, 1];
    
    for (let x of signs) {
        for (let y of signs) {
            for (let z of signs) {
                for (let w of signs) {
                    const homeCoord = { x, y, z, w };
                    
                    // Determine home cell: which cell's fixed coordinate does this piece match?
                    // A piece belongs to the cell where its coordinate matches the cell's fixed axis/val
                    let homeCell = null;
                    for (let [cell, def] of Object.entries(CELL_DEFS)) {
                        const axisIdx = axisToIndex(def.axis);
                        const coordVal = [homeCoord.x, homeCoord.y, homeCoord.z, homeCoord.w][axisIdx];
                        if (coordVal === def.val) {
                            homeCell = cell;
                            break;
                        }
                    }
                    
                    pieces.push({
                        homeCoord: { ...homeCoord },
                        currentCoord: { ...homeCoord },
                        homeCell: homeCell
                    });
                }
            }
        }
    }
}

function axisToIndex(axis) {
    return { 'x': 0, 'y': 1, 'z': 2, 'w': 3 }[axis];
}

// ============================================================
// 3. 4D ROTATION
// ============================================================
// Rotating in a 2D plane (e.g., XY) means:
//   - The two axes in the plane rotate into each other
//   - The other two axes stay fixed
//   - This is a 90° rotation: (u, v) → (-v, u) for CCW, (v, -u) for CW

function rotateCoord(coord, plane, dir) {
    const newCoord = { ...coord };
    
    const axes = {
        'xy': ['x', 'y'],
        'xz': ['x', 'z'],
        'xw': ['x', 'w'],
        'yz': ['y', 'z'],
        'yw': ['y', 'w'],
        'zw': ['z', 'w']
    };
    
    const [a1, a2] = axes[plane];
    const u = coord[a1];
    const v = coord[a2];
    
    if (dir === 1) {  // CCW
        newCoord[a1] = -v;
        newCoord[a2] = u;
    } else {  // CW
        newCoord[a1] = v;
        newCoord[a2] = -u;
    }
    
    return newCoord;
}

function applyMove(plane, dir, moveName) {
    // Save state for undo
    const snapshot = pieces.map(p => ({ ...p.currentCoord }));
    moveHistory.push(snapshot);
    
    // Apply rotation to all pieces
    for (let piece of pieces) {
        piece.currentCoord = rotateCoord(piece.currentCoord, plane, dir);
    }
    
    // Log the move
    moveLog = [`🌀 ${moveName}`];
    let changedCount = 0;
    for (let p of pieces) {
        const oldCell = getCellFromCoord(p.homeCoord); // Where it started
        const newCell = getCellFromCoord(p.currentCoord); // Where it is now
        if (oldCell !== newCell && changedCount < 5) {
            moveLog.push(`  ${oldCell}→${newCell}`);
            changedCount++;
        }
    }
    
    renderDashboard();
    updateLog();
}

// Which cell does a coordinate belong to?
// A piece belongs to the cell whose fixed coordinate it matches
function getCellFromCoord(coord) {
    for (let [cell, def] of Object.entries(CELL_DEFS)) {
        const axisIdx = axisToIndex(def.axis);
        const coordVal = [coord.x, coord.y, coord.z, coord.w][axisIdx];
        if (coordVal === def.val) {
            return cell;
        }
    }
    return null;
}

// ============================================================
// 4. RENDERING
// ============================================================
// For each cell and face, we need to find the 4 pieces that sit
// at the corners of that face.
//
// A face is defined by:
//   - The cell it belongs to (which fixes one coordinate)
//   - The face direction (which fixes another coordinate)
//   - The remaining 2 coordinates vary (±1 each), giving 4 corners

function renderDashboard() {
    const container = document.getElementById('dashboard');
    container.innerHTML = '';
    
    for (let cell of CELLS) {
        const cellDef = CELL_DEFS[cell];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.innerHTML = `<div class="cell-title" style="color:${cellDef.color}">${cell}</div><div class="faces"></div>`;
        const facesDiv = cellDiv.querySelector('.faces');
        
        for (let face of FACES) {
            const faceDef = FACE_AXIS[face];
            const faceDiv = document.createElement('div');
            faceDiv.className = 'face';
            faceDiv.innerHTML = `<div class="face-label">${face}</div><div class="grid-2x2"></div>`;
            const gridDiv = faceDiv.querySelector('.grid-2x2');
            
            // Find the 4 corner pieces for this face
            // The cell fixes one coordinate, the face fixes another
            // The remaining 2 coordinates vary
            
            const fixedCoords = {};
            fixedCoords[cellDef.axis] = cellDef.val;  // Cell's fixed coordinate
            fixedCoords[faceDef.axis] = faceDef.val;  // Face's fixed coordinate
            
            // The two varying axes
            const allAxes = ['x', 'y', 'z'];
            const varyingAxes = allAxes.filter(a => a !== cellDef.axis && a !== faceDef.axis);
            
            // If we only have 1 varying axis (because cell and face fix different axes),
            // we also need to vary the w coordinate if it's not fixed
            if (varyingAxes.length === 1 && cellDef.axis !== 'w' && faceDef.axis !== 'w') {
                varyingAxes.push('w');
            }
            
            // Generate 4 combinations of ±1 for the varying axes
            const combos = [];
            for (let v1 of [-1, 1]) {
                for (let v2 of [-1, 1]) {
                    const combo = {};
                    combo[varyingAxes[0]] = v1;
                    combo[varyingAxes[1]] = v2;
                    combos.push(combo);
                }
            }
            
            // For each combo, build the full coordinate and find the piece
            const stickers = [];
            for (let combo of combos) {
                const coord = { x: 0, y: 0, z: 0, w: 0 };
                
                // Set fixed coordinates
                coord[cellDef.axis] = cellDef.val;
                coord[faceDef.axis] = faceDef.val;
                
                // Set varying coordinates
                for (let axis of varyingAxes) {
                    coord[axis] = combo[axis];
                }
                
                // Find the piece at this coordinate
                const piece = pieces.find(p =>
                    p.currentCoord.x === coord.x &&
                    p.currentCoord.y === coord.y &&
                    p.currentCoord.z === coord.z &&
                    p.currentCoord.w === coord.w
                );
                
                stickers.push(piece ? piece.homeCell : null);
            }
            
            // Create 2x2 grid
            for (let i = 0; i < 4; i++) {
                const sticker = document.createElement('div');
                sticker.className = 'sticker';
                const homeCell = stickers[i];
                sticker.style.backgroundColor = homeCell ? CELL_DEFS[homeCell].color : '#2c2c3a';
                gridDiv.appendChild(sticker);
            }
            
            facesDiv.appendChild(faceDiv);
        }
        
        container.appendChild(cellDiv);
    }
}

// ============================================================
// 5. UTILITIES
// ============================================================
function updateLog() {
    const logDiv = document.getElementById('logPanel');
    if (moveLog.length === 0) {
        logDiv.innerHTML = '📋 Ready.';
    } else {
        logDiv.innerHTML = '<strong>📋 Move log:</strong><br>' + moveLog.map(m => `• ${m}`).join('<br>');
    }
}

function scramble(numMoves = 20) {
    const snapshot = pieces.map(p => ({ ...p.currentCoord }));
    moveHistory.push(snapshot);
    
    const allMoves = [
        { plane: 'xy', dir: 1, name: 'XY+' },
        { plane: 'xy', dir: -1, name: 'XY-' },
        { plane: 'xz', dir: 1, name: 'XZ+' },
        { plane: 'xz', dir: -1, name: 'XZ-' },
        { plane: 'xw', dir: 1, name: 'XW+' },
        { plane: 'xw', dir: -1, name: 'XW-' },
        { plane: 'yz', dir: 1, name: 'YZ+' },
        { plane: 'yz', dir: -1, name: 'YZ-' },
        { plane: 'yw', dir: 1, name: 'YW+' },
        { plane: 'yw', dir: -1, name: 'YW-' },
        { plane: 'zw', dir: 1, name: 'ZW+' },
        { plane: 'zw', dir: -1, name: 'ZW-' }
    ];
    
    for (let i = 0; i < numMoves; i++) {
        const m = allMoves[Math.floor(Math.random() * allMoves.length)];
        for (let piece of pieces) {
            piece.currentCoord = rotateCoord(piece.currentCoord, m.plane, m.dir);
        }
    }
    
    moveLog = [`🎲 Scrambled with ${numMoves} moves`];
    renderDashboard();
    updateLog();
}

function reset() {
    for (let piece of pieces) {
        piece.currentCoord = { ...piece.homeCoord };
    }
    moveHistory = [];
    moveLog = ['🔁 Reset to solved state'];
    renderDashboard();
    updateLog();
}

function undo() {
    if (moveHistory.length === 0) return;
    
    const lastSnapshot = moveHistory.pop();
    for (let i = 0; i < pieces.length; i++) {
        pieces[i].currentCoord = { ...lastSnapshot[i] };
    }
    
    moveLog = ['↩️ Undid last move'];
    renderDashboard();
    updateLog();
}

// ============================================================
// 6. BUILD MOVE BUTTONS
// ============================================================
function buildMoveButtons() {
    const container = document.getElementById('movePanel');
    container.innerHTML = '';
    
    const moveGroups = [
        { name: 'XY', moves: [
            { plane: 'xy', dir: 1, name: 'XY+' },
            { plane: 'xy', dir: -1, name: 'XY-' }
        ]},
        { name: 'XZ', moves: [
            { plane: 'xz', dir: 1, name: 'XZ+' },
            { plane: 'xz', dir: -1, name: 'XZ-' }
        ]},
        { name: 'XW', moves: [
            { plane: 'xw', dir: 1, name: 'XW+' },
            { plane: 'xw', dir: -1, name: 'XW-' }
        ]},
        { name: 'YZ', moves: [
            { plane: 'yz', dir: 1, name: 'YZ+' },
            { plane: 'yz', dir: -1, name: 'YZ-' }
        ]},
        { name: 'YW', moves: [
            { plane: 'yw', dir: 1, name: 'YW+' },
            { plane: 'yw', dir: -1, name: 'YW-' }
        ]},
        { name: 'ZW', moves: [
            { plane: 'zw', dir: 1, name: 'ZW+' },
            { plane: 'zw', dir: -1, name: 'ZW-' }
        ]}
    ];
    
    for (let group of moveGroups) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'move-group';
        groupDiv.innerHTML = `<span style="margin-right:8px;">${group.name}:</span>`;
        
        for (let m of group.moves) {
            const btn = document.createElement('button');
            btn.textContent = m.name;
            btn.onclick = () => applyMove(m.plane, m.dir, m.name);
            groupDiv.appendChild(btn);
        }
        
        container.appendChild(groupDiv);
    }
}

// ============================================================
// 7. INITIALIZE
// ============================================================
initPieces();
buildMoveButtons();
renderDashboard();

document.getElementById('scrambleBtn').onclick = () => scramble(20);
document.getElementById('resetBtn').onclick = reset;
document.getElementById('undoBtn').onclick = undo;

updateLog();