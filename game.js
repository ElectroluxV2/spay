import { Layout } from './layout.js';
import { Hexagon } from './hexagon.js';
import { Point } from './point.js';
import { Orientation } from './orientation.js';

export class Game {
    #layout;
    #mainCanvas;
    #mainCanvasContext;
    #window;
    #zoom;
    #selectedHexagon;
    keyboardStates;

    constructor(mainCanvas, window) {
        console.log('game');

        this.#layout = new Layout(Orientation.FLAT, new Point(20, 20), new Point(500, 500));
        this.#zoom = 20;
        this.#window = window;
        this.#mainCanvas = mainCanvas;
        this.#mainCanvasContext = mainCanvas.getContext('2d');
        this.keyboardStates = new Map();

        this.loop();
    }

    /**
     * @param {PointerEvent} PointerEvent 
     */
    onPointerMove(pageX, pageY) {
        const point = new Point(pageX, pageY);
        this.#selectedHexagon = this.#layout.pixelToHex(point);
        // this.#layout.origin = new Point(pageX, pageY);
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
        this.#mainCanvasContext.strokeStyle = 'red';


        const mapRadius = 10;

        for (let q = -mapRadius; q <= mapRadius; q++) {
            const r1 = Math.max(-mapRadius, -q - mapRadius);
            const r2 = Math.min(mapRadius, -q + mapRadius);

            for (let r = r1; r <= r2; r++) {
                const hexagon = new Hexagon(q, r, -q-r);

                if (this.#selectedHexagon?.equals(hexagon)) {
                    this.#mainCanvasContext.strokeStyle = 'green';
                } else {
                    this.#mainCanvasContext.strokeStyle = 'red';
                }

                this.#drawHexagon(hexagon);
            }
        }
    
        requestAnimationFrame(this.loop.bind(this));
    }
}