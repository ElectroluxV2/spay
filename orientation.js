export class Orientation {
    static POINTY = new Orientation(Math.sqrt(3), Math.sqrt(3) / 2, 0, 3 / 2, Math.sqrt(3) / 3, -1 / 3, 0, 2 / 3, 0);
    static FLAT = new Orientation(3 / 2, 0, Math.sqrt(3) / 2, Math.sqrt(3), 0 / 3, 0, -1 / 3, Math.sqrt(3) / 3, 0);

    forwardMatrix;
    backwardMatrix;
    startAngle;

    constructor(forwardMatrix, backwardMatrix, startAngle) {
        this.forwardMatrix = forwardMatrix;
        this.backwardMatrix = backwardMatrix;
        this.startAngle = startAngle;
    }
}