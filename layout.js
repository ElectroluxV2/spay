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
     * @param {Hexagon} hexagon
     * @returns {Point}
     */
    hexToPixel(hexagon) {
        return Layout.hexToPixel(this, hexagon);
    }

    /**
     * Converts screen pixel to hexagon
     * @param {Point} pixel
     * @returns {Hexagon}
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
       return Layout.hexagonCorners(this, hexagon);
    }

    /**
     * Constructs Path2D with hexagon fill
     * @param {Hexagon} hexagon
     * @param {Point[]} corners
     * @returns {Path2D}
     */
    hexagonFillPath2D(hexagon, corners) {
        return Layout.hexagonFillPath2D(this, hexagon, corners);
    }

    /**
     * 
     * @param {Hexagon} hexagon 
     * @param {Number} directionIndex 
     * @param {Point[]} corners 
     * @returns {Path2D}
     */
    hexagonBorderPartPath2D(hexagon, directionIndex, corners) {
        return Layout.hexagonBorderPartPath2D(this, hexagon, directionIndex, corners);
    }

    /**
     * Converts hexagon to hexagon's center on screen
     * @param {Layout} layout
     * @param {Hexagon} hexagon
     * @returns {Point}
     */
    static hexToPixel(layout, hexagon) {
        const o = layout.orientation;
        const x = (o.f[0] * hexagon.q + o.f[1] * hexagon.r) * layout.size.x;
        const y = (o.f[2] * hexagon.q + o.f[3] * hexagon.r) * layout.size.y;
        return new Point(x + layout.origin.x, y + layout.origin.y);
    }

    /**
     * Converts screen pixel to hexagon
     * @param {Layout} layout
     * @param {Point} pixel
     * @returns {Hexagon}
     */
    static pixelToHex(layout, pixel) {
        const o = layout.orientation;
        const pt = new Point((pixel.x - layout.origin.x) / layout.size.x, (pixel.y - layout.origin.y) / layout.size.y);
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
     * 
     * @param {Point} hexagonCorner 
     * @param {Point} hexagonCenter 
     * @param {Number} widthMultiplier 
     * @returns {Point}
     */
    static borderCorner(hexagonCorner, hexagonCenter, widthMultiplier) {
        return hexagonCenter.add(new Point(hexagonCorner.x - hexagonCenter.x, hexagonCorner.y - hexagonCenter.y).multiply(widthMultiplier));
    }

    /**
     * Calculates every corner in hexagon
     * @param {Layout} layout
     * @param {Hexagon} hexagon
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

    /**
     * Constructs Path2D with hexagon fill
     * @param {Layout} layout
     * @param {Hexagon} hexagon 
     * @param {Point[]} corners
     * @returns {Path2D}
     */
    static hexagonFillPath2D(layout, hexagon, corners = layout.hexagonCorners(hexagon)) {
        const path = new Path2D();
        path.moveTo(...corners[0]);

        for (let i = 1; i < corners.length; i++) {
            path.lineTo(...corners[i]);
        }

        path.closePath();
        return path;
    }
    
    /**
     * 
     * @param {Layout} layout 
     * @param {Hexagon} hexagon 
     * @param {Number} directionIndex 
     * @param {Point[]} corners 
     * @returns {Path2D}
     */
    static hexagonBorderPartPath2D(layout, hexagon, directionIndex, corners = layout.hexagonCorners(hexagon)) {
        const path = new Path2D();
        path.moveTo(...corners[directionIndex]);
        path.lineTo(...corners[(directionIndex + 1) % 6]);
        return path;
    }
}