import { Polyfills } from './polyfills.js';

// Prepare all Workers
const mainWorker = new Worker('./mainWorker.js', {
    type: 'module'
});

// Transfer ownership of variables
const mainCanvas = document.getElementById('mainCanvas').transferControlToOffscreen();

// Run constructor inside worker
mainWorker.postMessage({
    function: 'constructor',
    mainCanvas: mainCanvas,
    window: Polyfills.createWindow(),
}, [mainCanvas]);

console.log(mainCanvas);


// Forward window events
window.onresize = event => {
    mainWorker.postMessage({
        function: 'windowOnResize',
        window: Polyfills.createWindow()
    });
}

// Keyboard events
window.onkeydown = event => mainWorker.postMessage({
    function: 'windowOnKeyDown',
    key: event.key
});

window.onkeyup = event => mainWorker.postMessage({
    function: 'windowOnKeyUp',
    key: event.key
});

// Etc. eg. PointerEvents
window.onpointermove = ({pageX, pageY}) => mainWorker.postMessage({
    function: 'onPointerMove',
    pageX: pageX,
    pageY: pageY
});

window.onwheel = ({deltaX, deltaY}) => mainWorker.postMessage({
    function: 'onWheel',
    deltaX: deltaX,
    deltaY: deltaY
});
