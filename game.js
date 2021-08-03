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
    #hexagonMap;
    keyboardStates;

    constructor(mainCanvas, window) {
        console.log('game');

        this.#layout = new Layout(Orientation.FLAT, new Point(20, 20), new Point(500, 500));
        this.#zoom = 20;
        this.#window = window;
        this.#mainCanvas = mainCanvas;
        this.#mainCanvasContext = mainCanvas.getContext('2d');
        this.#hexagonMap = new Map();
        this.keyboardStates = new Map();

        this.loop();
    }

    /**
     * @param {PointerEvent} PointerEvent 
     */
    onPointerMove(pageX, pageY) {
        // const point = new Point(pageX, pageY);
        // this.#selectedHexagon = this.#layout.pixelToHex(point);
        this.#layout.origin = new Point(pageX, pageY);
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

    genv1(current, depth = 0) {
        const MAX_DEPTH = 50;
        const index = Math.floor(Math.random() * 5);
        const neighbor = current.neighbor(index);


         ++depth < MAX_DEPTH && this.genv1(neighbor, depth);
         depth < MAX_DEPTH / 2 && Math.random() > 0.5 && this.genv1(neighbor, 40);

        this.#drawHexagon(neighbor);
    }

    genv2random(min, max) {
        const range = max - min + 1
        const bytes_needed = Math.ceil(Math.log2(range) / 8)
        const cutoff = Math.floor((256 ** bytes_needed) / range) * range
        const bytes = new Uint8Array(bytes_needed)
        let value
        do {
            crypto.getRandomValues(bytes)
            value = bytes.reduce((acc, x, n) => acc + x * 256 ** n, 0)
        } while (value >= cutoff)
        return min + value % range
    }

    genv2(current, min = 10, max = 50, stepsLeft = 1000) {

        const neighborIndex = this.genv2random(0, 5);
        const neighbor = current.neighbor(neighborIndex);

        this.#hexagonMap.set(neighbor.hashCode(), neighbor);

        if ( --stepsLeft >= 0 && this.#hexagonMap.size < max) {
            this.genv2(neighbor, min, max, stepsLeft);
        } else if (this.#hexagonMap.size < 10) {
            this.genv2(current, min, max, 1);
        }
        

        this.#drawHexagon(neighbor);
    }
    
    loop() {
        this.#mainCanvasContext.reset();
        this.#mainCanvasContext.strokeStyle = 'red';


        // const mapRadius = 10;

        // for (let q = -mapRadius; q <= mapRadius; q++) {
        //     const r1 = Math.max(-mapRadius, -q - mapRadius);
        //     const r2 = Math.min(mapRadius, -q + mapRadius);

        //     for (let r = r1; r <= r2; r++) {
        //         const hexagon = new Hexagon(q, r, -q-r);

        //         if (this.#selectedHexagon?.equals(hexagon)) {
        //             this.#mainCanvasContext.strokeStyle = 'green';
        //         } else {
        //             this.#mainCanvasContext.strokeStyle = 'red';
        //         }

        //         this.#drawHexagon(hexagon);
        //     }
        // }
    

        const main = new Hexagon(0, 0, 0);
        this.#hexagonMap.set(main.hashCode(), main)
        // this.genv1(main);
        this.genv2(main, 100, 500);


        this.#mainCanvasContext.strokeStyle = 'yellow';
        this.#drawHexagon(main);


        // requestAnimationFrame(this.loop.bind(this));
    }
}