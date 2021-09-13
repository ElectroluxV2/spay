import { Point } from './point.js';
import { ProgressBar } from './progressBar.js';
import { WorldMap } from './worldMap.js';

export class Game {
    #mainCanvas;
    // #mainCanvasContext;
    #mainCanvasGL;
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
        this.#window = window;
        this.#mainCanvas = mainCanvas;
        this.#mainCanvasGL = mainCanvas.getContext('webgl2');
        this.#drag = false;
        this.keyboardStates = new Map();

        this.#mainCanvasGL.clearColor(0, 0, 0, 1);
        this.#mainCanvasGL.clear(this.#mainCanvasGL.COLOR_BUFFER_BIT | this.#mainCanvasGL.DEPTH_BUFFER_BIT);

        this.#loadLevel().then(this.#singleFrameUpdate.bind(this));
    }

    async #loadLevel() {
        const progressBar = new ProgressBar({x: (this.#window.innerWidth / 2) - (this.#window.innerWidth / 3 / 2), y: (this.#window.innerHeight / 2), width: this.#window.innerWidth / 3, height: 64}, '#989fce', 0);
        const center = new Point(this.#window.innerWidth, this.#window.innerHeight);

        this.#worldMap = new WorldMap(center, this.#window, this.#mainCanvasGL);

        let lastProgress = 0;
        const updateProgress = async (progress, text) => {
            if (Math.trunc((progress * 100)) <= lastProgress) return;

            // this.#mainCanvasContext.fillStyle = '#272838';
            // this.#mainCanvasContext.fillRect(0, 0, ...center);
            // progressBar.draw(this.#mainCanvasContext, progress);
            
            // const textSize = this.#mainCanvasContext.measureText(text);
            // this.#mainCanvasContext.fillStyle = '#7D6B91';
            // this.#mainCanvasContext.font = 'bold 16px Arial';
            // this.#mainCanvasContext.fillText(text,  (this.#window.innerWidth / 2) - (textSize.width / 2), (this.#window.innerHeight / 2) + 80 + textSize.actualBoundingBoxDescent);

            lastProgress = Math.trunc((progress * 100));

            await new Promise(resolve => {
                setTimeout(resolve, 0)
            });
        }

        updateProgress(0);

        const result = await fetch('./background_water.png');
        const blob = await result.blob();
        const image = await createImageBitmap(blob);
        // this.#waterPattern = this.#mainCanvasContext.createPattern(image, 'repeat');

        for await (const {p, t} of this.#worldMap.generate(this.#mainCanvasGL)) {
            await updateProgress(p / t, `Generating map. ${p} / ${t}`);
        }
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
            const dx = this.#dragStart.x - pointer.x;
            const dy = this.#dragStart.y - pointer.y;

            this.#worldMap.transform.x -= dx;
            this.#worldMap.transform.y -= dy;

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
        this.#worldMap.zoom += -Math.sign(deltaY) * 0.1;
        this.#worldMap.layout.size.x = this.#worldMap.layout.size.y = this.#worldMap.zoom;

        this.#thresholdFrameUpdate();
    }

    #drawSingleFrame() {
        // this.#mainCanvasContext.fillStyle = '#7FDBFF';
        // this.#mainCanvasContext.reset();
        // this.#mainCanvasContext.fillStyle = this.#waterPattern;
        // this.#mainCanvasContext.fillRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);

        
        this.#mainCanvasGL.clearColor(0, 0, 0, 1);
        this.#mainCanvasGL.clear(this.#mainCanvasGL.COLOR_BUFFER_BIT);
        this.#worldMap.draw(this.#mainCanvas, this.#mainCanvasGL);
    }

    
    // loop() {
    //     // this.#mainCanvasContext.reset();
    //     this.#mainCanvasContext.fillStyle = '#7FDBFF';
    //     this.#mainCanvasContext.fillRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);

    //     this.#worldMap.draw(this.#mainCanvasContext, this.#mainCanvasContext);
    
    //     // this.#mainCanvasContext.fillStyle = '#00000010';
    //     // this.#mainCanvasContext.strokeStyle = '#00000010';
    //     // this.#selectedHexagon && this.#drawHexagon(this.#selectedHexagon);

    //     requestAnimationFrame(this.loop.bind(this));
    // }
}