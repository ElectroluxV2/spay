import { Orientation } from './orientation.js';
import { Point } from './point.js';

export class Layout {
    orientation;
    size;
    origin;

    /**
     * 
     * @param {Orientation} orientation 
     * @param {Point} size 
     * @param {Point} origin 
     */
    constructor(orientation, size, origin) {
        this.orientation = orientation;
        this.size = size;
        this.origin = origin;
    }
}