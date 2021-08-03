import { Hexagon } from './hexagon.js';
import { Point } from './point.js';
import { Layout } from './layout.js';
import { Orientation } from './orientation.js';

export class WorldMap {
    #layout;
    #zoom;
    #initialZoom;
    #hexagons;
    #centerHexagon;

    /**
     * @param {Point} origin
     * @param {Number} initialZoom 
     */
    constructor(origin, initialZoom) {
        this.#layout = new Layout(Orientation.FLAT, new Point(initialZoom, initialZoom), origin);
        this.#hexagons = new Map();
        this.#zoom = this.#initialZoom = initialZoom;

        const main = new Hexagon(0, 0, 0);
        this.#hexagons.set(main.hashCode(), main);

        this.#generatorV3(main, 5000, 5000, 2000);
        // this.#generatorV2(main, 30, 100);
        // this.#generatorV1(main);
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

    /**
     * Calculates center of map
     * @returns {Hexagon}
     */
    #calculateCenterHexagon() {
        const min = new Point(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        const max = new Point(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

        for (const hexagon of this.hexagons) {

            if (hexagon.q > max.x) max.x = hexagon.q;
            if (hexagon.r > max.y) max.y = hexagon.r;

            if (hexagon.q < min.x) min.x = hexagon.q;
            if (hexagon.r < min.y) min.y = hexagon.r;
        }

        this.#centerHexagon = new Hexagon((max.x + min.x) / 2, (max.y + min.y) / 2);

        return this.#centerHexagon;
    }

    /**
     * 
     * @param {Number} initialSize 
     * @returns 
     */
    #scaleFromZoom(initialSize) {
        return Math.max(Math.max(1, Math.min(this.zoom -this.#initialZoom + initialSize, 10)) / 2, 1);
    }

    /**
     * 
     * @param {Hexagon} hexagon 
     */
    #drawHexagon(context, hexagon) {
        const corners = this.#layout.hexagonCorners(hexagon);

        context.beginPath();
        context.moveTo(...corners[0]);

        for (let i = 1; i < corners.length; i++) {
            context.lineTo(...corners[i]);
        }

        context.closePath();
        context.stroke();
        context.fill();
    }

    /**
     * Draws map onto canvas
     * @param {OffscreenCanvas} canvas 
     * @param {OffscreenCanvasRenderingContext2D} context 
     */
    draw(canvas, context) {
        context.lineJoin = 'bevel';
        context.lineWidth = this.#scaleFromZoom(3);
        context.strokeStyle = '#111111';
        context.fillStyle = '#DDDDDD';

        for (const hexagon of this.hexagons) {
            this.#drawHexagon(context, hexagon);
        }
    }

    get zoom() {
        return this.#zoom;
    }

    set zoom(value) {
        this.#zoom = value;
    }

    get layout() {
        return this.#layout;
    }

    get centerHexagon() {
        return this.#centerHexagon || this.#calculateCenterHexagon();
    }

    get hexagons() {
        return this.#hexagons.values();
    }
}