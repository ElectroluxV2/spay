import { Polyfills } from './polyfills.js';
import { Game } from './game.js';

const workerContext = {
    game: null,
    mainCanvas: null,
    constructor: ({mainCanvas, window}) => {
        workerContext.mainCanvas = mainCanvas;
        workerContext.windowOnResize({window});
        workerContext.game = new Game(workerContext.mainCanvas, window);
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
    onPointerDown: () => workerContext.game?.onPointerDown(),
    onPointerUp: () => workerContext.game?.onPointerUp(),
    onWheel: ({deltaX, deltaY}) => {
        workerContext.game?.onWheel(deltaX, deltaY);
    }
};

console.log('b');

onmessage = ({data} = event) => workerContext[data.function](data);

// Polyfill for canvas.context.reset();
OffscreenCanvasRenderingContext2D.prototype.reset = Polyfills.canvasContextReset;
