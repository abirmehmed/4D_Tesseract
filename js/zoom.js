// Handles the zoom-in/zoom-out feature
import { CELL_DEFS, CELLS, FACES, FACE_AXIS } from './constants.js';
import { state } from './state.js';
import { getFaceStickers } from './renderer.js';

export const currentZoomedCell = { value: null };
export let currentZoomedFace = { cell: null, face: null };

// ============================================================
// LEVEL 2: CELL ZOOM
// ============================================================
export function zoomInCell(cellName) {
    currentZoomedCell.value = cellName;
    const cellDef = CELL_DEFS[cellName];
    
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('zoomedView').classList.add('active');
    
    document.getElementById('zoomedTitle').textContent = `Cell ${cellName}`;
    document.getElementById('zoomedTitle').style.color = cellDef.color;
    
    // Import renderer dynamically to avoid circular dependency
    import('./renderer.js').then(renderer => {
        renderer.renderCrossLayout(cellName);
        renderer.renderSidebar(cellName, zoomInCell);
    });
    
    state.moveLog = [`🔍 Zoomed into Cell ${cellName}`];
}

export function zoomOut() {
    currentZoomedCell.value = null;
    document.getElementById('dashboard').style.display = 'grid';
    document.getElementById('zoomedView').classList.remove('active');
    state.moveLog = ['🔍 Back to overview'];
}

export function makeCellsClickable() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cellDiv => {
        cellDiv.onclick = () => {
            const cellName = cellDiv.querySelector('.cell-title').textContent.trim();
            zoomInCell(cellName);
        };
    });
}

// ============================================================
// LEVEL 3: FACE ZOOM
// ============================================================
export function zoomInFace(cellName, faceName) {
    currentZoomedFace.cell = cellName;
    currentZoomedFace.face = faceName;
    
    const cellDef = CELL_DEFS[cellName];
    const faceDef = FACE_AXIS[faceName];
    
    document.getElementById('zoomedView').classList.remove('active');
    const faceZoomView = document.getElementById('faceZoomView');
    if (faceZoomView) {
        faceZoomView.classList.add('active');
    }
    
    const titleEl = document.getElementById('faceZoomTitle');
    const subtitleEl = document.getElementById('faceZoomSubtitle');
    if (titleEl) {
        titleEl.textContent = `Cell ${cellName} - Face ${faceName}`;
        titleEl.style.color = cellDef.color;
    }
    if (subtitleEl) {
        subtitleEl.textContent = `Fixed: ${cellDef.axis}=${cellDef.val === 1 ? '+' : '-'}1, ${faceDef.axis}=${faceDef.val === 1 ? '+' : '-'}1`;
    }
    
    renderLargeFace(cellName, faceName);
    renderOtherFacesSidebar(cellName, faceName);
    showFaceDetails(cellName, faceName);
    
    state.moveLog = [`🔍 Zoomed into ${cellName}-${faceName}`];
}

function renderLargeFace(cellName, faceName) {
    const container = document.getElementById('largeFaceGrid');
    if (!container) return;
    container.innerHTML = '';
    
    const stickers = getFaceStickers(cellName, faceName);
    for (let i = 0; i < 9; i++) {
        const sticker = document.createElement('div');
        sticker.className = 'sticker';
        const stickerData = stickers[i];
        
        if (stickerData.colorCell) {
            sticker.style.backgroundColor = CELL_DEFS[stickerData.colorCell].color;
            sticker.textContent = stickerData.pieceId || '';
            sticker.title = `Piece ${stickerData.pieceId} (from Cell ${stickerData.colorCell})`;
        } else {
            sticker.style.backgroundColor = '#2c2c3a';
        }
        container.appendChild(sticker);
    }
}

function renderOtherFacesSidebar(cellName, currentFaceName) {
    const container = document.getElementById('otherFacesList');
    if (!container) return;
    container.innerHTML = '';
    
    const otherFaces = FACES.filter(f => f !== currentFaceName);
    
    otherFaces.forEach(faceName => {
        const faceDiv = document.createElement('div');
        faceDiv.className = 'other-face-item';
        faceDiv.innerHTML = `
            <div class="other-face-label">${faceName.toUpperCase()}</div>
            <div class="other-face-grid"></div>
        `;
        
        const gridDiv = faceDiv.querySelector('.other-face-grid');
        const stickers = getFaceStickers(cellName, faceName);
        
        for (let i = 0; i < 9; i++) {
            const sticker = document.createElement('div');
            sticker.className = 'sticker';
            const stickerData = stickers[i];
            
            if (stickerData.colorCell) {
                sticker.style.backgroundColor = CELL_DEFS[stickerData.colorCell].color;
                sticker.textContent = stickerData.pieceId || '';
            }
            gridDiv.appendChild(sticker);
        }
        
        faceDiv.onclick = () => {
            zoomInFace(cellName, faceName);
        };
        
        container.appendChild(faceDiv);
    });
}

export function zoomOutToCell() {
    currentZoomedFace.cell = null;
    currentZoomedFace.face = null;
    const faceZoomView = document.getElementById('faceZoomView');
    if (faceZoomView) {
        faceZoomView.classList.remove('active');
    }
    document.getElementById('zoomedView').classList.add('active');
    state.moveLog = ['🔍 Back to cell view'];
}

function showFaceDetails(cellName, faceName) {
    const cellDef = CELL_DEFS[cellName];
    const faceDef = FACE_AXIS[faceName];
    
    const stickers = getFaceStickers(cellName, faceName);
    const pieceIds = stickers.map(s => s.pieceId).filter(id => id !== null);
    const homeCells = [...new Set(stickers.map(s => s.colorCell).filter(c => c))];
    
    const detailsContent = document.getElementById('faceDetailsContent');
    if (detailsContent) {
        detailsContent.innerHTML = `
            <div class="detail-row">
                <span>Cell:</span>
                <strong>${cellName}</strong>
            </div>
            <div class="detail-row">
                <span>Face:</span>
                <strong>${faceName} (${faceDef.axis}${faceDef.val === 1 ? '+' : '-'})</strong>
            </div>
            <div class="detail-row">
                <span>Fixed Coordinates:</span>
                <strong>${cellDef.axis}=${cellDef.val}, ${faceDef.axis}=${faceDef.val}</strong>
            </div>
            <div class="detail-row">
                <span>Piece IDs:</span>
                <strong>${pieceIds.join(', ')}</strong>
            </div>
            <div class="detail-row">
                <span>Home Cells:</span>
                <strong>${homeCells.join(', ')}</strong>
            </div>
        `;
    }
    
    const affectedRotationsDiv = document.getElementById('affectedRotations');
    if (affectedRotationsDiv) {
        const affectedPlanes = getAffectedRotations(cellName, faceName);
        const rotationsHTML = affectedPlanes.map(plane => `
            <span class="rotation-btn" onclick="import('./rotation.js').then(m => m.applyMove('${plane}', 1, '${plane.toUpperCase()}+')); import('./ui.js').then(u => u.renderAll())">${plane.toUpperCase()}+</span>
            <span class="rotation-btn" onclick="import('./rotation.js').then(m => m.applyMove('${plane}', -1, '${plane.toUpperCase()}-')); import('./ui.js').then(u => u.renderAll())">${plane.toUpperCase()}-</span>
        `).join('');
        affectedRotationsDiv.innerHTML = rotationsHTML || '<p>No direct rotations affect this face</p>';
    }
}

function getAffectedRotations(cellName, faceName) {
    const cellDef = CELL_DEFS[cellName];
    const faceDef = FACE_AXIS[faceName];
    
    const fixedAxes = [cellDef.axis, faceDef.axis];
    const allPlanes = ['xy', 'xz', 'xw', 'yz', 'yw', 'zw'];
    
    return allPlanes.filter(plane => {
        const [a1, a2] = plane.split('');
        const involvesFixed = fixedAxes.includes(a1) || fixedAxes.includes(a2);
        const involvesBoth = fixedAxes.includes(a1) && fixedAxes.includes(a2);
        return involvesFixed && !involvesBoth;
    });
}