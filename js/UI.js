import { PieceModel } from './PieceModel.js';
import { HistoryManager } from './HistoryManager.js';
import { HypercubeRenderer } from './Renderer.js';
import { MOVES, createMove } from './MoveEngine.js';

export class HypercubeUI {
    constructor() {
        this.pieceModel = new PieceModel();
        this.history = new HistoryManager();
        this.renderer = new HypercubeRenderer(this.pieceModel, 'dashboard');
        this._initEventListeners();
        this._buildMoveButtons();
        this._saveSnapshot();
        this.renderer.render();
    }

    _saveSnapshot() {
        this.history.push(this.pieceModel.getSnapshot());
    }

    _applyMove(moveTransform) {
        this._saveSnapshot();
        this.pieceModel.applyMove(moveTransform);
        this.renderer.render();
    }

    scramble(movesCount = 20) {
        this._saveSnapshot();
        for (let i = 0; i < movesCount; i++) {
            const randomMoveDef = MOVES[Math.floor(Math.random() * MOVES.length)];
            const moveFunc = createMove(randomMoveDef.axis1, randomMoveDef.axis2, randomMoveDef.dir);
            this.pieceModel.applyMove(moveFunc);
        }
        this.renderer.render();
    }

    reset() {
        this._saveSnapshot();
        this.pieceModel.reset();
        this.renderer.render();
    }

    undo() {
        const prev = this.history.pop();
        if (prev) {
            this.pieceModel.restoreSnapshot(prev);
            this.renderer.render();
        }
    }

    _buildMoveButtons() {
        const panel = document.getElementById('movePanel');
        panel.innerHTML = '';
        for (let moveDef of MOVES) {
            const btn = document.createElement('button');
            btn.textContent = moveDef.name;
            const moveFunc = createMove(moveDef.axis1, moveDef.axis2, moveDef.dir);
            btn.onclick = () => this._applyMove(moveFunc);
            panel.appendChild(btn);
        }
    }

    _initEventListeners() {
        document.getElementById('scrambleBtn').onclick = () => this.scramble(20);
        document.getElementById('resetBtn').onclick = () => this.reset();
        document.getElementById('undoBtn').onclick = () => this.undo();
    }
}