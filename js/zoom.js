// Handles the zoom-in/zoom-out feature
import { CELL_DEFS } from './constants.js';
import { state } from './state.js';
import { renderCrossLayout, renderSidebar } from './renderer.js';

export const currentZoomedCell = { value: null };

export function zoomInCell(cellName) {
    currentZoomedCell.value = cellName;
    const cellDef = CELL_DEFS[cellName];
    
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('zoomedView').classList.add('active');
    
    document.getElementById('zoomedTitle').textContent = `Cell ${cellName}`;
    document.getElementById('zoomedTitle').style.color = cellDef.color;
    
    renderCrossLayout(cellName);
    renderSidebar(cellName, zoomInCell);
    
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