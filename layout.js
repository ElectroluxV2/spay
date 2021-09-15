import { Orientation } from './orientation.js';
import { Point } from './point.js';
import { Hexagon } from './hexagon.js';

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
     * WARNING this is RAW location WITHOUT current transform and scale
     * @param {Hexagon} hexagon
     * @returns {Point}
     */
    hexagonToPixelUntransformed(hexagon) {
        const o = this.orientation;
        const x = (o.f[0] * hexagon.q + o.f[1] * hexagon.r) * this.size.x;
        const y = (o.f[2] * hexagon.q + o.f[3] * hexagon.r) * this.size.y;
        return new Point(x + this.origin.x, y + this.origin.y);
    }

    /**
     * Converts screen pixel to hexagon
     * WARNING this is RAW location WITHOUT current transform and scale
     * @param {Point} pixel
     * @returns {Hexagon}
     */
    pixelToHexagonUntransformed(pixel) {
        const o = this.orientation;
        const pt = new Point((pixel.x - this.origin.x) / this.size.x, (pixel.y - this.origin.y) / this.size.y);
        const q = o.b[0] * pt.x + o.b[1] * pt.y;
        const r = o.b[2] * pt.x + o.b[3] * pt.y;
        const s = -q - r;

        let qi = Math.round(q);
        let ri = Math.round(r);
        let si = Math.round(s);

        const qDiff = Math.abs(qi - q);
        const rDiff = Math.abs(ri - r);
        const sDiff = Math.abs(si - s);

        if (qDiff > rDiff && qDiff > sDiff) {
            qi = -ri - si;
        } else if (rDiff > sDiff) {
            ri = -qi - si;
        } else {
            si = -qi - ri;
        }

        return new Hexagon(qi, ri, si);
    }

    /**
     * Calculates single corner in hexagon using current layout
     * @param {Number} cornerIndex
     * @returns {Point}
     */
    hexagonCorner(cornerIndex) {
        const o = this.orientation;
        const size = this.size;
        const angle = 2.0 * Math.PI * (o.a - cornerIndex) / 6.0;
        return new Point(size.x * Math.cos(angle), size.y * Math.sin(angle));
    }

     /**
     * 
     * @param {Point} hexagonCorner 
     * @param {Point} hexagonCenter 
     * @param {Number} widthMultiplier 
     * @returns {Point}
     */
    borderCorner(hexagonCorner, hexagonCenter, widthMultiplier) {
        return Layout.borderCorner(hexagonCorner, hexagonCenter, widthMultiplier);
    }

    /**
     * Calculates every corner in hexagon
     * @param {Hexagon} hexagon
     * @returns {Point[]}
     */
    hexagonCorners(hexagon) {
        const corners = [];
        const center = this.hexagonToPixelUntransformed(hexagon);

        for (let cornerIndex = 0; cornerIndex < 6; cornerIndex++) {
            const offset = this.hexagonCorner(cornerIndex);
            corners.push(new Point(center.x + offset.x, center.y + offset.y));
        }

        return corners;
    }
}