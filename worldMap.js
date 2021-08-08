import { Hexagon } from './hexagon.js';
import { Point } from './point.js';
import { Layout } from './layout.js';
import { Orientation } from './orientation.js';
export class WorldMap {
    static #MINIMUM_ZOOM = 0.5;
    static #INITIAL_ZOOM = 20;
    static #MAXIMUM_ZOOM = 90;

    static #COLORS = [
        '#DDDDDD',
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
    #hexagons;
    #hexagonsProperties; // This cannot contain WeakMaps due to fact that Hexagon is different every time, only hashCode is same.
    #centerHexagon;

    /**
     * @param {Point} origin
     */
    constructor(origin, window) {
        this.#zoom = WorldMap.#INITIAL_ZOOM;
        this.#layout = new Layout(Orientation.FLAT, new Point(this.#zoom, this.#zoom), origin);
        this.#window = window;
        this.#hexagons = new Map();
        this.#hexagonsProperties = new Map();
    }

    #setHexagonProperty(hexagon, property, value) {
        if (!this.#hexagonsProperties.has(property)) {
            this.#hexagonsProperties.set(property, new Map());
        }

        this.#hexagonsProperties.get(property).set(hexagon.hashCode(), value);
    }

    #getHexagonProperty(hexagon, property) {
        return this.#hexagonsProperties.get(property).get(hexagon.hashCode());
    }

    async *generate() {
        yield* this.#generatorV4(null, 100, true, false);

        // TODO: FIXME: Map is not always in center
        this.#layout.origin = this.#layout.hexToPixel(this.centerHexagon).multiply(0.5);
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

    /**
     * 
     * @param {Hexagon} current
     * @param {Number} count
     * @param {Boolean} lessLakes
     * @param {Boolean} allowIslands
     */
    *#generatorV4(current = null, count = 10, lessLakes = true, allowIslands = false) {
        console.info('MapGenerationStart');
        console.time('MapGenerationTook');

        if (current === null) {
            current = new Hexagon(0, 0, 0);
            this.#hexagons.set(current.hashCode(), current);
            this.#setHexagonProperty(current, Hexagon.PROPERTIES.COLOR, this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 1));
        }

        let progress = 0;
        const generateNext = current => current.neighbor(this.#cryptoRandomRange(0, allowIslands ? 11 : 5));
        const addNext = generated => {
            this.#hexagons.set(generated.hashCode(), generated);
            this.#setHexagonProperty(generated, Hexagon.PROPERTIES.COLOR, this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 1));
            return generated;
        };

        while (this.#hexagons.size < count) {

            let step = 0;
            while (lessLakes && this.#hexagons.size < count && step++ <= 5) {
                addNext(generateNext(current));
            }

            current = addNext(generateNext(current, true));

            if (progress !== this.#hexagons.size) {
                progress = this.#hexagons.size;
                yield {p: progress, t: count};
            }
        }

        console.timeEnd('MapGenerationTook');
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

        return new Hexagon((max.x + min.x) / 2, (max.y + min.y) / 2);
    }

    /**
     * Draws map onto canvas
     * @param {OffscreenCanvas} canvas 
     * @param {OffscreenCanvasRenderingContext2D} context 
     */
    async draw(canvas, context) {
        for (const hexagon of this.onScreenHexagons()) {
            const corners = this.#layout.hexagonCorners(hexagon);
            const fillPath = this.#layout.hexagonFillPath2D(hexagon, corners);
            const color = WorldMap.#COLORS[this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.COLOR)];
    
            // Fill with Stroke to fix issue where blending line between hexagons is visible
            context.fillStyle = color;
            context.fill(fillPath);
        }    
    }

    /**
     * @returns {Generator<Hexagon>}
     */
    *onScreenHexagons() {
        for (const hexagon of this.hexagons) {
            const centerOfHexagon = this.#layout.hexToPixel(hexagon);

            if (centerOfHexagon.x + (this.#layout.size.x * 2) < 0) continue;
            if (centerOfHexagon.y + (this.#layout.size.y * 2) < 0) continue;
            
            if (centerOfHexagon.x - (this.#layout.size.x * 2) > this.#window.innerWidth) continue;
            if (centerOfHexagon.y - (this.#layout.size.y * 2) > this.#window.innerHeight) continue;

            yield hexagon;
        }
    }

    get zoom() {
        return this.#zoom;
    }

    set zoom(value) {
        this.#zoom = value;
        if (this.#zoom < WorldMap.#MINIMUM_ZOOM) this.#zoom = WorldMap.#MINIMUM_ZOOM;
        if (this.#zoom > WorldMap.#MAXIMUM_ZOOM) this.#zoom = WorldMap.#MAXIMUM_ZOOM;
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