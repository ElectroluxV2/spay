import { Point } from './point.js';

export class Vector extends Point {

    static i = Vector.makeVector(new Point(0, 0), new Point(1, 0));
    static j = Vector.makeVector(new Point(0, 0), new Point(0, 1));

    /**
     * 
     * @param {Point} p1 
     * @param {Point} p2 
     * @returns {Vector}
     */
    static makeVector(p1, p2) {
        return new Vector(p2.x - p1.x, p2.y - p1.y);
    }

    /**
     * 
     * @param {Vector} vector 
     * @returns {Vector}
     */
    static perpendicularClockwise(vector) {
        return new Vector(vector.y, -vector.x);
    }

    /**
     * 
     * @param {Vector} vector 
     * @returns {Vector}
     */
    static perpendicularCounterClockwise(vector) {
        return new Vector(-vector.y, vector.x);
    }

    /**
     * 
     * @param {Vector} vector 
     * @returns {Vector}
     */
    static normalize(vector) {
        const length = this.magnitude(vector, vector);
        return new Vector(vector.x / length, vector.y / length);
    }

    /**
     * 
     * @param {Vector} vector 
     * @param {Number} scalar 
     * @returns {Vector}
     */
    static multiply(vector, scalar) {
        return new Vector(vector.x * scalar, vector.y * scalar);
    }

    /**
     * 
     * @param {Vector} v1 
     * @param {Vector} v2 
     * @returns {Vector}
     */
    static add(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    /**
     * 
     * @param {Vector} v1 
     * @param {Vector} v2 
     * @returns {Number}
     */
    static magnitude(v1, v2) {
        return Math.sqrt(v1.x * v2.x + v1.y * v2.y);
    }

    /**
     * 
     * @param {Vector} v 
     * @returns {Vector}
     */
    static reverse(v) {
        return new Vector(-v.x, -v.y);
    }

    /**
     * 
     * @returns {Vector}
     */
    perpendicularClockwise() {
        return Vector.perpendicularClockwise(this);
    }

    /**
     * 
     * @returns {Vector}
     */
    perpendicularCounterClockwise() {
        return Vector.perpendicularCounterClockwise(this);
    }

    /**
     * 
     * @returns {Vector}
     */
    normalize() {
        return Vector.normalize(this);
    }

    /**
     * 
     * @param {Number} scalar 
     * @returns {Vector}
     */
    multiply(scalar) {
        return Vector.multiply(this, scalar);
    }

    /**
     * 
     * @param {Vector} v2 
     * @returns {Vector}
     */
    add(v2) {
        return Vector.add(this, v2);
    }

    /**
     * 
     * @param {Vector} v2 
     * @returns {Number}
     */
    magnitude(v2) {
        return Vector.magnitude(this, v2);
    }

    /**
     * 
     * @returns {Vector}
     */
    reverse() {
        return Vector.reverse(this);
    }
}
