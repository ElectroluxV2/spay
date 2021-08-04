import { Hexagon } from './hexagon.js';
import { Point } from './point.js';
import { Layout } from './layout.js';
import { Orientation } from './orientation.js';

export class WorldMap {
    static #MAX_ZOOM = 80;
    static #MIN_ZOOM = 1;
    static #COLORS = [
        '#001f3f',
        '#0074D9',
        '#7FDBFF',
        '#39CCCC',
        '#85144b',
        '#B10DC9',
        '#F012BE',
        '#FF4136',
        '#FF851B',
        '#FFDC00',
        '#3D9970',
        '#2ECC40',
        '#01FF70'
    ];

    #layout;
    #window;
    #zoom;
    #initialZoom;
    #hexagons;
    #hexagonsColors;
    #centerHexagon;

    /**
     * @param {Point} origin
     * @param {Number} initialZoom 
     */
    constructor(origin, initialZoom, window) {
        this.#layout = new Layout(Orientation.FLAT, new Point(initialZoom, initialZoom), origin);
        this.#window = window;
        this.#hexagons = new Map();
        this.#hexagonsColors = new Map();
        this.#zoom = this.#initialZoom = initialZoom;

        const main = new Hexagon(0, 0, 0);
        this.#hexagons.set(main.hashCode(), main);
        this.#hexagonsColors.set(main.hashCode(), 9); 

        this.#generatorV4(main, 5000, 5000, true, false);
        // this.#generatorV3(main, 5000, 5000, 2000);
        // this.#generatorV2(main, 30, 50);
        // this.#generatorV1(main);

        this.#layout.origin = this.#layout.hexToPixel(this.centerHexagon).multiply(0.5);

        console.log();
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

        if (Math.random() > 0.5) this.#hexagonsColors.set(neighbor.hashCode(), this.#cryptoRandomRange(2, 13)); 
    

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
     * 
     * @param {Hexagon} current 
     * @param {Number} max 
     * @param {Number} min 
     */
    #generatorV4(current, min = 10, max = min, lessLakes = true, allowIslands = false) {

        const generateNext = current => current.neighbor(this.#cryptoRandomRange(0, allowIslands ? 11 : 5));
        const addNext = generated => {
            this.#hexagons.set(generated.hashCode(), generated);
            Math.random() > 0.5 && this.#hexagonsColors.set(generated.hashCode(), this.#cryptoRandomRange(1, 13)); 

            return generated;
        };

        while (this.#hexagons.size < min && this.#hexagons.size < max) {

            let step = 0;
            while (lessLakes && this.#hexagons.size < max && step++ < 5) {
                addNext(generateNext(current));
            }

            current = addNext(generateNext(current, true));
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
        return Math.max(Math.max(1, Math.min((this.zoom -this.#initialZoom + initialSize) * 0.1, 10)) / 2, 1);
    }

    #getColor(hexagon) {
        return WorldMap.#COLORS[this.#hexagonsColors.get(hexagon.hashCode())];
    }

    /**
     * @param {OffscreenCanvasRenderingContext2D} context
     * @param {Hexagon} hexagon 
     */
    #drawHexagonFill(context, hexagon) {
        const corners = this.#layout.hexagonCorners(hexagon);
        const fillPath = this.#layout.hexagonFillPath2D(hexagon, corners);

        const color = this.#getColor(hexagon) ?? '#DDDDDD';

        // Fill
        context.fillStyle = color;
        context.fill(fillPath);
    }

    /**
     * @param {OffscreenCanvasRenderingContext2D} context
     * @param {Hexagon} hexagon 
     */
    #drawHexagonBordersBlackOnly(context, hexagon) {
        const corners = this.#layout.hexagonCorners(hexagon);
        const color = this.#getColor(hexagon);

        for (let directionIndex = 0; directionIndex < 6; directionIndex++){
            const borderNeighbor = hexagon.neighbor(directionIndex);
            const colorNeighbor = this.#getColor(borderNeighbor);

            if (!this.#hexagons.has(borderNeighbor.hashCode())) {
                context.strokeStyle = '#111111';
            } else if (color === colorNeighbor) {
                continue;
            } else {
                context.strokeStyle = '#111111';
            }

            const border = this.#layout.hexagonBorderPartPath2D(hexagon, directionIndex, corners);
            context.stroke(border);
        }
    }

    /**
     * @param {OffscreenCanvasRenderingContext2D} context
     * @param {Hexagon} hexagon 
     */
    #drawHexagonBordersColorOnly(context, hexagon) {
        const corners = this.#layout.hexagonCorners(hexagon);
        const color = this.#getColor(hexagon);

        for (let directionIndex = 0; directionIndex < 6; directionIndex++){
            const borderNeighbor = hexagon.neighbor(directionIndex);
            const colorNeighbor = this.#getColor(borderNeighbor);

            if (!this.#hexagons.has(borderNeighbor.hashCode())) {
                continue;
            } else if (color === colorNeighbor) {
                if (!color) {
                    context.strokeStyle = '#DDDDDD';
                } else {
                    context.strokeStyle = color;
                }
            } else {
                continue;
            }

            const border = this.#layout.hexagonBorderPartPath2D(hexagon, directionIndex, corners);
            context.stroke(border);
        }
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

        for (const hexagon of this.onScreenHexagons()) {
            this.#drawHexagonFill(context, hexagon);
        }

        context.lineCap = 'round';

        for (const hexagon of this.onScreenHexagons()) {
            this.#drawHexagonBordersColorOnly(context, hexagon);
        }

        for (const hexagon of this.onScreenHexagons()) {
            this.#drawHexagonBordersBlackOnly(context, hexagon);
        }        
    }

    /**
     * @returns {Generator<Hexagon>}
     */
    *onScreenHexagons() {
        for (const hexagon of this.hexagons) {
            const centerOfHexagon = this.#layout.hexToPixel(hexagon);

            if (centerOfHexagon.x + this.#layout.size.x < 0) continue;
            if (centerOfHexagon.y + this.#layout.size.y < 0) continue;
            
            if (centerOfHexagon.x - this.#layout.size.x > this.#window.innerWidth) continue;
            if (centerOfHexagon.y - this.#layout.size.y > this.#window.innerHeight) continue;

            yield hexagon;
        }
    }

    get zoom() {
        return this.#zoom;
    }

    set zoom(value) {
        this.#zoom = value < WorldMap.#MIN_ZOOM ? WorldMap.#MIN_ZOOM : value > WorldMap.#MAX_ZOOM ? WorldMap.#MAX_ZOOM : value;
    }

    get layout() {
        return this.#layout;
    }

    get centerHexagon() {
        return this.#centerHexagon ?? this.#calculateCenterHexagon();
    }

    get hexagons() {
        return this.#hexagons.values();
    }
}