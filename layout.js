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

    /**
     * Converts hexagon to hexagon's center on screen
     * @param {Hex} hexagon
     * @returns {Point}
     */
    hexToPixel(hexagon) {
        return Layout.hexToPixel(this, hexagon);
    }

    /**
     * Converts screen pixel to hexagon
     * @param {Point} pixel
     * @returns {Hex}
     */
    pixelToHex(pixel) {
        return Layout.pixelToHex(this, pixel);
    }

    /**
     * Calculates single corner in hexagon using current layout
     * @param {Number} cornerIndex
     * @returns {Point}
     */
    hexagonCorner(cornerIndex) {
        return Layout.hexagonCorner(this, cornerIndex);
    }

    /**
     * Calculates every corner in hexagon
     * @param {Hex} hexagon
     * @returns {Point[]}
     */
    hexagonCorners(hexagon) {
       return Layout.hexagonCorners(this, hexagon);
    }

    /**
     * Converts hexagon to hexagon's center on screen
     * @param {Layout} layout
     * @param {Hex} hexagon
     * @returns {Point}
     */
    static hexToPixel(layout, hexagon) {
        console.log(layout);
        const o = layout.orientation;
        const x = (o.f[0] * hexagon.q + o.f[1] * hexagon.r) * layout.size.x;
        const y = (o.f[2] * hexagon.q + o.f[3] * hexagon.r) * layout.size.y;
        return new Point(x + layout.origin.x, y + layout.origin.y);
    }

    /**
     * Converts screen pixel to hexagon
     * @param {Layout} layout
     * @param {Point} pixel
     * @returns {Hex}
     */
    static pixelToHex(layout, pixel) {
        const o = layout.orientation;
        const pt = new Point((pixel.x - layout.origin.x) / layout.size.x, (pixel.y - layout.origin.y) / layout.size.y);
        const q = o.b[0] * pt.x + o.b[1] * pt.y;
        const r = o.b[2] * pt.x + o.b[3] * pt.y;
        return new Hex(q, r, -q - r);
    }

    /**
     * Calculates single corner in hexagon using current layout
     * @param {Layout} layout
     * @param {Number} cornerIndex
     * @returns {Point}
     */
    static hexagonCorner(layout, cornerIndex) {
        const o = layout.orientation;
        const size = layout.size;
        const angle = 2.0 * Math.PI * (o.a - cornerIndex) / 6.0;
        return new Point(size.x * Math.cos(angle), size.y * Math.sin(angle));
    }

    /**
     * Calculates every corner in hexagon
     * @param {Layout} layout
     * @param {Hex} hexagon
     * @returns {Point[]}
     */
    static hexagonCorners(layout, hexagon) {
        const corners = [];
        const center = layout.hexToPixel(hexagon);

        for (let cornerIndex = 0; cornerIndex < 6; cornerIndex++) {
            const offset = layout.hexagonCorner(cornerIndex);
            corners.push(new Point(center.x + offset.x, center.y + offset.y));
        }

        return corners;
    }
}