import { Polyfills } from './polyfills.js';
import { Game } from './game.js';

const workerContext = {
    game: null,
    mainCanvas: null,
    constructor: ({mainCanvas, window}) => {
        workerContext.mainCanvas = mainCanvas;
        workerContext.windowOnResize({window});
        workerContext.game = new Game(mainCanvas, window);
    },
    windowOnKeyDown: ({key}) => {
        workerContext.game.keyboardStates[key] = true;
    },
    windowOnKeyUp: ({key}) => {
        workerContext.game.keyboardStates[key] = false;
    },
    windowOnResize: ({window}) => {
        // Adjust to new dimensions
        workerContext.mainCanvas.height = window.innerHeight;
        workerContext.mainCanvas.width = window.innerWidth;
    },
    onPointerMove: ({pageX, pageY}) => {
        workerContext.game?.onPointerMove(pageX, pageY);
    },
    onPointerDown: ({pageX, pageY}) => workerContext.game?.onPointerDown(pageX, pageY),
    onPointerUp: ({pageX, pageY}) => workerContext.game?.onPointerUp(pageX, pageY),
    onWheel: ({deltaX, deltaY}) => {
        workerContext.game?.onWheel(deltaX, deltaY);
    },
    pinchGesture: ({change}) => workerContext.game?.pinchGesture(change)
};

onmessage = ({data} = event) => workerContext[data.function](data);

// Polyfill for canvas.context.reset();
OffscreenCanvasRenderingContext2D.prototype.reset = Polyfills.canvasContextReset;
console.slog = Polyfills.slog;

// https://rwaldron.github.io/proposal-math-extensions/
Math.RAD_PER_DEG = Polyfills.RAD_PER_DEG;
Math.DEG_PER_RAD = Polyfills.DEG_PER_RAD;
Math.clamp = Polyfills.clamp;
Math.scale = Polyfills.scale;
Math.radians = Polyfills.radians;
Math.degrees = Polyfills.degrees;