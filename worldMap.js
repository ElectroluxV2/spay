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
    #lastHexagonGroupId;
    #centerHexagon;

    #colorUniformLocation;

    /**
     * @param {Point} origin
     */
    constructor(origin, window, gl) {
        this.#zoom = WorldMap.#INITIAL_ZOOM;
        this.#layout = new Layout(Orientation.FLAT, new Point(this.#zoom, this.#zoom), origin);
        this.#window = window;
        this.#hexagons = new Map();
        this.#hexagonsProperties = new Map();

        const vertexShaderSource = `#version 300 es

        // an attribute is an input (in) to a vertex shader.
        // It will receive data from a buffer
        in vec2 a_position;
        
        // Used to pass in the resolution of the canvas
        uniform vec2 u_resolution;
        
        // all shaders have a main function
        void main() {
        
          // convert the position from pixels to 0.0 to 1.0
          vec2 zeroToOne = a_position / u_resolution;
        
          // convert from 0->1 to 0->2
          vec2 zeroToTwo = zeroToOne * 2.0;
        
          // convert from 0->2 to -1->+1 (clipspace)
          vec2 clipSpace = zeroToTwo - 1.0;
        
          gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        }
        `;
        
        const fragmentShaderSource = `#version 300 es

        precision mediump float;
        
        uniform vec4 u_color;
        
        // we need to declare an output for the fragment shader
        out vec4 outColor;
        
        void main() {
          outColor = u_color;
        }
        `;

        console.log(gl);

        const vertexShader = this.#createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.#createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = this.#createProgram(gl, vertexShader, fragmentShader);
        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
        const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
        this.#colorUniformLocation = gl.getUniformLocation(program, 'u_color');

        const positionBuffer = gl.createBuffer();
        const vertexArrayObject = gl.createVertexArray();

        gl.bindVertexArray(vertexArrayObject);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(program);
        gl.bindVertexArray(vertexArrayObject);
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    }

    #createShader(gl, type, source) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

        if (success) {
            return shader;
        }
        
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        console.error(log);
    }

    #createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        const success = gl.getProgramParameter(program, gl.LINK_STATUS);

        if (success) {
          return program;
        }
       
        const log = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        console.error(log);
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
        yield* this.#generatorV4(null, 1000, true, false);

        this.#makeGroups();

        // TODO: FIXME: Map is not always in center
        this.#layout.origin = this.#layout.hexToPixel(this.centerHexagon).multiply(0.5);
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

    /**
     * Draws map onto canvas
     * @param {OffscreenCanvas} canvas 
     * @param {WebGL2RenderingContext} context 
     */
    async draw(canvas, gl) {

        // context.fillStyle = '#FFFFFF80';
        // context.strokeStyle = '#FF0000';
        // context.lineWidth = 2;

        // const hexagon = new Hexagon(0, 0);
        // const hexagon2 = new Hexagon(0, 1);
       
        // const borderCorners = [];

        // for (const hexagonCorner of hexagonCorners) {
        //     borderCorners.push(this.#layout.borderCorner(hexagonCorner, hexagonCenter));
        // }

        // // Hexagon body
        // context.beginPath();
        // context.moveTo(...hexagonCorners[0]);
        // for (let i = 1; i < hexagonCorners.length; i++) {
        //     context.lineTo(...hexagonCorners[i]);
        // }
        // context.closePath();
        // context.fill();

        // Triangle

        // context.beginPath();
        // context.moveTo(...hexagonCenter);
        // context.lineTo(...hexagonCorners[0]);
        // context.lineTo(...hexagonCorners[1]);
        // context.closePath();
        // context.stroke();

        // Webgl

        const makeTrianglesFromHExagon = hexagon => {
            const hexagonCorners = this.#layout.hexagonCorners(hexagon);
            const hexagonCenter = this.#layout.hexToPixel(hexagon);

            const triangles = new Float32Array(18 * 3);

            for (let i = 0; i < 6; i++) {
                triangles.set([...hexagonCenter], i * 6);
                triangles.set([...hexagonCorners[i]], i * 6 + 2);
                triangles.set([...hexagonCorners[(i + 1) % 6]], i * 6 + 4);
            }

            return triangles;
        };

        const drawHexagon = (triangles, color) => {
            gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
            
            // Set a random color.
            gl.uniform4f(this.#colorUniformLocation, ...color, 1);
            gl.drawArrays(gl.TRIANGLES, 0, 18);
        };

        for (const hexagon of this.onScreenHexagons()) {
            const colorHEX = WorldMap.#COLORS[this.#getHexagonProperty(hexagon, Hexagon.PROPERTIES.COLOR)].substr(1);
            const color = [
                parseInt(colorHEX.substr(0, 2), 16) / 255,
                parseInt(colorHEX.substr(2, 2), 16) / 255,
                parseInt(colorHEX.substr(4, 2), 16) / 255,
            ];

            drawHexagon(makeTrianglesFromHExagon(hexagon), color);
        }

        // drawHexagon(makeTrianglesFromHExagon(hexagon));
        // drawHexagon(makeTrianglesFromHExagon(hexagon2));

        // const tr = new Float32Array([
        //     ...hexagonCenter,
        //     ...hexagonCorners[0],
        //     ...hexagonCorners[1],

        //     ...hexagonCenter,
        //     ...hexagonCorners[1],
        //     ...hexagonCorners[2],

        //     ...hexagonCenter,
        //     ...hexagonCorners[2],
        //     ...hexagonCorners[3],

        //     ...hexagonCenter,
        //     ...hexagonCorners[3],
        //     ...hexagonCorners[4],

        //     ...hexagonCenter,
        //     ...hexagonCorners[4],
        //     ...hexagonCorners[5],

        //     ...hexagonCenter,
        //     ...hexagonCorners[5],
        //     ...hexagonCorners[0],
        // ]);

        // context.fillStyle = 'pink';
        // context.fillRect(...v1.multiply(0.99), 2, 2);

        // const h2 = h1.neighbor(1);
        // const c2 = this.#layout.hexagonCorners(h2);
        // const center2 = this.#layout.hexToPixel(h1);

        // context.beginPath();
        // context.moveTo(...c2[0]);

        // for (let i = 1; i < c2.length; i++) {
        //     context.lineTo(...c2[i]);
        // }

        // context.closePath();
        // // context.stroke();
        // context.fill();

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