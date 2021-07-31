import { Hex } from './hex.js';
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
 * @param {Hex} hex 
 */
function drawHex(layout, hex) {
    const corners = layout.hexagonCorners(hex);

    ctx.beginPath();
    ctx.moveTo(...corners[0]);

    for (let i = 1; i < corners.length; i++) {
        ctx.lineTo(...corners[i]);
    }

    ctx.closePath();
    ctx.stroke();
}

const layout = new Layout(Orientation.FLAT, new Point(20, 20), new Point(500, 500));

drawHex(layout, new Hex(-1, -1, -1));
drawHex(layout, new Hex(0, 0, -1));
drawHex(layout, new Hex(0, -1, 0));
drawHex(layout, new Hex(-1, 0, 0));
drawHex(layout, new Hex(0, 0, 0));
drawHex(layout, new Hex(1, 0, 0));
drawHex(layout, new Hex(0, 1, 0));
drawHex(layout, new Hex(0, 0, 1));
drawHex(layout, new Hex(1, 1, 1));


