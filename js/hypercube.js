// ============================================================
// 1. CELL DEFINITIONS
// ============================================================
const CELL_DEFS = {
    'A': { axis: 'w', val: -1, color: '#E63946' },
    'B': { axis: 'x', val:  1, color: '#F4A261' },
    'C': { axis: 'y', val:  1, color: '#E9C46A' },
    'D': { axis: 'x', val: -1, color: '#2A9D8F' },
    'E': { axis: 'z', val:  1, color: '#2E8B57' },
    'F': { axis: 'w', val:  1, color: '#4895EF' },
    'G': { axis: 'y', val: -1, color: '#9C27B0' },
    'H': { axis: 'z', val: -1, color: '#FF70B8' }
};

const CELLS = Object.keys(CELL_DEFS);
const FACES = ['u','v','w','x','y','z'];

const FACE_AXIS = {
    'u': { axis: 'y', val:  1 },
    'v': { axis: 'y', val: -1 },
    'w': { axis: 'z', val:  1 },
    'x': { axis: 'z', val: -1 },
    'y': { axis: 'x', val:  1 },
    'z': { axis: 'x', val: -1 }
};

// ============================================================
// 2. PIECES
// ============================================================
let pieces = [];
let moveHistory = [];
let moveLog = [];

function initPieces() {
    pieces = [];
    const coords = [-1, 0, 1];
    
    for (let x of coords) {
        for (let y of coords) {
            for (let z of coords) {
                for (let w of coords) {
                    if (x === 0 && y === 0 && z === 0 && w === 0) continue;
                    
                    const homeCoord = { x, y, z, w };
                    const zeroCount = [x, y, z, w].filter(v => v === 0).length;
                    let pieceType;
                    if (zeroCount === 0) pieceType = 'corner';
                    else if (zeroCount === 1) pieceType = 'edge';
                    else if (zeroCount === 2) pieceType = 'faceCenter';
                    else pieceType = 'cellCenter';
                    
                    let homeCell = null;
                    for (let [cell, def] of Object.entries(CELL_DEFS)) {
                        const axisIdx = axisToIndex(def.axis);
                        const coordVal = [x, y, z, w][axisIdx];
                        if (coordVal === def.val) {
                            homeCell = cell;
                            break;
                        }
                    }
                    
                    const stickers = [];
                    if (x !== 0) stickers.push({ axis: 'x', dir: x });
                    if (y !== 0) stickers.push({ axis: 'y', dir: y });
                    if (z !== 0) stickers.push({ axis: 'z', dir: z });
                    if (w !== 0) stickers.push({ axis: 'w', dir: w });
                    
                    pieces.push({
                        homeCoord: { ...homeCoord },
                        currentCoord: { ...homeCoord },
                        homeCell: homeCell,
                        pieceType: pieceType,
                        stickers: stickers
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
    
    if (dir === 1) {
        newCoord[a1] = -v;
        newCoord[a2] = u;
    } else {
        newCoord[a1] = v;
        newCoord[a2] = -u;
    }
    
    return newCoord;
}

function rotateSticker(sticker, plane, dir) {
    const newSticker = { ...sticker };
    const axes = {
        'xy': ['x', 'y'],
        'xz': ['x', 'z'],
        'xw': ['x', 'w'],
        'yz': ['y', 'z'],
        'yw': ['y', 'w'],
        'zw': ['z', 'w']
    };
    
    if (axes[plane].includes(sticker.axis)) {
        const [a1, a2] = axes[plane];
        if (sticker.axis === a1) {
            newSticker.axis = a2;
            newSticker.dir = dir === 1 ? -sticker.dir : sticker.dir;
        } else {
            newSticker.axis = a1;
            newSticker.dir = dir === 1 ? sticker.dir : -sticker.dir;
        }
    }
    
    return newSticker;
}

function applyMove(plane, dir, moveName) {
    const snapshot = pieces.map(p => ({ 
        currentCoord: { ...p.currentCoord },
        stickers: p.stickers.map(s => ({ ...s }))
    }));
    moveHistory.push(snapshot);
    
    for (let piece of pieces) {
        piece.currentCoord = rotateCoord(piece.currentCoord, plane, dir);
        piece.stickers = piece.stickers.map(s => rotateSticker(s, plane, dir));
    }
    
    moveLog = [`🌀 ${moveName}`];
    let changedCount = 0;
    for (let p of pieces) {
        const oldCell = getCellFromCoord(p.homeCoord);
        const newCell = getCellFromCoord(p.currentCoord);
        if (oldCell !== newCell && changedCount < 5) {
            moveLog.push(`  ${oldCell}→${newCell}`);
            changedCount++;
        }
    }
    
    renderDashboard();
    updateLog();
}

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
            faceDiv.innerHTML = `<div class="face-label">${face}</div><div class="grid-3x3"></div>`;
            const gridDiv = faceDiv.querySelector('.grid-3x3');
            
            const fixedCoords = {};
            fixedCoords[cellDef.axis] = cellDef.val;
            fixedCoords[faceDef.axis] = faceDef.val;
            
            const allAxes = ['x', 'y', 'z'];
            let varyingAxes = allAxes.filter(a => a !== cellDef.axis && a !== faceDef.axis);
            
            if (cellDef.axis !== 'w' && faceDef.axis !== 'w') {
                varyingAxes.push('w');
            }
            
            const values = [-1, 0, 1];
            const stickers = [];
            
            for (let v1 of values) {
                for (let v2 of values) {
                    const coord = { x: 0, y: 0, z: 0, w: 0 };
                    coord[cellDef.axis] = cellDef.val;
                    coord[faceDef.axis] = faceDef.val;
                    if (varyingAxes.length >= 1) coord[varyingAxes[0]] = v1;
                    if (varyingAxes.length >= 2) coord[varyingAxes[1]] = v2;
                    
                    const piece = pieces.find(p =>
                        p.currentCoord.x === coord.x &&
                        p.currentCoord.y === coord.y &&
                        p.currentCoord.z === coord.z &&
                        p.currentCoord.w === coord.w
                    );
                    
                    let homeCell = null;
                    if (piece) {
                        const visibleSticker = piece.stickers.find(s => 
                            s.axis === faceDef.axis && s.dir === faceDef.val
                        );
                        if (visibleSticker) {
                            for (let [c, def] of Object.entries(CELL_DEFS)) {
                                if (def.axis === visibleSticker.axis && def.val === visibleSticker.dir) {
                                    homeCell = c;
                                    break;
                                }
                            }
                        } else {
                            homeCell = piece.homeCell;
                        }
                    }
                    
                    stickers.push(homeCell);
                }
            }
            
            for (let i = 0; i < 9; i++) {
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
    const snapshot = pieces.map(p => ({ 
        currentCoord: { ...p.currentCoord },
        stickers: p.stickers.map(s => ({ ...s }))
    }));
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
            piece.stickers = piece.stickers.map(s => rotateSticker(s, m.plane, m.dir));
        }
    }
    
    moveLog = [`🎲 Scrambled with ${numMoves} moves`];
    renderDashboard();
    updateLog();
}

function reset() {
    for (let piece of pieces) {
        piece.currentCoord = { ...piece.homeCoord };
        piece.stickers = [];
        if (piece.homeCoord.x !== 0) piece.stickers.push({ axis: 'x', dir: piece.homeCoord.x });
        if (piece.homeCoord.y !== 0) piece.stickers.push({ axis: 'y', dir: piece.homeCoord.y });
        if (piece.homeCoord.z !== 0) piece.stickers.push({ axis: 'z', dir: piece.homeCoord.z });
        if (piece.homeCoord.w !== 0) piece.stickers.push({ axis: 'w', dir: piece.homeCoord.w });
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
        pieces[i].currentCoord = { ...lastSnapshot[i].currentCoord };
        pieces[i].stickers = lastSnapshot[i].stickers.map(s => ({ ...s }));
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
// 7. ZOOM FEATURE
// ============================================================
let currentZoomedCell = null;

function zoomInCell(cellName) {
    currentZoomedCell = cellName;
    const cellDef = CELL_DEFS[cellName];
    
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('zoomedView').classList.add('active');
    
    document.getElementById('zoomedTitle').textContent = `Cell ${cellName}`;
    document.getElementById('zoomedTitle').style.color = cellDef.color;
    
    renderCrossLayout(cellName);
    renderSidebar(cellName);
    
    moveLog = [`🔍 Zoomed into Cell ${cellName}`];
    updateLog();
}

function zoomOut() {
    currentZoomedCell = null;
    document.getElementById('dashboard').style.display = 'grid';
    document.getElementById('zoomedView').classList.remove('active');
    moveLog = ['🔍 Back to overview'];
    updateLog();
}

function renderCrossLayout(cellName) {
    const container = document.getElementById('crossLayout');
    container.innerHTML = '';
    
    const faceOrder = [
        { face: 'u', position: 'top' },
        { face: 'x', position: 'left' },
        { face: 'y', position: 'center' },
        { face: 'w', position: 'right' },
        { face: 'v', position: 'bottom' },
        { face: 'z', position: 'back' }
    ];
    
    for (let { face, position } of faceOrder) {
        const faceDiv = document.createElement('div');
        faceDiv.className = `cross-face ${position}`;
        faceDiv.innerHTML = `<div class="face-label">${face}</div><div class="grid-3x3"></div>`;
        const gridDiv = faceDiv.querySelector('.grid-3x3');
        
        const stickers = getFaceStickers(cellName, face);
        for (let i = 0; i < 9; i++) {
            const sticker = document.createElement('div');
            sticker.className = 'sticker';
            const homeCell = stickers[i];
            sticker.style.backgroundColor = homeCell ? CELL_DEFS[homeCell].color : '#2c2c3a';
            sticker.textContent = homeCell || '';
            gridDiv.appendChild(sticker);
        }
        
        container.appendChild(faceDiv);
    }
}

function renderSidebar(excludeCell) {
    const container = document.getElementById('sidebarCells');
    container.innerHTML = '';
    
    for (let cell of CELLS) {
        if (cell === excludeCell) continue;
        
        const cellDef = CELL_DEFS[cell];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'sidebar-cell';
        cellDiv.onclick = () => zoomInCell(cell);
        cellDiv.innerHTML = `<div class="sidebar-cell-title" style="color:${cellDef.color}">${cell}</div><div class="sidebar-faces"></div>`;
        const facesDiv = cellDiv.querySelector('.sidebar-faces');
        
        for (let face of FACES) {
            const faceDiv = document.createElement('div');
            faceDiv.className = 'sidebar-face';
            faceDiv.innerHTML = `<div class="grid-3x3"></div>`;
            const gridDiv = faceDiv.querySelector('.grid-3x3');
            
            const stickers = getFaceStickers(cell, face);
            for (let i = 0; i < 9; i++) {
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

function getFaceStickers(cellName, faceName) {
    const cellDef = CELL_DEFS[cellName];
    const faceDef = FACE_AXIS[faceName];
    
    const fixedCoords = {};
    fixedCoords[cellDef.axis] = cellDef.val;
    fixedCoords[faceDef.axis] = faceDef.val;
    
    const allAxes = ['x', 'y', 'z'];
    let varyingAxes = allAxes.filter(a => a !== cellDef.axis && a !== faceDef.axis);
    
    if (cellDef.axis !== 'w' && faceDef.axis !== 'w') {
        varyingAxes.push('w');
    }
    
    const values = [-1, 0, 1];
    const stickers = [];
    
    for (let v1 of values) {
        for (let v2 of values) {
            const coord = { x: 0, y: 0, z: 0, w: 0 };
            coord[cellDef.axis] = cellDef.val;
            coord[faceDef.axis] = faceDef.val;
            if (varyingAxes.length >= 1) coord[varyingAxes[0]] = v1;
            if (varyingAxes.length >= 2) coord[varyingAxes[1]] = v2;
            
            const piece = pieces.find(p =>
                p.currentCoord.x === coord.x &&
                p.currentCoord.y === coord.y &&
                p.currentCoord.z === coord.z &&
                p.currentCoord.w === coord.w
            );
            
            let homeCell = null;
            if (piece) {
                const visibleSticker = piece.stickers.find(s => 
                    s.axis === faceDef.axis && s.dir === faceDef.val
                );
                if (visibleSticker) {
                    for (let [c, def] of Object.entries(CELL_DEFS)) {
                        if (def.axis === visibleSticker.axis && def.val === visibleSticker.dir) {
                            homeCell = c;
                            break;
                        }
                    }
                } else {
                    homeCell = piece.homeCell;
                }
            }
            
            stickers.push(homeCell);
        }
    }
    
    return stickers;
}

function makeCellsClickable() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cellDiv => {
        cellDiv.onclick = () => {
            const cellName = cellDiv.querySelector('.cell-title').textContent.trim();
            zoomInCell(cellName);
        };
    });
}

function enableZoomFeature() {
    if (typeof renderDashboard !== 'undefined') {
        const originalRenderDashboard = renderDashboard;
        
        window.renderDashboard = function() {
            originalRenderDashboard();
            makeCellsClickable();
            
            if (currentZoomedCell) {
                renderCrossLayout(currentZoomedCell);
                renderSidebar(currentZoomedCell);
            }
        };
        
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.onclick = zoomOut;
        }
        
        console.log('✅ Zoom feature enabled');
    } else {
        console.error('❌ renderDashboard not found!');
    }
}

// ============================================================
// 8. INITIALIZATION
// ============================================================
initPieces();
buildMoveButtons();
renderDashboard();

document.getElementById('scrambleBtn').onclick = () => scramble(20);
document.getElementById('resetBtn').onclick = reset;
document.getElementById('undoBtn').onclick = undo;

updateLog();
enableZoomFeature();