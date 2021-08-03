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
    #initialZoom;
    #selectedHexagon;
    #worldMap;
    #drag;
    #dragStart;
    keyboardStates;

    constructor(mainCanvas, window) {
        console.log('game');

        const center = new Point(window.innerWidth, window.innerHeight);

        this.#zoom = this.#initialZoom = 20;
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

    scaleFromZoom(initialSize) {
        return Math.max(Math.max(1, Math.min(this.#zoom - this.#initialZoom + initialSize, 10)) / 2, 1);
    }


    setColor() {

        if (Math.random() > 0.3) {
            this.#mainCanvasContext.strokeStyle = '#111111';
            this.#mainCanvasContext.fillStyle = '#DDDDDD';
        } else if (Math.random() > 0.3) {
            this.#mainCanvasContext.strokeStyle = '#111111';
            this.#mainCanvasContext.fillStyle = '#FF4136';
        } else if (Math.random() > 0.3) {
            this.#mainCanvasContext.strokeStyle = '#111111';
            this.#mainCanvasContext.fillStyle = '#01FF70';
        } else if (Math.random() > 0.3) {
            this.#mainCanvasContext.strokeStyle = '#111111';
            this.#mainCanvasContext.fillStyle = '#FFDC00';
        } else if (Math.random() > 0.3) {
            this.#mainCanvasContext.strokeStyle = '#111111';
            this.#mainCanvasContext.fillStyle = '#F012BE';
        } else {
            this.#mainCanvasContext.strokeStyle = '#111111';
            this.#mainCanvasContext.fillStyle = '#FF851B';
        }

        
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
        this.#mainCanvasContext.fill();
    }
    
    loop() {
        // this.#mainCanvasContext.reset();
        this.#mainCanvasContext.fillStyle = '#7FDBFF';
        this.#mainCanvasContext.fillRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);

        this.#mainCanvasContext.lineJoin = 'bevel';
        this.#mainCanvasContext.lineWidth = this.scaleFromZoom(3);

        for (const hexagon of this.#worldMap.hexagons) {
            this.setColor();
            this.#drawHexagon(hexagon);
        }
    
        this.#mainCanvasContext.fillStyle = '#00000010';
        this.#mainCanvasContext.strokeStyle = '#00000010';
        this.#selectedHexagon && this.#drawHexagon(this.#selectedHexagon);

        this.#mainCanvasContext.strokeStyle = 'yellow';
        this.#drawHexagon(this.#worldMap.centerHexagon);

        requestAnimationFrame(this.loop.bind(this));
    }
}