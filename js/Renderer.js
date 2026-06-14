import { CELL_NAMES, CELL_COLORS, FACE_NAMES } from './constants.js';

export class HypercubeRenderer {
    constructor(pieceModel, containerId) {
        this.pieceModel = pieceModel;
        this.container = document.getElementById(containerId);
    }

    render() {
        this.container.innerHTML = '';
        for (let cellName of CELL_NAMES) {
            const piecesInCell = this.pieceModel.getPiecesInCell(cellName);
            const faceStickers = this._computeFaceStickers(piecesInCell);
            const cellDiv = this._createCellElement(cellName, faceStickers);
            this.container.appendChild(cellDiv);
        }
    }

    _computeFaceStickers(piecesInCell) {
        const stickers = {};
        for (let f of FACE_NAMES) stickers[f] = [null, null, null, null];

        for (let piece of piecesInCell) {
            const { x, y, z, w } = piece.currentCoord;
            const localX = x === 1 ? 1 : 0;
            const localY = y === 1 ? 1 : 0;
            const localZ = z === 1 ? 1 : 0;

            const homeColor = CELL_COLORS[this.pieceModel.getHomeCell(piece)];

            // U = +Y, V = -Y, W = +Z, X = -Z, Y = +X, Z = -X
            if (localY === 1) {
                const idx = (localX << 1) | localZ;
                stickers['U'][idx] = homeColor;
            }
            if (localY === 0) {
                const idx = (localX << 1) | localZ;
                stickers['V'][idx] = homeColor;
            }
            if (localZ === 1) {
                const idx = (localX << 1) | localY;
                stickers['W'][idx] = homeColor;
            }
            if (localZ === 0) {
                const idx = (localX << 1) | localY;
                stickers['X'][idx] = homeColor;
            }
            if (localX === 1) {
                const idx = (localY << 1) | localZ;
                stickers['Y'][idx] = homeColor;
            }
            if (localX === 0) {
                const idx = (localY << 1) | localZ;
                stickers['Z'][idx] = homeColor;
            }
        }

        // Fill any missing stickers with default dark gray
        for (let f of FACE_NAMES) {
            for (let i = 0; i < 4; i++) {
                if (!stickers[f][i]) stickers[f][i] = '#2c2c3a';
            }
        }
        return stickers;
    }

    _createCellElement(cellName, faceStickers) {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.innerHTML = `<div class="cell-title" style="color:${CELL_COLORS[cellName]}">${cellName}</div><div class="faces"></div>`;
        const facesContainer = cellDiv.querySelector('.faces');

        for (let f of FACE_NAMES) {
            const colors = faceStickers[f];
            const faceDiv = document.createElement('div');
            faceDiv.className = 'face';
            faceDiv.innerHTML = `<div class="face-label">${f}</div><div class="grid-2x2"></div>`;
            const gridDiv = faceDiv.querySelector('.grid-2x2');
            for (let i = 0; i < 4; i++) {
                const sticker = document.createElement('div');
                sticker.className = 'sticker';
                sticker.style.backgroundColor = colors[i];
                gridDiv.appendChild(sticker);
            }
            facesContainer.appendChild(faceDiv);
        }
        return cellDiv;
    }
}