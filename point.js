/**
 * Represents single point in 2D
 * Contains some useful functions
 */
export class Point extends Array {
    /**
     * Creates Point with given Coords
     * @param {Number} x Coord x
     * @param {Number} y Coord y
     */
    constructor(x = 0, y = 0) {
        super();
        this.x = x;
        this.y = y;
    }

    /**
     * Calculates distance between first and second point
     * @param {Point} first 
     * @param {Point} second 
     * @returns {Number}
     */
    static distance(first, second) {
        return Math.sqrt(Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2));
    }

    /**
     * Checks equality between given Points
     * @param {Point} first 
     * @param {Point} second 
     * @returns {Boolean} true if equals to other
     */
    static equals(first, second) {
        return Math.abs(first.x - second.x) < Number.EPSILON && Math.abs(first.y - second.y) < Number.EPSILON;
    }

    /**
     * Creates deep copy
     * @returns {Point} Deep copy
     */
    duplicate() {
        return new Point(this.x, this.y);
    }

    /**
     * Calculates distance between this and second point
     * @param {Point} other Point to calculate distance to
     * @returns {Number} Distance between points
     */
    distance(other) {
        return Point.distance(this, other);
    }

    /**
     * Checks equality with other Point
     * @param {Point} other Point to check equality on
     * @returns {Boolean} true if equals to other
     */
    equals(other) {
        return Point.equals(this, other);
    }

    set x(value) {
        this[0] = value;
    }

    get x() {
        return this[0];
    }

    set y(value) {
        this[1] = value;
    }

    get y() {
        return this[1];
    }
}