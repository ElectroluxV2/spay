import { Hexagon } from './hexagon.js';

export class WorldMap {
    #hexagons;

    constructor() {
        this.#hexagons = new Map();

        const main = new Hexagon(0, 0, 0);
        this.#hexagons.set(main.hashCode(), main);

        this.#generatorV3(main, 100000, 100000, 2000);
    }

    #generatorV1(current, depth = 0, maxDepth = 50) {
        const index = Math.floor(Math.random() * 5);
        const neighbor = current.neighbor(index);

        ++depth < maxDepth && this.#generatorV1(neighbor, depth);
        ++depth < maxDepth / 2 && Math.random() > 0.5 && this.#generatorV1(neighbor, depth);

        this.#hexagons.set(neighbor.hashCode(), neighbor);
    }

    #cryptoRandomRange(min, max) {
        const range = max - min + 1;
        const bytes_needed = Math.ceil(Math.log2(range) / 8);
        const cutoff = Math.floor((256 ** bytes_needed) / range) * range;
        const bytes = new Uint8Array(bytes_needed);
        let value;
        do {
            crypto.getRandomValues(bytes);
            value = bytes.reduce((acc, x, n) => acc + x * 256 ** n, 0);
        } while (value >= cutoff);
        return min + value % range;
    }

    #generatorV2(current, min = 10, max = 50, stepsLeft = 1000) {
        if (max < min) min = max;

        const neighborIndex = this.#cryptoRandomRange(0, 5);
        const neighbor = current.neighbor(neighborIndex);

        this.#hexagons.set(neighbor.hashCode(), neighbor);

        if ( --stepsLeft >= 0 && this.#hexagons.size < max) {

            if (this.#hexagons.size > min && this.#cryptoRandomRange(0, max) > max - min) return;
            this.#generatorV2(neighbor, min, max, stepsLeft);

        } else if (this.#hexagons.size < 10) {
            this.#generatorV2(current, min, max, 1);
        }
    }

    #generatorV3(current, min = 50000, max = 10000) {
        for (let i = 0; i < this.#cryptoRandomRange(min, max); i++) {

            const neighborIndex = this.#cryptoRandomRange(0, 5);
            const neighbor = current.neighbor(neighborIndex);

            this.#hexagons.set(neighbor.hashCode(), neighbor);

            current = neighbor;
        }
    }

    get hexagons() {
        return this.#hexagons.values();
    }
}