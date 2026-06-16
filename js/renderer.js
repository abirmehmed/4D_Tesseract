// Draws the dashboard, cross layout, and sidebar
import { CELL_DEFS, CELLS, FACES, FACE_AXIS } from './constants.js';
import { state } from './state.js';

export function getFaceStickers(cellName, faceName) {
    const cellDef = CELL_DEFS[cellName];
    const faceDef = FACE_AXIS[faceName];
    
    const allAxes = ['x', 'y', 'z'];
    let varyingAxes = allAxes.filter(a => a !== cellDef.axis && a !== faceDef.axis);
    if (cellDef.axis !== 'w' && faceDef.axis !== 'w') varyingAxes.push('w');
    
    const values = [-1, 0, 1];
    const stickers = [];
    
    for (let v1 of values) {
        for (let v2 of values) {
            const coord = { x: 0, y: 0, z: 0, w: 0 };
            coord[cellDef.axis] = cellDef.val;
            coord[faceDef.axis] = faceDef.val;
            if (varyingAxes.length >= 1) coord[varyingAxes[0]] = v1;
            if (varyingAxes.length >= 2) coord[varyingAxes[1]] = v2;
            
            const piece = state.pieces.find(p =>
                p.currentCoord.x === coord.x && p.currentCoord.y === coord.y &&
                p.currentCoord.z === coord.z && p.currentCoord.w === coord.w
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

export function renderDashboard() {
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

export function renderCrossLayout(cellName) {
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

export function renderSidebar(excludeCell, onCellClick) {
    const container = document.getElementById('sidebarCells');
    container.innerHTML = '';
    
    for (let cell of CELLS) {
        if (cell === excludeCell) continue;
        
        const cellDef = CELL_DEFS[cell];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'sidebar-cell';
        cellDiv.onclick = () => onCellClick(cell);
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