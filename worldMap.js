import { Hexagon } from './hexagon.js';
import { Point } from './point.js';
import { Layout } from './layout.js';
import { Orientation } from './orientation.js';
export class WorldMap {
    static #MINIMUM_ZOOM = 0.5;
    static #INITIAL_ZOOM = 0.5;
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
    #lastHexagonGroupId;
    #centerHexagon;

    #program;

    transform = new Point(0, 0);

    /**
     * @param {Point} origin
     */
    constructor(origin, window, gl) {
        this.#zoom = WorldMap.#INITIAL_ZOOM;
        this.#layout = new Layout(Orientation.FLAT, new Point(this.#zoom, this.#zoom), origin);
        this.#window = window;
        this.#hexagons = new Map();
        this.#hexagonsProperties = new Map();

        const vertexShaderSource =
            `#version 300 es

            layout (location=0) in vec2 a_position;
            layout (location=1) in vec3 color;

            uniform vec2 u_resolution;
            uniform vec2 u_translation;
            uniform vec2 u_scale;
            out vec3 vColor;
      
            void main() {
                vec2 scaledPosition = a_position * u_scale;
                vec2 position = scaledPosition + u_translation;
                vec2 zeroToOne = position / u_resolution;
                vec2 zeroToTwo = zeroToOne * 2.0;
                vec2 clipSpace = zeroToTwo - 1.0;
            
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                vColor = color;
            }`;
        
        const fragmentShaderSource = 
            `#version 300 es
            precision highp float;
      
            in vec3 vColor;
            out vec4 fragColor;
      
            void main() {
              fragColor = vec4(vColor, 1.0);
            }`;

        console.log(gl);

        // Set background to solid grey
        gl.clearColor(0.25, 0.25, 0.25, 1);

        // Compile shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vertexShader));
        }
 
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fragmentShader));
        }

        // Link shaders to WebGL program
        this.#program = gl.createProgram();
        gl.attachShader(this.#program, vertexShader);
        gl.attachShader(this.#program, fragmentShader);
        gl.linkProgram(this.#program);
        if (!gl.getProgramParameter(this.#program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.#program));
        }

        // Finally, activate WebGL program
        gl.useProgram(this.#program);

        // Remember to update
        const resolutionUniformLocation = gl.getUniformLocation(this.#program, "u_resolution");
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
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

    async *generate(gl) {
        yield* this.#generatorV4(null, 5_00_000, true, false);

        this.#makeGroups();

        // TODO: FIXME: Map is not always in center
        this.#layout.origin = this.#layout.hexToPixel(this.centerHexagon).multiply(0.5);

        console.time('CALC');
        let trianglesCounter = 0;
        console.log(this.#hexagons.size);
        for (const hexagon of this.#hexagons.values()) {
            trianglesCounter += 6;

            const colorHEX = WorldMap.#COLORS[this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.COLOR)].substr(1);
            const color = [
                parseInt(colorHEX.substr(0, 2), 16) / 255,
                parseInt(colorHEX.substr(2, 2), 16) / 255,
                parseInt(colorHEX.substr(4, 2), 16) / 255,
            ];

            for (const vertex of this.#makeTrianglesFromHexagon(hexagon)) {
                this.triangles.push(...vertex);
            }

            // triangles.push(...this.#makeTrianglesFromHexagon(hexagon));
            for (let i = 0; i < 6 * 3; i++) {
                this.colors.push(...color);
            }
        }

        const trianglesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, trianglesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.triangles), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);


        console.log(`Triangles count: ${trianglesCounter}`);
        console.timeEnd('CALC');
    }  

    #populateGroup(hexagon, lastHexagonGroupId) {
        const stack = [];
        stack.push(hexagon);
    
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
        this.#lastHexagonGroupId = 0;
        
        for (const hexagon of this.hexagons) {
            if (this.#hasHexagonProperty(hexagon, Hexagon.PROPERTIES.GUILD)) continue;

            this.#populateGroup(hexagon, ++this.#lastHexagonGroupId);
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
     * @param {Number} count
     * @param {Boolean} lessLakes
     * @param {Boolean} allowIslands
     */
    *#generatorV4(current = null, count = 10, lessLakes = true, allowIslands = false) {
        console.info('MapGenerationStart');
        console.time('MapGenerationTook');

        current = new Hexagon(0, 0, 0);
        this.#hexagons.set(current.hashCode(), current);
        this.#setHexagonProperty(current, Hexagon.PROPERTIES.COLOR, this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 1));

        for (let q = 0; q <= 1_200; q++) {
            for (let r = 0; r <= 1_200 - q; r++) {
                const generated = new Hexagon(q, r);
                this.#hexagons.set(generated.hashCode(), generated);
                this.#setHexagonProperty(generated, Hexagon.PROPERTIES.COLOR, this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 1));
            }
        }

        // yield {p:1,t:1};
        

        // if (current === null) {
        //     current = new Hexagon(0, 0, 0);
        //     this.#hexagons.set(current.hashCode(), current);
        //     this.#setHexagonProperty(current, Hexagon.PROPERTIES.COLOR, this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 1));
        // }

        // let progress = 0;
        // const generateNext = current => current.neighbor(this.#cryptoRandomRange(0, allowIslands ? 11 : 5));
        // const addNext = generated => {
        //     this.#hexagons.set(generated.hashCode(), generated);
        //     this.#setHexagonProperty(generated, Hexagon.PROPERTIES.COLOR, this.#cryptoRandomRange(0, WorldMap.#COLORS.length - 1));
        //     return generated;
        // };

        // while (this.#hexagons.size < count) {

        //     let step = 0;
        //     while (lessLakes && this.#hexagons.size < count && step++ <= 5) {
        //         addNext(generateNext(current));
        //     }

        //     current = addNext(generateNext(current, true));

        //     if (progress !== this.#hexagons.size) {
        //         progress = this.#hexagons.size;
        //         yield {p: progress, t: count};
        //     }
        // }

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
     * 
     * @param {Number} guildId
     * @returns {Path2D[]}
     */
    #getGuildBorder(guildId) {
        const paths = [];

        

        for (const hexagon of this.onScreenHexagons()) {
            if (this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.GUILD) !== guildId) continue;

            const corners = this.#layout.hexagonCorners(hexagon);

            // Draw border only on these sides where enemy is next to
            for (let directionIndex = 0; directionIndex < 6; directionIndex++) {
                const neighbor = hexagon.neighbor(directionIndex);

                // Is enemy?
                if (this.#getHexagonProperty(neighbor, Hexagon.PROPERTIES.GUILD) === guildId) continue;
                
                paths.push(this.#layout.hexagonBorderPartPath2D(hexagon, directionIndex, corners));
            }
        }

        return paths;
    }

    *#makeTrianglesFromHexagon(hexagon) {
        const hexagonCorners = this.#layout.hexagonCorners(hexagon);
        const hexagonCenter = this.#layout.hexToPixel(hexagon);

        for (let i = 0; i < 6; i++) {
            yield (hexagonCenter);
            yield (hexagonCorners[i]);
            yield (hexagonCorners[(i + 1) % 6]);
        }
    };

    triangles = [];
    colors = [];

    /**
     * Draws map onto canvas
     * @param {OffscreenCanvas} canvas 
     * @param {WebGL2RenderingContext} context 
     */
    async draw(canvas, gl) {
        // Webgl
        console.time('DRAW');

        const translationLocation = gl.getUniformLocation(this.#program, "u_translation");
        // Set the translation.
        gl.uniform2fv(translationLocation, [...this.transform]);

        const scaleLocation = gl.getUniformLocation(this.#program, "u_scale");
        gl.uniform2fv(scaleLocation, [this.#zoom, this.#zoom]);

        
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, this.triangles.length / 2);
        
        console.timeEnd('DRAW');


        return;

        for (const hexagon of this.onScreenHexagons()) {
            const corners = this.#layout.hexagonCorners(hexagon);
            const fillPath = this.#layout.hexagonFillPath2D(hexagon, corners);
            const color = WorldMap.#COLORS[this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.COLOR)];
            const center = this.#layout.hexToPixel(hexagon);
            const guildId = this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.GUILD);
    
            // Fill with Stroke to fix issue where blending line between hexagons is visible
            context.fillStyle = color;
            context.fill(fillPath);

            const textSize = context.measureText(guildId);
            context.fillStyle = `#${(Number(`0x1${color.substr(1)}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()}`;
            context.font = `bold ${this.#zoom}px Arial`;
            context.fillText(guildId,  center.x - (textSize.width / 2), center.y + ((textSize.actualBoundingBoxAscent + textSize.actualBoundingBoxDescent) / 2));
        }

        // TODO: Change to Set in order to skip dupes
        const borderPaths = [];

        for (const guildId of this.onScreenGuilds()) {
            borderPaths.push(this.#getGuildBorder(guildId));
        }

        const combinedPath = new Path2D();

        for (const paths of borderPaths) {

            for (const path of paths) {
                combinedPath.addPath(path);
            }
        }

        // Black borders
        context.lineWidth = 3;
        context.strokeStyle = '#111111';
        context.stroke(combinedPath);
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

    /**
     * @returns {Generator<Number>}
     */
    *onScreenGuilds() {
        const guildIds = new Set();

        for (const hexagon of this.onScreenHexagons()) {
            const guildId = this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.GUILD);


            const lastSize = guildIds.size;

            guildIds.add(guildId);

            const newSize = guildIds.size;


            // No changes
            if (lastSize === newSize) continue;

            yield guildId;
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