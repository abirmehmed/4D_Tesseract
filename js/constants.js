// Fixed rules that never change
export const CELL_DEFS = {
    'A': { axis: 'w', val: -1, color: '#E63946' },
    'B': { axis: 'x', val:  1, color: '#F4A261' },
    'C': { axis: 'y', val:  1, color: '#E9C46A' },
    'D': { axis: 'x', val: -1, color: '#2A9D8F' },
    'E': { axis: 'z', val:  1, color: '#2E8B57' },
    'F': { axis: 'w', val:  1, color: '#4895EF' },
    'G': { axis: 'y', val: -1, color: '#9C27B0' },
    'H': { axis: 'z', val: -1, color: '#FF70B8' }
};

export const CELLS = Object.keys(CELL_DEFS);
export const FACES = ['u','v','w','x','y','z'];

export const FACE_AXIS = {
    'u': { axis: 'y', val:  1 },
    'v': { axis: 'y', val: -1 },
    'w': { axis: 'z', val:  1 },
    'x': { axis: 'z', val: -1 },
    'y': { axis: 'x', val:  1 },
    'z': { axis: 'x', val: -1 }
};