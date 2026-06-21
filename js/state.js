// Where we store all the ingredients (pieces, history, logs)
import { CELL_DEFS } from './constants.js';

export const state = {
    pieces: [],
    moveHistory: [],
    moveLog: []
};

export function axisToIndex(axis) {
    return { 'x': 0, 'y': 1, 'z': 2, 'w': 3 }[axis];
}

export function initPieces() {
    state.pieces = [];
    const coords = [-1, 0, 1];
    let idCounter = 11; // Start our license plates at 11
    
    for (let x of coords) {
        for (let y of coords) {
            for (let z of coords) {
                for (let w of coords) {
                    // Skip the hidden center piece
                    if (x === 0 && y === 0 && z === 0 && w === 0) continue;
                    
                    const homeCoord = { x, y, z, w };
                    
                    // ... (keep the existing logic for pieceType and homeCell) ...
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
                    
                    // ADD THE PIECE ID HERE!
                    // We skip numbers ending in 0 (like 20, 30) to keep it clean
                    let currentId = idCounter;
                    if (currentId % 10 === 0) currentId++; 
                    idCounter++;

                    state.pieces.push({
                        homeCoord: { ...homeCoord },
                        currentCoord: { ...homeCoord },
                        homeCell: homeCell,
                        pieceType: pieceType,
                        stickers: stickers,
                        pieceId: currentId // <--- NEW!
                    });
                }
            }
        }
    }
}

export function resetPieces() {
    for (let piece of state.pieces) {
        piece.currentCoord = { ...piece.homeCoord };
        piece.stickers = [];
        if (piece.homeCoord.x !== 0) piece.stickers.push({ axis: 'x', dir: piece.homeCoord.x });
        if (piece.homeCoord.y !== 0) piece.stickers.push({ axis: 'y', dir: piece.homeCoord.y });
        if (piece.homeCoord.z !== 0) piece.stickers.push({ axis: 'z', dir: piece.homeCoord.z });
        if (piece.homeCoord.w !== 0) piece.stickers.push({ axis: 'w', dir: piece.homeCoord.w });
    }
    state.moveHistory = [];
    state.moveLog = ['🔁 Reset to solved state'];
}