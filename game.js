import { Point } from './point.js';
import { WorldMap } from './worldMap.js';

export class Game {
    #mainCanvas;
    #mainCanvasContext;
    #window;
    #animationFrameId;
    #thresholdFrameUpdateTimer;

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
        console.log('game');

        this.#window = window;
        this.#mainCanvas = mainCanvas;
        this.#mainCanvasContext = mainCanvas.getContext('2d');
        this.#drag = false;
        this.keyboardStates = new Map();

        this.#loadLevel().then(this.#singleFrameUpdate.bind(this));
    }

    async #loadLevel() {
        const center = new Point(this.#window.innerWidth, this.#window.innerHeight);
        this.#worldMap = new WorldMap(center, this.#window);

        const result = await fetch('./background_water.png');
        const blob = await result.blob();
        const image = await createImageBitmap(blob);
        this.#waterPattern = this.#mainCanvasContext.createPattern(image, 'repeat');

        await this.#worldMap.prerender();
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
        this.#dragStart = new Point(pageX, pageY);
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
        const pointer = new Point(pageX, pageY);


        if (this.#drag) {
            const dx = this.#dragStart.x - pointer.x;
            const dy = this.#dragStart.y - pointer.y;

            this.#worldMap.layout.origin.x -= dx;
            this.#worldMap.layout.origin.y -= dy;

            this.#dragStart.x -= dx;
            this.#dragStart.y -= dy;

            return;
        }


        this.#selectedHexagon = this.#worldMap.layout.pixelToHex(pointer);
    }

    /**
     * @param {WheelEvent} WheelEvent 
     */
    onWheel(deltaX, deltaY) {
        Math.sign(deltaY) > 0 ? this.#worldMap.zoomOut() : this.#worldMap.zoomIn();
        this.#worldMap.layout.size.x = this.#worldMap.layout.size.y = this.#worldMap.zoom;

        this.#thresholdFrameUpdate();
    }

    #drawSingleFrame() {
        // this.#mainCanvasContext.fillStyle = '#7FDBFF';
        this.#mainCanvasContext.fillStyle = this.#waterPattern;
        this.#mainCanvasContext.fillRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);

        this.#worldMap.draw(this.#mainCanvasContext, this.#mainCanvasContext);
    }

    
    loop() {
        // this.#mainCanvasContext.reset();
        this.#mainCanvasContext.fillStyle = '#7FDBFF';
        this.#mainCanvasContext.fillRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);

        this.#worldMap.draw(this.#mainCanvasContext, this.#mainCanvasContext);
    
        // this.#mainCanvasContext.fillStyle = '#00000010';
        // this.#mainCanvasContext.strokeStyle = '#00000010';
        // this.#selectedHexagon && this.#drawHexagon(this.#selectedHexagon);

        requestAnimationFrame(this.loop.bind(this));
    }
}