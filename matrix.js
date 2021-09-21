/*
 * Copyright 2021 GFXFundamentals.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of GFXFundamentals. nor the names of his
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { Point } from './point.js';

export class Matrix extends Array {

    /**
     * 
     * @param {Number[]} contents 
     */
    constructor(contents) {
        super(contents);
    }

    /**
     * Takes two Matrix3s, first and second, and computes the product in the order that pre-composes first and second.
     * @param {Matrix} first 
     * @param {Matrix} second 
     * @returns {Matrix}
     */
    static multiply(first, second) {
        const a = first;
        const b = second;

        const a00 = a[0 * 3 + 0];
        const a01 = a[0 * 3 + 1];
        const a02 = a[0 * 3 + 2];
        const a10 = a[1 * 3 + 0];
        const a11 = a[1 * 3 + 1];
        const a12 = a[1 * 3 + 2];
        const a20 = a[2 * 3 + 0];
        const a21 = a[2 * 3 + 1];
        const a22 = a[2 * 3 + 2];
        const b00 = b[0 * 3 + 0];
        const b01 = b[0 * 3 + 1];
        const b02 = b[0 * 3 + 2];
        const b10 = b[1 * 3 + 0];
        const b11 = b[1 * 3 + 1];
        const b12 = b[1 * 3 + 2];
        const b20 = b[2 * 3 + 0];
        const b21 = b[2 * 3 + 1];
        const b22 = b[2 * 3 + 2];
    
        return new Matrix([
          b00 * a00 + b01 * a10 + b02 * a20,
          b00 * a01 + b01 * a11 + b02 * a21,
          b00 * a02 + b01 * a12 + b02 * a22,
          b10 * a00 + b11 * a10 + b12 * a20,
          b10 * a01 + b11 * a11 + b12 * a21,
          b10 * a02 + b11 * a12 + b12 * a22,
          b20 * a00 + b21 * a10 + b22 * a20,
          b20 * a01 + b21 * a11 + b22 * a21,
          b20 * a02 + b21 * a12 + b22 * a22,
        ]);
    }

    /**
     * Creates a 3x3 identity matrix
     * @returns {Matrix}
     */
    static identity() {
        return new Matrix([
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ]);
    }

    /**
     * Creates a 2D projection matrix
     * @param {Number} width width in pixels
     * @param {Number} height height in pixels
     * @returns {Matrix} a projection matrix that converts from pixels to clipspace with Y = 0 at the top.
     */
    static projection(width, height) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return new Matrix([
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1,
        ]);
    }

    /**
     * Multiplies by a 2D projection matrix
     * @param {Matrix} matrix the matrix to be multiplied
     * @param {Number} width width in pixels
     * @param {Number} height height in pixels
     * @returns {Matrix}
     */
    static project(matrix, width, height) {
        return Matrix.multiply(matrix, Matrix.projection(width, height));
    }

    /**
     * Creates a 2D translation matrix
     * @param {Number} tx amount to translate in x
     * @param {Number} ty amount to translate in y
     * @returns {Matrix} a translation matrix that translates by tx and ty.
     */
    static translation(tx, ty) {
        return new Matrix([
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ]);
    }

    /**
     * Multiplies by a 2D translation matrix
     * @param {Matrix} matrix the matrix to be multiplied
     * @param {Number} tx amount to translate in x
     * @param {Number} ty amount to translate in y
     * @returns {Matrix}
     */
    static translate(matrix, tx, ty) {
        return Matrix.multiply(matrix, Matrix.translation(tx, ty));
    }

    /**
     * Creates a 2D rotation matrix
     * @param {Number} angleInRadians amount to rotate in radians
     * @returns {Matrix} a rotation matrix that rotates by angleInRadians
     */
    static rotation(angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        return new Matrix([
          c, -s, 0,
          s, c, 0,
          0, 0, 1,
        ]);
    }

    /**
     * Multiplies by a 2D rotation matrix
     * @param {Matrix} matrix the matrix to be multiplied
     * @param {Number} angleInRadians amount to rotate in radians
     * @returns {Matrix}
     */
    static rotate(matrix, angleInRadians) {
        return Matrix.multiply(matrix, Matrix.rotation(angleInRadians));
    }
    
    /**
     * Creates a 2D scaling matrix
     * @param {Number} sx amount to scale in x
     * @param {Number} sy amount to scale in y
     * @returns {Matrix} a scale matrix that scales by sx and sy.
     */
    static scaling(sx, sy) {
        return new Matrix([
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ]);
    }

    /**
     * Multiplies by a 2D scaling matrix
     * @param {Matrix} matrix the matrix to be multiplied
     * @param {Number} sx amount to scale in x
     * @param {Number} sy amount to scale in y
     * @returns {Matrix}
     */
    static scale(matrix, sx, sy) {
        return Matrix.multiply(matrix, Matrix.scaling(sx, sy));
    }

    /**
     * 
     * @param {Matrix} matrix 
     * @param {Point} point 
     * @returns {Point}
     */
    static transformPoint(matrix, point) {
        const m = matrix;
        const v0 = point[0];
        const v1 = point[1];
        const d = v0 * m[0 * 3 + 2] + v1 * m[1 * 3 + 2] + m[2 * 3 + 2];
        return new Point([
          (v0 * m[0 * 3 + 0] + v1 * m[1 * 3 + 0] + m[2 * 3 + 0]) / d,
          (v0 * m[0 * 3 + 1] + v1 * m[1 * 3 + 1] + m[2 * 3 + 1]) / d,
        ]);
    }

    /**
     * 
     * @param {Matrix} matrix 
     * @returns {Matrix}
     */
    static inverse(matrix) {
        const m = matrix;
        const t00 = m[1 * 3 + 1] * m[2 * 3 + 2] - m[1 * 3 + 2] * m[2 * 3 + 1];
        const t10 = m[0 * 3 + 1] * m[2 * 3 + 2] - m[0 * 3 + 2] * m[2 * 3 + 1];
        const t20 = m[0 * 3 + 1] * m[1 * 3 + 2] - m[0 * 3 + 2] * m[1 * 3 + 1];
        const d = 1.0 / (m[0 * 3 + 0] * t00 - m[1 * 3 + 0] * t10 + m[2 * 3 + 0] * t20);
        return new Matrix([
           d * t00, -d * t10, d * t20,
          -d * (m[1 * 3 + 0] * m[2 * 3 + 2] - m[1 * 3 + 2] * m[2 * 3 + 0]),
           d * (m[0 * 3 + 0] * m[2 * 3 + 2] - m[0 * 3 + 2] * m[2 * 3 + 0]),
          -d * (m[0 * 3 + 0] * m[1 * 3 + 2] - m[0 * 3 + 2] * m[1 * 3 + 0]),
           d * (m[1 * 3 + 0] * m[2 * 3 + 1] - m[1 * 3 + 1] * m[2 * 3 + 0]),
          -d * (m[0 * 3 + 0] * m[2 * 3 + 1] - m[0 * 3 + 1] * m[2 * 3 + 0]),
           d * (m[0 * 3 + 0] * m[1 * 3 + 1] - m[0 * 3 + 1] * m[1 * 3 + 0]),
        ]);
    }

    /**
     * Takes two Matrix3s, first and second, and computes the product in the order that pre-composes first and second.
     * @param {Matrix} second 
     * @returns {Matrix}
     */
    multiply(second) {
        return Matrix.multiply(this, second);
    }

    /**
     * Multiplies by a 2D projection matrix
     * @param {Number} width width in pixels
     * @param {Number} height height in pixels
     * @returns {Matrix}
     */
    project(width, height) {
        return Matrix.project(this, width, height);
    }

    /**
     * Multiplies by a 2D translation matrix
     * @param {Number} tx amount to translate in x
     * @param {Number} ty amount to translate in y
     * @returns {Matrix}
     */
    translate(tx, ty) {
        return Matrix.translate(this, tx, ty);
    }

    /**
     * Multiplies by a 2D rotation matrix
     * @param {Number} angleInRadians amount to rotate in radians
     * @returns {Matrix}
     */
    rotate(angleInRadians) {
        return Matrix.rotate(this, angleInRadians);
    }

    /**
     * Multiplies by a 2D scaling matrix
     * @param {Number} sx amount to scale in x
     * @param {Number} sy amount to scale in y
     * @returns {Matrix}
     */
    scale(sx, sy) {
        return Matrix.scale(this, sx, sy);
    }

    /**
     * 
     * @param {Point} point 
     * @returns {Point}
     */
    transformPoint(point) {
        return Matrix.transformPoint(this, point);
    }

    /**
     *
     * @returns {Matrix}
     */
    inverse() {
        return Matrix.inverse(this);
    }
}