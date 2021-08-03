import { SzudziksPairing } from './szudziksPairing.js';

/**
 * 3 axis 2 dimensional coordinate system
 */
export class Hexagon extends Array {

    static NEIGHBOR_DIRECTIONS = [new Hexagon(1, 0, -1), new Hexagon(1, -1, 0), new Hexagon(0, -1, 1), new Hexagon(-1, 0, 1), new Hexagon(-1, 1, 0), new Hexagon(0, 1, -1)];
    static DIAGONAL_DIRECTIONS = [new Hexagon(1, -2, 1), new Hexagon(-1, -1, 2), new Hexagon(-2, 1, 1), new Hexagon(-1, 2, -1), new Hexagon(1, 1, -2), new Hexagon(2, -1, -1)];
    static DIRECTIONS = [...Hexagon.NEIGHBOR_DIRECTIONS, ...Hexagon.DIAGONAL_DIRECTIONS];
    
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
     * @param {Hexagon} other 
     * @returns {Boolean}
     */
    equals(other) {
        return Hexagon.equals(this, other);
    }

    /**
     * 
     * @param {Hexagon} other 
     * @returns {Hexagon}
     */
    add(other) {
        return Hexagon.add(this, other);
    }

    /**
     * 
     * @param {Hexagon} other 
     * @returns {Hexagon}
     */
    subtract(other) {
        return Hexagon.subtract(this, other);
    }

    /**
     * 
     * @param {Number} scalar 
     * @returns {Hexagon}
     */
    multiply(scalar) {
        return Hexagon.multiply(this, scalar);
    }

    /**
     * 
     * @param {Hexagon} other 
     * @returns {Number}
     */
    length(other) {
        return Hexagon.length(this, other);
    }

    /**
     * 
     * @param {Hexagon} other 
     * @returns {Number}
     */
    distance(other) {
        return Hexagon.distance(this, other);
    }

    /**
     * 
     * @param {Number} directionIndex 
     * @returns {Hexagon}
     */
    direction(directionIndex) {
        return Hexagon.direction(directionIndex);
    }

    /**
     * 
     * @param {Number} directionIndex 
     * @returns {Hexagon}
     */
    neighbor(directionIndex) {
        return Hexagon.neighbor(this, directionIndex);
    }

    /**
     * @returns {String} String representation of hexagon
     */
    toString() {
        return `${this.q.toString(16)}|${this.r.toString(16)}|${this.s.toString(16)}`;
    }

    /**
     * Returns hash code based on coords
     * @returns {Number}
     */
    hashCode() {
        return Hexagon.hashCode(this);
    }

    /**
     * Floating point safe
     * @param {Hexagon} first 
     * @param {Hexagon} second 
     * @returns {Boolean}
     */
    static equals(first, second) {
        return first.q === second.q && first.r === second.r && first.s === second.s;
    }

    /**
     * 
     * @param {Hexagon} first 
     * @param {Hexagon} second 
     * @returns {Hexagon}
     */
    static add(first, second) {
        return new Hexagon(first.q + second.q, first.r + second.r, first.s + second.s);
    }

    /**
     * 
     * @param {Hexagon} first 
     * @param {Hexagon} second 
     * @returns {Hexagon}
     */
    static subtract(first, second) {
        return new Hexagon(first.q - second.q, first.r - second.r, first.s - second.s);
    }

    /**
     * 
     * @param {Hexagon} source 
     * @param {Number} scalar 
     * @returns {Hexagon}
     */
    static multiply(source, scalar) {
        return new Hexagon(source.q * scalar, source.r * scalar, source.s * scalar);
    }

    /**
     * 
     * @param {Hexagon} object 
     * @returns {Number}
     */
    static length(object) {
        return (Math.abs(object.q) + Math.abs(object.r) + Math.abs(object.s)) / 2;
    }

    /**
     * 
     * @param {Hexagon} first 
     * @param {Hexagon} second
     * @returns {Number} 
     */
    static distance(first, second) {
        return first.subtract(second).length();
    }

    /**
     * 
     * @param {Number} directionIndex 
     * @returns {Hexagon}
     */
    static direction(directionIndex) {
        return Hexagon.DIRECTIONS[directionIndex % Hexagon.DIRECTIONS.length];
    }

    /**
     * 
     * @param {Hexagon} object 
     * @param {Number} direction 
     * @returns {Hexagon}
     */
    static neighbor(object, directionIndex) {
        return object.add(Hexagon.direction(directionIndex));
    }

    /**
     * Returns hash code based on coords
     * @param {Hexagon} object 
     * @returns {Number}
     */
    static hashCode(object) {
        return SzudziksPairing.pair(object.q, object.r);
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