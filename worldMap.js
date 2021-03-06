import { Hexagon } from './hexagon.js';
import { Point } from './point.js';
export class WorldMap {
    static #COLORS = [
        '#DDDDDD',
        '#001f3f',
        '#0074D9',
        '#7FDBFF',
        '#39CCCC',
        // '#85144b',
        // '#B10DC9',
        // '#F012BE',
        '#FF4136',
        // '#FF851B',
        // '#FFDC00',
        // '#3D9970',
        // '#2ECC40',
        // '#01FF70'
    ];

    #hexagons;
    #hexagonsProperties; // This cannot contain WeakMaps due to fact that Hexagon is different every time, only hashCode is same.
    #lastHexagonGroupId;
    #centerHexagon;

    /**
     * 
     */
    constructor() {
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
        return this.#hexagonsProperties.get(property)?.get(hexagon.hashCode()) ?? undefined;
    }

    #hasHexagonProperty(hexagon, property) {
        return this.#hexagonsProperties.get(property)?.has(hexagon.hashCode()) ?? false;
    }

    async *generate() {
        // yield* this.#generatorV4(null, ...arguments);
        yield* this.#triangleMapGenerator(...arguments);

        this.#makeGroups();
    }  

    #populateGroup(hexagon, lastHexagonGroupId) {
        const stack = [hexagon];
    
        while (stack.length) {
            hexagon = stack.pop();

            if (this.#hasHexagonProperty(hexagon, Hexagon.PROPERTIES.GUILD)) continue;

            this.#setHexagonProperty(hexagon, Hexagon.PROPERTIES.GUILD, lastHexagonGroupId);

            for (const neighbor of hexagon.closeNeighbors()) {
                if (this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.COLOR) === this.#getHexagonProperty(neighbor, Hexagon.PROPERTIES.COLOR)) {
                    stack.push(neighbor);
                }
            }
        }
    }

    #makeGroups() {
        console.log('POPULATE GROUPS START');
        console.time('POPULATE GROUPS TOOK');
        this.#lastHexagonGroupId = 0;
        
        for (const hexagon of this.hexagons) {
            if (this.#hasHexagonProperty(hexagon, Hexagon.PROPERTIES.GUILD)) continue;

            this.#populateGroup(hexagon, ++this.#lastHexagonGroupId);
        }

        console.timeEnd('POPULATE GROUPS TOOK');
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
        console.info('MAP GENERATION START');
        console.time('MAP GENERATION TOOK');

        if (current === null) {
            current = new Hexagon(0, 0, 0);
            this.#hexagons.set(current.hashCode(), current);
            this.#setHexagonProperty(current, Hexagon.PROPERTIES.COLOR, this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 2));
        }

        let progress = 0;
        const generateNext = current => current.neighbor(this.#cryptoRandomRange(0, allowIslands ? 11 : 5));
        const addNext = generated => {
            this.#hexagons.set(generated.hashCode(), generated);
            this.#setHexagonProperty(generated, Hexagon.PROPERTIES.COLOR, this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 2));
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

        const centerHexagon = this.centerHexagon;
        this.#hexagons.set(centerHexagon.hashCode(), centerHexagon);
        this.#setHexagonProperty(centerHexagon, Hexagon.PROPERTIES.COLOR, WorldMap.#COLORS.length - 1);

        console.timeEnd('MAP GENERATION TOOK');
    }

    *#triangleMapGenerator(size) {
        console.info('MAP GENERATION START');
        console.time('MAP GENERATION TOOK');

        const total = (size * size) * 0.5;
        let progress = 0;
        for (let q = 0; q <= size; q++) {
            for (let r = 0; r <= size - q; r++) {
                yield {p: ++progress, t: total};
                const generated = new Hexagon(q, r);
                this.#hexagons.set(generated.hashCode(), generated);
                this.#setHexagonProperty(generated, Hexagon.PROPERTIES.COLOR, this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 2));
            }
        }

        console.timeEnd('MAP GENERATION TOOK');
    }

    /**
     * Calculates center of map
     * @returns {Hexagon}
     */
    #calculateCenterHexagon() {
        const min = new Point(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        const max = new Point(-Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER);

        for (const hexagon of this.hexagons) {

            if (hexagon.q > max.x) max.x = hexagon.q;
            if (hexagon.r > max.y) max.y = hexagon.r;

            if (hexagon.q < min.x) min.x = hexagon.q;
            if (hexagon.r < min.y) min.y = hexagon.r;
        }

        return new Hexagon((max.x + min.x) / 2, (max.y + min.y) / 2);
    }

    /**
     * @returns {Generator<Number>}
     */
    *guilds() {
        const guildIds = new Set();

        for (const hexagon of this.hexagons()) {
            const guildId = this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.GUILD);


            const lastSize = guildIds.size;

            guildIds.add(guildId);

            const newSize = guildIds.size;


            // No changes
            if (lastSize === newSize) continue;

            yield guildId;
        }
    }

    getHexagonColor(hexagon) {
        return WorldMap.#COLORS[this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.COLOR)].substr(1);
    }

    get centerHexagon() {
        return this.#centerHexagon ?? this.#calculateCenterHexagon();
    }

    get hexagons() {
        return this.#hexagons.values();
    }

    get hexagonSize() {
        return this.#hexagons.size;
    }
}