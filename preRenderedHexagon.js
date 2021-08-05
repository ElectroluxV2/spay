export class PreRenderedHexagon extends OffscreenCanvas {
    size;
    color;
    removeBorderIndexes;

    /**
     * 
     * @param {Point} size
     * @param {String} color
     * @param {String} removeBorderIndexes
     */
    constructor(size, color, removeBorderIndexes) {
        super(...size.multiply(2.2)); // Border offset
        this.getContext('2d').translate(size.multiply(0.2).x / 2, 0); // Border offset

        this.size = size;
        this.color = color;
        this.removeBorderIndexes = removeBorderIndexes;
    }

    async toImageURL() {
        const blob = await this.convertToBlob({
            type: 'image/png',
        });

        return new FileReaderSync().readAsDataURL(blob);
    }
}