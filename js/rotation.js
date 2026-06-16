// The math that transforms pieces in 4D space
import { state, axisToIndex } from './state.js';
import { CELL_DEFS } from './constants.js';

const ROTATION_AXES = {
    'xy': ['x', 'y'], 'xz': ['x', 'z'], 'xw': ['x', 'w'],
    'yz': ['y', 'z'], 'yw': ['y', 'w'], 'zw': ['z', 'w']
};

export function rotateCoord(coord, plane, dir) {
    const newCoord = { ...coord };
    const [a1, a2] = ROTATION_AXES[plane];
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

export function rotateSticker(sticker, plane, dir) {
    const newSticker = { ...sticker };
    if (ROTATION_AXES[plane].includes(sticker.axis)) {
        const [a1, a2] = ROTATION_AXES[plane];
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

export function applyMove(plane, dir, moveName) {
    // Save snapshot for undo
    const snapshot = state.pieces.map(p => ({ 
        currentCoord: { ...p.currentCoord },
        stickers: p.stickers.map(s => ({ ...s }))
    }));
    state.moveHistory.push(snapshot);
    
    // Apply rotation to all pieces
    for (let piece of state.pieces) {
        piece.currentCoord = rotateCoord(piece.currentCoord, plane, dir);
        piece.stickers = piece.stickers.map(s => rotateSticker(s, plane, dir));
    }
    
    // Log the move
    state.moveLog = [`🌀 ${moveName}`];
    let changedCount = 0;
    for (let p of state.pieces) {
        const oldCell = getCellFromCoord(p.homeCoord);
        const newCell = getCellFromCoord(p.currentCoord);
        if (oldCell !== newCell && changedCount < 5) {
            state.moveLog.push(`  ${oldCell}→${newCell}`);
            changedCount++;
        }
    }
}

export function getCellFromCoord(coord) {
    for (let [cell, def] of Object.entries(CELL_DEFS)) {
        const axisIdx = axisToIndex(def.axis);
        const coordVal = [coord.x, coord.y, coord.z, coord.w][axisIdx];
        if (coordVal === def.val) return cell;
    }
    return null;
}