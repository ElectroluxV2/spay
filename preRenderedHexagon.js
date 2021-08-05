export class PreRenderedHexagon extends OffscreenCanvas {
    size;
    color;
    deletedBorderIndexes;

    /**
     * 
     * @param {Point} size
     * @param {String} color
     * @param {Number[]} deletedBorderIndexes
     */
    constructor(size, color, deletedBorderIndexes) {
        super(...size.multiply(2));

        this.size = size;
        this.color = color;
        this.deletedBorderIndexes = deletedBorderIndexes;
    }
}