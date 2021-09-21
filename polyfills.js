import { Point } from './point.js';

export class Polyfills {
    static canvasContextReset() {
        this.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    static createWindow() {
        return {
            innerHeight: window.innerHeight,
            innerWidth: window.innerWidth,
            devicePixelRatio: window.devicePixelRatio
        };
    }

    /**
     * 
     * @param {Point} origin 
     * @param {Point} point 
     * @param {Number} radians 
     * @returns {Point}
     */
    static rotate(origin, point, radians) {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const x = (cos * (point.x - origin.x)) + (sin * (point.y - origin.y)) + origin.x;
        const y = (cos * (point.y - origin.y)) - (sin * (point.x - origin.x)) + origin.y
        return new Point(x, y);
    }

    /**
     * 
     * @param {Number} x 
     * @param {Number} lower 
     * @param {Number} upper 
     * @returns {Number}
     */
    static clamp(x, lower, upper) {
        return Math.min(Math.max(x, lower), upper);
    }

    /**
     * 
     * @param {Number} x 
     * @param {Number} inLow 
     * @param {Number} inHigh 
     * @param {Number} outLow 
     * @param {Number} outHigh 
     * @returns {Number} 
     */
    static scale(x, inLow, inHigh, outLow, outHigh) {
        return (x - inLow) * (outHigh - outLow) / (inHigh - inLow) + outLow;
    }

    /**
     * 
     * @param {Number} degrees 
     * @returns {Number}
     */
    static radians(degrees) {
        return degrees * Math.DEG_PER_RAD;
    }

    /**
     * 
     * @param {Number} radians 
     * @returns {Number}
     */
    static degrees(radians) {
        return radians * Math.RAD_PER_DEG;
    }

    static RAD_PER_DEG = 180 / Math.PI;
    static DEG_PER_RAD = Math.PI / 180;

    static lastTimer = null;
    static lastTime = 0;
    static slog(m) {
        const currentTime = performance.now();

        if (currentTime - Polyfills.lastTime > 20) {
            Polyfills.lastTime = currentTime;
            console.log(m);
            return;
        }

        clearTimeout(Polyfills.lastTimer);
        Polyfills.lastTimer = setTimeout(() => {
            console.log(m);
        }, 20);
    }
}
