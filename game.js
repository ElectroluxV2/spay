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
    keyboardStates;

    constructor(mainCanvas, window) {
        console.log('game');

        this.#layout = new Layout(Orientation.FLAT, new Point(20, 20), new Point(500, 500));
        this.#zoom = 20;
        this.#window = window;
        this.#mainCanvas = mainCanvas;
        this.#mainCanvasContext = mainCanvas.getContext('2d');
        this.#worldMap = new WorldMap();
        this.#drag = false;
        this.keyboardStates = new Map();

        this.loop();
    }

    onPointerDown() {
        this.#drag = true;
    }

    onPointerUp() {
        this.#drag = false;
    }

    /**
     * @param {PointerEvent} PointerEvent 
     */
    onPointerMove(pageX, pageY) {

        if (this.#drag) {
            this.#layout.origin.x = this.#layout.origin.x + (pageX - this.#layout.origin.x);
            this.#layout.origin.y = this.#layout.origin.y + (pageY - this.#layout.origin.y);
            return;
        }

        const point = new Point(pageX, pageY);
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
        this.#mainCanvasContext.fillRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);
        this.#mainCanvasContext.strokeStyle = 'red';

        for (const hexagon of this.#worldMap.hexagons) {
            this.#drawHexagon(hexagon);
        }
    
        this.#mainCanvasContext.strokeStyle = 'lime';
        this.#selectedHexagon && this.#drawHexagon(this.#selectedHexagon);

        requestAnimationFrame(this.loop.bind(this));
    }
}