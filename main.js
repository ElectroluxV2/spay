import { Hexagon } from './hexagon.js';
import { Point } from './point.js';
import { Layout } from './layout.js';
import { Orientation } from './orientation.js';

console.log('test');

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
// canvas.width = window.screen.width;
// canvas.height = window.screen.height;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(500, 500);
ctx.strokeStyle = 'green';
ctx.stroke();
ctx.strokeStyle = 'red';


/**
 * 
 * @param {Layout} layout 
 * @param {Hexagon} hexagon 
 */
function drawHex(layout, hexagon) {
    const corners = layout.hexagonCorners(hexagon);

    ctx.beginPath();
    ctx.moveTo(...corners[0]);

    for (let i = 1; i < corners.length; i++) {
        ctx.lineTo(...corners[i]);
    }

    ctx.closePath();
    ctx.stroke();
}

const layout = new Layout(Orientation.FLAT, new Point(20, 20), new Point(500, 500));

window.onpointermove = ({pageX, pageY}) => {
    const point = new Point(pageX, pageY);
    layout.origin = point;
}

let zoom = 20;

window.onwheel = ({deltaY}) => {
    zoom -= Math.sign(deltaY);
    layout.size.x = zoom;
    layout.size.y = zoom;
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let q = -5; q < 5; q++) {
        for (let r = -5; r < 5; r++) {
            for (let s = -5; s < 5; s++) {
                const hexagon = new Hexagon(q, r, s);
                drawHex(layout, hexagon);
            }
        }
    }

    window.requestAnimationFrame(loop);
}

loop();


