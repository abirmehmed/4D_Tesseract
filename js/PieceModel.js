import { CELL_NAMES, SIGNS } from './constants.js';

export class PieceModel {
    constructor() {
        this.pieces = [];   // each piece: { homeCoord, currentCoord }
        this._initPieces();
    }

    _initPieces() {
        this.pieces = [];
        for (const x of SIGNS) {
            for (const y of SIGNS) {
                for (const z of SIGNS) {
                    for (const w of SIGNS) {
                        const home = { x, y, z, w };
                        this.pieces.push({
                            homeCoord: { ...home },
                            currentCoord: { ...home }
                        });
                    }
                }
            }
        }
    }

    applyMove(moveTransform) {
        for (let piece of this.pieces) {
            piece.currentCoord = moveTransform(piece.currentCoord);
        }
    }

    getSnapshot() {
        return this.pieces.map(p => ({ ...p.currentCoord }));
    }

    restoreSnapshot(snapshot) {
        for (let i = 0; i < this.pieces.length; i++) {
            this.pieces[i].currentCoord = { ...snapshot[i] };
        }
    }

    reset() {
        for (let piece of this.pieces) {
            piece.currentCoord = { ...piece.homeCoord };
        }
    }

    getHomeCell(piece) {
        const { x, y, z, w } = piece.homeCoord;
        const cx = x === 1 ? 1 : 0;
        const cy = y === 1 ? 1 : 0;
        const cz = z === 1 ? 1 : 0;
        const cw = w === 1 ? 1 : 0;
        const idx = (cx << 0) | (cy << 1) | (cz << 2) | (cw << 3);
        return CELL_NAMES[idx];
    }

    getCurrentCell(piece) {
        const { x, y, z, w } = piece.currentCoord;
        const cx = x === 1 ? 1 : 0;
        const cy = y === 1 ? 1 : 0;
        const cz = z === 1 ? 1 : 0;
        const cw = w === 1 ? 1 : 0;
        const idx = (cx << 0) | (cy << 1) | (cz << 2) | (cw << 3);
        return CELL_NAMES[idx];
    }

    getPiecesInCell(cellName) {
        const targetSigns = this._cellToSigns(cellName);
        return this.pieces.filter(p => {
            const { x, y, z, w } = p.currentCoord;
            return x === targetSigns[0] && y === targetSigns[1] && z === targetSigns[2] && w === targetSigns[3];
        });
    }

    _cellToSigns(cellName) {
        const map = {
            'A': [-1,-1,-1,-1], 'B': [ 1,-1,-1,-1], 'C': [-1, 1,-1,-1], 'D': [ 1, 1,-1,-1],
            'E': [-1,-1, 1,-1], 'F': [ 1,-1, 1,-1], 'G': [-1, 1, 1,-1], 'H': [ 1, 1, 1, 1]
        };
        return map[cellName];
    }
}