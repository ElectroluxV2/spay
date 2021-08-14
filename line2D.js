import { Point } from './point.js';

export class Line2D {
    #first;
    #second;

    /**
     * 
     * @param {Point} first 
     * @param {Point} second 
     */
    constructor(first, second) {
        this.#first = first;
        this.#second = second;
    }

    /**
     * 
     * @param {Line2D} other 
     * @returns {Boolean}
     */
    equals(other) {
        return Line2D.equals(this, other);
    }

    /**
     * 
     * @param {Line2D} firstLine 
     * @param {Line2D} secondLine 
     * @returns {Boolean}
     */
    static equals(firstLine, secondLine) {
        return (firstLine.first.equals(secondLine.first) && firstLine.second.equals(secondLine.second)) || (firstLine.first.equals(secondLine.second) && firstLine.second.equals(secondLine.first));
    }

    /**
     * @returns {Point}
     */
    get first() {
        return this.#first;
    }

    /**
     * @returns {Point}
     */
    get second() {
        return this.#second;
    }
}