// The boss! Opens the restaurant and coordinates everyone.
import { initPieces } from './state.js';
import { buildMoveButtons, scramble, reset, undo, renderAll } from './ui.js';
import { zoomOut } from './zoom.js';

// 1. Initialize the kitchen
initPieces();
buildMoveButtons();

// 2. First render
renderAll();

// 3. Wire up the control buttons
document.getElementById('scrambleBtn').onclick = () => scramble(20);
document.getElementById('resetBtn').onclick = reset;
document.getElementById('undoBtn').onclick = undo;
document.getElementById('backBtn').onclick = () => {
    zoomOut();
    renderAll();
};

console.log('🚀 4D Hypercube is ready!');