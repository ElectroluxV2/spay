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

const eventsCache = [];
let previousDifference = -1;

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
window.onpointermove = ({pageX, pageY} = event) => {
    for (let i = 0; i < eventsCache.length; i++) {
        if (event.pointerId === eventsCache[i].pointerId) {
            eventsCache[i] = event;
            break;
        }
    }
     
    // If two pointers are down, check for pinch gestures
    if (eventsCache.length === 2) {
        // Calculate the distance between the two pointers
        const curDiff = Math.hypot(eventsCache[1].clientX - eventsCache[0].clientX, eventsCache[1].clientY - eventsCache[0].clientY);
        
        if (previousDifference > 0) {    
            // The distance between the two pointers
            mainWorker.postMessage({
                function: 'pinchGesture',
                change: curDiff - previousDifference,
                pageX: (eventsCache[1].clientX + eventsCache[0].clientX) / 2,
                pageY: (eventsCache[1].clientY + eventsCache[0].clientY) / 2
            });
            
        }
        
        // Cache the distance for the next move event 
        previousDifference = curDiff;
    } else {
        // Just move
        mainWorker.postMessage({
            function: 'onPointerMove',
            pageX: pageX,
            pageY: pageY
        });
    }
};

window.onpointerdown = ({pageX, pageY} = event) => {
    mainWorker.postMessage({
        function: 'onPointerDown',
        pageX: pageX,
        pageY: pageY
    });

    eventsCache.push(event);
};

window.onpointerup = ({pageX, pageY} = event) => {
    mainWorker.postMessage({
        function: 'onPointerUp',
        pageX: pageX,
        pageY: pageY
    });

    // Remove this event from the target's cache
    for (let i = 0; i < eventsCache.length; i++) {
        if (eventsCache[i].pointerId == event.pointerId) {
            eventsCache.splice(i, 1);
            break;
        }
    }
    
    // If the number of pointers down is less than two then reset diff tracker
    if (eventsCache.length < 2) previousDifference = -1;
};

window.onwheel = ({deltaX, deltaY, pageX, pageY}) => mainWorker.postMessage({
    function: 'onWheel',
    deltaX: deltaX,
    deltaY: deltaY,
    pageX: pageX,
    pageY: pageY
});


// https://rwaldron.github.io/proposal-math-extensions/
Math.RAD_PER_DEG = Polyfills.RAD_PER_DEG;
Math.DEG_PER_RAD = Polyfills.DEG_PER_RAD;
Math.clamp = Polyfills.clamp;
Math.scale = Polyfills.scale;
Math.radians = Polyfills.radians;
Math.degrees = Polyfills.degrees;