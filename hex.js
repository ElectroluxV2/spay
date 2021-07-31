/**
 * 3 axis 2 dimensional coordinate system
 */
export class Hex extends Array {

    static NEIGHBOR_DIRECTIONS = [new Hex(0, -1, -1), new Hex(1, 1, 0), new Hex(-1, 0, -1), new Hex(0, 1, 1), new Hex(-1, -1, 0), new Hex(1, 0, 1)];
    static DIAGONAL_DIRECTIONS = [new Hex(2, -1, -1), new Hex(1, 1, -2), new Hex(-1, 2, -1), new Hex(-2, 1, 1), new Hex(-1, -1, 2), new Hex(1, -2, 1)];
    static DIRECTIONS = [...Hex.NEIGHBOR_DIRECTIONS, ...Hex.DIAGONAL_DIRECTIONS];
    
    /**
     * Creates Hex with given coords
     * @param {Number} q 
     * @param {Number} r 
     * @param {Number} s 
     */
    constructor(q, r, s) {
        super();
        this.q = q;
        this.r = r;
        this.s = s;
    }

    /**
     * 
     * @param {Hex} other 
     * @returns {Boolean}
     */
    equals(other) {
        return Hex.equals(this, other);
    }

    /**
     * 
     * @param {Hex} other 
     * @returns {Hex}
     */
    add(other) {
        return Hex.add(this, other);
    }

    /**
     * 
     * @param {Hex} other 
     * @returns {Hex}
     */
    subtract(other) {
        return Hex.subtract(this, other);
    }

    /**
     * 
     * @param {Number} scalar 
     * @returns {Hex}
     */
    multiply(scalar) {
        return Hex.multiply(this, scalar);
    }

    /**
     * 
     * @param {Hex} other 
     * @returns {Number}
     */
    length(other) {
        return Hex.length(this, other);
    }

    /**
     * 
     * @param {Hex} other 
     * @returns {Number}
     */
    distance(other) {
        return Hex.distance(this, other);
    }

    /**
     * 
     * @param {Number} directionIndex 
     * @returns {Hex}
     */
    direction(directionIndex) {
        return Hex.direction(directionIndex);
    }

    /**
     * 
     * @param {Number} directionIndex 
     * @returns {Hex}
     */
    neighbor(directionIndex) {
        return Hex.neighbor(this, directionIndex);
    }

    /**
     * @returns {String} HashCode inf form of string, used in Map
     */
    hashCode() {
        return `${this.q.toString(16)}|${this.r.toString(16)}|${this.s.toString(16)}`;
    }

    /**
     * Floating point safe
     * @param {Hex} first 
     * @param {Hex} second 
     * @returns {Boolean}
     */
    static equals(first, second) {
        return first.q === second.q && first.r === second.r && first.s === second.s;
    }

    /**
     * 
     * @param {Hex} first 
     * @param {Hex} second 
     * @returns {Hex}
     */
    static add(first, second) {
        return new Hex(first.q + second.q, first.r + second.r, first.s + second.s);
    }

    /**
     * 
     * @param {Hex} first 
     * @param {Hex} second 
     * @returns {Hex}
     */
    static subtract(first, second) {
        return new Hex(first.q - second.q, first.r - second.r, first.s - second.s);
    }

    /**
     * 
     * @param {Hex} source 
     * @param {Number} scalar 
     * @returns {Hex}
     */
    static multiply(source, scalar) {
        return new Hex(source.q * scalar, source.r * scalar, source.s * scalar);
    }

    /**
     * 
     * @param {Hex} object 
     * @returns {Number}
     */
    static length(object) {
        return (Math.abs(object.q) + Math.abs(object.r) + Math.abs(object.s)) / 2;
    }

    /**
     * 
     * @param {Hex} first 
     * @param {Hex} second
     * @returns {Number} 
     */
    static distance(first, second) {
        return first.subtract(second).length();
    }

    /**
     * 
     * @param {Number} directionIndex 
     * @returns {Hex}
     */
    static direction(directionIndex) {
        return Hex.DIRECTIONS[directionIndex % Hex.DIRECTIONS.length];
    }

    /**
     * 
     * @param {Hex} object 
     * @param {Number} direction 
     * @returns {Hex}
     */
    static neighbor(object, directionIndex) {
        return object.add(Hex.direction(directionIndex));
    }

    get q() {
        return this[0];
    }

    set q(value) {
        this[0] = Math.trunc(value);
    }

    get r() {
        return this[1];
    }

    set r(value) {
        this[1] = Math.trunc(value);
    }

    get s() {
        return this[2];
    }

    set s(value) {
        this[2] = Math.trunc(value);
    }
}