// Pure function: rotate a 4D coordinate in a given plane
export function rotateCoord(coord, axis1, axis2, dir) {
    const newCoord = { ...coord };
    const u = coord[axis1];
    const v = coord[axis2];
    if (dir === 1) {   // 90° CCW
        newCoord[axis1] = -v;
        newCoord[axis2] = u;
    } else {           // 90° CW
        newCoord[axis1] = v;
        newCoord[axis2] = -u;
    }
    return newCoord;
}

// Factory: creates a move function that applies to a piece's coordinate
export function createMove(axis1, axis2, dir) {
    return (coord) => rotateCoord(coord, axis1, axis2, dir);
}

// Predefined moves (12 moves: 6 planes × 2 directions)
export const MOVES = [
    { name: 'XY+', axis1:0, axis2:1, dir: 1 }, { name: 'XY-', axis1:0, axis2:1, dir: -1 },
    { name: 'XZ+', axis1:0, axis2:2, dir: 1 }, { name: 'XZ-', axis1:0, axis2:2, dir: -1 },
    { name: 'XW+', axis1:0, axis2:3, dir: 1 }, { name: 'XW-', axis1:0, axis2:3, dir: -1 },
    { name: 'YZ+', axis1:1, axis2:2, dir: 1 }, { name: 'YZ-', axis1:1, axis2:2, dir: -1 },
    { name: 'YW+', axis1:1, axis2:3, dir: 1 }, { name: 'YW-', axis1:1, axis2:3, dir: -1 },
    { name: 'ZW+', axis1:2, axis2:3, dir: 1 }, { name: 'ZW-', axis1:2, axis2:3, dir: -1 }
];