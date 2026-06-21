// Handles user actions: buttons, logs, scramble, reset, undo
import { state } from './state.js';
import { applyMove, rotateCoord, rotateSticker } from './rotation.js';
import { renderDashboard, renderCrossLayout, renderSidebar } from './renderer.js';
import { currentZoomedCell, makeCellsClickable } from './zoom.js';

// Central render function - called after every state change
export function renderAll() {
    renderDashboard();
    makeCellsClickable();
    
    if (currentZoomedCell.value) {
        renderCrossLayout(currentZoomedCell.value);
        renderSidebar(currentZoomedCell.value, (cell) => {
            import('./zoom.js').then(zoom => zoom.zoomInCell(cell));
        });
    }
    updateLog();
}

export function updateLog() {
    const logDiv = document.getElementById('logPanel');
    if (state.moveLog.length === 0) {
        logDiv.innerHTML = '📋 Ready.';
    } else {
        logDiv.innerHTML = '<strong>📋 Move log:</strong><br>' + state.moveLog.map(m => `• ${m}`).join('<br>');
    }
}

export function buildMoveButtons() {
    const container = document.getElementById('movePanel');
    container.innerHTML = '';
    
    const moveGroups = [
        { name: 'XY', moves: [{ plane: 'xy', dir: 1, name: 'XY+' }, { plane: 'xy', dir: -1, name: 'XY-' }] },
        { name: 'XZ', moves: [{ plane: 'xz', dir: 1, name: 'XZ+' }, { plane: 'xz', dir: -1, name: 'XZ-' }] },
        { name: 'XW', moves: [{ plane: 'xw', dir: 1, name: 'XW+' }, { plane: 'xw', dir: -1, name: 'XW-' }] },
        { name: 'YZ', moves: [{ plane: 'yz', dir: 1, name: 'YZ+' }, { plane: 'yz', dir: -1, name: 'YZ-' }] },
        { name: 'YW', moves: [{ plane: 'yw', dir: 1, name: 'YW+' }, { plane: 'yw', dir: -1, name: 'YW-' }] },
        { name: 'ZW', moves: [{ plane: 'zw', dir: 1, name: 'ZW+' }, { plane: 'zw', dir: -1, name: 'ZW-' }] }
    ];
    
    for (let group of moveGroups) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'move-group';
        groupDiv.innerHTML = `<span style="margin-right:8px;">${group.name}:</span>`;
        
        for (let m of group.moves) {
            const btn = document.createElement('button');
            btn.textContent = m.name;
            btn.onclick = () => {
                applyMove(m.plane, m.dir, m.name);
                renderAll();
            };
            groupDiv.appendChild(btn);
        }
        container.appendChild(groupDiv);
    }
}

export function scramble(numMoves = 20) {
    const snapshot = state.pieces.map(p => ({ 
        currentCoord: { ...p.currentCoord },
        stickers: p.stickers.map(s => ({ ...s }))
    }));
    state.moveHistory.push(snapshot);
    
    const allMoves = [
        { plane: 'xy', dir: 1 }, { plane: 'xy', dir: -1 },
        { plane: 'xz', dir: 1 }, { plane: 'xz', dir: -1 },
        { plane: 'xw', dir: 1 }, { plane: 'xw', dir: -1 },
        { plane: 'yz', dir: 1 }, { plane: 'yz', dir: -1 },
        { plane: 'yw', dir: 1 }, { plane: 'yw', dir: -1 },
        { plane: 'zw', dir: 1 }, { plane: 'zw', dir: -1 }
    ];
    
    for (let i = 0; i < numMoves; i++) {
        const m = allMoves[Math.floor(Math.random() * allMoves.length)];
        for (let piece of state.pieces) {
            piece.currentCoord = rotateCoord(piece.currentCoord, m.plane, m.dir);
            piece.stickers = piece.stickers.map(s => rotateSticker(s, m.plane, m.dir));
        }
    }
    
    state.moveLog = [`🎲 Scrambled with ${numMoves} moves`];
    renderAll();
}

export function reset() {
    import('./state.js').then(stateModule => {
        stateModule.resetPieces();
        renderAll();
    });
}

export function undo() {
    if (state.moveHistory.length === 0) return;
    
    const lastSnapshot = state.moveHistory.pop();
    for (let i = 0; i < state.pieces.length; i++) {
        state.pieces[i].currentCoord = { ...lastSnapshot[i].currentCoord };
        state.pieces[i].stickers = lastSnapshot[i].stickers.map(s => ({ ...s }));
    }
    
    state.moveLog = ['↩️ Undid last move'];
    renderAll();
}