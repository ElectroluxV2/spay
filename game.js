import { Point } from './point.js';
import { ProgressBar } from './progressBar.js';
import { Renderer } from './renderer.js';
import { WorldMap } from './worldMap.js';

export class Game {
    #mainCanvas;
    #mainCanvasGL;
    #window;
    #animationFrameId;
    #thresholdFrameUpdateTimer;

    #renderer;

    #worldMap;
    #waterPattern;
    #selectedHexagon;

    #drag;
    #dragStart;

    keyboardStates;

    /**
     * 
     * @param {OffscreenCanvas} mainCanvas 
     * @param {{innerWidth: Number, innerHeight: Number}} window 
     */
    constructor(mainCanvas, window) {
        this.#window = window;
        this.#mainCanvas = mainCanvas;
        this.#mainCanvasGL = mainCanvas.getContext('webgl2');
        this.#drag = false;
        this.keyboardStates = new Map();

        this.#mainCanvasGL.clearColor(0, 0, 0, 1);
        this.#mainCanvasGL.clear(this.#mainCanvasGL.COLOR_BUFFER_BIT | this.#mainCanvasGL.DEPTH_BUFFER_BIT);

        this.#renderer = new Renderer(this.#mainCanvasGL);
        this.#worldMap = new WorldMap();

        this.#loadLevel().then(this.#singleFrameUpdate.bind(this));
    }

    async #loadLevel() {
        // World Size 
        for await (const {p, t} of this.#worldMap.generate(2000)) {
            console.log(`Generating map. ${p} / ${t}`);
        }

        console.log('CALCULATE HEXAGONS DATA START');
        console.time('CALCULATE HEXAGONS DATA TOOK');
        // Calculate triangles and set colors for renderer
        const vertices = new Float32Array(this.#worldMap.hexagonSize * 6 * 3 * 2); // 6 times triangle, 3 times vertex, 2 times coord
        const colors = new Float32Array(this.#worldMap.hexagonSize * 6 * 3 * 3); // 6 times triangle, 3 times vertex, 3 times color (gradient)

        let vertexIndex = 0;
        let colorIndex = 0;
        for (const hexagon of this.#worldMap.hexagons) {
            // Triangles
            for (const triangle of this.#renderer.getTrianglesFromHexagon(hexagon)) {
                for (const vertex of triangle) {
                    vertices.set(vertex, vertexIndex);
                    vertexIndex += 2;
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
            }
        }

        this.#renderer.vertices = vertices;
        this.#renderer.colors = colors;

        this.#renderer.offset.x = this.#window.innerWidth / 2;
        this.#renderer.offset.y = this.#window.innerHeight / 2;

        console.timeEnd('CALCULATE HEXAGONS DATA TOOK');
    }

    #startFrameUpdate() {
        this.#drawSingleFrame();
        this.#animationFrameId = requestAnimationFrame(this.#startFrameUpdate.bind(this));
    }

    #isFrameUpdateStarted() {
        return this.#animationFrameId !== undefined;
    }

    #singleFrameUpdate() {
        this.#drawSingleFrame();
    }

    #thresholdFrameUpdate(timeToStop = 200) {
        !this.#isFrameUpdateStarted() && this.#startFrameUpdate();
        clearTimeout(this.#thresholdFrameUpdateTimer);
        this.#thresholdFrameUpdateTimer = setTimeout(this.#stopFrameUpdate.bind(this), timeToStop);
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

        !this.#isFrameUpdateStarted() && this.#startFrameUpdate();
    }

    /**
     * 
     * @param {Number} pageX 
     * @param {Number} pageY 
     */
    onPointerUp(pageX, pageY) {
        this.#drag = false;

        this.#stopFrameUpdate();
    }

    /**
     * 
     * @param {Number} pageX 
     * @param {Number} pageY 
     */
    onPointerMove(pageX, pageY) {
        const pointer = new Point(pageX.toFixed(0), pageY.toFixed(0));


        if (this.#drag) {

            // const centerHexagon = this.#worldMap.centerHexagon;
            // const onScreenCenter = this.#worldMap.layout.hexToPixel(centerHexagon);
            // const transformed = onScreenCenter.multiply(this.#zoomFunction(this.#currentZoom)).add(this.#renderer.offset).add(this.#renderer.transform);

            // console.log(pointer, transformed);

            const dx = this.#dragStart.x - pointer.x;
            const dy = this.#dragStart.y - pointer.y;

            this.#renderer.transform.x -= dx;
            this.#renderer.transform.y -= dy;

            this.#dragStart.x -= dx;
            this.#dragStart.y -= dy;

            return;
        }
    }

    /**
     * @param {WheelEvent} WheelEvent 
     */
    onWheel(deltaX, deltaY) {
        this.#renderer.zoom -= Math.sign(deltaY) * 0.1;
        this.#thresholdFrameUpdate();
    }

    #drawSingleFrame() {
        this.#renderer.draw();
    }
}