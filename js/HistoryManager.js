export class HistoryManager {
    constructor(maxSize = 50) {
        this.history = [];
        this.maxSize = maxSize;
    }

    push(stateSnapshot) {
        // deep copy of snapshot (array of coordinate objects)
        this.history.push(stateSnapshot.map(s => ({ ...s })));
        if (this.history.length > this.maxSize) this.history.shift();
    }

    pop() {
        return this.history.pop();
    }

    clear() {
        this.history = [];
    }
}