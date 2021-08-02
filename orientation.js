export class Orientation {
    static POINTY = new Orientation([Math.sqrt(3) / 3, -1 / 3, 0, 2 / 3], [Math.sqrt(3), Math.sqrt(3) / 2, 0, 3 / 2], 0.5);
    static FLAT = new Orientation([2 / 3, 0, -1 / 3, Math.sqrt(3) / 3], [3 / 2, 0, Math.sqrt(3) / 2, Math.sqrt(3)], 0);

    backwardMatrix;
    forwardMatrix;
    startAngle;

    /**
     * 
     * @param {Number[]} backwardMatrix 
     * @param {Number[]} forwardMatrix 
     * @param {Number} startAngle 
     */
    constructor(backwardMatrix, forwardMatrix, startAngle) {
        this.backwardMatrix = backwardMatrix;
        this.forwardMatrix = forwardMatrix;
        this.startAngle = startAngle;
    }

    /**
     * backwardMatrix
     * @returns {Number[]}
     */
    get b() {
        return this.backwardMatrix;
    }

    /**
     * forwardMatrix
     * @returns {Number[]}
     */
    get f() {
        return this.forwardMatrix;
    }

    /**
     * startAngle
     * @returns {Number}
     */
    get a() {
        return this.startAngle;
    }
}