import { Point } from './point.js';
import { ProgressBar } from './progressBar.js';
import { Renderer } from './renderer.js';
import { WorldMap } from './worldMap.js';

export class Game {
    #mainCanvasGL;
    #window;
    #animationFrameId;

    #renderer;

    #worldMap;
    #waterPattern;
    #selectedHexagon;

    #drag;
    #dragStart;
    #lastPointer;

    keyboardStates;

    /**
     * 
     * @param {OffscreenCanvas} mainCanvas 
     * @param {{innerWidth: Number, innerHeight: Number}} window 
     */
    constructor(mainCanvas, window) {
        this.#window = window;
        this.#mainCanvasGL = mainCanvas.getContext('webgl2');
        this.#drag = false;
        this.keyboardStates = new Map();

        this.#worldMap = new WorldMap();
        this.#renderer = new Renderer(this.#mainCanvasGL);

        this.#loadLevel().then(this.#startFrameUpdate.bind(this));
    }

    *#calculateDataForRenderer() {
        console.log('CALCULATE RENDERER DATA START');
        console.time('CALCULATE RENDERER DATA TOOK');

        // Calculate triangles and set colors for renderer
        const vertices = new Float32Array(this.#worldMap.hexagonSize * 6 * 3 * 2); // 6 times triangle, 3 times vertex, 2 times coord
        const colors = new Float32Array(this.#worldMap.hexagonSize * 6 * 3 * 3); // 6 times triangle, 3 times vertex, 3 times color (gradient)

        const total = (this.#worldMap.hexagonSize * 6 * 3) + (this.#worldMap.hexagonSize * 6 * 3);
        let progress = 0;

        let vertexIndex = 0;
        let colorIndex = 0;
        for (const hexagon of this.#worldMap.hexagons) {
            // Triangles
            for (const triangle of this.#renderer.getTrianglesFromHexagon(hexagon)) {
                for (const vertex of triangle) {
                    vertices.set(vertex, vertexIndex);
                    vertexIndex += 2;

                    yield {p: ++progress, t: total};
                }
            }

            // Color
            const colorHEX = this.#worldMap.getHexagonColor(hexagon);
            const colorRGB = [
                parseInt(colorHEX.substr(0, 2), 16) / 255,
                parseInt(colorHEX.substr(2, 2), 16) / 255,
                parseInt(colorHEX.substr(4, 2), 16) / 255,
            ];

            // 6 times triangle, don't want gradient
            for (let i = 0; i < 6 * 3; i++) {
                colors.set(colorRGB, colorIndex);
                colorIndex += 3;

                yield {p: ++progress, t: total};
            }
        }

        this.#renderer.vertices = vertices;
        this.#renderer.colors = colors;

        // this.#renderer.offset.x = this.#window.innerWidth / 2;
        // this.#renderer.offset.y = this.#window.innerHeight / 2;

        console.timeEnd('CALCULATE RENDERER DATA TOOK');
    }

    async #loadLevel() {
        // World Size 
        for await (const {p, t} of this.#worldMap.generate(1000, true, false)) {
            console.slog(`Generating map. ${p} / ${t}`);
        }

        // Calculate vertices for WebGL
        for (const {p, t} of this.#calculateDataForRenderer()) {
            console.slog(`Calculating renderer data. ${p} / ${t}`);
        }
    }

    #startFrameUpdate() {
        this.#drawSingleFrame();
        this.#animationFrameId = requestAnimationFrame(this.#startFrameUpdate.bind(this));
    }

    #isFrameUpdateStarted() {
        return this.#animationFrameId !== undefined;
    }

    #stopFrameUpdate() {
        cancelAnimationFrame(this.#animationFrameId);
        this.#animationFrameId = undefined;
    }

    /**
     * 
     * @param {Number} pageX 
     * @param {Number} pageY 
     */
    onPointerDown(pageX, pageY) {
        this.#dragStart = new Point(pageX.toFixed(0), pageY.toFixed(0));
        this.#drag = true;
    }

    /**
     * 
     * @param {Number} pageX 
     * @param {Number} pageY 
     */
    onPointerUp(pageX, pageY) {
        this.#drag = false;
    }

    /**
     * 
     * @param {Number} pageX 
     * @param {Number} pageY 
     */
    onPointerMove(pageX, pageY) {
        const pointer = new Point(pageX.toFixed(0), pageY.toFixed(0));
        this.#selectedHexagon = this.#renderer.pixelToHexagon(pointer.x, pointer.y);

        if (this.#drag) {
            const dx = this.#dragStart.x - pointer.x;
            const dy = this.#dragStart.y - pointer.y;

            this.#renderer.transform.x -= dx;
            this.#renderer.transform.y -= dy;

            this.#dragStart.x -= dx;
            this.#dragStart.y -= dy;
        }

        this.#lastPointer = pointer;
    }

    /**
     * @param {WheelEvent} WheelEvent 
     */
    onWheel(deltaX, deltaY) {
        this.#renderer.zoom -= Math.sign(deltaY) * 0.1;
    }

    pinchGesture(change) {
        this.#renderer.zoom += change;
    }

    #drawSingleFrame() {
        this.#renderer.draw();
    }
}