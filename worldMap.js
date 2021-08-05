import { Hexagon } from './hexagon.js';
import { Point } from './point.js';
import { Layout } from './layout.js';
import { Orientation } from './orientation.js';
import { PreRenderedHexagon } from './preRenderedHexagon.js';

export class WorldMap {
    static #ZOOM_STAGES = [
        1.5,
        2,
        3,
        4,
        5.5,
        7,
        8.5,
        10,
        12,
        14,
        16,
        20,
        24,
        30,
        40,
        50
    ];

    static #MAX_ZOOM = WorldMap.#ZOOM_STAGES.length - 1;
    static #MIN_ZOOM = 0;
    
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
    #zoomIndex;
    #initialZoom;
    #hexagons;
    #hexagonsColors;
    #preRenderedHexagons;
    #centerHexagon;

    /**
     * @param {Point} origin
     */
    constructor(origin, window) {
        const middleZoomIndex = Math.trunc(WorldMap.#MAX_ZOOM / 2);
        this.#zoomIndex = middleZoomIndex;
        this.#initialZoom = WorldMap.#ZOOM_STAGES[middleZoomIndex];


        this.#layout = new Layout(Orientation.FLAT, new Point(this.#initialZoom, this.#initialZoom), origin);
        this.#window = window;
        this.#hexagons = new Map();
        this.#hexagonsColors = new Map();


        const main = new Hexagon(0, 0, 0);
        this.#hexagons.set(main.hashCode(), main);
        this.#hexagonsColors.set(main.hashCode(), 0); 

        this.#generatorV4(main, 50000, 50000, true, false);

        // TODO: FIXME: Map is not always in center
        this.#layout.origin = this.#layout.hexToPixel(this.centerHexagon).multiply(0.5);
    }

    getPreRenderedHexagon(deletedBorderIndexes, colorIndex, zoomIndex) {
        return this.#preRenderedHexagons.get(deletedBorderIndexes).get(colorIndex).get(zoomIndex);
    }

    setPreRenderedHexagon(deletedBorderIndexes, colorIndex, zoomIndex, preRenderedHexagon) {
        this.#preRenderedHexagons.get(deletedBorderIndexes).get(colorIndex).set(zoomIndex, preRenderedHexagon);
    }

    async prerender() {
        let preRenderedHexagonCounter = 0;

        // Generate all possible variants of hexagon
        this.#preRenderedHexagons = new Map();
        const allPossibleDeletedBorderIndexes = new Set(['none']);

        const pushSequence = (n, k, length, array, output) => {
            if (length == k) {
                const numbers = [];
                for (let i = 0; i < k; i++) {
                    numbers.push(array[i]);
                }
                output.add(numbers.sort().join(''));
                return;
            }
    
            let i = (length == 0) ? 0 : array[length - 1] + 1;
    
            length++;
    
            while (i <= n) {
                array[length - 1] = i;
                pushSequence(n, k, length, array, output);
                i++;
            }
    
            length--;
        }

        for (let removeBorderCount = 1; removeBorderCount <= 6; removeBorderCount++) {
            pushSequence(5, removeBorderCount, 0, [], allPossibleDeletedBorderIndexes);
        }

        for (const deletedBorderIndexes of allPossibleDeletedBorderIndexes) {
            this.#preRenderedHexagons.set(deletedBorderIndexes, new Map());

            for (let colorIndex = 0; colorIndex < WorldMap.#COLORS.length; colorIndex++) {
                this.#preRenderedHexagons.get(deletedBorderIndexes).set(colorIndex, new Map());
                const color = WorldMap.#COLORS[colorIndex];
    
                for (let zoomIndex = 0; zoomIndex <= WorldMap.#MAX_ZOOM; zoomIndex++) {
                    const size = new Point(WorldMap.#ZOOM_STAGES[zoomIndex], WorldMap.#ZOOM_STAGES[zoomIndex]);
        
                    const preRenderedHexagon = new PreRenderedHexagon(size, color, deletedBorderIndexes);
                    await this.prerenderSingleHexagon(preRenderedHexagon);
                    this.setPreRenderedHexagon(deletedBorderIndexes, colorIndex, zoomIndex, preRenderedHexagon);
                    preRenderedHexagonCounter++;
                }
            }
        }

        console.info(`Pre-rendered total ${preRenderedHexagonCounter} hexagon textures.`);        
    }

    /**
     * 
     * @param {PreRenderedHexagon} preRenderedHexagon 
     */
    async prerenderSingleHexagon(preRenderedHexagon) {
        const context = preRenderedHexagon.getContext('2d');
        this.#drawHexagon(context, new Hexagon(0, 0), new Layout(Orientation.FLAT, preRenderedHexagon.size, preRenderedHexagon.size), preRenderedHexagon.removeBorderIndexes, preRenderedHexagon.color);
    }

    /**
     * @param {OffscreenCanvasRenderingContext2D} context
     * @param {Hexagon} hexagon
     * @param {Layout} layout
     * @param {String} color
     * @param {String} removeBorderIndexes
     */
     #drawHexagon(context, hexagon, layout, removeBorderIndexes, color) {
        const corners = layout.hexagonCorners(hexagon);
        const fillPath = layout.hexagonFillPath2D(hexagon, corners);

        // Fill
        context.fillStyle = color;
        context.fill(fillPath);

        // Color borders
        context.lineWidth = this.#scaleFromZoom(6, layout.size.x * 1.5);
        context.lineCap = 'round';
        context.strokeStyle = color;
        for (let directionIndex = 0; directionIndex < 6 && removeBorderIndexes !== 'none'; directionIndex++) {
            
            // Check if color (directionIndex is NOT included in removeBorderIndexes)
            if (!removeBorderIndexes.includes(directionIndex)) continue;

            const border = this.#layout.hexagonBorderPartPath2D(hexagon, directionIndex, corners);
            context.stroke(border);
        }

        // Black borders
        context.strokeStyle = '#111111';
        for (let directionIndex = 0; directionIndex < 6; directionIndex++) {
            
            // Check if color (directionIndex is included in removeBorderIndexes)
            if (removeBorderIndexes !== 'none' && removeBorderIndexes.includes(directionIndex)) continue;

            const border = this.#layout.hexagonBorderPartPath2D(hexagon, directionIndex, corners);
            context.stroke(border);
        }
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
     * @param {Number} max 
     * @param {Number} min 
     */
    #generatorV4(current, min = 10, max = min, lessLakes = true, allowIslands = false) {

        const generateNext = current => current.neighbor(this.#cryptoRandomRange(0, allowIslands ? 11 : 5));
        const addNext = generated => {
            this.#hexagons.set(generated.hashCode(), generated);
            this.#hexagonsColors.set(generated.hashCode(), this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 1)); 

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
    #scaleFromZoom(initialSize, currentZoom = this.zoom) {
        // TODO: FIXME: Its useless in current form
        return Math.max(Math.max(1, Math.min((currentZoom -this.#initialZoom + initialSize) * 0.1, 10)) / 2, 1);
    }

    /**
     * Draws map onto canvas
     * @param {OffscreenCanvas} canvas 
     * @param {OffscreenCanvasRenderingContext2D} context 
     */
    async draw(canvas, context) {
        context.imageSmoothingEnabled = false;
        context.lineJoin = 'bevel';
        context.lineWidth = this.#scaleFromZoom(3);
        context.strokeStyle = '#111111';

        for (const hexagon of this.onScreenHexagons()) {
            const center = this.#layout.hexToPixel(hexagon);
            const colorIndex = this.#hexagonsColors.get(hexagon.hashCode());

            const removedBorders = [];
            for (let directionIndex = 0; directionIndex < 6; directionIndex++) {
                const borderNeighbor = hexagon.neighbor(directionIndex);

                if (!this.#hexagons.has(borderNeighbor.hashCode())) continue;

                const colorNeighborIndex = this.#hexagonsColors.get(borderNeighbor.hashCode());

                if (colorIndex !== colorNeighborIndex) continue;

                removedBorders.push(directionIndex);
            }

            const stringValue = removedBorders.sort().join('');
            const removedBorderIndexes = stringValue.length ? stringValue : 'none';
            const zoomIndex = this.#zoomIndex;

            context.drawImage(this.getPreRenderedHexagon(removedBorderIndexes, colorIndex, zoomIndex), ...center);
  
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
        return WorldMap.#ZOOM_STAGES[this.#zoomIndex];
    }

    zoomIn() {
        ++this.#zoomIndex > WorldMap.#MAX_ZOOM && (this.#zoomIndex = WorldMap.#MAX_ZOOM);
        // (++this.#zoomIndex) %= WorldMap.#MAX_ZOOM;
    }

    zoomOut() {
        --this.#zoomIndex < WorldMap.#MIN_ZOOM && (this.#zoomIndex = WorldMap.#MIN_ZOOM);
        // WorldMap.#MAX_ZOOM += ((--this.#zoomIndex) %= WorldMap.#MAX_ZOOM);
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