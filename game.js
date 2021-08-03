import { Layout } from './layout.js';
import { Hexagon } from './hexagon.js';
import { Point } from './point.js';
import { Orientation } from './orientation.js';
import { WorldMap } from './worldMap.js';

export class Game {
    #layout;
    #mainCanvas;
    #mainCanvasContext;
    #window;
    #zoom;
    #selectedHexagon;
    #worldMap;
    #drag;
    #dragStart;
    keyboardStates;

    constructor(mainCanvas, window) {
        console.log('game');

        const center = new Point(window.innerWidth, window.innerHeight);

        this.#zoom = 20;
        this.#layout = new Layout(Orientation.FLAT, new Point(this.#zoom, this.#zoom), center);
        this.#window = window;
        this.#mainCanvas = mainCanvas;
        this.#mainCanvasContext = mainCanvas.getContext('2d');
        this.#worldMap = new WorldMap();
        this.#drag = false;
        this.keyboardStates = new Map();

        this.loop();
    }

    onPointerDown(pageX, pageY) {
        this.#dragStart = new Point(pageX, pageY);
        this.#drag = true;
    }

    onPointerUp(pageX, pageY) {
        this.#drag = false;
    }

    /**
     * @param {PointerEvent} PointerEvent 
     */
    onPointerMove(pageX, pageY) {
        const pointer = new Point(pageX, pageY);


        if (this.#drag) {
            const dx = this.#dragStart.x - pointer.x;
            const dy = this.#dragStart.y - pointer.y;

            this.#layout.origin.x -= dx;
            this.#layout.origin.y -= dy;

            this.#dragStart.x -= dx;
            this.#dragStart.y -= dy;

            return;
        }

        const point = pointer;
        this.#selectedHexagon = this.#layout.pixelToHex(point);
    }

    /**
     * @param {WheelEvent} WheelEvent 
     */
    onWheel(deltaX, deltaY) {
        this.#zoom -= Math.sign(deltaY);
        this.#layout.size.x = this.#layout.size.y = this.#zoom;
    }

    /**
     * 
     * @param {Hexagon} hexagon 
     */
    #drawHexagon(hexagon) {
        const corners = this.#layout.hexagonCorners(hexagon);

        this.#mainCanvasContext.beginPath();
        this.#mainCanvasContext.moveTo(...corners[0]);

        for (let i = 1; i < corners.length; i++) {
            this.#mainCanvasContext.lineTo(...corners[i]);
        }

        this.#mainCanvasContext.closePath();
        this.#mainCanvasContext.stroke();
    }
    
    loop() {
        this.#mainCanvasContext.reset();
        this.#mainCanvasContext.fillStyle = 'rebeccapurple';
        this.#mainCanvasContext.fillRect(0, 0, this.#mainCanvas.width, this.#mainCanvasContext.height);
        this.#mainCanvasContext.strokeStyle = 'red';

        for (const hexagon of this.#worldMap.hexagons) {
            this.#drawHexagon(hexagon);
        }
    
        this.#mainCanvasContext.strokeStyle = 'lime';
        this.#selectedHexagon && this.#drawHexagon(this.#selectedHexagon);

        requestAnimationFrame(this.loop.bind(this));
    }
}